# Wound Analysis Application User Guide

A Django backend with React Native (Expo) frontend application for wound scanning and analysis using AI processing.

## Project Structure

```
Project-2/
├── .env.example            # Backend environment template (Gemini API key)
├── requirements.txt        # Root Python dependencies (legacy - use backend/requirements/)
├── weights/               # AI model files (YOLO, depth estimation models)
├── backend/                 # Django REST API backend
│   ├── apps/               # Django applications
│   │   ├── authentication/ # User authentication & profiles
│   │   ├── patients/       # Patient management & data
│   │   ├── scans/          # Scan data handling & storage
│   │   ├── ai_processing/  # AI model integration & processors
│   │   └── common/         # Shared utilities
│   ├── config/             # Django settings (base, dev, prod)
│   ├── requirements/       # Environment-specific dependencies
│   ├── scripts/            # Server startup scripts
│   └── media/              # Uploaded files & images
├── frontend/               # React Native (Expo) mobile app
│   ├── src/
│   │   ├── screens/        # App screens (14 total)
│   │   │   ├── auth/       # LoginScreen
│   │   │   ├── patients/   # Patient management screens (6)
│   │   │   ├── scanning/   # Camera & photo preview (2)
│   │   │   ├── ai-processing/ # AI workflow screens (5)
│   │   │   └── printing/   # Print settings
│   │   ├── components/     # Reusable components
│   │   │   ├── ui/         # UI components (LogoHeader, PatientCard, Icons)
│   │   │   └── navigation/ # Navigation components
│   │   ├── services/       # API layer (5 services)
│   │   │   ├── api.js      # Base API configuration
│   │   │   ├── authService.js    # Authentication
│   │   │   ├── patientService.js # Patient CRUD
│   │   │   ├── scanService.js    # Scan management
│   │   │   └── aiProcessingService.js # AI processing
│   │   └── assets/         # Static resources
│   │       ├── fonts/      # Urbanist font family
│   │       ├── icons/      # UI icons (PNG/SVG)
│   │       └── images/     # Sample images & assets
│   └── android/            # Android build configuration
├── weights/                # AI model weights (.pt files)
└── docs/                   # Documentation
```

### **📦 Package Management**

This project uses separate package management for frontend and backend:
- **Frontend**: Dependencies managed in `frontend/package.json` and `frontend/package-lock.json`
- **Backend**: Dependencies managed in `backend/requirements/` (base.txt, development.txt, production.txt)

**Note:** The root level previously had an empty `package-lock.json` file that has been removed to avoid confusion.

### **📁 Git-Ignored Files & Directories**

Several important files and directories are excluded from version control for security and performance:

- **Environment Files**: `.env`, `frontend/.env` (contain API keys and sensitive config)
- **Virtual Environments**: `.venv/`, `.venv-win/`, `venv/`, `env/` (large, machine-specific)
- **Dependencies**: `node_modules/` (large, reproducible from package.json)
- **Build Files**: `.expo/`, `dist/`, `web-build/` (generated files)
- **Media Files**: `backend/media/` (uploaded content, can be large)
- **Database**: `db.sqlite3` (development database with potentially sensitive data)

These files will be created during setup and development but should never be committed to the repository.

### **Root Directory Files**

#### **Configuration Files**
- **`.env.example`** - Template for backend environment variables (Gemini API key)
- **`requirements.txt`** - Legacy root-level Python dependencies (⚠️ use `backend/requirements/` instead)

#### **Documentation**
- **`README.md`** - Main project documentation (this file)

#### **AI/ML Resources**
- **`weights/`** - AI model files (.pt files for YOLO wound detection)

#### **Development Environment**
- **`.idea/`** - JetBrains IDE configuration

#### **Generated/Ignored Files** (Not in repository)
- **`.env`** - Environment variables (created from .env.example)
- **`.venv/` / `.venv-win/`** - Python virtual environments
- **`.expo/`** - Expo development cache
- **`.cursor/`** - Cursor IDE configuration
- **`docs/`** - Generated documentation
- **`backend/media/`** - Uploaded files and images

