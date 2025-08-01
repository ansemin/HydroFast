#!/usr/bin/env python3
"""
Database Verification Script for HydroFast Application
Location: /backend/scripts/verify_db.py
Purpose: Verify database integrity, models, and relationships after session-based architecture implementation

Usage:
    cd backend/scripts
    python verify_db.py
"""

import os
import sys
import django
from pathlib import Path

# Add the backend directory to Python path for Django imports
scripts_dir = Path(__file__).parent.absolute()
backend_dir = scripts_dir.parent
sys.path.insert(0, str(backend_dir))

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

# Import Django models after setup
from django.db import connection
from django.contrib.auth.models import User
from apps.patients.models import Patient
from apps.scans.models import Scan, ScanResult
from apps.authentication.models import UserProfile

def print_header(title):
    """Print a formatted header"""
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")

def print_section(title):
    """Print a formatted section header"""
    print(f"\n{'-'*40}")
    print(f"  {title}")
    print(f"{'-'*40}")

def verify_database_connection():
    """Verify database connection and basic info"""
    print_header("DATABASE CONNECTION VERIFICATION")
    
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT sqlite_version();")
            result = cursor.fetchone()
            if result:
                version = result[0]
                print(f"✅ Database connected successfully")
                print(f"✅ SQLite version: {version}")
            else:
                print(f"❌ Could not retrieve SQLite version")
            
            # Get database file path
            db_path = connection.settings_dict['NAME']
            if os.path.exists(db_path):
                size_mb = os.path.getsize(db_path) / (1024 * 1024)
                print(f"✅ Database file: {os.path.basename(db_path)}")
                print(f"✅ Database size: {size_mb:.2f} MB")
            else:
                print(f"❌ Database file not found: {db_path}")
                
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False
    
    return True

def verify_tables():
    """Verify all required tables exist"""
    print_section("TABLE VERIFICATION")
    
    required_tables = [
        'auth_user',
        'authtoken_token',
        'authentication_userprofile', 
        'patients_patient',
        'scans_scan',
        'scans_scanresult'
    ]
    
    with connection.cursor() as cursor:
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        existing_tables = [row[0] for row in cursor.fetchall()]
        
        print(f"Total tables in database: {len(existing_tables)}")
        
        for table in required_tables:
            if table in existing_tables:
                print(f"✅ {table}")
            else:
                print(f"❌ {table} - MISSING")
        
        # Check for legacy coreViews tables (should be removed)
        legacy_tables = [t for t in existing_tables if 'coreViews' in t]
        if legacy_tables:
            print(f"\n⚠️  Legacy coreViews tables found (should be cleaned up):")
            for table in legacy_tables:
                print(f"   - {table}")
        else:
            print(f"\n✅ No legacy coreViews tables found")

def verify_models():
    """Verify model counts and basic structure"""
    print_section("MODEL VERIFICATION")
    
    try:
        # User and UserProfile counts
        user_count = User.objects.count()
        profile_count = UserProfile.objects.count()
        print(f"✅ Users: {user_count}")
        print(f"✅ User Profiles: {profile_count}")
        
        # Patient counts
        patient_count = Patient.objects.count()
        print(f"✅ Patients: {patient_count}")
        
        if patient_count > 0:
            sample_patient = Patient.objects.first()
            if sample_patient:
                print(f"   Sample patient: {sample_patient.first_name} {sample_patient.last_name}")
            else:
                print(f"   No sample patient found")
        
        # Scan counts  
        scan_count = Scan.objects.count()
        processed_scan_count = Scan.objects.filter(is_processed=True).count()
        print(f"✅ Scans: {scan_count} (Processed: {processed_scan_count})")
        
        # ScanResult counts
        result_count = ScanResult.objects.count()
        print(f"✅ Scan Results: {result_count}")
        
        # Check for scans with results
        scans_with_results = Scan.objects.filter(result__isnull=False).count()
        print(f"   Scans with results: {scans_with_results}")
        
    except Exception as e:
        print(f"❌ Model verification failed: {e}")

