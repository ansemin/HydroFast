import os
import shutil
from pathlib import Path
from django.core.management.base import BaseCommand
from django.conf import settings
from apps.scans.models import Scan

class Command(BaseCommand):
    """
    Cleanup redundant storage files and directories.
    Usage: python manage.py cleanup_storage
    """
    help = "Clean up redundant storage files and directories to fix storage inconsistencies"

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be deleted without actually deleting',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        if dry_run:
            self.stdout.write(self.style.WARNING("DRY RUN MODE - No files will be deleted"))
        
        media_root = Path(settings.MEDIA_ROOT)
        
        # 1. Clean up legacy depth_maps directory (now using depth_maps_bbox)
        legacy_depth_dir = media_root / 'depth_maps'
        if legacy_depth_dir.exists():
            self.stdout.write(f"Found legacy depth_maps directory: {legacy_depth_dir}")
            if dry_run:
                self.stdout.write(self.style.WARNING(f"[DRY RUN] Would delete: {legacy_depth_dir}"))
            else:
                shutil.rmtree(legacy_depth_dir)
                self.stdout.write(self.style.SUCCESS(f"Deleted legacy depth_maps directory"))
        
        # 2. Clean up empty bbox_crop_results directories
        bbox_crop_dir = media_root / 'bbox_crop_results'
        if bbox_crop_dir.exists():
            for scan_dir in bbox_crop_dir.iterdir():
                if scan_dir.is_dir() and not any(scan_dir.iterdir()):
                    self.stdout.write(f"Found empty bbox crop directory: {scan_dir}")
                    if dry_run:
                        self.stdout.write(self.style.WARNING(f"[DRY RUN] Would delete: {scan_dir}"))
                    else:
                        scan_dir.rmdir()
                        self.stdout.write(self.style.SUCCESS(f"Deleted empty directory: {scan_dir}"))
        
        # 3. Clean up orphaned files (files for scans that no longer exist in database)
        self._cleanup_orphaned_files(media_root, dry_run)
        
        # 4. Report storage statistics
        self._report_storage_stats(media_root)
        
        if not dry_run:
            self.stdout.write(self.style.SUCCESS("Storage cleanup completed!"))
        else:
            self.stdout.write(self.style.WARNING("DRY RUN completed - run without --dry-run to perform cleanup"))

    def _cleanup_orphaned_files(self, media_root, dry_run):
        """Clean up files for scans that no longer exist in the database."""
        existing_scan_ids = set(Scan.objects.values_list('id', flat=True))
        
        # Check depth_maps_bbox directory
        depth_bbox_dir = media_root / 'depth_maps_bbox'
        if depth_bbox_dir.exists():
            for scan_dir in depth_bbox_dir.iterdir():
                if scan_dir.is_dir() and scan_dir.name.startswith('scan_'):
                    try:
                        scan_id = int(scan_dir.name.replace('scan_', ''))
                        if scan_id not in existing_scan_ids:
                            self.stdout.write(f"Found orphaned depth files for scan_{scan_id}")
                            if dry_run:
                                self.stdout.write(self.style.WARNING(f"[DRY RUN] Would delete: {scan_dir}"))
                            else:
                                shutil.rmtree(scan_dir)
                                self.stdout.write(self.style.SUCCESS(f"Deleted orphaned files: {scan_dir}"))
                    except ValueError:
                        # Skip directories that don't follow scan_X pattern
                        continue
        
        # Check bbox_crop_results directory
        bbox_crop_dir = media_root / 'bbox_crop_results'
        if bbox_crop_dir.exists():
            for scan_dir in bbox_crop_dir.iterdir():
                if scan_dir.is_dir() and scan_dir.name.startswith('scan_'):
                    try:
                        scan_id = int(scan_dir.name.replace('scan_', ''))
                        if scan_id not in existing_scan_ids:
                            self.stdout.write(f"Found orphaned bbox crop files for scan_{scan_id}")
                            if dry_run:
                                self.stdout.write(self.style.WARNING(f"[DRY RUN] Would delete: {scan_dir}"))
                            else:
                                shutil.rmtree(scan_dir)
                                self.stdout.write(self.style.SUCCESS(f"Deleted orphaned files: {scan_dir}"))
                    except ValueError:
                        continue

    def _report_storage_stats(self, media_root):
        """Report storage statistics."""
        self.stdout.write("\n" + "="*50)
        self.stdout.write("STORAGE STATISTICS")
        self.stdout.write("="*50)
        
        directories = [
            'scans',
            'processed_scans', 
            'bbox_crop_results',
            'depth_maps_bbox',
            'generated_stl',
            'stl_previews'
        ]
        
        total_size = 0
        for dir_name in directories:
            dir_path = media_root / dir_name
            if dir_path.exists():
                size = sum(f.stat().st_size for f in dir_path.rglob('*') if f.is_file())
                file_count = len(list(dir_path.rglob('*')))
                total_size += size
                self.stdout.write(f"{dir_name:20}: {size:>10} bytes ({file_count} files)")
            else:
                self.stdout.write(f"{dir_name:20}: {'NOT FOUND':>10}")
        
        self.stdout.write("-" * 50)
        self.stdout.write(f"{'TOTAL':20}: {total_size:>10} bytes")
        self.stdout.write("="*50) 