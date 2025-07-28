```
Project-2/
├── .env.example            # Backend environment template (Gemini API key)
├── requirements.txt        # Complete ZoeDepth project dependencies (62 packages) 🔥 UPDATED
├── weights/               # AI model weights (ZoeDepth models: ZoeD_NK 1.35GB, ZoeD_N 1.34GB)
├── backend/                 # Django REST API backend (ZoeDepth pipeline with bbox crop workflow COMPLETE ✅)
│   ├── apps/               # Django applications (modular architecture)
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
│   │   │       ├── generate_patients.py    # Generate test patient data
│   │   │       ├── load_sample_patients.py # Load sample patient records
│   │   │       └── delete_patients.py      # Bulk delete patients
│   │   ├── scans/          # Medical scan data & ZoeDepth processing endpoint
│   │   │   ├── models.py   # Scan model (image, processed_image, patient relation)
│   │   │   ├── views.py    # ScanViewSet + /process_scan/ endpoint (180s timeout)
│   │   │   ├── urls.py     # RESTful API: /api/scans/ (CRUD + ZoeDepth processing)
│   │   │   ├── serializers.py # Scan data serialization
│   │   │   └── management/commands/create_scans.py # Generate test scan data
│   │   ├── ai_processing/  # AI model integration & ZoeDepth pipeline (COMPLETE)
│   │   │   ├── models.py   # AIModel model for storing AI model metadata
│   │   │   ├── views.py    # AIModelViewSet for model management  
│   │   │   ├── urls.py     # API endpoints: /api/aimodels/
│   │   │   ├── serializers.py # AI model data serialization
│   │   │   └── processors/ # AI processing pipeline components (ZoeDepth integrated)
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
│   │   ├── urls.py         # Main URL configuration
│   │   ├── wsgi.py         # WSGI application
│   │   └── asgi.py         # ASGI application
│   ├── coreViews/          # Legacy app (kept for backwards compatibility)
│   │   ├── models.py       # Legacy Patient, Scan, AIModel, UserProfile models
│   │   ├── views.py        # Legacy API views and authentication  
│   │   ├── urls.py         # Legacy API endpoints
│   │   └── management/commands/ # Legacy management commands
│   ├── requirements/       # Environment-specific dependencies
│   │   ├── base.txt        # Core dependencies (Django, DRF, Pillow)
│   │   ├── development.txt # Dev tools (debug toolbar, pytest, black)
│   │   ├── production.txt  # Production deps (gunicorn, postgres, redis)
│   │   └── testing.txt     # Testing framework dependencies
│   ├── scripts/            # Server startup & utility scripts
│   │   ├── run_server.py   # Production server runner with network detection
│   │   ├── run_server.bat  # Windows batch file for server startup  
│   │   └── yolov8n-seg.pt  # YOLO segmentation model weights (6.7MB)
│   ├── media/              # Uploaded files & processed images  
│   │   ├── scans/          # Original medical scan images
│   │   ├── processed_scans/ # YOLO-segmented wound images
│   │   ├── depth_maps/     # ZoeDepth-generated depth maps (8-bit & 16-bit)
│   │   ├── generated_stl/  # Generated STL files for 3D printing
│   │   ├── stl_previews/   # STL mesh preview images (vedo rendering)
│   │   ├── ai_models/      # Uploaded AI model files
│   │   └── info.txt        # Media directory information
│   ├── static/             # Static files (CSS, JS, images)
│   ├── logs/               # Application logs
│   │   └── django.log      # Django application logs
│   ├── db.sqlite3          # SQLite database file
│   └── manage.py           # Django management script
├── frontend/               # React Native (Expo) mobile app
│   ├── src/                # Source code directory (cleaned up - unused files removed)
│   │   ├── screens/        # App screens (13 total - complete workflow)
│   │   │   ├── auth/       # Authentication screens
│   │   │   │   ├── LoginScreen.js     # User login with token authentication
│   │   │   │   ├── SignUpScreen.js    # User registration
│   │   │   │   └── index.js           # Auth screens export
│   │   │   ├── patients/   # Patient management screens (4 screens)
│   │   │   │   ├── PatientsListScreen.js    # Patient list with search & logout (uses PatientListItem)
│   │   │   │   ├── NewPatientFormScreen.js  # Patient creation form (NRIC, DOB, etc.)
│   │   │   │   ├── PatientDetailScreen.js   # Patient details, edit, delete, scan access
│   │   │   │   ├── ScanResultsScreen.js     # View patient scan history & results
│   │   │   │   └── index.js                 # Patient screens export
│   │   │   ├── scanning/   # Image capture screens (2 screens)
│   │   │   │   ├── CameraScreen.js     # Camera interface with patient selection
│   │   │   │   ├── PhotoPreviewScreen.js # Photo preview before submission
│   │   │   │   └── index.js            # Scanning screens export
│   │   │   ├── ai-processing/ # AI workflow screens (5 screens)
│   │   │   │   ├── ProcessingScreen.js      # Progress tracking for AI pipeline
│   │   │   │   ├── WoundDetectionScreen.js  # YOLO-based wound detection results
│   │   │   │   ├── DepthDetectionScreen.js  # Depth map analysis results
│   │   │   │   ├── MeshDetectionScreen.js   # 3D mesh generation results
│   │   │   │   ├── DownloadFilesScreen.js   # Download processed files (STL, images)
│   │   │   │   └── index.js                 # AI processing screens export
│   │   │   └── index.js    # Main screens export
│   │   ├── components/     # Reusable UI components (architecture cleaned up)
│   │   │   ├── ui/         # Core UI components (active components)
│   │   │   │   ├── LogoHeader.js        # App logo header component
│   │   │   │   ├── NavigationButton.js  # Styled navigation buttons
│   │   │   │   ├── Icons.js             # SVG icon components (Camera, Back - available)
│   │   │   │   └── index.js             # UI components export
│   │   │   ├── navigation/ # Navigation utilities
│   │   │   │   └── index.js             # Navigation components export (empty)
│   │   │   ├── layout/     # Layout components directory (empty)
│   │   │   └── index.js    # Main components export
│   │   ├── services/       # API layer & backend integration (5 services)
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
│   │   │   ├── scanService.js    # Scan management service
│   │   │   │               # - getAllScans(), getPatientScans()
│   │   │   │               # - createScan(), processWoundDetection()
│   │   │   │               # - Multipart form data support
│   │   │   ├── aiProcessingService.js # AI processing service
│   │   │   │               # - processWoundDetection(), processDepthAnalysis()
│   │   │   │               # - processMeshGeneration(), getAIModels()
│   │   │   │               # - Mock processing for demo
│   │   │   └── index.js    # Services export aggregation
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
└── docs/    