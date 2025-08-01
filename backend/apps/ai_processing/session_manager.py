"""
Session-based temporary file manager for AI processing pipeline.
Handles temporary storage of processing artifacts until final results are saved.
"""

import os
import json
import shutil
import uuid
from pathlib import Path
from django.conf import settings
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)


class ProcessingSession:
    """
    Manages temporary files and data for a single scan processing session.
    All intermediate files are stored temporarily and cleaned up after final results are saved.
    """
    
    def __init__(self, session_id: str):
        self.session_id = session_id
        self.session_dir = os.path.join(settings.MEDIA_ROOT, 'temp', 'sessions', str(session_id))
        self._ensure_session_dir()
    
    def _ensure_session_dir(self):
        """Create session directory if it doesn't exist"""
        os.makedirs(self.session_dir, exist_ok=True)
        logger.info(f"Session directory ready: {self.session_dir}")
    
    def save_original_image(self, image_file, filename: Optional[str] = None) -> str:
        """Save the original uploaded image to session"""
        if filename is None:
            filename = f"original_image{Path(image_file.name).suffix}"
        
        file_path = os.path.join(self.session_dir, filename)
        
        # Save uploaded file to session directory
        with open(file_path, 'wb') as f:
            for chunk in image_file.chunks():
                f.write(chunk)
        
        logger.info(f"Original image saved to session: {file_path}")
        return file_path
    
    def save_processing_file(self, source_path: str, filename: str) -> str:
        """Copy a processing result file to session directory"""
        dest_path = os.path.join(self.session_dir, filename)
        shutil.copy2(source_path, dest_path)
        logger.info(f"Processing file saved to session: {dest_path}")
        return dest_path
    
    def save_session_data(self, data: Dict[str, Any], filename: str = 'processing_metadata.json') -> str:
        """Save processing metadata to session"""
        file_path = os.path.join(self.session_dir, filename)
        with open(file_path, 'w') as f:
            json.dump(data, f, indent=2)
        logger.info(f"Session data saved: {file_path}")
        return file_path
    
    def load_session_data(self, filename: str = 'processing_metadata.json') -> Optional[Dict[str, Any]]:
        """Load processing metadata from session"""
        file_path = os.path.join(self.session_dir, filename)
        if os.path.exists(file_path):
            with open(file_path, 'r') as f:
                return json.load(f)
        return None
    
    def get_file_path(self, filename: str) -> str:
        """Get full path to a file in the session directory"""
        return os.path.join(self.session_dir, filename)
    
    def file_exists(self, filename: str) -> bool:
        """Check if a file exists in the session directory"""
        return os.path.exists(self.get_file_path(filename))
    
    def get_file_url(self, filename: str, request) -> str:
        """Get URL for accessing a session file"""
        relative_path = os.path.relpath(
            self.get_file_path(filename), 
            settings.MEDIA_ROOT
        )
        return request.build_absolute_uri(settings.MEDIA_URL + relative_path)
    
    def save_bbox_data(self, bbox_data: Dict[str, Any]) -> str:
        """Save bounding box data to session"""
        return self.save_session_data(bbox_data, 'bbox_data.json')
    
    def load_bbox_data(self) -> Optional[Dict[str, Any]]:
        """Load bounding box data from session"""
        return self.load_session_data('bbox_data.json')
    
    def cleanup(self):
        """Remove all session files and directory"""
        if os.path.exists(self.session_dir):
            shutil.rmtree(self.session_dir)
            logger.info(f"Session {self.session_id} cleaned up")
    
    def cleanup_all_temp_files(self):
        """Clean up all temp directories after mesh generation completion"""
        temp_root = os.path.join(settings.MEDIA_ROOT, 'temp')
        
        temp_dirs_to_clean = [
            'generated_stl',
            'stl_previews', 
            'processed_scans'
        ]
        
        cleaned_files = 0
        for temp_dir in temp_dirs_to_clean:
            temp_path = os.path.join(temp_root, temp_dir)
            if os.path.exists(temp_path):
                try:
                    # Remove all files in the directory but keep the directory
                    for filename in os.listdir(temp_path):
                        file_path = os.path.join(temp_path, filename)
                        if os.path.isfile(file_path):
                            os.remove(file_path)
                            cleaned_files += 1
                        elif os.path.isdir(file_path):
                            shutil.rmtree(file_path)
                            cleaned_files += 1
                    logger.info(f"Cleaned temp directory: {temp_path}")
                except Exception as e:
                    logger.warning(f"Failed to clean temp directory {temp_path}: {e}")
        
        # Also clean up the session directory
        self.cleanup()
        
        logger.info(f"Total temp cleanup completed. Cleaned {cleaned_files} files/directories")
        return cleaned_files
    
    def migrate_final_results(self, patient_name: str, scan_number: int) -> str:
        """
        Move final processing results to patient-centric permanent storage.
        
        Creates structure: media/{patient_name}/scan_{scan_number}/
        Only moves essential final files:
        - metadata.json
        - depth_map_8bit.png
        - depth_map_16bit.png  
        - {scan_id}.stl
        - {scan_id}_preview.png
        """
        # Clean patient name
        clean_patient_name = "".join(c for c in patient_name if c.isalnum() or c in ['_', '-'])
        
        # Create patient scan directory
        patient_scan_dir = os.path.join(
            settings.MEDIA_ROOT, 
            clean_patient_name, 
            f"scan_{scan_number}"
        )
        os.makedirs(patient_scan_dir, exist_ok=True)
        
        # Files to migrate (only final results)
        final_files = {
            'processing_metadata.json': 'metadata.json',
            'depth_map_8bit.png': 'depth_map_8bit.png',
            'depth_map_16bit.png': 'depth_map_16bit.png',
            # STL and preview files will be handled by mesh generation
        }
        
        migrated_files = {}
        
        for session_filename, final_filename in final_files.items():
            session_file = self.get_file_path(session_filename)
            if os.path.exists(session_file):
                final_path = os.path.join(patient_scan_dir, final_filename)
                shutil.copy2(session_file, final_path)
                migrated_files[final_filename] = final_path
                logger.info(f"Migrated {session_filename} -> {final_path}")
        
        logger.info(f"Final results migrated to: {patient_scan_dir}")
        return patient_scan_dir


