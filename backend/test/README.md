# HydroFast Test Suite

This directory contains all test scripts for the HydroFast application, organized for easy execution and maintenance.

## Test Organization

### Core Test Scripts
- `test_comprehensive_cleanup.py` - Tests the comprehensive temp cleanup functionality
- `test_temp_structure.py` - Verifies temp directory structure and organization
- `test_mesh_temp_paths.py` - Tests mesh generation with correct temp paths
- `test_session_cleanup.py` - Tests session-based cleanup functionality
- `test_mesh_cleanup_integration.py` - Integration test for mesh generation + cleanup

### Depth Processing Tests
- `test_depth_direct.py` - Direct test of depth processing logic (requires session data)
- `test_depth_fix.py` - Test depth processing endpoint (requires active API)

### Existing Tests
- `test_complete_flow.py` - Complete workflow test
- `test_depth_no_mask.py` - Depth processing without mask
- `test_full_pipeline.py` - Full AI processing pipeline test
- `test_stl_generation.py` - STL generation test
- `test_redownload_zoedepth.py` - ZoeDepth model download test

## Running Tests

### Run All Tests
```powershell
# Using Python script
cd backend/test
python run_all_tests.py

# Using batch file (with venv activation)
cd backend/test
.\run_tests.bat
```

### Run Individual Tests
```powershell
# From project root
cd backend/test
python test_comprehensive_cleanup.py
```

### With Virtual Environment
```powershell
# From project root
.venv-win/Scripts/activate
cd backend/test
python test_comprehensive_cleanup.py
```

## Test Categories

### 🧹 Cleanup Tests
- **Purpose**: Verify temp file cleanup and session management
- **Scripts**: `test_comprehensive_cleanup.py`, `test_session_cleanup.py`, `test_mesh_cleanup_integration.py`

### 🏗️ Structure Tests  
- **Purpose**: Verify directory organization and path configuration
- **Scripts**: `test_temp_structure.py`, `test_mesh_temp_paths.py`

### 🔍 Processing Tests
- **Purpose**: Test AI processing components
- **Scripts**: `test_depth_direct.py`, `test_depth_fix.py`, `test_full_pipeline.py`

### 🎯 Integration Tests
- **Purpose**: End-to-end workflow testing
- **Scripts**: `test_complete_flow.py`, `test_mesh_cleanup_integration.py`

## Test Requirements

### Environment Setup
1. Virtual environment activated
2. Django project configured
3. Required AI models available (ZoeDepth, YOLOv8)

### Dependencies
- All tests require Django setup and database access
- Some tests require specific session data or API endpoints
- Depth processing tests may require GPU/CUDA for optimal performance

## Test Runner Features

The `run_all_tests.py` script provides:
- ✅ Automatic test discovery
- ✅ Sequential execution with status reporting
- ✅ Comprehensive summary with pass/fail counts
- ✅ Individual test result tracking

## Notes

- Tests automatically create and clean up temporary files
- Session-based tests use UUID session management
- All temp file operations respect the `media/temp/` structure
- Tests are safe to run multiple times without side effects

## Troubleshooting

### Common Issues
1. **ModuleNotFoundError**: Ensure virtual environment is activated
2. **Django setup errors**: Check `DJANGO_SETTINGS_MODULE` configuration
3. **Path errors**: Verify working directory is `backend/test/`
4. **Permission errors**: Ensure write access to `media/temp/` directory

### Debug Mode
Add `--verbose` or modify script logging levels for detailed output during troubleshooting.