## Prerequisites

- **Python 3.8+** (for Django backend)
- **Node.js 16+** (for React Native frontend)
- **Expo CLI** (for mobile development)
- **Expo Go app** (for testing on mobile devices)

---

## Backend Architecture

### Django App Structure

The backend follows Django's modular app architecture with clear separation of concerns:

#### **Core Apps**
- **`apps.authentication`** - User management, profiles, and token-based authentication
- **`apps.patients`** - Patient registration, management, and CRUD operations
- **`apps.scans`** - Image upload, scan storage, and processing status tracking
- **`apps.ai_processing`** - AI model management and processing pipeline
- **`coreViews`** - Legacy app (being migrated to modular apps)

#### **Configuration Structure**
```
backend/config/
├── settings/
│   ├── base.py        # Shared settings across environments
│   ├── development.py # Development-specific settings
│   ├── production.py  # Production-specific settings
│   └── testing.py     # Test environment settings
├── urls.py           # Main URL routing
└── wsgi.py/asgi.py   # WSGI/ASGI application
```

### Database Models & Relationships

#### **User Management**
```python
UserProfile (1:1 User)
├── user: OneToOneField(User)
└── is_admin: BooleanField
```

#### **Patient Management**
```python
Patient (N:1 User)
├── user: ForeignKey(User)           # Created by user
├── first_name: CharField(50)
├── last_name: CharField(50)
├── nric: CharField(9, unique=True)  # Singapore NRIC
├── date_of_birth: DateField(optional)
├── contact_no: CharField(15, optional)
└── details: TextField(optional)
```

#### **Scan Management**
```python
Scan (N:1 Patient, N:1 User)
├── user: ForeignKey(User)              # Scan creator
├── patient: ForeignKey(Patient)        # Associated patient
├── image: ImageField(upload_to="scans/")
├── processed_image: ImageField(upload_to="processed_scans/")
├── created_at: DateTimeField(auto_now_add=True)
└── is_processed: BooleanField(default=False)
```

#### **AI Model Management**
```python
AIModel
├── name: CharField(100)
├── description: TextField
├── model_file: FileField(upload_to="ai_models/")
└── created_at: DateTimeField(auto_now_add=True)
```

### AI Processing Pipeline

The AI processing system follows a modular processor architecture:

#### **Base Processor Architecture**
```python
BaseProcessor (Abstract)
├── load_model()         # Load AI model
├── process()           # Main processing logic
├── preprocess()        # Input preprocessing
├── postprocess()       # Output postprocessing
├── validate_input()    # Input validation
└── get_status()        # Processor status
```

#### **Processing Pipeline**
1. **WoundDetector** - YOLO-based wound detection and segmentation
   - Input: Raw wound images
   - Output: Bounding boxes, segmentation masks, confidence scores
   - Model: `weights/best.pt`

2. **DepthAnalyzer** - Wound depth estimation and volume calculation
   - Input: Segmented wound data
   - Output: Depth maps, volume estimates, surface area measurements
   - Methods: Stereo vision, photometric analysis, ML-based estimation

3. **MeshGenerator** - 3D mesh generation for visualization and printing
   - Input: Depth analysis data
   - Output: STL files, 3D meshes, quality metrics
   - Formats: STL (3D printing), OBJ (visualization), PLY (analysis)

### API Endpoints Structure

#### **Authentication Endpoints** (`/api/auth/`)
```
POST /api/auth/login/      # Token-based login
POST /api/auth/register/   # User registration
GET  /api/auth/user-info/  # Current user information
```

#### **Patient Management** (`/api/patients/`)
```
GET    /api/patients/           # List all patients
POST   /api/patients/           # Create new patient
GET    /api/patients/{id}/      # Get patient details
PUT    /api/patients/{id}/      # Update patient
DELETE /api/patients/{id}/      # Delete patient
```

