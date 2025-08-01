import os
import shutil
from pathlib import Path
from django.core.management.base import BaseCommand
from django.conf import settings
from apps.scans.models import Scan, ScanResult

class Command(BaseCommand):
    """
    Enhanced cleanup for patient-centric storage with optimization
    Usage: python manage.py cleanup_storage
    """
    help = "Clean up storage files and migrate to patient-centric structure"

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be deleted without actually deleting',
        )
        parser.add_argument(
            '--migrate-legacy',
            action='store_true',
            help='Migrate existing files to patient-centric structure',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        migrate_legacy = options['migrate_legacy']
        
        if dry_run:
            self.stdout.write(self.style.WARNING("DRY RUN MODE - No files will be deleted"))
        
        media_root = Path(settings.MEDIA_ROOT)
        
        # 1. Clean up legacy intermediate directories (now using temp files)
        self._cleanup_intermediate_directories(media_root, dry_run)
        
        # 2. Migrate existing files to patient-centric structure if requested
        if migrate_legacy:
            self._migrate_to_patient_centric(media_root, dry_run)
        
        # 3. Clean up orphaned files
        self._cleanup_orphaned_files(media_root, dry_run)
        
        # 4. Report storage statistics with new structure
        self._report_storage_stats(media_root)
        
        if not dry_run:
            self.stdout.write(self.style.SUCCESS("Enhanced storage cleanup completed!"))
        else:
            self.stdout.write(self.style.WARNING("DRY RUN completed - run without --dry-run to perform cleanup"))

    def _cleanup_intermediate_directories(self, media_root, dry_run):
        """Clean up legacy intermediate file directories"""
        self.stdout.write("\n" + "="*50)
        self.stdout.write("CLEANING INTERMEDIATE DIRECTORIES")
        self.stdout.write("="*50)
        
        # Directories that are no longer needed with optimized processing
        legacy_dirs = [
            'processed_scans',  # Segmented images (now temp)
            'bbox_crop_results',  # Intermediate crop results (now temp)
            'depth_maps',  # Legacy depth maps
            'depth_maps_bbox'  # Legacy bbox depth maps
        ]
        
        for dir_name in legacy_dirs:
            legacy_dir = media_root / dir_name
            if legacy_dir.exists():
                self.stdout.write(f"Found legacy directory: {legacy_dir}")
                if dry_run:
                    self.stdout.write(self.style.WARNING(f"[DRY RUN] Would delete: {legacy_dir}"))
                else:
                    shutil.rmtree(legacy_dir)
                    self.stdout.write(self.style.SUCCESS(f"Deleted legacy directory: {dir_name}"))

    def _migrate_to_patient_centric(self, media_root, dry_run):
        """Migrate existing files to patient-centric structure"""
        self.stdout.write("\n" + "="*50)
        self.stdout.write("MIGRATING TO PATIENT-CENTRIC STRUCTURE")
        self.stdout.write("="*50)
        
        # Migrate from legacy generated_stl and stl_previews
        legacy_stl_dir = media_root / 'generated_stl'
        legacy_preview_dir = media_root / 'stl_previews'
        
        # Get all scan results to update
        scan_results = ScanResult.objects.select_related('scan__patient').all()
        
        for scan_result in scan_results:
            try:
                scan = scan_result.scan
                patient = scan.patient
                
                # Create patient directory structure
                patient_name = f"{patient.first_name}_{patient.last_name}"
                clean_patient_name = "".join(c for c in patient_name if c.isalnum() or c in ['_', '-'])
                patient_scan_dir = media_root / clean_patient_name / f"scan_{scan.id}"
                
                if dry_run:
                    self.stdout.write(f"[DRY RUN] Would create: {patient_scan_dir}")
                else:
                    patient_scan_dir.mkdir(parents=True, exist_ok=True)
                
                # Migrate STL file if it exists
                if scan_result.stl_file and scan_result.stl_file.name:
                    old_stl_path = media_root / scan_result.stl_file.name
                    if old_stl_path.exists():
                        new_stl_filename = f"{scan.id}.stl"
                        new_stl_path = patient_scan_dir / new_stl_filename
                        
                        if dry_run:
                            self.stdout.write(f"[DRY RUN] Would move: {old_stl_path} -> {new_stl_path}")
                        else:
                            shutil.copy2(old_stl_path, new_stl_path)
                            scan_result.stl_file.name = f"{clean_patient_name}/scan_{scan.id}/{new_stl_filename}"
                            self.stdout.write(f"Migrated STL: {new_stl_path}")
                
                # Migrate preview if it exists
                if scan_result.preview_image and scan_result.preview_image.name:
                    old_preview_path = media_root / scan_result.preview_image.name
                    if old_preview_path.exists():
                        new_preview_filename = f"{scan.id}_preview.png"
                        new_preview_path = patient_scan_dir / new_preview_filename
                        
                        if dry_run:
                            self.stdout.write(f"[DRY RUN] Would move: {old_preview_path} -> {new_preview_path}")
                        else:
                            shutil.copy2(old_preview_path, new_preview_path)
                            scan_result.preview_image.name = f"{clean_patient_name}/scan_{scan.id}/{new_preview_filename}"
                            self.stdout.write(f"Migrated preview: {new_preview_path}")
                
                # Save updated paths
                if not dry_run:
                    scan_result.save()
                    
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Error migrating scan {scan_result.id}: {e}"))

    def _cleanup_orphaned_files(self, media_root, dry_run):
        """Clean up orphaned files for non-existent scans"""
        self.stdout.write("\n" + "="*50)
        self.stdout.write("CLEANING ORPHANED FILES")
        self.stdout.write("="*50)
        
        existing_scan_ids = set(Scan.objects.values_list('id', flat=True))
        
        # Check patient directories for orphaned scan folders
        for patient_dir in media_root.iterdir():
            if patient_dir.is_dir() and not patient_dir.name.startswith('.'):
                # Skip system directories
                if patient_dir.name in ['scans', 'generated_stl', 'stl_previews']:
                    continue
                    
                # Check scan directories within patient directory
                for scan_dir in patient_dir.iterdir():
                    if scan_dir.is_dir() and scan_dir.name.startswith('scan_'):
                        try:
                            scan_id = int(scan_dir.name.replace('scan_', ''))
                            if scan_id not in existing_scan_ids:
                                self.stdout.write(f"Found orphaned scan directory: {scan_dir}")
                                if dry_run:
                                    self.stdout.write(self.style.WARNING(f"[DRY RUN] Would delete: {scan_dir}"))
                                else:
                                    shutil.rmtree(scan_dir)
                                    self.stdout.write(self.style.SUCCESS(f"Deleted orphaned directory: {scan_dir}"))
                        except ValueError:
                            # Skip directories that don't follow scan_X pattern
                            continue

    def _report_storage_stats(self, media_root):
        """Report storage statistics for new structure"""
        self.stdout.write("\n" + "="*50)
        self.stdout.write("STORAGE STATISTICS (PATIENT-CENTRIC)")
        self.stdout.write("="*50)
        
        total_size = 0
        total_files = 0
        patient_count = 0
        scan_count = 0
        
        # Count patient directories and their contents
        for patient_dir in media_root.iterdir():
            if patient_dir.is_dir() and not patient_dir.name.startswith('.'):
                # Skip legacy system directories
                if patient_dir.name in ['scans', 'generated_stl', 'stl_previews', 'processed_scans', 'bbox_crop_results']:
                    continue
                
                patient_count += 1
                patient_size = 0
                patient_files = 0
                patient_scans = 0
                
                for scan_dir in patient_dir.iterdir():
                    if scan_dir.is_dir() and scan_dir.name.startswith('scan_'):
                        patient_scans += 1
                        scan_count += 1
                        
                        for file_path in scan_dir.rglob('*'):
                            if file_path.is_file():
                                size = file_path.stat().st_size
                                patient_size += size
                                total_size += size
                                patient_files += 1
                                total_files += 1
                
                if patient_files > 0:
                    self.stdout.write(f"{patient_dir.name:30}: {patient_size:>10} bytes ({patient_files} files, {patient_scans} scans)")
        
        self.stdout.write("-" * 70)
        self.stdout.write(f"{'TOTAL PATIENTS':30}: {patient_count}")
        self.stdout.write(f"{'TOTAL SCANS':30}: {scan_count}")
        self.stdout.write(f"{'TOTAL FILES':30}: {total_files}")
        self.stdout.write(f"{'TOTAL SIZE':30}: {total_size:>10} bytes ({total_size / (1024*1024):.1f} MB)")
        self.stdout.write("="*70) 