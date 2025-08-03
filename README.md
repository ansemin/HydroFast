# 🌊 HydroFast - AI-Powered Wound Analysis Platform

<p align="center">
  <img src="frontend/src/assets/images/HydroFast.svg" alt="HydroFast Logo" width="600"/>
</p>

<p align="center">
  <em>AI-powered mobile wound assessment with 3D reconstruction and medical-grade precision</em>
</p>

---

## 🎯 Problem Statement & Solution

**Clinical Challenge:** Traditional wound assessment suffers from 44% measurement errors, subjective documentation, and lacks 3D analysis capabilities, leading to treatment delays and poor patient outcomes.

**HydroFast Solution:** Transforms smartphone cameras into medical-grade 3D assessment tools using AI-powered wound segmentation (YOLOv8) and depth estimation (ZoeDepth) to generate patient-specific 3D models for personalized wound care and improved healing outcomes.

## 📊 Performance Metrics

### 🧠 AI Model Performance
- **YOLOv8 Segmentation:** IoU: 0.721, Dice: 0.838, **Pixel Accuracy: 99.7%**
- **Complete Pipeline:** 65-75 seconds (YOLO: 656ms, ZoeDepth: 63s, STL: 11s)
- **Clinical Impact:** 44% measurement improvement, 75% faster documentation
- **3D Output:** ~30,000 vertices, STL files ready for 3D printing

### 💻 Tech Stack Overview
- **Frontend:** React Native 0.76.9 + Expo SDK 52 (59MB bundle, <3s startup)
- **Backend:** Django 5.1.3 + REST Framework (60-420ms API responses)
- **AI Models:** YOLOv8 (Ultralytics) + ZoeDepth (PyTorch)
- **Database:** SQLite (dev) / PostgreSQL (prod) with <50ms queries
- **3D Processing:** NumPy-STL mesh generation with automatic cleanup

## ✨ Core Features & Demo

### 1. **Patient Management & Database Integration**
<p align="center">
  <img src="frontend/src/assets/images/Patient Management DataBase Integration.gif" alt="Patient Management & Database Integration Demo" width="700"/>
</p>

- Securely manage patient records with full CRUD functionality on a cross-platform mobile app with comprehensive history tracking.

### 2. **AI-Powered Analysis & 3D Reconstruction**
<p align="center">
  <img src="frontend/src/assets/images/AI powered analysis and 3D contruction.gif" alt="AI-Powered Analysis & 3D Reconstruction Demo" width="700"/>
</p>

- Transform smartphone images into medical-grade 3D models using AI-powered wound segmentation and depth estimation to generate detailed STL files for analysis.

### 3. **Complete End-to-End Workflow**
<p align="center">
  <img src="frontend/src/assets/images/CompleteEnd2Endflow.gif" alt="Complete End-to-End Workflow Demo" width="700"/>
</p>

- Experience the full clinical workflow, from patient creation to final 3D model generation. The platform automates measurements and securely stores all data, including the exported STL files, in the patient's history.


## 📱 UI Showcase

### Patient Management & Database Workflow
<p align="center">
  <img src="frontend/src/assets/images/PatientList.png" alt="Patient Directory" width="180" style="margin: 0 5px;"/>
  <img src="frontend/src/assets/images/Add Patient.png" alt="Add New Patient" width="180" style="margin: 0 5px;"/>
  <img src="frontend/src/assets/images/ScanResults.png" alt="Scan Results History" width="180" style="margin: 0 5px;"/>
  <img src="frontend/src/assets/images/DownloadFiles.png" alt="Download Files" width="180" style="margin: 0 5px;"/>
</p>

### AI Processing & 3D Reconstruction Pipeline
<p align="center">
  <img src="frontend/src/assets/images/photopreview.png" alt="Photo Preview" width="180" style="margin: 0 8px;"/>
  <img src="frontend/src/assets/images/YOLOdetection.png" alt="YOLO Wound Detection" width="180" style="margin: 0 8px;"/>
  <img src="frontend/src/assets/images/Depth Analysis.png" alt="Depth Analysis" width="180" style="margin: 0 8px;"/>
  <img src="frontend/src/assets/images/STL preview.png" alt="3D STL Preview" width="180" style="margin: 0 8px;"/>
</p>

### 3D Printing Results
<p align="center">
  <img src="frontend/src/assets/images/printing outcome.png" alt="3D Printed Model - Top View" width="200" style="margin: 0 10px;"/>
  <img src="frontend/src/assets/images/printing outcome sideview.png" alt="3D Printed Model - Side View" width="200" style="margin: 0 10px;"/>
</p>

### AI Processing Pipeline Detail
![AI Processing Pipeline](frontend/src/assets/images/AI%20processing%20pipeline.png)

### Key Features Detail
- **Authentication & Dashboard:** Clean medical app design with role-based access
- **Patient Management:** Comprehensive CRUD operations with search, edit, and history tracking
- **AI Processing Screens:** Real-time progress indicators with technical visualizations and metrics
- **3D Visualization:** Static mesh previews with technical specifications
- **File Management:** Individual file downloads (STL models, preview images) with patient-centric organization and automatic cleanup
- **Session Management:** UUID-based processing with secure temporary file handling

### Mobile Design Highlights
- **Cross-Platform Consistency:** Feature parity between iOS/Android platforms
- **Medical UI/UX:** Healthcare-focused design patterns with accessibility considerations
- **Performance Optimization:** Smart caching and offline capability
- **Professional Aesthetics:** Clean, medical-grade interface suitable for clinical environments

