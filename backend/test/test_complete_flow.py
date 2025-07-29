#!/usr/bin/env python3
"""
Complete Step-by-Step Flow Test Script

This script tests the complete end-to-end user flow through the application:
PhotoPreview → ProcessingScreen → CroppedOriginal → ProcessingScreen → 
WoundDetection → ProcessingScreen → DepthDetection → ProcessingScreen → 
MeshDetection → DownloadFiles

Tests all granular backend endpoints in sequence:
1. upload_image
2. process_wound_segmentation  
3. process_bbox_detection
4. process_depth_analysis
5. process_mesh_generation

Results are saved to test_complete_flow/ directory.
"""

import os
import sys
import django
from pathlib import Path
import logging
from datetime import datetime
import shutil
import json
from io import BytesIO
from PIL import Image

# Add the project's backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from django.test import Client
from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from apps.patients.models import Patient
from apps.scans.models import Scan

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class CompleteFlowTester:
    """
    End-to-end flow tester for the complete application pipeline.
    Simulates the full user journey from image upload to file download.
    """
    
    def __init__(self):
        self.client = Client()
        self.output_dir = Path(__file__).resolve().parent / "test_complete_flow"
        self.test_image_path = Path(__file__).resolve().parent / "test image" / "scan_1753445089110.jpg"
        self.patient = None
        self.scan_id = None
        self.scan_data = {}
        
        # Flow tracking
        self.flow_steps = []
        self.step_results = {}
    
    def setup_test_environment(self):
        """Setup test environment with patient and test image."""
        logger.info("🔧 Setting up test environment...")
        
        # Create output directory
        self.output_dir.mkdir(parents=True, exist_ok=True)
        logger.info(f"📁 Created output directory: {self.output_dir}")
        
        # Ensure admin user exists
        try:
            admin_user = User.objects.get(username="admin")
            logger.info("✅ Admin user found")
        except User.DoesNotExist:
            admin_user = User.objects.create_user(
                username="admin",
                password="admin123"
            )
            logger.info("✅ Created admin user")

        # Perform token-based login
        response = self.client.post('/api/login/', {
            'username': 'admin',
            'password': 'admin123'
        })
        
        if response.status_code != 200:
            raise Exception("Failed to authenticate and get token")
            
        token = response.json().get('token')
        if not token:
            raise Exception("Token not found in login response")
            
        # Set the token in the client's headers for all subsequent requests
        self.client.defaults['HTTP_AUTHORIZATION'] = f'Token {token}'
        logger.info("✅ Client authenticated with token")
        
        # Create test patient
        self.patient, created = Patient.objects.get_or_create(
            first_name="Test",
            last_name="Patient Flow",
            date_of_birth="1990-01-01",
            defaults={
                'nric': 'T1234567Z',
                'user': admin_user
            }
        )
        logger.info(f"✅ Test patient: {self.patient.id} - {self.patient.first_name} {self.patient.last_name}")
        
        # Validate test image exists
        if not self.test_image_path.exists():
            raise FileNotFoundError(f"Test image not found: {self.test_image_path}")
        
        logger.info(f"✅ Test image validated: {self.test_image_path}")
        
        # Copy test image to output directory for reference
        test_image_copy = self.output_dir / "00_original_test_image.jpg"
        shutil.copy2(self.test_image_path, test_image_copy)
        logger.info(f"📷 Test image copied to: {test_image_copy}")
    
    def create_test_upload_file(self):
        """Create a test upload file from the test image."""
        with open(self.test_image_path, 'rb') as f:
            image_content = f.read()
        
        return SimpleUploadedFile(
            name="test_scan.jpg",
            content=image_content,
            content_type="image/jpeg"
        )
    
    def log_step_start(self, step_name, description):
        """Log the start of a flow step."""
        logger.info("\n" + "="*80)
        logger.info(f"STEP {len(self.flow_steps) + 1}: {step_name.upper()}")
        logger.info("="*80)
        logger.info(f"📝 Description: {description}")
        logger.info(f"🎯 Simulating: {step_name}")
        
        step_info = {
            'step_number': len(self.flow_steps) + 1,
            'step_name': step_name,
            'description': description,
            'timestamp': datetime.now().isoformat(),
            'status': 'started'
        }
        self.flow_steps.append(step_info)
        return step_info
    
    def log_step_success(self, step_info, response_data=None, notes=None):
        """Log successful completion of a flow step."""
        step_info['status'] = 'success'
        step_info['completion_time'] = datetime.now().isoformat()
        if response_data:
            step_info['response_keys'] = list(response_data.keys()) if isinstance(response_data, dict) else None
        if notes:
            step_info['notes'] = notes
        
        logger.info(f"✅ {step_info['step_name']} completed successfully!")
        if response_data and isinstance(response_data, dict):
            logger.info(f"📋 Response keys: {list(response_data.keys())}")
        if notes:
            logger.info(f"💡 Notes: {notes}")
    
    def log_step_error(self, step_info, error, response=None):
        """Log error in a flow step."""
        step_info['status'] = 'failed'
        step_info['error'] = str(error)
        step_info['completion_time'] = datetime.now().isoformat()
        if response:
            step_info['response_status'] = response.status_code
            step_info['response_content'] = response.content.decode('utf-8')[:500]
        
        logger.error(f"❌ {step_info['step_name']} failed: {error}")
        if response:
            logger.error(f"❌ Response status: {response.status_code}")
            logger.error(f"❌ Response content: {response.content.decode('utf-8')[:200]}...")
    
    def test_step_1_upload_image(self):
        """Step 1: PhotoPreview → upload_image"""
        step_info = self.log_step_start(
            "upload_image", 
            "PhotoPreview screen uploads image to create scan"
        )
        
        try:
            # Create test upload file
            test_file = self.create_test_upload_file()
            
            # Make API call to upload image
            response = self.client.post('/api/scans/', {
                'patient': self.patient.id,
                'image': test_file
            })
            
            if response.status_code != 201:
                raise Exception(f"Upload failed with status {response.status_code}")
            
            response_data = response.json()
            self.scan_id = response_data.get('id')
            self.scan_data.update(response_data)
            
            # Save step result
            self.step_results['upload'] = response_data
            
            self.log_step_success(
                step_info, 
                response_data, 
                f"Scan ID: {self.scan_id}, Image URL: {response_data.get('image')}"
            )
            return True
            
        except Exception as e:
            self.log_step_error(step_info, e, response if 'response' in locals() else None)
            return False
    
    def test_step_2_wound_segmentation(self):
        """Step 2: ProcessingScreen → process_wound_segmentation → CroppedOriginal"""
        step_info = self.log_step_start(
            "process_wound_segmentation",
            "ProcessingScreen calls YOLO wound segmentation, navigates to CroppedOriginal"
        )
        
        try:
            if not self.scan_id:
                raise Exception("No scan ID available from previous step")
            
            # Make API call to process wound segmentation
            response = self.client.post(f'/api/scans/{self.scan_id}/process_wound_segmentation/')
            
            if response.status_code != 200:
                raise Exception(f"Wound segmentation failed with status {response.status_code}")
            
            response_data = response.json()
            self.scan_data.update(response_data)
            
            # Validate required data for next step
            if not response_data.get('processed_image'):
                raise Exception("No processed_image URL in response")
            
            # Save step result
            self.step_results['wound_segmentation'] = response_data
            
            self.log_step_success(
                step_info,
                response_data,
                f"Segmented image: {response_data.get('processed_image')}"
            )
            return True
            
        except Exception as e:
            self.log_step_error(step_info, e, response if 'response' in locals() else None)
            return False
    
    def test_step_3_bbox_detection(self):
        """Step 3: CroppedOriginal → ProcessingScreen → process_bbox_detection → WoundDetection"""
        step_info = self.log_step_start(
            "process_bbox_detection",
            "CroppedOriginal screen calls bbox detection and cropping, navigates to WoundDetection"
        )
        
        try:
            if not self.scan_id:
                raise Exception("No scan ID available from previous step")
            
            # Make API call to process bbox detection
            response = self.client.post(f'/api/scans/{self.scan_id}/process_bbox_detection/')
            
            if response.status_code != 200:
                raise Exception(f"Bbox detection failed with status {response.status_code}")
            
            response_data = response.json()
            self.scan_data.update(response_data)
            
            # Validate required data for next step
            required_fields = ['cropped_image_path', 'cropped_segmented_path', 'bbox_visualization_path', 'bbox']
            missing_fields = [field for field in required_fields if not response_data.get(field)]
            if missing_fields:
                raise Exception(f"Missing required fields: {missing_fields}")
            
            # Save step result
            self.step_results['bbox_detection'] = response_data
            
            self.log_step_success(
                step_info,
                response_data,
                f"Cropped images created, bbox: {response_data.get('bbox')}"
            )
            return True
            
        except Exception as e:
            self.log_step_error(step_info, e, response if 'response' in locals() else None)
            return False
    
    def test_step_4_depth_analysis(self):
        """Step 4: WoundDetection → ProcessingScreen → process_depth_analysis → DepthDetection"""
        step_info = self.log_step_start(
            "process_depth_analysis",
            "WoundDetection screen calls ZoeDepth processing, navigates to DepthDetection"
        )
        
        try:
            if not self.scan_id:
                raise Exception("No scan ID available from previous step")
            
            # Make API call to process depth analysis
            response = self.client.post(f'/api/scans/{self.scan_id}/process_depth_analysis/')
            
            if response.status_code != 200:
                raise Exception(f"Depth analysis failed with status {response.status_code}")
            
            response_data = response.json()
            self.scan_data.update(response_data)
            
            # Validate required data for next step
            required_fields = ['depth_map_8bit', 'depth_map_16bit', 'volume_estimate', 'depth_metadata']
            missing_fields = [field for field in required_fields if not response_data.get(field)]
            if missing_fields:
                raise Exception(f"Missing required fields: {missing_fields}")
            
            # Save step result
            self.step_results['depth_analysis'] = response_data
            
            self.log_step_success(
                step_info,
                response_data,
                f"Depth maps created, volume: {response_data.get('volume_estimate')} mm³"
            )
            return True
            
        except Exception as e:
            self.log_step_error(step_info, e, response if 'response' in locals() else None)
            return False
    
    def test_step_5_mesh_generation(self):
        """Step 5: DepthDetection → ProcessingScreen → process_mesh_generation → MeshDetection"""
        step_info = self.log_step_start(
            "process_mesh_generation",
            "DepthDetection screen calls STL mesh generation, navigates to MeshDetection"
        )
        
        try:
            if not self.scan_id:
                raise Exception("No scan ID available from previous step")
            
            # Make API call to process mesh generation (using balanced mode - production default)
            response = self.client.post(f'/api/scans/{self.scan_id}/process_mesh_generation/', {
                'visualization_mode': 'balanced'  # Use production default
            })
            
            if response.status_code != 200:
                raise Exception(f"Mesh generation failed with status {response.status_code}")
            
            response_data = response.json()
            self.scan_data.update(response_data)
            
            # Validate required data for next step
            stl_generation = response_data.get('stl_generation', {})
            preview_generation = response_data.get('preview_generation', {})
            
            if not stl_generation.get('stl_file_url'):
                raise Exception("No STL file URL in response")
            if not preview_generation.get('preview_image_url'):
                raise Exception("No preview image URL in response")
            
            # Save step result
            self.step_results['mesh_generation'] = response_data
            
            self.log_step_success(
                step_info,
                response_data,
                f"STL and preview generated, mode: {stl_generation.get('visualization_mode')}"
            )
            return True
            
        except Exception as e:
            self.log_step_error(step_info, e, response if 'response' in locals() else None)
            return False
    
    def test_step_6_download_files(self):
        """Step 6: MeshDetection → DownloadFiles (final screen)"""
        step_info = self.log_step_start(
            "download_files_ready",
            "MeshDetection navigates to DownloadFiles screen with all generated files"
        )
        
        try:
            # Validate that all required files are available for download
            downloadable_files = []
            
            # Check depth maps
            if self.scan_data.get('depth_map_8bit'):
                downloadable_files.append(('8-bit depth map', self.scan_data['depth_map_8bit']))
            if self.scan_data.get('depth_map_16bit'):
                downloadable_files.append(('16-bit depth map', self.scan_data['depth_map_16bit']))
            
            # Check STL file
            stl_generation = self.scan_data.get('stl_generation', {})
            if stl_generation.get('stl_file_url'):
                downloadable_files.append(('STL mesh file', stl_generation['stl_file_url']))
            
            # Check preview image
            preview_generation = self.scan_data.get('preview_generation', {})
            if preview_generation.get('preview_image_url'):
                downloadable_files.append(('STL preview image', preview_generation['preview_image_url']))
            
            if len(downloadable_files) < 4:
                raise Exception(f"Not all files available for download. Found: {len(downloadable_files)}/4")
            
            # Save step result
            self.step_results['download_ready'] = {
                'downloadable_files': downloadable_files,
                'total_files': len(downloadable_files),
                'scan_data_complete': True
            }
            
            self.log_step_success(
                step_info,
                {'downloadable_files_count': len(downloadable_files)},
                f"All {len(downloadable_files)} files ready for download"
            )
            return True
            
        except Exception as e:
            self.log_step_error(step_info, e)
            return False
    
    def save_flow_results(self):
        """Save complete flow results to JSON file."""
        logger.info("\n" + "="*60)
        logger.info("SAVING FLOW RESULTS")
        logger.info("="*60)
        
        # Prepare comprehensive results
        flow_results = {
            'test_metadata': {
                'test_name': 'Complete Step-by-Step Flow Test',
                'test_timestamp': datetime.now().isoformat(),
                'patient_id': self.patient.id if self.patient else None,
                'scan_id': self.scan_id,
                'total_steps': len(self.flow_steps),
                'successful_steps': len([s for s in self.flow_steps if s['status'] == 'success']),
                'failed_steps': len([s for s in self.flow_steps if s['status'] == 'failed'])
            },
            'flow_steps': self.flow_steps,
            'step_results': self.step_results,
            'final_scan_data': self.scan_data
        }
        
        # Save to JSON file
        results_file = self.output_dir / "flow_test_results.json"
        with open(results_file, 'w') as f:
            json.dump(flow_results, f, indent=2, default=str)
        
        logger.info(f"✅ Flow results saved to: {results_file}")
        
        # Save human-readable summary
        summary_file = self.output_dir / "flow_test_summary.txt"
        with open(summary_file, 'w') as f:
            f.write("COMPLETE STEP-BY-STEP FLOW TEST SUMMARY\n")
            f.write("="*50 + "\n\n")
            f.write(f"Test Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"Patient ID: {self.patient.id if self.patient else 'N/A'}\n")
            f.write(f"Scan ID: {self.scan_id or 'N/A'}\n\n")
            
            f.write("FLOW STEPS:\n")
            f.write("-" * 20 + "\n")
            for step in self.flow_steps:
                status_icon = "✅" if step['status'] == 'success' else "❌"
                f.write(f"{status_icon} Step {step['step_number']}: {step['step_name']}\n")
                f.write(f"   Description: {step['description']}\n")
                f.write(f"   Status: {step['status']}\n")
                if step.get('error'):
                    f.write(f"   Error: {step['error']}\n")
                f.write("\n")
            
            f.write("\nFINAL RESULTS:\n")
            f.write("-" * 15 + "\n")
            f.write(f"Total Steps: {len(self.flow_steps)}\n")
            f.write(f"Successful: {len([s for s in self.flow_steps if s['status'] == 'success'])}\n")
            f.write(f"Failed: {len([s for s in self.flow_steps if s['status'] == 'failed'])}\n")
            
            if self.scan_data:
                f.write(f"\nGENERATED FILES:\n")
                f.write("-" * 16 + "\n")
                if self.scan_data.get('processed_image'):
                    f.write(f"- Segmented image: {self.scan_data['processed_image']}\n")
                if self.scan_data.get('cropped_image_path'):
                    f.write(f"- Cropped original: {self.scan_data['cropped_image_path']}\n")
                if self.scan_data.get('cropped_segmented_path'):
                    f.write(f"- Cropped segmented: {self.scan_data['cropped_segmented_path']}\n")
                if self.scan_data.get('depth_map_8bit'):
                    f.write(f"- 8-bit depth map: {self.scan_data['depth_map_8bit']}\n")
                if self.scan_data.get('depth_map_16bit'):
                    f.write(f"- 16-bit depth map: {self.scan_data['depth_map_16bit']}\n")
                
                stl_gen = self.scan_data.get('stl_generation', {})
                if stl_gen.get('stl_file_url'):
                    f.write(f"- STL mesh: {stl_gen['stl_file_url']}\n")
                
                preview_gen = self.scan_data.get('preview_generation', {})
                if preview_gen.get('preview_image_url'):
                    f.write(f"- STL preview: {preview_gen['preview_image_url']}\n")
        
        logger.info(f"✅ Flow summary saved to: {summary_file}")
        return flow_results
    
    def print_final_results(self, flow_results):
        """Print comprehensive final results."""
        logger.info("\n" + "="*80)
        logger.info("COMPLETE STEP-BY-STEP FLOW TEST RESULTS")
        logger.info("="*80)
        
        metadata = flow_results['test_metadata']
        
        # Overall statistics
        logger.info(f"\n📊 OVERALL STATISTICS:")
        logger.info(f"   • Total steps: {metadata['total_steps']}")
        logger.info(f"   • Successful: {metadata['successful_steps']} ✅")
        logger.info(f"   • Failed: {metadata['failed_steps']} ❌")
        logger.info(f"   • Success rate: {(metadata['successful_steps']/metadata['total_steps']*100):.1f}%")
        logger.info(f"   • Patient ID: {metadata['patient_id']}")
        logger.info(f"   • Scan ID: {metadata['scan_id']}")
        
        # Step-by-step results
        logger.info(f"\n🔄 STEP-BY-STEP RESULTS:")
        for step in self.flow_steps:
            status_icon = "✅" if step['status'] == 'success' else "❌"
            logger.info(f"   {status_icon} Step {step['step_number']}: {step['step_name']}")
            if step['status'] == 'failed' and step.get('error'):
                logger.info(f"      Error: {step['error']}")
        
        # Generated files
        if self.scan_data:
            logger.info(f"\n📁 GENERATED FILES:")
            file_count = 0
            
            if self.scan_data.get('processed_image'):
                logger.info(f"   • Segmented image: ✅")
                file_count += 1
            if self.scan_data.get('cropped_image_path'):
                logger.info(f"   • Cropped original: ✅")
                file_count += 1
            if self.scan_data.get('cropped_segmented_path'):
                logger.info(f"   • Cropped segmented: ✅")
                file_count += 1
            if self.scan_data.get('depth_map_8bit'):
                logger.info(f"   • 8-bit depth map: ✅")
                file_count += 1
            if self.scan_data.get('depth_map_16bit'):
                logger.info(f"   • 16-bit depth map: ✅")
                file_count += 1
            
            stl_gen = self.scan_data.get('stl_generation', {})
            if stl_gen.get('stl_file_url'):
                logger.info(f"   • STL mesh file: ✅")
                file_count += 1
            
            preview_gen = self.scan_data.get('preview_generation', {})
            if preview_gen.get('preview_image_url'):
                logger.info(f"   • STL preview image: ✅")
                file_count += 1
            
            logger.info(f"   📊 Total files generated: {file_count}")
        
        # Processing metrics
        if self.scan_data.get('volume_estimate'):
            logger.info(f"\n📏 PROCESSING METRICS:")
            logger.info(f"   • Volume estimate: {self.scan_data['volume_estimate']:.2f} mm³")
            
            bbox = self.scan_data.get('bbox', {})
            if bbox:
                logger.info(f"   • Bounding box: {bbox.get('width')}x{bbox.get('height')} px")
            
            stl_gen = self.scan_data.get('stl_generation', {})
            if stl_gen.get('mesh_metadata'):
                mesh_meta = stl_gen['mesh_metadata']
                logger.info(f"   • Mesh vertices: {mesh_meta.get('vertex_count', 'N/A')}")
                logger.info(f"   • Mesh faces: {mesh_meta.get('face_count', 'N/A')}")
                logger.info(f"   • STL file size: {mesh_meta.get('file_size_mb', 'N/A')} MB")
        
        logger.info(f"\n📁 Results saved to: {self.output_dir}")


def run_complete_flow_test():
    """Run the complete step-by-step flow test."""
    
    logger.info("="*80)
    logger.info("STARTING COMPLETE STEP-BY-STEP FLOW TEST")
    logger.info("="*80)
    logger.info("🎯 Testing: PhotoPreview → ProcessingScreen → CroppedOriginal → ProcessingScreen →")
    logger.info("           WoundDetection → ProcessingScreen → DepthDetection → ProcessingScreen →")
    logger.info("           MeshDetection → DownloadFiles")
    logger.info("📋 This simulates the complete user journey through the application")
    
    tester = CompleteFlowTester()
    
    try:
        # Setup test environment
        tester.setup_test_environment()
        
        # Run all flow steps in sequence
        steps = [
            tester.test_step_1_upload_image,
            tester.test_step_2_wound_segmentation,
            tester.test_step_3_bbox_detection,
            tester.test_step_4_depth_analysis,
            tester.test_step_5_mesh_generation,
            tester.test_step_6_download_files
        ]
        
        all_passed = True
        for step_func in steps:
            if not step_func():
                all_passed = False
                logger.error(f"❌ Step failed: {step_func.__name__}")
                # Continue with remaining steps to see how far we get
        
        # Save and display results
        flow_results = tester.save_flow_results()
        tester.print_final_results(flow_results)
        
        if all_passed:
            logger.info("\n✅ COMPLETE FLOW TEST PASSED!")
            logger.info("🎉 All steps completed successfully - the entire user journey works!")
            return True
        else:
            logger.warning("\n⚠️ COMPLETE FLOW TEST PARTIALLY FAILED!")
            logger.warning("Some steps failed - check the results for details")
            return False
            
    except Exception as e:
        logger.error(f"❌ Flow test failed with exception: {e}")
        import traceback
        traceback.print_exc()
        return False


def clear_test_directory():
    """Clear the test_complete_flow directory."""
    test_dir = backend_dir / "test_complete_flow"
    
    if test_dir.exists():
        logger.info(f"Clearing test directory: {test_dir}")
        try:
            shutil.rmtree(test_dir)
            logger.info("✅ Test directory cleared successfully!")
        except Exception as e:
            logger.error(f"❌ Error clearing test directory: {e}")
            sys.exit(1)
    else:
        logger.info("Test directory doesn't exist - nothing to clear.")


def main():
    """Main function to run the complete flow test."""
    import argparse
    
    # Setup argument parser
    parser = argparse.ArgumentParser(
        description="Complete step-by-step flow test",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python test_complete_flow.py           # Run complete flow test
  python test_complete_flow.py --clear   # Clear test directory and run test

This test simulates the complete user journey:
1. PhotoPreview → upload_image
2. ProcessingScreen → process_wound_segmentation → CroppedOriginal  
3. CroppedOriginal → process_bbox_detection → WoundDetection
4. WoundDetection → process_depth_analysis → DepthDetection
5. DepthDetection → process_mesh_generation → MeshDetection
6. MeshDetection → DownloadFiles

Output:
  Creates test_complete_flow/ directory with:
  - flow_test_results.json (detailed results)
  - flow_test_summary.txt (human-readable summary)
  - 00_original_test_image.jpg (test image copy)
        """
    )
    parser.add_argument(
        '--clear',
        action='store_true',
        help='Clear the test_complete_flow directory before running the test'
    )
    
    args = parser.parse_args()
    
    # Handle clear command
    if args.clear:
        clear_test_directory()
    
    logger.info("Starting complete step-by-step flow test...")
    
    success = run_complete_flow_test()
    
    if success:
        logger.info("\n🎉 COMPLETE FLOW TEST COMPLETED SUCCESSFULLY!")
        logger.info("Check the test_complete_flow/ directory for detailed results.")
        logger.info("💡 The entire user journey from PhotoPreview to DownloadFiles works perfectly!")
        sys.exit(0)
    else:
        logger.error("\n❌ COMPLETE FLOW TEST FAILED!")
        logger.error("Check the test_complete_flow/ directory for error details.")
        sys.exit(1)


if __name__ == "__main__":
    main() 