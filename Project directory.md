```
Project-2/
├── .env.example            # Backend environment template (Gemini API key)
├── requirements.txt        # Complete ZoeDepth project dependencies (62 packages) 🔥 UPDATED
├── weights/               # AI model weights (ZoeDepth models: ZoeD_NK 1.35GB, ZoeD_N 1.34GB)
├── backend/                 # Django REST API backend (ZoeDepth pipeline with bbox crop workflow COMPLETE ✅)
│   ├── apps/               # Django applications (modular architecture) - CLEANED ✅
│   │   ├── authentication/ # User authentication & authorization
│   │   │   ├── models.py   # UserProfile model with admin roles
│   │   │   ├── views.py    # CustomAuthToken, register_user, get_user_info
│   │   │   ├── urls.py     # API endpoints: /api/login/, /api/register/, /api/user-info/
│   │   │   ├── serializers.py # DRF serializers for user data
│   │   │   └── management/commands/create_default_user.py # CLI: creates admin/default users
│   │   ├── patients/       # Patient management & CRUD operations
│   │   │   ├── models.py   # Patient model (name, NRIC, DOB, contact, details)
│   │   │   ├── views.py    # PatientViewSet with user-based filtering
│   │   │   ├── urls.py     # RESTful API: /api/patients/ (CRUD operations)
│   │   │   ├── serializers.py # Patient data serialization
│   │   │   └── management/commands/ # CLI utilities
│   │   │       ├── load_sample_patients.py # Load sample patient records ✅ ENHANCED
│   │   │       └── cleanup_storage.py      # Clean unused media files ✅ NEW
│   │   ├── scans/          # Medical scan data & step-by-step ZoeDepth processing ✅ REFACTORED
│   │   │   ├── models.py   # Scan + ScanResult models (OneToOne relationship) ✅ MIGRATION 0003
│   │   │   │               # - Scan: image, bbox_data, patient relation
│   │   │   │               # - ScanResult: STL files, depth maps, previews (patient-organized)
│   │   │   ├── views.py    # ScanViewSet + granular processing endpoints ✅ UPDATED
│   │   │   │               # - /upload_image/ - Image upload only
│   │   │   │               # - /process_initial_crop/ - Segment & crop original
│   │   │   │               # - /process_cropped_segmentation/ - Crop segmented image
│   │   │   │               # - /process_depth_analysis/ - ZoeDepth analysis
│   │   │   │               # - /process_mesh_generation/ - STL & preview generation
│   │   │   ├── urls.py     # RESTful API: /api/scans/ (CRUD + step-by-step processing)
│   │   │   ├── serializers.py # Scan + ScanResult serializers with file validation ✅ UPDATED
│   │   │   └── management/commands/ # Management utilities
│   │   ├── ai_processing/  # AI model integration & ZoeDepth pipeline (COMPLETE)
│   │   │   ├── models.py   # AIModel model for storing AI model metadata
│   │   │   ├── views.py    # AIModelViewSet (commented out - unused) ⚠️ DISABLED
│   │   │   ├── urls.py     # No active endpoints (commented out)
│   │   │   ├── serializers.py # AI model data serialization
│   │   │   └── processors/ # AI processing pipeline components (ZoeDepth integrated) ✅ ACTIVE
│   │   │       ├── base.py              # BaseProcessor abstract class
│   │   │       ├── wound_detector.py    # YOLO-based wound detection (segmentation)
│   │   │       ├── zoedepth_processor.py # ZoeDepth monocular depth estimation (ZoeD_NK + bbox crop)
│   │   │       ├── depth_utils.py       # ZoeDepth utilities (bbox crop, Algorithm 1 processing)
│   │   │       ├── depth_analyzer.py    # Depth analysis wrapper (uses ZoeDepth)
│   │   │       ├── mesh_generator.py    # 3D mesh generation from depth maps (STL.py algorithm)
│   │   │       └── mesh_preview_generator.py # STL preview generation (vedo rendering)
│   │   ├── common/         # Shared utilities and mixins
│   │   └── __init__.py
│   ├── config/             # Django configuration & settings
│   │   ├── settings/       # Environment-specific settings
│   │   │   ├── base.py     # Base Django settings (DRF, CORS, auth)
│   │   │   ├── development.py # Development environment settings
│   │   │   ├── production.py  # Production environment settings
│   │   │   └── testing.py     # Testing environment settings
│   │   ├── urls.py         # Main URL configuration ✅ CLEANED (removed coreViews routes)
│   │   ├── wsgi.py         # WSGI application
│   │   └── asgi.py         # ASGI application
│   ├── requirements/       # Environment-specific dependencies
│   │   ├── base.txt        # Core dependencies (Django, DRF, Pillow)
│   │   ├── development.txt # Dev tools (debug toolbar, pytest, black)
│   │   ├── production.txt  # Production deps (gunicorn, postgres, redis)
│   │   └── testing.txt     # Testing framework dependencies
│   ├── scripts/            # Server startup & utility scripts
│   │   ├── run_server.py   # Production server runner with network detection
│   │   ├── run_server.bat  # Windows batch file for server startup  
│   │   └── yolov8n-seg.pt  # YOLO segmentation model weights (6.7MB)
│   ├── media/              # Patient-organized file storage ✅ NEW STRUCTURE
│   │   ├── scans/          # Original medical scan images
│   │   ├── processed_scans/ # YOLO-segmented wound images
│   │   ├── bbox_crop_results/ # Intermediate crop processing results
│   │   ├── generated_stl/  # Legacy STL files (transitioning out)
│   │   ├── stl_previews/   # Legacy preview images (transitioning out)
│   │   ├── {PatientName}/  # ✅ NEW: Patient-specific directories
│   │   │   │               # Example: Allison_Torres/, Amanda_Hudson/
│   │   │   ├── *_scan001_wound_model.stl    # STL files with scan numbering
│   │   │   ├── *_scan001_depth_map_8bit.png # 8-bit depth maps
│   │   │   ├── *_scan001_depth_map_16bit.png # 16-bit depth maps
│   │   │   └── *_scan001_stl_preview.png    # STL preview images
│   │   └── info.txt        # Media directory information
│   ├── static/             # Static files (CSS, JS, images)
│   ├── logs/               # Application logs
│   │   └── django.log      # Django application logs
│   ├── test/               # Testing scripts and output directories
│   │   ├── test_complete_flow.py      # End-to-end API testing
│   │   ├── test_depth_no_mask.py      # Depth processing tests
│   │   ├── test_full_pipeline.py      # Complete pipeline tests
│   │   ├── test_redownload_zoedepth.py # ZoeDepth model re-download
│   │   ├── test_stl_generation.py     # STL generation tests
│   │   └── test*/          # Test output directories (ignored by git)
│   ├── db.sqlite3          # SQLite database file
│   ├── clean_media.py      # Media cleanup utility
│   └── manage.py           # Django management script
├── frontend/               # React Native (Expo) mobile app - CLEANED & OPTIMIZED ✅
│   ├── src/                # Source code directory (unused files removed, components consolidated)
│   │   ├── screens/        # App screens (13 total - complete workflow)
│   │   │   ├── auth/       # Authentication screens
│   │   │   │   ├── LoginScreen.js     # User login with token authentication
│   │   │   │   ├── SignUpScreen.js    # User registration ✅ CLEANED (BackArrowIcon centralized)
│   │   │   │   └── index.js           # Auth screens export
│   │   │   ├── patients/   # Patient management screens (4 screens)
│   │   │   │   ├── PatientsListScreen.js    # Patient list with search & logout (uses PatientListItem)
│   │   │   │   ├── NewPatientFormScreen.js  # Patient creation form (NRIC, DOB, etc.)
│   │   │   │   ├── PatientDetailScreen.js   # Patient details, edit, delete, scan access ✅ UPDATED
│   │   │   │   ├── ScanResultsScreen.js     # View patient scan history & results ✅ FIXED STL filtering
│   │   │   │   └── index.js                 # Patient screens export
│   │   │   ├── scanning/   # Image capture screens (2 screens)
│   │   │   │   ├── CameraScreen.js     # Camera interface with patient selection
│   │   │   │   ├── PhotoPreviewScreen.js # Photo preview before submission ✅ UPDATED (granular processing)
│   │   │   │   └── index.js            # Scanning screens export
│   │   │   ├── ai-processing/ # AI workflow screens (5 screens) - REFACTORED ✅
│   │   │   │   ├── ProcessingScreen.js      # Progress tracking for step-by-step AI pipeline ✅ NEW
│   │   │   │   ├── CroppedOriginalScreen.js # Display cropped original image ✅ NEW
│   │   │   │   ├── WoundDetectionScreen.js  # YOLO-based wound detection results ✅ UPDATED
│   │   │   │   ├── DepthDetectionScreen.js  # Depth map analysis results ✅ UPDATED
│   │   │   │   ├── MeshDetectionScreen.js   # 3D mesh generation results ✅ UPDATED
│   │   │   │   ├── DownloadFilesScreen.js   # Download processed files (STL, images) ✅ UPDATED
│   │   │   │   └── index.js                 # AI processing screens export
│   │   │   └── index.js    # Main screens export
│   │   ├── components/     # Reusable UI components (architecture cleaned up) ✅ OPTIMIZED
│   │   │   ├── ui/         # Core UI components (centralized & consolidated)
│   │   │   │   ├── LogoHeader.js        # App logo header component
│   │   │   │   ├── NavigationButton.js  # Styled navigation buttons
│   │   │   │   ├── Icons.js             # ✅ CONSOLIDATED: Single BackArrowIcon (removed 8 duplicates)
│   │   │   │   └── index.js             # UI components export
│   │   │   ├── navigation/ # Navigation utilities
│   │   │   │   └── index.js             # Navigation components export (empty)
│   │   │   ├── layout/     # Layout components directory (empty)
│   │   │   └── index.js    # Main components export
│   │   ├── services/       # API layer & backend integration (4 services) ✅ CLEANED
│   │   │   ├── api.js      # Base API configuration with axios
│   │   │   │               # - Dynamic IP detection (.env support)
│   │   │   │               # - Token authentication interceptors
│   │   │   │               # - Enhanced error handling & logging
│   │   │   │               # - 60s timeout for AI processing
│   │   │   ├── authService.js    # Authentication service
│   │   │   │               # - login(), register(), logout()
│   │   │   │               # - getUserInfo(), isAuthenticated()
│   │   │   │               # - AsyncStorage token management
│   │   │   ├── patientService.js # Patient CRUD operations
│   │   │   │               # - getAllPatients(), getPatient()
│   │   │   │               # - createPatient(), updatePatient(), deletePatient()
│   │   │   ├── scanService.js    # Scan management service ✅ UPDATED
│   │   │   │               # - getAllScans(), getPatientScans()
│   │   │               # - createScan() (upload only)
│   │   │   │               # - processInitialCrop(), processCroppedSegmentation()
│   │   │   │               # - processDepthAnalysis(), processMeshGeneration()
│   │   │   │               # - Step-by-step processing support
│   │   │   └── index.js    # Services export aggregation ✅ CLEANED (removed aiProcessingService)
│   │   ├── assets/         # Static resources & media
│   │   │   ├── fonts/      # Typography assets
│   │   │   │   ├── Urbanist-Regular.ttf  # Primary font
│   │   │   │   ├── Urbanist-Bold.ttf     # Bold weight
│   │   │   │   └── Urbanist-Italic.ttf   # Italic style
│   │   │   ├── icons/      # UI icons (SVG/PNG)
│   │   │   │   ├── camera.svg        # Camera interface icon
│   │   │   │   ├── backarrow.svg     # Navigation back button
│   │   │   │   ├── flipcamera.svg    # Camera flip icon
│   │   │   │   ├── searchIcon.png    # Search functionality
│   │   │   │   ├── Tick.png          # Success/completion icon
│   │   │   │   └── DropDownIcon.png  # Dropdown menu icon
│   │   │   ├── images/     # Sample images & branding
│   │   │   │   ├── NUS_logo.jpg      # University branding
│   │   │   │   ├── download_icon_*.png # Download buttons
│   │   │   │   ├── 0138_segmented.png    # Sample processed scan
│   │   │   │   ├── 0138_depth_grayscale_zd.png # Sample depth map
│   │   │   │   └── 0138_mesh_consistent_z05.png # Sample mesh
│   │   │   └── styles/     # Global styles directory
│   │   ├── hooks/          # Custom React hooks (future use)
│   │   └── utils/          # Utility functions (future use)
│   ├── android/            # Android build configuration
│   │   ├── app/            # Main Android app configuration
│   │   │   ├── build.gradle         # Android build script
│   │   │   │               # - Package: com.jonleeacc.woundapp2
│   │   │   │               # - Version: 1.0.0 (versionCode: 1)
│   │   │   │               # - Expo integration with Metro bundler
│   │   │   │               # - Hermes JavaScript engine
│   │   │   ├── src/main/   # Android source code
│   │   │   │   ├── AndroidManifest.xml  # App permissions & configuration
│   │   │   │   │           # - CAMERA, INTERNET, STORAGE permissions
│   │   │   │   │           # - Portrait orientation lock
│   │   │   │   │           # - Deep linking support
│   │   │   │   ├── java/   # Kotlin/Java source code
│   │   │   │   │   └── com/jonleeacc/woundapp2/
│   │   │   │   │       ├── MainActivity.kt      # Main activity
│   │   │   │   │       └── MainApplication.kt   # App initialization
│   │   │   │   └── res/    # Android resources
│   │   │   │       ├── mipmap-*/  # App icons (all densities)
│   │   │   │       ├── values/    # Colors, strings, styles
│   │   │   │       └── drawable/  # UI drawables
│   │   │   ├── debug.keystore      # Debug signing certificate
│   │   │   └── proguard-rules.pro  # Code obfuscation rules
│   │   ├── gradle/         # Gradle build system
│   │   │   └── wrapper/    # Gradle wrapper files
│   │   ├── build.gradle    # Root build configuration
│   │   ├── settings.gradle # Project settings
│   │   └── gradle.properties # Build properties
│   ├── App.js              # Main app component with navigation
│   │                       # - React Navigation v6 stack navigator
│   │                       # - 13 screens with headerShown: false
│   │                       # - GestureHandlerRootView wrapper
│   ├── app.json           # Expo configuration
│   │                       # - SDK version: 52.0.0
│   │                       # - Portrait orientation lock
│   │                       # - Camera & image picker plugins
│   │                       # - Android permissions configuration
│   ├── eas.json           # Expo Application Services config
│   │                       # - Development, preview, production builds
│   │                       # - Auto-increment version numbers
│   ├── package.json       # Dependencies & scripts
│   │                       # - React Native 0.76.9
│   │                       # - Expo SDK 52.0.47
│   │                       # - React Navigation v6
│   │                       # - Axios for API calls
│   │                       # - AsyncStorage for local data
│   │                       # - Camera & image picker
│   ├── babel.config.js    # Babel transpilation configuration
│   ├── metro.config.js    # Metro bundler configuration
│   ├── tsconfig.json      # TypeScript configuration
│   ├── .env.example       # Environment variables template
│   │                       # - API_BASE_URL for backend connection
│   │                       # - IP address configuration guide
│   └── index.js           # Expo entry point
├── weights/                # AI model weights (.pt files)
├── docs/                   # Documentation and development files ✅ MAINTAINED
│   ├── AI scripts/         # Development notebooks and prototypes
│   ├── ERD/               # Entity Relationship Diagrams
│   ├── Repomix-dev/       # Development output archives
│   └── Report/            # Final project reports
├── context.md             # ✅ UPDATED: Complete project documentation with migration details
├── Project directory.md   # ✅ UPDATED: This file - current project structure
└── .gitignore             # ✅ UPDATED: Cleaned for new patient-centric file structure
```

