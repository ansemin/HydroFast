"""
Management command to clean up session files and temp directories.
Usage: python manage.py cleanup_sessions [--all]
"""

from django.core.management.base import BaseCommand
from apps.ai_processing.session_manager import SessionManager


class Command(BaseCommand):
    help = 'Clean up session files and temp directories'

    def add_arguments(self, parser):
        parser.add_argument(
            '--all',
            action='store_true',
            help='Clean up all temp directories and sessions (complete cleanup)',
        )
        parser.add_argument(
            '--max-age',
            type=int,
            default=24,
            help='Maximum age of sessions to keep in hours (default: 24)',
        )

    def handle(self, *args, **options):
        if options['all']:
            self.stdout.write('🧹 Performing complete temp directory cleanup...')
            cleaned_count = SessionManager.cleanup_all_temp_directories()
            self.stdout.write(
                self.style.SUCCESS(
                    f'✅ Complete cleanup completed. Cleaned {cleaned_count} files/directories'
                )
            )
        else:
            self.stdout.write(f'🧹 Cleaning up expired sessions (older than {options["max_age"]} hours)...')
            SessionManager.cleanup_expired_sessions(options['max_age'])
            self.stdout.write(
                self.style.SUCCESS('✅ Expired session cleanup completed')
            )
