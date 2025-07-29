#!/usr/bin/env python3
"""
Media Cleanup Script

This script cleans all generated media files (images, JSON, STL files) from the media directory
while preserving the directory structure. Run this to start fresh with testing.

Usage:
    python clean_media.py [--dry-run] [--confirm]
    
Examples:
    python clean_media.py --dry-run    # Show what would be deleted without actually deleting
    python clean_media.py --confirm    # Delete files with confirmation prompts
    python clean_media.py             # Interactive mode (default)
"""

import os
import sys
import argparse
import shutil
from pathlib import Path
from typing import List, Set


def get_media_directory() -> Path:
    """Get the media directory path relative to the script location."""
    script_dir = Path(__file__).resolve().parent
    media_dir = script_dir / "media"
    
    if not media_dir.exists():
        print(f"❌ Media directory not found: {media_dir}")
        sys.exit(1)
    
    return media_dir


def get_file_extensions_to_clean() -> Set[str]:
    """Get the file extensions that should be cleaned."""
    return {
        # Image files
        '.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.tif', '.gif',
        # Data files
        '.json',
        # 3D model files
        '.stl', '.obj', '.ply',
        # Other potential files
        '.txt'  # But we'll exclude info.txt specifically
    }


def should_preserve_file(file_path: Path) -> bool:
    """Check if a file should be preserved (not deleted)."""
    preserve_files = {
        'info.txt',  # Keep the info file
        '.gitkeep',  # Keep git directory markers
        'README.md', # Keep any readme files
    }
    
    return file_path.name in preserve_files


def find_files_to_clean(media_dir: Path, extensions: Set[str]) -> List[Path]:
    """Find all files that should be cleaned based on extensions."""
    files_to_clean = []
    
    for root, dirs, files in os.walk(media_dir):
        root_path = Path(root)
        
        for file in files:
            file_path = root_path / file
            file_ext = file_path.suffix.lower()
            
            # Check if file should be cleaned
            if file_ext in extensions and not should_preserve_file(file_path):
                files_to_clean.append(file_path)
    
    return files_to_clean


def find_empty_directories(media_dir: Path) -> List[Path]:
    """Find empty directories that can be removed (excluding the root media dir)."""
    empty_dirs = []
    
    # Walk from bottom up to catch nested empty directories
    for root, dirs, files in os.walk(media_dir, topdown=False):
        root_path = Path(root)
        
        # Skip the root media directory itself
        if root_path == media_dir:
            continue
            
        # Check if directory is empty (no files and no subdirectories, or only empty subdirectories)
        try:
            # Check if directory has any content
            has_content = False
            for item in root_path.iterdir():
                if item.is_file():
                    # Check if this file should be preserved
                    if not should_preserve_file(item):
                        has_content = True
                        break
                elif item.is_dir():
                    # Check if subdirectory has any content (recursively)
                    if any(item.rglob('*')):
                        # Check if subdirectory has any non-preservable files
                        has_non_preserved_files = False
                        for subitem in item.rglob('*'):
                            if subitem.is_file() and not should_preserve_file(subitem):
                                has_non_preserved_files = True
                                break
                        if has_non_preserved_files:
                            has_content = True
                            break
            
            if not has_content:
                empty_dirs.append(root_path)
        except OSError:
            pass  # Directory might have been deleted already or is inaccessible
    
    return empty_dirs