## ✅ **MAJOR UPDATES SUMMARY - January 2025**

### 🗄️ **Database Architecture Overhaul**
- **Migration 0003**: Added `ScanResult` model with OneToOne relationship to `Scan`
- **Patient-Centric Storage**: Files now organized in `{FirstName}_{LastName}/` directories
- **Scan Numbering**: Automatic `scan001`, `scan002`, etc. for multiple scans per patient
- **File Validation**: Backend serializers verify actual file existence before marking `has_results`

### 🧹 **Codebase Cleanup & Optimization**
- **❌ REMOVED**: Legacy `coreViews` app completely eliminated
- **❌ REMOVED**: `aiProcessingService.js` (294 lines of duplicate functionality)
- **✅ CONSOLIDATED**: 8 duplicate `BackArrowIcon` components into single centralized component
- **✅ UPDATED**: All affected screens to use centralized UI components

### 🔄 **Processing Pipeline Refactoring**
- **Granular Endpoints**: Replaced monolithic processing with step-by-step API calls
- **New Screens**: Added `ProcessingScreen.js` and `CroppedOriginalScreen.js`
- **Service Updates**: `scanService.js` supports individual processing steps
- **Frontend Integration**: Complete step-by-step user-controlled AI processing

### 📁 **File Organization Improvements**
- **Patient Directories**: `Allison_Torres/`, `Amanda_Hudson/` with scan numbering
- **Legacy Transition**: Old `generated_stl/` and `stl_previews/` directories maintained during transition
- **Git Ignore**: Updated for new structure, removed outdated patterns
- **Storage Cleanup**: Added management commands for media file cleanup

### 🔧 **Configuration & Documentation**
- **Context Documentation**: Updated to reflect complete patient-AI processing integration
- **Project Structure**: This document updated with all recent changes and cleanup status
- **Git Ignore**: Cleaned to match current file organization patterns
- **Migration Documentation**: Complete database evolution timeline documented

**Last Updated:** January 31, 2025 - **Complete Architecture Documentation Update** 📋✅    