#### **Scan Management** (`/api/scans/`)
```
GET    /api/scans/              # List all scans
POST   /api/scans/              # Create new scan
GET    /api/scans/{id}/         # Get scan details
POST   /api/scans/upload_image/ # Upload image for processing
POST   /api/scans/{id}/process_scan/ # Trigger AI processing
```

#### **AI Model Management** (`/api/aimodels/`)
```
GET    /api/aimodels/          # List AI models
POST   /api/aimodels/          # Upload new model
GET    /api/aimodels/{id}/     # Get model details
PUT    /api/aimodels/{id}/     # Update model
DELETE /api/aimodels/{id}/     # Delete model
```

### Authentication & Security

#### **Token-Based Authentication**
- **Token Authentication**: REST framework token-based auth
- **Session Authentication**: For web interface (Django admin)
- **Permission Classes**: `IsAuthenticated` (default)
- **Custom Permissions**: Admin/owner-based access control

#### **CORS Configuration**
```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:8081",      # Local Expo dev server
    "http://127.0.0.1:8081",      # Local testing
    "http://172.28.96.144:8081",  # Network access for mobile
]
```

### Management Commands

#### **User Management**
```bash
# Create default admin and test users
python manage.py create_default_user
```

#### **Patient Data Management**
```bash
# Load realistic sample patient data
python manage.py load_sample_patients --clear

# Generate random test patients
python manage.py generate_patients --count=10

# Delete patients (all, by filter, or by ID)
python manage.py delete_patients --all
python manage.py delete_patients --filter="first_name=John"
python manage.py delete_patients --id=1
```

#### **Scan Data Management**
```bash
# Create sample scan data for testing
python manage.py create_scans --count=5
```

### File Storage Structure

#### **Media Files Organization** (Generated during runtime, ignored by Git)
```
backend/media/
├── scans/              # Original uploaded images
├── processed_scans/    # AI-processed images
├── ai_models/          # Uploaded AI model files
└── generated_meshes/   # STL files from 3D mesh generation
```

**Note:** The `backend/media/` directory is created automatically when files are uploaded and is ignored by Git.

#### **Static Files**
```
backend/static/         # Collected static files for production
```

### Environment-Specific Configuration

#### **Development Settings** (`settings/development.py`)
- SQLite database
- Debug mode enabled
- All hosts allowed
- Detailed error pages

#### **Production Settings** (`settings/production.py`)
- PostgreSQL database
- Debug mode disabled
- Restricted allowed hosts
- Enhanced security headers
- Logging configuration

#### **Testing Settings** (`settings/testing.py`)
- In-memory SQLite
- Disabled migrations for speed
- Fast password hashing
- Temporary media storage

### Dependency Management

#### **Base Requirements** (`requirements/base.txt`)
```
Django==5.1.3
djangorestframework==3.15.0
django-cors-headers==4.3.1
Pillow==10.3.0
python-decouple==3.8
```

#### **Development Requirements** (`requirements/development.txt`)
```
-r base.txt
django-debug-toolbar==4.2.0
pytest==7.4.3
pytest-django==4.7.0
black==23.12.1
flake8==6.1.0
```

#### **Production Requirements** (`requirements/production.txt`)
```
-r base.txt
psycopg2-binary==2.9.9
gunicorn==21.2.0
sentry-sdk==1.39.2
```

---

## Initial Setup

### 1. Environment Configuration

