#!/usr/bin/env python
"""
Test runner for all HydroFast test scripts
Location: /backend/test/run_all_tests.py
Purpose: Run all test scripts in the test directory

Usage:
    cd backend/test
    python run_all_tests.py
"""

import os
import sys
import subprocess
from pathlib import Path

def run_test_script(script_name):
    """Run a single test script and capture results"""
    print(f"\n{'='*80}")
    print(f"RUNNING: {script_name}")
    print(f"{'='*80}")
    
    try:
        # Run the script
        result = subprocess.run(
            [sys.executable, script_name],
            cwd=Path(__file__).parent,
            capture_output=False,
            text=True
        )
        
        if result.returncode == 0:
            print(f"✅ {script_name} completed successfully")
            return True
        else:
            print(f"❌ {script_name} failed with return code: {result.returncode}")
            return False
            
    except Exception as e:
        print(f"❌ Error running {script_name}: {e}")
        return False

def main():
    """Run all test scripts"""
    print("HydroFast Test Suite Runner")
    print("="*80)
    
    # List of test scripts to run
    test_scripts = [
        'test_comprehensive_cleanup.py',
        'test_temp_structure.py',
        'test_mesh_temp_paths.py',
        'test_session_cleanup.py',
        'test_mesh_cleanup_integration.py',
        # Note: test_depth_direct.py and test_depth_fix.py require specific session data
        # 'test_depth_direct.py',
        # 'test_depth_fix.py',
    ]
    
    # Check if scripts exist
    test_dir = Path(__file__).parent
    existing_scripts = []
    
    for script in test_scripts:
        script_path = test_dir / script
        if script_path.exists():
            existing_scripts.append(script)
        else:
            print(f"⚠️  Script not found: {script}")
    
    print(f"\nFound {len(existing_scripts)} test scripts to run:")
    for script in existing_scripts:
        print(f"  📄 {script}")
    
    # Run tests
    results = {}
    for script in existing_scripts:
        results[script] = run_test_script(script)
    
    # Summary
    print(f"\n{'='*80}")
    print("TEST SUMMARY")
    print(f"{'='*80}")
    
    passed = sum(1 for success in results.values() if success)
    total = len(results)
    
    print(f"Tests run: {total}")
    print(f"Passed: {passed}")
    print(f"Failed: {total - passed}")
    
    for script, success in results.items():
        status = "✅ PASSED" if success else "❌ FAILED"
        print(f"  {status}: {script}")
    
    if passed == total:
        print(f"\n🎉 All tests passed!")
        return 0
    else:
        print(f"\n⚠️  {total - passed} test(s) failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())