class SessionManager:
    """Factory for creating and managing processing sessions"""
    
    @staticmethod
    def create_session() -> ProcessingSession:
        """Create a new processing session"""
        session_id = str(uuid.uuid4())
        return ProcessingSession(session_id)
    
    @staticmethod
    def get_session(session_id: str) -> ProcessingSession:
        """Get an existing processing session"""
        return ProcessingSession(session_id)
    
    @staticmethod
    def cleanup_expired_sessions(max_age_hours: int = 24):
        """Clean up old session directories"""
        import time
        
        sessions_dir = os.path.join(settings.MEDIA_ROOT, 'temp', 'sessions')
        if not os.path.exists(sessions_dir):
            return
        
        current_time = time.time()
        max_age_seconds = max_age_hours * 3600
        
        for session_dir in os.listdir(sessions_dir):
            session_path = os.path.join(sessions_dir, session_dir)
            if os.path.isdir(session_path):
                # Check directory age
                dir_age = current_time - os.path.getctime(session_path)
                if dir_age > max_age_seconds:
                    shutil.rmtree(session_path)
                    logger.info(f"Cleaned up expired session: {session_dir}")
    
    @staticmethod
    def cleanup_all_sessions():
        """Clean up ALL session directories (use with caution - for manual cleanup)"""
        sessions_dir = os.path.join(settings.MEDIA_ROOT, 'temp', 'sessions')
        if os.path.exists(sessions_dir):
            cleaned_count = 0
            for session_dir in os.listdir(sessions_dir):
                session_path = os.path.join(sessions_dir, session_dir)
                if os.path.isdir(session_path):
                    shutil.rmtree(session_path)
                    cleaned_count += 1
                    logger.info(f"Cleaned up session: {session_dir}")
            
            if cleaned_count > 0:
                logger.info(f"Cleaned up {cleaned_count} sessions")
            return cleaned_count
        return 0

    @staticmethod
    def cleanup_all_temp_directories():
        """Clean up ALL temp directories (use for complete temp cleanup)"""
        temp_root = os.path.join(settings.MEDIA_ROOT, 'temp')
        
        temp_dirs_to_clean = [
            'generated_stl',
            'stl_previews', 
            'processed_scans'
        ]
        
        cleaned_files = 0
        for temp_dir in temp_dirs_to_clean:
            temp_path = os.path.join(temp_root, temp_dir)
            if os.path.exists(temp_path):
                try:
                    # Remove all files in the directory but keep the directory
                    for filename in os.listdir(temp_path):
                        file_path = os.path.join(temp_path, filename)
                        if os.path.isfile(file_path):
                            os.remove(file_path)
                            cleaned_files += 1
                        elif os.path.isdir(file_path):
                            shutil.rmtree(file_path)
                            cleaned_files += 1
                    logger.info(f"Cleaned temp directory: {temp_path}")
                except Exception as e:
                    logger.warning(f"Failed to clean temp directory {temp_path}: {e}")
        
        # Also clean up all sessions
        session_count = SessionManager.cleanup_all_sessions()
        
        logger.info(f"Complete temp cleanup completed. Cleaned {cleaned_files} files/directories and {session_count} sessions")
        return cleaned_files + session_count