def find_and_clean_empty_directories(media_dir: Path, dry_run: bool = False) -> int:
    """Recursively find and clean empty directories after file deletion."""
    total_deleted = 0
    max_iterations = 10  # Prevent infinite loops
    iteration = 0
    
    while iteration < max_iterations:
        empty_dirs = []
        
        # Walk from bottom up to catch nested empty directories
        for root, dirs, files in os.walk(media_dir, topdown=False):
            root_path = Path(root)
            
            # Skip the root media directory itself
            if root_path == media_dir:
                continue
                
            # Check if directory is truly empty (no files, no subdirectories)
            try:
                dir_contents = list(root_path.iterdir())
                if not dir_contents:
                    empty_dirs.append(root_path)
                else:
                    # Check if directory only contains preserved files
                    has_non_preserved_content = False
                    for item in dir_contents:
                        if item.is_file() and not should_preserve_file(item):
                            has_non_preserved_content = True
                            break
                        elif item.is_dir():
                            has_non_preserved_content = True
                            break
                    
                    if not has_non_preserved_content:
                        empty_dirs.append(root_path)
            except OSError:
                pass  # Directory might be inaccessible
        
        if not empty_dirs:
            break  # No more empty directories found
        
        # Delete empty directories
        deleted_this_iteration = 0
        for dir_path in empty_dirs:
            try:
                if dry_run:
                    print(f"[DRY RUN] Would remove empty directory: {dir_path}")
                else:
                    dir_path.rmdir()
                    print(f"✅ Removed empty directory: {dir_path.name}")
                deleted_this_iteration += 1
            except OSError as e:
                if not dry_run:
                    print(f"❌ Failed to remove directory {dir_path}: {e}")
        
        total_deleted += deleted_this_iteration
        iteration += 1
        
        if deleted_this_iteration == 0:
            break  # No directories were deleted, so we're done
    
    return total_deleted


def format_file_size(size_bytes: int) -> str:
    """Format file size in human readable format."""
    for unit in ['B', 'KB', 'MB', 'GB']:
        if size_bytes < 1024.0:
            return f"{size_bytes:.1f} {unit}"
        size_bytes /= 1024.0
    return f"{size_bytes:.1f} TB"


def calculate_total_size(file_paths: List[Path]) -> int:
    """Calculate total size of files to be deleted."""
    total_size = 0
    for file_path in file_paths:
        try:
            total_size += file_path.stat().st_size
        except OSError:
            pass  # File might not exist or be accessible
    return total_size


def print_files_summary(files_to_clean: List[Path], media_dir: Path):
    """Print a summary of files to be cleaned."""
    if not files_to_clean:
        print("✅ No files found to clean!")
        return
    
    print(f"\n📁 Files to be cleaned from {media_dir}:")
    print("=" * 60)
    
    # Group files by directory
    dirs_with_files = {}
    for file_path in files_to_clean:
        relative_dir = file_path.parent.relative_to(media_dir)
        if relative_dir not in dirs_with_files:
            dirs_with_files[relative_dir] = []
        dirs_with_files[relative_dir].append(file_path.name)
    
    # Print organized by directory
    for dir_path, files in sorted(dirs_with_files.items()):
        print(f"\n📂 {dir_path}:")
        for file_name in sorted(files):
            print(f"   🗑️  {file_name}")
    
    # Print summary
    total_size = calculate_total_size(files_to_clean)
    print(f"\n📊 Summary:")
    print(f"   📄 Total files: {len(files_to_clean)}")
    print(f"   💾 Total size: {format_file_size(total_size)}")
    print(f"   📁 Directories affected: {len(dirs_with_files)}")


def clean_files(files_to_clean: List[Path], dry_run: bool = False) -> int:
    """Clean the specified files."""
    deleted_count = 0
    
    for file_path in files_to_clean:
        try:
            if dry_run:
                print(f"[DRY RUN] Would delete: {file_path}")
            else:
                file_path.unlink()
                print(f"✅ Deleted: {file_path.name}")
            deleted_count += 1
        except OSError as e:
            print(f"❌ Failed to delete {file_path}: {e}")
    
    return deleted_count


def clean_empty_directories(empty_dirs: List[Path], dry_run: bool = False) -> int:
    """Clean empty directories. (Legacy function - use find_and_clean_empty_directories instead)"""
    deleted_count = 0
    
    for dir_path in empty_dirs:
        try:
            if dry_run:
                print(f"[DRY RUN] Would remove empty directory: {dir_path}")
            else:
                dir_path.rmdir()
                print(f"✅ Removed empty directory: {dir_path.name}")
            deleted_count += 1
        except OSError as e:
            print(f"❌ Failed to remove directory {dir_path}: {e}")
    
    return deleted_count