def verify_session_architecture():
    """Verify session-based architecture implementation"""
    print_section("SESSION ARCHITECTURE VERIFICATION")
    
    try:
        # Check if Scan model has session_id field
        from django.db import models
        scan_fields = [field.name for field in Scan._meta.fields]
        
        if 'session_id' in scan_fields:
            print("✅ Scan model has session_id field")
            
            # Check session_id field type
            session_field = Scan._meta.get_field('session_id')
            if isinstance(session_field, models.UUIDField):
                print("✅ session_id is UUIDField")
            else:
                print(f"⚠️  session_id field type: {type(session_field)}")
            
            # Check for scans with session_ids
            scans_with_sessions = Scan.objects.exclude(session_id__isnull=True).count()
            print(f"✅ Scans with session_id: {scans_with_sessions}")
            
            if scans_with_sessions > 0:
                sample_scan = Scan.objects.exclude(session_id__isnull=True).first()
                if sample_scan and hasattr(sample_scan, 'session_id'):
                    print(f"   Sample session_id: {sample_scan.session_id}")
                else:
                    print(f"   Could not retrieve sample session_id")
                
        else:
            print("❌ Scan model missing session_id field")
            
        # Check ScanResult model fields
        result_fields = [field.name for field in ScanResult._meta.fields]
        expected_fields = ['stl_file', 'depth_map_8bit', 'depth_map_16bit', 'preview_image', 'patient_name']
        
        print("\nScanResult model fields:")
        for field in expected_fields:
            if field in result_fields:
                print(f"✅ {field}")
            else:
                print(f"❌ {field} - MISSING")
                
    except Exception as e:
        print(f"❌ Session architecture verification failed: {e}")

def verify_file_structure():
    """Verify media directory structure"""
    print_section("FILE STRUCTURE VERIFICATION")
    
    try:
        from django.conf import settings
        media_root = Path(settings.MEDIA_ROOT)
        
        if media_root.exists():
            print(f"✅ Media directory exists: {media_root}")
            
            # Check for session temp directory
            session_temp_dir = media_root / 'temp' / 'sessions'
            if session_temp_dir.exists():
                session_count = len(list(session_temp_dir.iterdir()))
                print(f"✅ Session temp directory exists with {session_count} sessions")
            else:
                print(f"ℹ️  Session temp directory not found (will be created when needed)")
            
            # Check for patient directories
            patient_dirs = [d for d in media_root.iterdir() if d.is_dir() and not d.name.startswith('.') and d.name != 'temp']
            print(f"✅ Patient directories found: {len(patient_dirs)}")
            
            for patient_dir in patient_dirs[:3]:  # Show first 3
                scan_dirs = [d for d in patient_dir.iterdir() if d.is_dir() and d.name.startswith('scan_')]
                print(f"   {patient_dir.name}: {len(scan_dirs)} scans")
                
        else:
            print(f"❌ Media directory not found: {media_root}")
            
    except Exception as e:
        print(f"❌ File structure verification failed: {e}")

def verify_relationships():
    """Verify model relationships"""
    print_section("RELATIONSHIP VERIFICATION")
    
    try:
        # Patient → Scan relationship
        patients_with_scans = Patient.objects.filter(new_scans__isnull=False).distinct().count()
        total_patients = Patient.objects.count()
        print(f"✅ Patients with scans: {patients_with_scans}/{total_patients}")
        
        # Scan → ScanResult relationship
        scans_with_results = Scan.objects.filter(result__isnull=False).count()
        total_scans = Scan.objects.count()
        print(f"✅ Scans with results: {scans_with_results}/{total_scans}")
        
        # Check for orphaned records
        orphaned_results = ScanResult.objects.filter(scan__isnull=True).count()
        if orphaned_results > 0:
            print(f"⚠️  Orphaned scan results: {orphaned_results}")
        else:
            print(f"✅ No orphaned scan results")
            
        # User relationships
        patients_with_users = Patient.objects.filter(user__isnull=False).count()
        print(f"✅ Patients linked to users: {patients_with_users}/{total_patients}")
        
    except Exception as e:
        print(f"❌ Relationship verification failed: {e}")

def run_verification():
    """Run complete database verification"""
    print_header("HYDROFAST DATABASE VERIFICATION")
    print(f"Script location: {__file__}")
    print(f"Working directory: {os.getcwd()}")
    
    # Run all verification steps
    if not verify_database_connection():
        return False
        
    verify_tables()
    verify_models()
    verify_session_architecture()
    verify_file_structure()
    verify_relationships()
    
    print_header("VERIFICATION COMPLETE")
    print("✅ Database verification finished")
    print("\nUsage Options:")
    print("1. Direct Python: cd backend/scripts && python verify_db.py")
    print("2. Batch script: cd backend/scripts && .\\verify_db.bat")
    print("3. With venv: cd project-root && .venv-win/Scripts/activate && cd backend/scripts && python verify_db.py")
    print("\nRecommendations:")
    print("1. If session_id field is missing, run: python manage.py makemigrations scans")
    print("2. If migrations are needed, run: python manage.py migrate")
    print("3. If no test data exists, run: python manage.py create_default_user")
    print("4. To load sample data, run: python manage.py load_sample_patients")
    
    return True

if __name__ == "__main__":
    try:
        run_verification()
    except KeyboardInterrupt:
        print("\n\n⚠️  Verification interrupted by user")
    except Exception as e:
        print(f"\n❌ Verification failed with error: {e}")
        sys.exit(1)
