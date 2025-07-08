from .base import *

# SECURITY WARNING: keep the secret key used in testing secret!
SECRET_KEY = 'test-secret-key-not-for-production'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = ['localhost', '127.0.0.1', 'testserver']

# Database for testing
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}

# Disable migrations for faster testing
class DisableMigrations:
    def __contains__(self, item):
        return True
    
    def __getitem__(self, item):
        return None

MIGRATION_MODULES = DisableMigrations()

# Fast password hashing for tests
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.MD5PasswordHasher',
]

# Disable logging during tests
LOGGING_CONFIG = None

# Test-specific settings
EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'

# Media files - use temporary directory for tests
MEDIA_ROOT = BASE_DIR / 'test_media'

# CORS settings for testing
CORS_ALLOW_ALL_ORIGINS = True