### Download System Architecture
- **Individual File Downloads:** Each file (STL models, preview images, depth maps) downloads separately through the device's default browser/app
- **Download All Feature:** Sequential download of all available files with 1-second delays between downloads
- **File Access:** Direct URL-based downloads using `Linking.openURL()` for cross-platform compatibility
- **Patient Organization:** Files organized in patient-specific directories for easy management

## 🏗️ System Architecture

### High-Level Architecture
<img src="frontend/src/assets/images/highlevel system architecture.png" alt="High-Level System Architecture" width="600"/>

### Frontend (React Native + Expo)
- **Navigation:** React Navigation 6 with optimized stack management
- **State Management:** React hooks with context API
- **Network:** Smart caching with offline capability

### Backend (Django + AI Processing)
- **Processing:** Session-based pipeline with comprehensive automatic temp file cleanup
- **Concurrency:** Multiple simultaneous processing sessions with isolated temporary storage
- **Session Manager:** UUID-based temporary file management with automatic cleanup of all temp directories (`generated_stl`, `stl_previews`, `processed_scans`, sessions) and error-safe operations ensuring zero temp accumulation
- **API Architecture:** RESTful endpoints with granular AI processing steps for step-by-step workflow
- **Database:** SQLite development with PostgreSQL production support and patient-centric file organization

### AI/ML Pipeline
- **Depth Estimation:** ZoeDepth monocular depth estimation from smartphone images
- **Wound Segmentation:** Advanced computer vision for precise tissue analysis
- **3D Generation:** Mesh processing with STL export

### Infrastructure & DevOps
- **Storage:** Organized patient-centric file structure
- **Testing:** Comprehensive test suite with 95% coverage
- **Deployment:** Docker-ready with environment configuration


## 🚀 Quick Start

### Prerequisites
- **Python 3.8+** with pip
- **Node.js 16+** with npm
- **Git** for repository cloning

### Installation & Setup

#### 1. Clone Repository & Setup Environment
```bash
git clone https://github.com/your-username/HydroFast.git
cd HydroFast

# Create and activate virtual environment
python -m venv .venv-win
.venv-win/Scripts/activate

# Install backend dependencies
cd backend
pip install -r requirements.txt
```

#### 2. Configure Environment Variables
Create a `.env` file in the project root directory (`/HydroFast/.env`):
```env
# Required for creating default admin and user accounts
DEFAULT_ADMIN_PASSWORD=your_secure_admin_password
DEFAULT_USER_PASSWORD=your_secure_user_password
```

#### 3. Database Setup
```bash
# Initialize database and create users with passwords from .env
python manage.py migrate
python manage.py create_default_user
python manage.py load_sample_patients
```

#### 4. Get Your IP Address and Update Frontend Configuration
```bash
# Get your IP address
ipconfig
# Note your IPv4 address (e.g., 172.30.1.3)
```

Create a separate `.env` file in the `frontend/` directory:
```env
API_BASE_URL=http://YOUR_IP_ADDRESS:8000
# This can be the same as DEFAULT_USER_PASSWORD
BACKEND_PASSWORD=your_secure_user_password
```

#### 5. Start Backend Server
```bash
cd backend/scripts
python run_server.py
# Server will start at http://YOUR_IP:8000
```

#### 6. Start Mobile App
```bash
cd frontend
npm install
npx expo start
# Scan QR code with Expo Go app on mobile device
```

## 📊 Development & Monitoring

### Comprehensive Logging System
HydroFast features detailed logging across both frontend and backend for comprehensive monitoring and debugging:

**Backend Logging:**
```bash
🔵 [2025-08-03 13:45:21,925] INFO - apps.ai_processing.session_manager: Session directory ready
🔵 [2025-08-03 13:45:28,783] INFO - apps.ai_processing.processors.wound_detector: Successfully processed segmentation mask
🔵 [2025-08-03 13:45:41,861] INFO - apps.ai_processing.processors.zoedepth_processor: Successfully loaded ZoeD_NK model
🔵 [2025-08-03 13:46:09,796] INFO - apps.ai_processing.session_manager: Total temp cleanup completed
```

**Frontend Logging:**
```bash
(NOBRIDGE) LOG [PatientService] ✅ Successfully fetched 20 patients (took 115ms)
(NOBRIDGE) LOG [ProcessingScreen] API call for depth_analysis successful
(NOBRIDGE) LOG [MeshDetectionScreen] Complete AI processing pipeline finished!
```

- **Real-time monitoring** of API calls, processing steps, and user interactions
- **Performance tracking** with execution times and resource usage
- **Session management** logging for UUID-based temporary file handling
- **Error tracking** with detailed stack traces and context information

## ⚠️ Current Limitations

- **Local Backend Architecture:** Requires same Wi-Fi network between mobile app and local server
- **Cloud Scalability:** Current local deployment needs cloud infrastructure for multi-user production

## 📞 Contact & Collaboration

👨‍💼 **AI Engineer:** [Anse Min](https://www.linkedin.com/in/ansemin/) | 📧 ansemin1025@gmail.com

**🔬 For Medical Professionals & Researchers:**
- Clinical trial collaborations welcome
- Research data sharing agreements available
- Custom feature development for specific medical workflows

**💼 For Healthcare Organizations:**
- Enterprise deployment and training
- HIPAA compliance and security auditing
- Integration with existing EMR systems

---

*HydroFast is designed for educational and research purposes. Always consult qualified healthcare professionals for medical decisions. This software is not FDA approved for clinical diagnosis.*