**Backend Configuration (Root Level):**
1. Copy the environment template (this creates a file that's ignored by Git):
   ```bash
   cp .env.example .env
   ```
2. Edit the newly created `.env` file and add your Google Gemini API key:
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   ```
   
   Get your API key from: https://makersuite.google.com/app/apikey
   
   **Note:** The `.env` file is ignored by Git for security - never commit API keys!

**Frontend Configuration:**
1. Copy the frontend environment template (creates a file ignored by Git):
   ```bash
   cp frontend/.env.example frontend/.env
   ```
2. The IP address will be configured automatically during backend startup, or set manually:
   ```
   API_BASE_URL=192.168.1.100
   ```
   
   **Note:** The `frontend/.env` file is also ignored by Git for security.

### 2. Virtual Environment Setup

**Note:** Virtual environment directories are ignored by Git and must be created locally.

**Windows:**
```bash
# Create virtual environment (this directory will be ignored by Git)
python -m venv .venv-win

# Activate virtual environment
.\.venv-win\Scripts\Activate.ps1
```

**macOS/Linux:**
    ```bash
# Create virtual environment (this directory will be ignored by Git)
python -m venv .venv

# Activate virtual environment
source .venv/bin/activate
    ```

---

## Backend Setup

### 1. Install Dependencies

        ```bash
# Navigate to backend directory
        cd backend

# Install development dependencies (includes all base requirements)
pip install -r requirements/development.txt
        ```

### 2. Database Setup

        ```bash
# Create and apply migrations
        python manage.py makemigrations
        python manage.py migrate
        ```

### 3. Create Initial Data

    ```bash
# Create default admin users (admin/admin and default_user/default_password)
    python manage.py create_default_user

# Load sample patient data (20 realistic patient records)
python manage.py load_sample_patients

# Generate additional test patients (optional)
    python manage.py generate_patients --count=5

# Create sample scan data
    python manage.py create_scans --count=3
    ```

### 4. Start Backend Server
    
**Recommended (for mobile testing):**
        ```bash
# Use the automated script (detects and displays IP addresses)
python scripts/run_server.py
        ```
    
**Alternative methods:**
        ```bash
# Manual command (for mobile testing)
        python manage.py runserver 0.0.0.0:8000

# Localhost only (for web testing)
python manage.py runserver

# Windows batch script
scripts\run_server.bat
```

**Important:** When starting the server, note the IP address displayed. You'll need this for frontend configuration.

---

## Frontend Setup

### 1. Install Dependencies

        ```bash
# Navigate to frontend directory
        cd frontend

# Install npm packages
    npm install
    ```

### 2. Configure API Connection

1. The backend startup script will display your computer's IP address
2. Update `frontend/.env` with this IP address:
   ```
   API_BASE_URL=192.168.1.100
   ```
   Replace `192.168.1.100` with your actual IP address

### 3. Start the App

    ```bash
# Start Expo development server
npm start
# or
    npx expo start
    ```

### 4. Test the Application

**On Mobile Device:**
1. Install **Expo Go** app from your app store
2. Ensure your phone and computer are on the same Wi-Fi network
3. Scan the QR code displayed in your terminal

**On Computer:**
- Press `w` in the terminal to open in web browser

---

## Default Login Credentials

The application comes with pre-configured test accounts:

- **Username:** `admin` / **Password:** `admin`
- **Username:** `default_user` / **Password:** `default_password`

---

## Available Management Commands

### User Management

    ```bash
# Create default admin and test users
    python manage.py create_default_user
    ```

### Patient Management

    ```bash
# Load realistic sample patient data (20 patients)
python manage.py load_sample_patients

# Generate random test patients
python manage.py generate_patients --count=10

# Delete patients
python manage.py delete_patients --all                    # Delete all
python manage.py delete_patients --filter="first_name=John"  # Delete by filter
python manage.py delete_patients --id=1                   # Delete by ID
```

### Scan Data Management

    ```bash
# Create sample scan data
python manage.py create_scans --count=5
    ```

---

## Application Features

### Current Functionality

1. **User Authentication**
   - Secure login/logout system
   - Token-based authentication

2. **Patient Management**
   - Create, view, edit, and delete patient records
   - Patient search functionality
   - Patient detail views

3. **Wound Scanning**
   - Camera integration for capturing wound images
   - Image preview and confirmation
   - Integration with AI processing pipeline

4. **AI Processing Pipeline** (Framework Ready)
   - **ProcessingScreen**: Initial processing interface
   - **WoundDetectionScreen**: Wound identification and segmentation
   - **DepthDetectionScreen**: Depth map generation and analysis
   - **MeshDetectionScreen**: 3D mesh reconstruction
   - **DownloadFilesScreen**: Results download and export

### Application Flow

1. **Authentication** → Login screen with admin/default_user access
2. **Patient Directory** → Home screen (PatientsListScreen) with search
3. **Patient Management** → Create/View/Edit/Delete patient records
4. **Camera Workflow** → CameraScreen → PhotoPreviewScreen
5. **AI Processing Pipeline** → ProcessingScreen → WoundDetectionScreen → DepthDetectionScreen → MeshDetectionScreen → DownloadFilesScreen
6. **Scan Results** → View patient scan history and processed files

### Screen Navigation Routes

The app uses React Navigation with the following registered routes:
- `Login` → Authentication screen
- `Home` → Patient directory (HomeScreen → PatientsListScreen)
- `Patients List` → Patient management
- `New Patient Form` → Add new patient
- `Patient Detail` → View/edit patient information
- `Camera Page` → Capture wound images
- `Photo Preview` → Confirm captured image
- `Scan Results` → View patient scan history
- `Processing` → AI processing initiation
- `Wound Detection` → Wound analysis screen
- `Depth Detection` → Depth map generation
- `Mesh Detection` → 3D mesh reconstruction
- `Download Files` → Export processed results
- `Printer Settings` → Print configuration

---

## AI Models Integration

To add your AI models:

1. Navigate to `backend/apps/ai_processing/processors/`
2. Implement your models in the respective processor files:
   - `wound_detector.py` - For wound detection
   - `depth_analyzer.py` - For depth analysis
   - `mesh_generator.py` - For 3D mesh generation

3. Update the processing pipeline in `backend/apps/ai_processing/views.py`

### API Services Layer

The frontend includes a comprehensive service layer for API interactions:

**Core Services:**
- **api.js**: Base API configuration with automatic IP detection and environment handling
- **authService.js**: Authentication management
  - `login(username, password)` - User authentication
  - `logout()` - Session termination
  - `getUserInfo()` - Profile retrieval
  - `isAuthenticated()` - Auth status check

- **patientService.js**: Patient data management
  - `getAllPatients()` - Fetch patient list
  - `getPatient(id)` - Single patient details
  - `createPatient(data)` - Add new patient
  - `updatePatient(id, data)` - Edit patient info
  - `deletePatient(id)` - Remove patient

- **scanService.js**: Scan data handling
  - `getAllScans()` - Fetch all scans
  - `getPatientScans(patientId)` - Patient-specific scans
  - `uploadImage(patientId, imageUri)` - Image upload

- **aiProcessingService.js**: AI processing workflow
  - Processing pipeline integration (framework ready)

---

## Troubleshooting

### Network Connection Issues

**"Network Error" when logging in:**
1. Verify your backend server is running
2. Check that your IP address in `frontend/.env` matches the one displayed by the server
3. Ensure both devices are on the same network
4. Restart the Expo development server after changing `.env`

**Finding Your IP Address:**
- **Windows:** `ipconfig` in Command Prompt
- **macOS/Linux:** `ifconfig` in Terminal
- **Or:** Check the output when starting the backend server

### Common Issues

**Virtual Environment Issues:**
- Ensure you activate the virtual environment before running any Python commands
- Use the correct activation script for your OS

**Database Issues:**
- Delete `db.sqlite3` and re-run migrations if you encounter database errors
- Ensure all migrations are applied: `python manage.py migrate`

**Expo Issues:**
- Clear Expo cache: `npx expo start -c`
- Restart the development server if changes aren't reflected

### Development Environment

**Requirements Files:**
- `requirements/base.txt` - Core dependencies
- `requirements/development.txt` - Development tools (includes base)
- `requirements/production.txt` - Production optimizations
- `requirements/testing.txt` - Testing frameworks

**For Development:**
```bash
pip install -r requirements/development.txt
```

---

## Project Status

This application is currently in **development/testing** phase using Expo Go. For production deployment to app stores, additional configuration and build processes will be required.

**Backend:** Django REST API with modular app structure
**Frontend:** React Native with Expo for cross-platform mobile development
**AI Integration:** Framework ready for custom AI model integration
