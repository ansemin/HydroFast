from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.contrib.auth.models import User
from apps.patients.models import Patient
from .models import Scan
from .serializers import ScanSerializer

class ScanViewSet(viewsets.ModelViewSet):
    serializer_class = ScanSerializer
    # permission_classes = [permissions.IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get_queryset(self):
        user = self.request.user

        # Allow AnonymousUser during testing
        if not user.is_authenticated:
            # return Scan.objects.none()
            # Return all Scans or a specific set for testing
            return Scan.objects.all()

        # Handle authenticated users
        if hasattr(user, 'userprofile') and user.userprofile.is_admin:
            return Scan.objects.all()  # Admin users see all patients
        return Scan.objects.filter(user=user) 
    
    def perform_create(self, serializer):
        if self.request.user.is_anonymous:
            # Using default user
            # Default user 'default_user' created with password 'default_password'.
            default_user = User.objects.get(username="default_user") 
            serializer.save(user=default_user)
        else:
            serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def upload_image(self, request):
        """
        Upload an image for a patient
        """
        print(f"🚀 [Backend] Step 1: Starting image upload process...")
        print(f"📥 [Backend] Request method: {request.method}")
        print(f"📋 [Backend] Request data keys: {list(request.data.keys())}")
        
        try:
            patient_id = request.data.get('patient')
            print(f"👤 [Backend] Patient ID from request: {patient_id}")
            
            if not patient_id:
                print(f"❌ [Backend] Error: Patient ID is required")
                return Response({'error': 'Patient ID is required'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Check if patient exists
            print(f"🔍 [Backend] Checking if patient exists...")
            try:
                patient = Patient.objects.get(id=patient_id)
                print(f"✅ [Backend] Patient found: {patient}")
            except Patient.DoesNotExist:
                print(f"❌ [Backend] Error: Patient not found with ID {patient_id}")
                return Response({'error': 'Patient not found'}, status=status.HTTP_404_NOT_FOUND)
            
            # Get the image from the request
            image = request.data.get('image')
            print(f"📷 [Backend] Image from request: {type(image)}")
            
            if not image:
                print(f"❌ [Backend] Error: Image is required")
                return Response({'error': 'Image is required'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Log information about the received image for debugging
            print(f"📊 [Backend] Image details:")
            print(f"  - Type: {type(image)}")
            print(f"  - Size: {getattr(image, 'size', 'unknown')} bytes")
            print(f"  - Name: {getattr(image, 'name', 'unknown')}")
            print(f"  - Content type: {getattr(image, 'content_type', 'unknown')}")
            
            # Create a new scan object
            scan_data = {
                'patient': patient_id,
                'image': image
            }
            
            print(f"📦 [Backend] Creating scan with data:")
            print(f"  - Patient: {patient_id}")
            print(f"  - Image: {image}")
            
            print(f"⚙️ [Backend] Validating scan data...")
            serializer = self.get_serializer(data=scan_data)
            if serializer.is_valid():
                print(f"✅ [Backend] Scan data validation successful")
                print(f"💾 [Backend] Saving scan to database...")
                self.perform_create(serializer)
                
                scan_id = serializer.data.get('id')
                image_url = serializer.data.get('image')
                print(f"✅ [Backend] Scan created successfully!")
                print(f"🆔 [Backend] Generated scan ID: {scan_id}")
                print(f"🔗 [Backend] Image URL: {image_url}")
                print(f"📤 [Backend] Returning scan data to frontend")
                
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            
            # If validation failed, log the errors
            print(f"❌ [Backend] Serializer validation failed:")
            print(f"❌ [Backend] Validation errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        except Exception as e:
            print(f"❌ [Backend] Error in image upload process:")
            print(f"❌ [Backend] Error message: {str(e)}")
            import traceback
            print(f"❌ [Backend] Traceback:")
            print(traceback.format_exc())
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def process_initial_crop(self, request, pk=None):
        """
        GRANULAR Step 1.1: Segments the full image, finds the bounding box,
        saves the bbox, and crops the *original* image.
        """
        scan = self.get_object()
        print(f"🚀 [Backend] GRANULAR Step 1.1: Starting Initial Crop for Scan ID: {scan.id}")
        try:
            import os
            from django.conf import settings
            from apps.ai_processing.processors.wound_detector import WoundDetector
            from apps.ai_processing.processors.depth_utils import detect_bounding_box_from_segmented, crop_image_with_bbox

            # 1. Segment the entire original image
            print("   - Step 1: Segmenting full original image...")
            detector = WoundDetector()
            segmented_image_path = detector.process(scan.image.path)
            relative_path = os.path.relpath(segmented_image_path, settings.MEDIA_ROOT)
            scan.processed_image = relative_path  # Save the full segmented image path
            print(f"   - Full segmented image saved to: {relative_path}")

            # 2. Detect bounding box from the full segmented image
            print("   - Step 2: Detecting bounding box...")
            bbox = detect_bounding_box_from_segmented(segmented_image_path)
            if bbox is None:
                raise ValueError("Could not detect bounding box from segmented image")
            scan.bbox_data = bbox  # Save bbox to the model
            scan.save()
            print(f"   - Bounding box detected and saved: {bbox}")

            # 3. Crop the original image using the bounding box
            print("   - Step 3: Cropping original image...")
            bbox_output_dir = os.path.join(settings.MEDIA_ROOT, 'bbox_crop_results', f'scan_{scan.id}')
            os.makedirs(bbox_output_dir, exist_ok=True)
            cropped_image_path = os.path.join(bbox_output_dir, "cropped_wound.png")
            crop_success = crop_image_with_bbox(scan.image.path, bbox, cropped_image_path)
            if not crop_success:
                raise ValueError("Failed to crop original image")
            print(f"   - Cropped original image saved to: {cropped_image_path}")

            # 4. Build and return the response
            cropped_image_url = request.build_absolute_uri(settings.MEDIA_URL + os.path.relpath(cropped_image_path, settings.MEDIA_ROOT))
            response_data = {
                'status': 'Initial crop complete',
                'cropped_image_path': cropped_image_url,
                'scan_id': scan.id,
            }
            print("✅ [Backend] GRANULAR Step 1.1 successful.")
            return Response(response_data)

        except Exception as e:
            import traceback
            print(f"❌ [Backend] Error in process_initial_crop: {str(e)}")
            print(traceback.format_exc())
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def process_cropped_segmentation(self, request, pk=None):
        """
        GRANULAR Step 1.2: Uses the saved bounding box to crop the
        full segmented image.
        """
        scan = self.get_object()
        print(f"🚀 [Backend] GRANULAR Step 1.2: Starting Cropped Segmentation for Scan ID: {scan.id}")
        try:
            import os
            from django.conf import settings
            from apps.ai_processing.processors.depth_utils import crop_image_with_bbox

            # 1. Validate necessary data exists
            if not scan.bbox_data:
                raise ValueError("Bounding box data not found. Run initial_crop first.")
            if not scan.processed_image or not os.path.exists(scan.processed_image.path):
                raise ValueError("Full segmented image not found. Run initial_crop first.")
            
            bbox = scan.bbox_data
            full_segmented_path = scan.processed_image.path
            print(f"   - Using saved bounding box: {bbox}")
            print(f"   - Using full segmented image: {full_segmented_path}")

            # 2. Crop the full segmented image using the saved bounding box
            print("   - Step 1: Cropping full segmented image...")
            bbox_output_dir = os.path.join(settings.MEDIA_ROOT, 'bbox_crop_results', f'scan_{scan.id}')
            os.makedirs(bbox_output_dir, exist_ok=True)
            cropped_segmented_path = os.path.join(bbox_output_dir, "cropped_segmented.png")
            crop_success = crop_image_with_bbox(full_segmented_path, bbox, cropped_segmented_path)
            if not crop_success:
                raise ValueError("Failed to crop segmented image")
            print(f"   - Cropped segmented image saved to: {cropped_segmented_path}")

            # 3. Build and return the response
            cropped_segmented_url = request.build_absolute_uri(settings.MEDIA_URL + os.path.relpath(cropped_segmented_path, settings.MEDIA_ROOT))
            response_data = {
                'status': 'Cropped segmentation complete',
                'cropped_segmented_path': cropped_segmented_url,
                'scan_id': scan.id,
            }
            print("✅ [Backend] GRANULAR Step 1.2 successful.")
            return Response(response_data)

        except Exception as e:
            import traceback
            print(f"❌ [Backend] Error in process_cropped_segmentation: {str(e)}")
            print(traceback.format_exc())
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def process_depth_analysis(self, request, pk=None):
        """SIMPLIFIED Step 3: ZoeDepth processing only WITHOUT masking
        
        IMPORTANT: ZoeDepth processing is performed on the CROPPED ORIGINAL image only.
        NO wound masking is applied - the raw ZoeDepth output is used directly.
        
        Simplified Flow: 
        - Input: cropped_wound.png (cropped original) from bbox detection
        - ZoeDepth processes: cropped_wound.png (cropped original)
        - Output: raw depth maps WITHOUT any masking applied
        """
        scan = self.get_object()
        
        print(f"🚀 [Backend] SIMPLIFIED Step 3: Starting ZoeDepth analysis...")
        print(f"🆔 [Backend] Scan ID: {scan.id}")
        print(f"👤 [Backend] Patient ID: {scan.patient.id if scan.patient else 'None'}")
        print(f"📷 [Backend] Processed image: {scan.processed_image}")
        
        try:
            import os
            import cv2
            import numpy as np
            from pathlib import Path
            from django.conf import settings
            from apps.ai_processing.processors.zoedepth_processor import ZoeDepthProcessor
            from apps.ai_processing.processors.depth_utils import calculate_depth_statistics, estimate_volume_from_depth
            
            # Check if wound segmentation and bbox detection were done first
            if not scan.processed_image:
                print(f"❌ [Backend] Error: Wound segmentation must be completed first")
                return Response(
                    {'error': 'Wound segmentation must be completed first. Run /process_wound_segmentation/ first.'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Look for cropped original image from bbox detection
            bbox_output_dir = os.path.join(settings.MEDIA_ROOT, 'bbox_crop_results', f'scan_{scan.id}')
            cropped_image_path = os.path.join(bbox_output_dir, "cropped_wound.png")
            
            print(f"📁 [Backend] Looking for bbox crop results in: {bbox_output_dir}")
            print(f"🔍 [Backend] Checking for cropped original image: {cropped_image_path}")
            
            if not os.path.exists(cropped_image_path):
                print(f"❌ [Backend] Error: Cropped original image not found. Bbox detection must be completed first.")
                return Response(
                    {'error': 'Bbox detection must be completed first. Run /process_bbox_detection/ first.'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            print(f"🤖 [Backend] Processing ZoeDepth on cropped original image (NO MASKING)...")
            # Initialize ZoeDepth processor
            processor = ZoeDepthProcessor()
            processor.load_model()  # Explicitly load the model
            
            print(f"📷 [Backend] IMPORTANT: Using CROPPED ORIGINAL image for ZoeDepth processing (NO MASKING)")
            print(f"📷 [Backend] ZoeDepth input: {cropped_image_path} (cropped original)")
            # Preprocess the cropped ORIGINAL image for ZoeDepth
            processed_image, original_size = processor.preprocess(cropped_image_path)
            
            print(f"🔍 [Backend] Generating raw depth map from cropped ORIGINAL image using ZoeDepth...")
            # Generate depth map using ZoeDepth on cropped ORIGINAL image
            raw_depth_map = processor._generate_depth_map(processed_image)
            
            # Resize depth map to cropped image size if needed
            if processor.config['output_size'] is None and original_size is not None:
                raw_depth_map = cv2.resize(raw_depth_map, original_size, interpolation=cv2.INTER_LINEAR)
            
            print(f"⚠️ [Backend] NO WOUND MASKING APPLIED - using raw ZoeDepth output directly")
            print(f"⚙️ [Backend] Simplified Flow: ZoeDepth(cropped_original) = Final depth map")
            # Use raw depth map directly (NO MASKING APPLIED)
            processed_depth_map = raw_depth_map  # Use raw depth map directly
            
            print(f"📊 [Backend] Calculating depth statistics (no mask applied)...")
            # Calculate depth statistics (no mask applied)
            depth_stats = calculate_depth_statistics(processed_depth_map, mask=None)
            
            print(f"📏 [Backend] Estimating volume (no mask applied)...")
            # Estimate volume (no mask applied)
            volume_estimate = estimate_volume_from_depth(
                processed_depth_map, 
                mask=None, 
                pixel_size_mm=processor.config['pixel_size_mm']
            )
            
            print(f"💾 [Backend] Saving depth maps...")
            # Save depth maps in bbox output directory
            depth_8bit_path = os.path.join(bbox_output_dir, "depth_8bit.png")
            depth_16bit_path = os.path.join(bbox_output_dir, "depth_16bit.png")
            
            # Save 8-bit depth map
            depth_8bit_normalized = cv2.normalize(processed_depth_map, None, 0, 255, cv2.NORM_MINMAX)
            cv2.imwrite(depth_8bit_path, depth_8bit_normalized.astype(np.uint8))
            print(f"✅ [Backend] Saved 8-bit depth map: {depth_8bit_path}")
            
            # Save 16-bit depth map  
            depth_16bit_normalized = cv2.normalize(processed_depth_map, None, 0, 65535, cv2.NORM_MINMAX)
            cv2.imwrite(depth_16bit_path, depth_16bit_normalized.astype(np.uint16))
            print(f"✅ [Backend] Saved 16-bit depth map: {depth_16bit_path}")
            
            print(f"🔗 [Backend] Building depth map URLs...")
            # Build URLs for depth maps
            depth_8bit_relative = os.path.relpath(depth_8bit_path, settings.MEDIA_ROOT)
            depth_8bit_url = request.build_absolute_uri(settings.MEDIA_URL + depth_8bit_relative)
            print(f"🔗 [Backend] 8-bit depth map URL: {depth_8bit_url}")
            
            depth_16bit_relative = os.path.relpath(depth_16bit_path, settings.MEDIA_ROOT)
            depth_16bit_url = request.build_absolute_uri(settings.MEDIA_URL + depth_16bit_relative)
            print(f"🔗 [Backend] 16-bit depth map URL: {depth_16bit_url}")
            
            # Prepare depth metadata (no masking applied)
            depth_metadata = {
                'depth_statistics': depth_stats,
                'volume_estimate': {
                    'total_volume': volume_estimate,
                    'confidence': 0.8,
                    'method': 'ZoeDepth_raw_no_mask'
                },
                'processing_parameters': {
                    'model_type': processor.config['model_type'],
                    'masking_applied': False,  # Updated to reflect no masking
                    'pixel_size_mm': processor.config['pixel_size_mm']
                },
                'workflow_type': 'granular_cropped_no_mask',
                'processor': 'ZoeDepthProcessor'
            }
            
            print(f"💾 [Backend] Saving metadata...")
            # Save metadata
            metadata_path = os.path.join(bbox_output_dir, "metadata.json")
            import json
            with open(metadata_path, 'w') as f:
                json.dump(depth_metadata, f, indent=2, default=str)
            print(f"✅ [Backend] Saved metadata: {metadata_path}")
            
            response_data = {
                'status': 'ZoeDepth analysis complete',
                'depth_map_8bit': depth_8bit_url,
                'depth_map_16bit': depth_16bit_url,
                'volume_estimate': volume_estimate,
                'depth_metadata': depth_metadata,
                'scan_id': scan.id,
                'step': 'depth_analysis',
                'processor': 'ZoeDepthProcessor'
            }
            
            print(f"✅ [Backend] SIMPLIFIED Step 3 completed successfully!")
            print(f"📤 [Backend] Returning response with depth analysis results")
            return Response(response_data)
            
        except Exception as e:
            import traceback
            print(f"❌ [Backend] Error in ZoeDepth analysis:")
            print(f"❌ [Backend] Error message: {str(e)}")
            print(f"❌ [Backend] Traceback:")
            print(traceback.format_exc())
            
            error_details = {
                'error': str(e),
                'traceback': traceback.format_exc(),
                'scan_id': scan.id if 'scan' in locals() else None,
                'step': 'depth_analysis'
            }
            return Response(error_details, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def process_mesh_generation(self, request, pk=None):
        """SIMPLIFIED Step 4: Mesh and preview generation only (uses existing depth analysis)"""
        scan = self.get_object()
        
        print(f"🚀 [Backend] SIMPLIFIED Step 4: Starting mesh generation...")
        print(f"🆔 [Backend] Scan ID: {scan.id}")
        print(f"👤 [Backend] Patient ID: {scan.patient.id if scan.patient else 'None'}")
        print(f"📷 [Backend] Processed image: {scan.processed_image}")
        
        try:
            import os
            import json
            from django.conf import settings
            from apps.ai_processing.processors.mesh_generator import MeshGenerator
            from apps.ai_processing.processors.mesh_preview_generator import MeshPreviewGenerator
            
            # Check if wound segmentation was done first
            if not scan.processed_image:
                print(f"❌ [Backend] Error: Wound segmentation must be completed first")
                return Response(
                    {'error': 'Wound segmentation must be completed first. Run /process_wound_segmentation/ first.'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check for existing depth analysis results
            bbox_output_dir = os.path.join(settings.MEDIA_ROOT, 'bbox_crop_results', f'scan_{scan.id}')
            metadata_path = os.path.join(bbox_output_dir, 'metadata.json')
            depth_8bit_path = os.path.join(bbox_output_dir, 'depth_8bit.png')
            depth_16bit_path = os.path.join(bbox_output_dir, 'depth_16bit.png')
            
            print(f"📁 [Backend] Looking for existing depth analysis in: {bbox_output_dir}")
            print(f"📋 [Backend] Checking for metadata: {metadata_path}")
            print(f"🔍 [Backend] Checking for depth maps: {depth_8bit_path}, {depth_16bit_path}")
            
            if not os.path.exists(metadata_path):
                print(f"❌ [Backend] Error: Depth analysis must be completed first")
                return Response(
                    {'error': 'Depth analysis must be completed first. Run /process_depth_analysis/ first.'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if not os.path.exists(depth_8bit_path) or not os.path.exists(depth_16bit_path):
                print(f"❌ [Backend] Error: Depth maps not found")
                return Response(
                    {'error': 'Depth maps not found. Run /process_depth_analysis/ first.'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            print(f"📋 [Backend] Loading existing depth analysis results...")
            # Load existing depth analysis results
            with open(metadata_path, 'r') as f:
                depth_metadata = json.load(f)
            
            print(f"✅ [Backend] Loaded depth metadata with keys: {list(depth_metadata.keys())}")
            
            # Prepare depth_results structure for mesh generator (compatible format)
            depth_results = {
                'depth_map_8bit_path': depth_8bit_path,
                'depth_map_16bit_path': depth_16bit_path,
                'depth_statistics': depth_metadata.get('depth_statistics', {}),
                'volume_estimate': depth_metadata.get('volume_estimate', {}).get('total_volume', 0),
                'depth_metadata': depth_metadata
            }
            
            print(f"📊 [Backend] Using existing depth analysis results:")
            if depth_results.get('volume_estimate'):
                print(f"📏 [Backend] Volume estimate: {depth_results['volume_estimate']}")
            if depth_results.get('depth_statistics'):
                print(f"📊 [Backend] Depth statistics available")
            
            # Get visualization mode from request (default: balanced - PRODUCTION OPTIMIZED)
            viz_mode = request.data.get('visualization_mode', 'balanced')
            print(f"⚙️ [Backend] Visualization mode: {viz_mode}")
            print(f"💡 [Backend] BALANCED mode is production default (optimized from test_stl_generation.py)")
            
            # Configure based on visualization mode
            if viz_mode == 'realistic':
                # Realistic physical dimensions for 3D printing
                z_dimension = 1.8
                clip_percentile = 10
                print(f"🔧 [Backend] Using realistic mode: z={z_dimension}mm, clip={clip_percentile}%")
            elif viz_mode == 'enhanced':
                # Enhanced visualization for better 3D preview
                z_dimension = 8.0
                clip_percentile = 5
                print(f"🔧 [Backend] Using enhanced mode: z={z_dimension}mm, clip={clip_percentile}%")
            else:  # 'balanced' (PRODUCTION DEFAULT)
                # BALANCED MODE: Optimized for production use based on test results
                # Perfect balance between realism and visualization quality
                z_dimension = 5.0
                clip_percentile = 5
                print(f"🔧 [Backend] Using BALANCED mode (PRODUCTION DEFAULT): z={z_dimension}mm, clip={clip_percentile}%")
            
            # Generate STL mesh using existing depth analysis
            print("🏗️ [Backend] Step 4a: Generating STL mesh from existing depth data...")
            
            mesh_config = {
                'actual_x': 7.4,      # Physical dimensions from STL.py
                'actual_y': 16.4,
                'actual_z': z_dimension,
                'base_layers': 0,
                'base_thickness_mm': 0.26,
                'depth_clip_percentile': clip_percentile
            }
            
            print(f"⚙️ [Backend] Mesh configuration: {mesh_config}")
            
            mesh_generator = MeshGenerator(mesh_config)
            stl_results = mesh_generator.process(depth_results)
            
            print(f"✅ [Backend] STL generation completed!")
            print(f"📋 [Backend] STL results keys: {list(stl_results.keys())}")
            print(f"📊 [Backend] Generation status: {stl_results.get('generation_status')}")
            
            if stl_results.get('stl_file_path'):
                print(f"🏗️ [Backend] STL file generated: {stl_results['stl_file_path']}")
            if stl_results.get('mesh_metadata'):
                mesh_meta = stl_results['mesh_metadata']
                print(f"📊 [Backend] Mesh metadata:")
                if mesh_meta.get('vertex_count'):
                    print(f"  - Vertex count: {mesh_meta['vertex_count']}")
                if mesh_meta.get('face_count'):
                    print(f"  - Face count: {mesh_meta['face_count']}")
                if mesh_meta.get('file_size_bytes'):
                    print(f"  - File size: {mesh_meta['file_size_bytes']} bytes")
            
            if stl_results['generation_status'] != 'success':
                print(f"❌ [Backend] STL generation failed: {stl_results.get('error', 'Unknown error')}")
                return Response(
                    {'error': f'STL generation failed: {stl_results.get("error", "Unknown error")}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            # Generate mesh preview
            print("🖼️ [Backend] Step 4b: Generating mesh preview...")
            
            # BALANCED MODE preview configuration - PRODUCTION OPTIMIZED
            # Based on successful test results from test_stl_generation.py
            preview_config = {
                'camera_position': (1.5, 1.5, 1),    # BALANCED: Improved isometric angle for better depth view
                'mesh_color': 'lightgray',           # BALANCED: Light gray for clinical clarity
                'background_color': 'white',         # BALANCED: White background for professional look
                'output_size': (1000, 800),          # BALANCED: High resolution for clinical assessment
                'zoom_factor': 1.0,                  # BALANCED: Standard zoom for optimal visibility
                'offscreen': True,                   # Server-side rendering
                'use_matplotlib_fallback': True      # BALANCED: Consistent rendering across platforms
            }
            
            print(f"⚙️ [Backend] Preview configuration: {preview_config}")
            
            preview_generator = MeshPreviewGenerator(preview_config)
            preview_results = preview_generator.process(stl_results)
            
            print(f"✅ [Backend] Mesh preview generation completed!")
            print(f"📋 [Backend] Preview results keys: {list(preview_results.keys())}")
            print(f"📊 [Backend] Preview generation status: {preview_results.get('generation_status')}")
            
            if preview_results.get('preview_image_path'):
                print(f"🎨 [Backend] Preview image generated: {preview_results['preview_image_path']}")
            if preview_results.get('preview_metadata'):
                print(f"📊 [Backend] Preview metadata available")
            if preview_results.get('view_info'):
                print(f"📐 [Backend] View info available")
            
            print(f"🔗 [Backend] Building response URLs...")
            # Build URLs for generated files
            stl_file_url = None
            preview_image_url = None
            
            if stl_results.get('stl_file_path'):
                stl_relative = os.path.relpath(stl_results['stl_file_path'], settings.MEDIA_ROOT)
                stl_file_url = request.build_absolute_uri(settings.MEDIA_URL + stl_relative)
                print(f"🔗 [Backend] STL file URL: {stl_file_url}")
            
            if preview_results.get('preview_image_path'):
                preview_relative = os.path.relpath(preview_results['preview_image_path'], settings.MEDIA_ROOT)
                preview_image_url = request.build_absolute_uri(settings.MEDIA_URL + preview_relative)
                print(f"🔗 [Backend] Preview image URL: {preview_image_url}")
            
            # Prepare response data
            response_data = {
                'status': 'Mesh generation complete',
                'scan_id': scan.id,
                'step': 'mesh_generation',
                'stl_generation': {
                    'status': stl_results['generation_status'],
                    'stl_file_url': stl_file_url,
                    'mesh_metadata': stl_results['mesh_metadata'],
                    'algorithm': stl_results.get('algorithm', 'STL_reference'),
                    'visualization_mode': viz_mode,
                    'z_dimension_mm': z_dimension,
                    'configuration_notes': {
                        'realistic': 'Accurate 1.8mm depth for 3D printing',
                        'enhanced': 'Enhanced 8.0mm depth for better visualization', 
                        'balanced': 'Balanced 5.0mm depth (default)'
                    }.get(viz_mode, 'Balanced configuration')
                },
                'preview_generation': {
                    'status': preview_results['generation_status'],
                    'preview_image_url': preview_image_url,
                    'preview_metadata': preview_results['preview_metadata'],
                    'view_info': preview_results['view_info']
                },
                'depth_analysis': {
                    'volume_estimate': depth_results.get('volume_estimate', {}),
                    'depth_statistics': depth_results.get('depth_statistics', {})
                }
            }
            
            print(f"✅ [Backend] SIMPLIFIED Step 4 completed successfully!")
            print(f"📤 [Backend] Returning response with STL and preview data")
            return Response(response_data)
            
        except Exception as e:
            import traceback
            print(f"❌ [Backend] Error in mesh generation:")
            print(f"❌ [Backend] Error message: {str(e)}")
            print(f"❌ [Backend] Traceback:")
            print(traceback.format_exc())
            
            error_details = {
                'error': str(e),
                'traceback': traceback.format_exc(),
                'scan_id': scan.id if 'scan' in locals() else None,
                'step': 'mesh_generation'
            }
            return Response(error_details, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    # ... (keep existing deprecated methods for now)
    @action(detail=True, methods=['post'])
    def process_wound_detection(self, request, pk=None):
        """DEPRECATED MONOLITHIC: Process wound detection with bbox crop workflow
        
        ⚠️ DEPRECATED: This endpoint is monolithic and performs multiple steps:
        - YOLO wound segmentation  
        - Bbox detection and cropping
        - ZoeDepth processing
        - Volume estimation
        
        🆕 USE INSTEAD: New granular endpoints for step-by-step processing:
        - /process_wound_segmentation/ (Step 1)
        - /process_bbox_detection/ (Step 2) 
        - /process_depth_analysis/ (Step 3)
        - /process_mesh_generation/ (Step 4)
        """
        scan = self.get_object()
        
        print(f"⚠️ [Backend] DEPRECATED: process_wound_detection called - consider using granular endpoints")
        print(f"🚀 [Backend] Step 2: Starting wound detection with bbox crop workflow...")
        print(f"🆔 [Backend] Scan ID: {scan.id}")
        print(f"📷 [Backend] Original image path: {scan.image.path}")
        print(f"👤 [Backend] Patient ID: {scan.patient.id if scan.patient else 'None'}")
        
        try:
            import os
            from django.conf import settings
            from apps.ai_processing.processors.wound_detector import WoundDetector
            from apps.ai_processing.processors.zoedepth_processor import ZoeDepthProcessor
            
            print(f"🔍 [Backend] Step 2a: Starting basic wound detection...")
            # Step 1a: Basic Wound Detection to create segmented image
            detector = WoundDetector()
            segmented_image_path = detector.process(scan.image.path)
            print(f"✅ [Backend] Wound detection completed: {segmented_image_path}")
            
            # Convert absolute path to relative path for Django FileField
            relative_path = os.path.relpath(segmented_image_path, settings.MEDIA_ROOT)
            scan.processed_image = relative_path
            scan.save()
            print(f"💾 [Backend] Saved processed image to scan: {relative_path}")
            
            print(f"📦 [Backend] Step 2b: Starting bbox crop workflow...")
            # Step 1b: Use bbox crop workflow to create cropped images
            # Create output directory for bbox crop results
            bbox_output_dir = os.path.join(settings.MEDIA_ROOT, 'bbox_crop_results', f'scan_{scan.id}')
            os.makedirs(bbox_output_dir, exist_ok=True)
            print(f"📁 [Backend] Created bbox output directory: {bbox_output_dir}")
            
            # Initialize ZoeDepthProcessor with bbox crop workflow
            zoedepth_processor = ZoeDepthProcessor()
            print(f"🤖 [Backend] Processing with bbox crop workflow...")
            bbox_results = zoedepth_processor.process_with_bbox_crop(
                original_image_path=scan.image.path,
                segmented_image_path=segmented_image_path,
                output_dir=bbox_output_dir
            )
            
            print(f"✅ [Backend] Bbox crop workflow completed!")
            print(f"📋 [Backend] Bbox results keys: {list(bbox_results.keys())}")
            
            # Log each generated file
            if bbox_results.get('cropped_segmented_path'):
                print(f"✂️ [Backend] Generated cropped segmented image: {bbox_results['cropped_segmented_path']}")
            if bbox_results.get('cropped_image_path'):
                print(f"📷 [Backend] Generated cropped original image: {bbox_results['cropped_image_path']}")
            if bbox_results.get('bbox_visualization_path'):
                print(f"📦 [Backend] Generated bbox visualization: {bbox_results['bbox_visualization_path']}")
            if bbox_results.get('depth_map_8bit_path'):
                print(f"🔍 [Backend] Generated 8-bit depth map: {bbox_results['depth_map_8bit_path']}")
            if bbox_results.get('depth_map_16bit_path'):
                print(f"🔬 [Backend] Generated 16-bit depth map: {bbox_results['depth_map_16bit_path']}")
            if bbox_results.get('volume_estimate'):
                print(f"📏 [Backend] Volume estimate: {bbox_results['volume_estimate']}")
            if bbox_results.get('bbox'):
                print(f"📐 [Backend] Bounding box coordinates: {bbox_results['bbox']}")
            
            print(f"🔗 [Backend] Building response URLs...")
            # Build URLs for all generated images
            processed_image_url = request.build_absolute_uri(scan.processed_image.url) if scan.processed_image else None
            
            # Build URLs for bbox crop results
            cropped_segmented_url = None
            cropped_image_url = None
            bbox_visualization_url = None
            depth_8bit_url = None
            depth_16bit_url = None
            
            if bbox_results.get('cropped_segmented_path'):
                cropped_segmented_relative = os.path.relpath(bbox_results['cropped_segmented_path'], settings.MEDIA_ROOT)
                cropped_segmented_url = request.build_absolute_uri(settings.MEDIA_URL + cropped_segmented_relative)
                print(f"🔗 [Backend] Cropped segmented URL: {cropped_segmented_url}")
            
            if bbox_results.get('cropped_image_path'):
                cropped_image_relative = os.path.relpath(bbox_results['cropped_image_path'], settings.MEDIA_ROOT)
                cropped_image_url = request.build_absolute_uri(settings.MEDIA_URL + cropped_image_relative)
                print(f"🔗 [Backend] Cropped image URL: {cropped_image_url}")
            
            if bbox_results.get('bbox_visualization_path'):
                bbox_viz_relative = os.path.relpath(bbox_results['bbox_visualization_path'], settings.MEDIA_ROOT)
                bbox_visualization_url = request.build_absolute_uri(settings.MEDIA_URL + bbox_viz_relative)
                print(f"🔗 [Backend] Bbox visualization URL: {bbox_visualization_url}")
            
            # Include depth map URLs that were generated during bbox crop processing
            if bbox_results.get('depth_map_8bit_path'):
                depth_8bit_relative = os.path.relpath(bbox_results['depth_map_8bit_path'], settings.MEDIA_ROOT)
                depth_8bit_url = request.build_absolute_uri(settings.MEDIA_URL + depth_8bit_relative)
                print(f"🔗 [Backend] 8-bit depth map URL: {depth_8bit_url}")
            
            if bbox_results.get('depth_map_16bit_path'):
                depth_16bit_relative = os.path.relpath(bbox_results['depth_map_16bit_path'], settings.MEDIA_ROOT)
                depth_16bit_url = request.build_absolute_uri(settings.MEDIA_URL + depth_16bit_relative)
                print(f"🔗 [Backend] 16-bit depth map URL: {depth_16bit_url}")
            
            response_data = {
                'status': 'Wound detection complete with bbox crop',
                'processed_image': processed_image_url,  # Original segmented image
                'cropped_segmented_path': cropped_segmented_url,  # Cropped segmented image (what user wants)
                'cropped_image_path': cropped_image_url,  # Cropped original image
                'bbox_visualization_path': bbox_visualization_url,  # Bbox visualization
                'depth_map_8bit': depth_8bit_url,  # 8-bit depth map generated during bbox crop
                'depth_map_16bit': depth_16bit_url,  # 16-bit depth map generated during bbox crop
                'volume_estimate': bbox_results.get('volume_estimate', {}).get('total_volume'),  # Volume estimate
                'bbox': bbox_results.get('bbox', {}),  # Bounding box coordinates
                'scan_id': scan.id,
                'step': 'wound_detection_with_bbox_crop',
                'workflow_type': 'bbox_crop'
            }
            
            print(f"✅ [Backend] Step 2 completed successfully!")
            print(f"📤 [Backend] Returning response with {len(response_data)} fields")
            return Response(response_data)
            
        except Exception as e:
            import traceback
            print(f"❌ [Backend] Error in wound detection workflow:")
            print(f"❌ [Backend] Error message: {str(e)}")
            print(f"❌ [Backend] Traceback:")
            print(traceback.format_exc())
            
            error_details = {
                'error': str(e),
                'traceback': traceback.format_exc(),
                'scan_id': scan.id if 'scan' in locals() else None,
                'step': 'wound_detection_with_bbox_crop'
            }
            return Response(error_details, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def process_scan(self, request, pk=None):
        """DEPRECATED LEGACY: Complete processing pipeline (for backwards compatibility)
        
        ⚠️ DEPRECATED: This endpoint processes everything in one monolithic call:
        - Wound Detection
        - ZoeDepth Processing  
        - Volume estimation
        
        🆕 USE INSTEAD: New granular endpoints for step-by-step processing:
        - /process_wound_segmentation/ (Step 1) 
        - /process_bbox_detection/ (Step 2)
        - /process_depth_analysis/ (Step 3)
        - /process_mesh_generation/ (Step 4)
        """
        scan = self.get_object()
        
        print(f"⚠️ [Backend] DEPRECATED: process_scan called - consider using granular endpoints")
        
        try:
            import os
            from django.conf import settings
            from apps.ai_processing.processors.wound_detector import WoundDetector
            from apps.ai_processing.processors.depth_analyzer import DepthAnalyzer
            
            # Step 1: Wound Detection
            detector = WoundDetector()
            segmented_image_path = detector.process(scan.image.path)
            
            # Convert absolute path to relative path for Django FileField
            relative_path = os.path.relpath(segmented_image_path, settings.MEDIA_ROOT)
            scan.processed_image = relative_path
            scan.is_processed = True
            scan.save()
            
            # Build full URL for the processed image
            processed_image_url = request.build_absolute_uri(scan.processed_image.url) if scan.processed_image else None
            
            # Step 2: ZoeDepth Processing
            depth_analyzer = DepthAnalyzer()
            depth_results = depth_analyzer.process(segmented_image_path)
            
            # Build URLs for depth maps
            depth_8bit_url = None
            depth_16bit_url = None
            
            if depth_results.get('depth_map_8bit_path'):
                depth_8bit_relative = os.path.relpath(depth_results['depth_map_8bit_path'], settings.MEDIA_ROOT)
                depth_8bit_url = request.build_absolute_uri(settings.MEDIA_URL + depth_8bit_relative)
            
            if depth_results.get('depth_map_16bit_path'):
                depth_16bit_relative = os.path.relpath(depth_results['depth_map_16bit_path'], settings.MEDIA_ROOT)
                depth_16bit_url = request.build_absolute_uri(settings.MEDIA_URL + depth_16bit_relative)
            
            # Prepare comprehensive response
            response_data = {
                'status': 'Processing complete', 
                'processed_image': processed_image_url,
                'depth_map_8bit': depth_8bit_url,
                'depth_map_16bit': depth_16bit_url,
                'depth_metadata': {
                    'depth_statistics': depth_results.get('depth_statistics', {}),
                    'volume_estimate': depth_results.get('volume_estimate', {}),
                    'wound_severity': depth_results.get('wound_severity', 'unknown'),
                    'processing_confidence': depth_results.get('processing_confidence', 0.0),
                    'surface_area': depth_results.get('surface_area', 0.0),
                    'wound_mask_extracted': depth_results.get('wound_mask_extracted', False),
                    'analysis_method': depth_results.get('analysis_method', 'ZoeDepth_monocular'),
                    'processor': depth_results.get('processor', 'DepthAnalyzer'),
                    'timestamp': depth_results.get('timestamp'),
                    'units': depth_results.get('units', {})
                },
                'processing_pipeline': ['WoundDetector', 'ZoeDepth', 'DepthAnalyzer'],
                'scan_id': scan.id
            }
            
            return Response(response_data)
            
        except Exception as e:
            import traceback
            error_details = {
                'error': str(e),
                'traceback': traceback.format_exc(),
                'scan_id': scan.id if 'scan' in locals() else None
            }
            return Response(error_details, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def process_wound_segmentation(self, request, pk=None):
        """GRANULAR Step 1: YOLO wound segmentation only"""
        scan = self.get_object()
        
        print(f"🚀 [Backend] GRANULAR Step 1: Starting YOLO wound segmentation...")
        print(f"🆔 [Backend] Scan ID: {scan.id}")
        print(f"📷 [Backend] Original image path: {scan.image.path}")
        print(f"👤 [Backend] Patient ID: {scan.patient.id if scan.patient else 'None'}")
        
        try:
            import os
            from django.conf import settings
            from apps.ai_processing.processors.wound_detector import WoundDetector
            
            # Validate original image exists
            if not scan.image:
                print(f"❌ [Backend] Error: Original image is required")
                return Response(
                    {'error': 'Original image is required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            print(f"🤖 [Backend] Processing YOLO wound segmentation...")
            # Step 1: YOLO Wound Detection to create segmented image
            detector = WoundDetector()
            segmented_image_path = detector.process(scan.image.path)
            print(f"✅ [Backend] YOLO wound segmentation completed: {segmented_image_path}")
            
            # Convert absolute path to relative path for Django FileField
            relative_path = os.path.relpath(segmented_image_path, settings.MEDIA_ROOT)
            scan.processed_image = relative_path
            scan.save()
            print(f"💾 [Backend] Saved processed image to scan: {relative_path}")
            
            # Build URL for the processed image
            processed_image_url = request.build_absolute_uri(scan.processed_image.url) if scan.processed_image else None
            print(f"🔗 [Backend] Processed image URL: {processed_image_url}")
            
            response_data = {
                'status': 'YOLO wound segmentation complete',
                'processed_image': processed_image_url,  # Segmented image
                'scan_id': scan.id,
                'step': 'wound_segmentation',
                'processor': 'WoundDetector'
            }
            
            print(f"✅ [Backend] GRANULAR Step 1 completed successfully!")
            print(f"📤 [Backend] Returning response with segmented image URL")
            return Response(response_data)
            
        except Exception as e:
            import traceback
            print(f"❌ [Backend] Error in YOLO wound segmentation:")
            print(f"❌ [Backend] Error message: {str(e)}")
            print(f"❌ [Backend] Traceback:")
            print(traceback.format_exc())
            
            error_details = {
                'error': str(e),
                'traceback': traceback.format_exc(),
                'scan_id': scan.id if 'scan' in locals() else None,
                'step': 'wound_segmentation'
            }
            return Response(error_details, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def process_bbox_detection(self, request, pk=None):
        """GRANULAR Step 2: Bbox detection and cropping only"""
        scan = self.get_object()
        
        print(f"🚀 [Backend] GRANULAR Step 2: Starting bbox detection and cropping...")
        print(f"🆔 [Backend] Scan ID: {scan.id}")
        print(f"📷 [Backend] Original image path: {scan.image.path}")
        print(f"🎯 [Backend] Segmented image path: {scan.processed_image.path if scan.processed_image else 'None'}")
        print(f"👤 [Backend] Patient ID: {scan.patient.id if scan.patient else 'None'}")
        
        try:
            import os
            from django.conf import settings
            from apps.ai_processing.processors.depth_utils import detect_bounding_box_from_segmented, crop_image_with_bbox, visualize_bounding_box
            
            # Validate that wound segmentation was done first
            if not scan.processed_image:
                print(f"❌ [Backend] Error: Wound segmentation must be completed first")
                return Response(
                    {'error': 'Wound segmentation must be completed first. Run /process_wound_segmentation/ first.'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            segmented_image_path = scan.processed_image.path
            original_image_path = scan.image.path
            
            print(f"📦 [Backend] Step 2a: Creating bbox output directory...")
            # Create output directory for bbox crop results
            bbox_output_dir = os.path.join(settings.MEDIA_ROOT, 'bbox_crop_results', f'scan_{scan.id}')
            os.makedirs(bbox_output_dir, exist_ok=True)
            print(f"📁 [Backend] Created bbox output directory: {bbox_output_dir}")
            
            print(f"🔍 [Backend] Step 2b: Detecting bounding box from segmented image...")
            # Step 1: Detect bounding box from segmented image
            bbox = detect_bounding_box_from_segmented(segmented_image_path)
            if bbox is None:
                raise ValueError("Could not detect bounding box from segmented image")
            print(f"📐 [Backend] Detected bounding box: {bbox}")
            
            print(f"🖼️ [Backend] Step 2c: Creating bbox visualization...")
            # Step 2: Visualize bounding box on original image
            bbox_viz_path = os.path.join(bbox_output_dir, "bbox_visualization.png")
            visualize_success = visualize_bounding_box(original_image_path, bbox, bbox_viz_path)
            if not visualize_success:
                print(f"⚠️ [Backend] Warning: Failed to create bbox visualization")
            else:
                print(f"✅ [Backend] Created bbox visualization: {bbox_viz_path}")
            
            print(f"✂️ [Backend] Step 2d: Cropping original image...")
            # Step 3: Crop original image using bounding box
            cropped_image_path = os.path.join(bbox_output_dir, "cropped_wound.png")
            crop_success = crop_image_with_bbox(original_image_path, bbox, cropped_image_path)
            if not crop_success:
                raise ValueError("Failed to crop original image using bounding box")
            print(f"✅ [Backend] Cropped original image: {cropped_image_path}")
            
            print(f"🎯 [Backend] Step 2e: Cropping segmented image...")
            # Step 4: Crop segmented image using same bounding box
            cropped_segmented_path = os.path.join(bbox_output_dir, "cropped_segmented.png")
            crop_segmented_success = crop_image_with_bbox(segmented_image_path, bbox, cropped_segmented_path)
            if not crop_segmented_success:
                raise ValueError("Failed to crop segmented image using bounding box")
            print(f"✅ [Backend] Cropped segmented image: {cropped_segmented_path}")
            
            print(f"🔗 [Backend] Building response URLs...")
            # Build URLs for all generated images
            cropped_image_url = None
            cropped_segmented_url = None
            bbox_visualization_url = None
            
            if os.path.exists(cropped_image_path):
                cropped_image_relative = os.path.relpath(cropped_image_path, settings.MEDIA_ROOT)
                cropped_image_url = request.build_absolute_uri(settings.MEDIA_URL + cropped_image_relative)
                print(f"🔗 [Backend] Cropped image URL: {cropped_image_url}")
            
            if os.path.exists(cropped_segmented_path):
                cropped_segmented_relative = os.path.relpath(cropped_segmented_path, settings.MEDIA_ROOT)
                cropped_segmented_url = request.build_absolute_uri(settings.MEDIA_URL + cropped_segmented_relative)
                print(f"🔗 [Backend] Cropped segmented URL: {cropped_segmented_url}")
            
            if os.path.exists(bbox_viz_path):
                bbox_viz_relative = os.path.relpath(bbox_viz_path, settings.MEDIA_ROOT)
                bbox_visualization_url = request.build_absolute_uri(settings.MEDIA_URL + bbox_viz_relative)
                print(f"🔗 [Backend] Bbox visualization URL: {bbox_visualization_url}")
            
            response_data = {
                'status': 'Bbox detection and cropping complete',
                'cropped_image_path': cropped_image_url,  # Cropped original image
                'cropped_segmented_path': cropped_segmented_url,  # Cropped segmented image
                'bbox_visualization_path': bbox_visualization_url,  # Bbox visualization
                'bbox': bbox,  # Bounding box coordinates
                'scan_id': scan.id,
                'step': 'bbox_detection'
            }
            
            print(f"✅ [Backend] GRANULAR Step 2 completed successfully!")
            print(f"📤 [Backend] Returning response with cropped images and bbox data")
            return Response(response_data)
            
        except Exception as e:
            import traceback
            print(f"❌ [Backend] Error in bbox detection and cropping:")
            print(f"❌ [Backend] Error message: {str(e)}")
            print(f"❌ [Backend] Traceback:")
            print(traceback.format_exc())
            
            error_details = {
                'error': str(e),
                'traceback': traceback.format_exc(),
                'scan_id': scan.id if 'scan' in locals() else None,
                'step': 'bbox_detection'
            }
            return Response(error_details, status=status.HTTP_500_INTERNAL_SERVER_ERROR)