def confirm_deletion() -> bool:
    """Ask user for confirmation."""
    while True:
        response = input("\n⚠️  Do you want to proceed with deletion? (yes/no): ").lower().strip()
        if response in ['yes', 'y']:
            return True
        elif response in ['no', 'n']:
            return False
        else:
            print("Please enter 'yes' or 'no'")


def main():
    """Main script function."""
    parser = argparse.ArgumentParser(
        description="Clean all generated media files from the Django media directory",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python clean_media.py                # Interactive mode (default)
  python clean_media.py --dry-run      # Show what would be deleted
  python clean_media.py --confirm      # Delete with confirmation
  python clean_media.py --force        # Delete without confirmation (use carefully!)
  python clean_media.py -y             # Alias for --force
        """
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Show what would be deleted without actually deleting files'
    )
    parser.add_argument(
        '--confirm',
        action='store_true',
        help='Ask for confirmation before deleting each category'
    )
    parser.add_argument(
        '--force',
        action='store_true',
        help='Delete files without any confirmation (use carefully!)'
    )
    parser.add_argument(
        '-y', '--yes',
        action='store_true',
        help='Yes to all prompts. Deletes files without confirmation.'
    )
    
    args = parser.parse_args()
    
    print("🧹 Django Media Cleanup Tool")
    print("=" * 40)
    
    # Get paths and files
    media_dir = get_media_directory()
    extensions = get_file_extensions_to_clean()
    files_to_clean = find_files_to_clean(media_dir, extensions)
    
    # Show summary
    print_files_summary(files_to_clean, media_dir)
    
    is_forced = args.force or args.yes

    if not files_to_clean:
        print("\n🎉 Nothing to clean!")
        # Still check for empty directories even if no files to clean
        if args.dry_run:
            print(f"\n🔍 Checking for empty directories...")
            find_and_clean_empty_directories(media_dir, dry_run=True)
        else:
            if not is_forced and not args.confirm:
                if confirm_deletion():
                    deleted_dirs = find_and_clean_empty_directories(media_dir, dry_run=False)
                    if deleted_dirs > 0:
                        print(f"\n🎉 Cleanup completed! Removed {deleted_dirs} empty directories.")
                    else:
                        print(f"\n🎉 No empty directories found!")
                else:
                    print("❌ Operation cancelled.")
            elif is_forced or args.confirm:
                deleted_dirs = find_and_clean_empty_directories(media_dir, dry_run=False)
                if deleted_dirs > 0:
                    print(f"\n🎉 Cleanup completed! Removed {deleted_dirs} empty directories.")
                else:
                    print(f"\n🎉 No empty directories found!")
        return
    
    # Handle dry run
    if args.dry_run:
        print(f"\n🔍 DRY RUN MODE - No files will actually be deleted")
        clean_files(files_to_clean, dry_run=True)
        
        # Also show empty directories that would be cleaned
        print(f"\n📁 Checking for empty directories after file deletion...")
        find_and_clean_empty_directories(media_dir, dry_run=True)
        
        print(f"\n✅ Dry run completed. Use --confirm, --force or -y to actually delete files.")
        return
    
    # Get confirmation unless force is used
    if not is_forced:
        if not confirm_deletion():
            print("❌ Operation cancelled.")
            return
    
    # Clean files
    print(f"\n🗑️  Starting cleanup...")
    deleted_files = clean_files(files_to_clean, dry_run=False)
    
    # Clean empty directories (using new recursive method)
    print(f"\n📁 Cleaning up empty directories...")
    deleted_dirs = find_and_clean_empty_directories(media_dir, dry_run=False)
    
    # Final summary
    total_size = calculate_total_size(files_to_clean)
    print(f"\n🎉 Cleanup completed!")
    print(f"   📄 Files deleted: {deleted_files}")
    print(f"   📁 Directories removed: {deleted_dirs}")
    print(f"   💾 Space freed: {format_file_size(total_size)}")
    print(f"\n✨ Media directory is now clean and ready for fresh testing!")


if __name__ == "__main__":
    main() 