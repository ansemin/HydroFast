import logging
import time
from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger('apps.common')

class RequestLoggingMiddleware(MiddlewareMixin):
    """
    Middleware to log all incoming requests with enhanced context
    """
    
    def process_request(self, request):
        """Log the start of each request"""
        request.start_time = time.time()
        
        # Skip logging for static files and admin
        if self.should_skip_logging(request.path):
            return None
            
        # Get user info
        user_info = "Anonymous"
        if hasattr(request, 'user') and request.user.is_authenticated:
            user_info = f"{request.user.username}"
        
        # Get client IP
        client_ip = self.get_client_ip(request)
        
        # Log the request
        logger.info(f"🌐 {request.method} {request.path} - User: {user_info}, IP: {client_ip}")
        
        # Log query parameters if present
        if request.GET:
            logger.debug(f"📝 Query params: {dict(request.GET)}")
            
        return None
    
    def process_response(self, request, response):
        """Log the response details"""
        if self.should_skip_logging(request.path):
            return response
            
        # Calculate response time
        duration = None
        if hasattr(request, 'start_time'):
            duration = round((time.time() - request.start_time) * 1000, 2)  # ms
        
        # Determine status emoji
        status_emoji = self.get_status_emoji(response.status_code)
        
        # Log response
        if duration:
            logger.info(f"{status_emoji} {request.method} {request.path} - {response.status_code} ({duration}ms)")
        else:
            logger.info(f"{status_emoji} {request.method} {request.path} - {response.status_code}")
            
        # Log response size for large responses
        if hasattr(response, 'content') and len(response.content) > 10000:  # > 10KB
            size_kb = round(len(response.content) / 1024, 2)
            logger.debug(f"📦 Response size: {size_kb}KB")
        
        return response
    
    def should_skip_logging(self, path):
        """Determine if we should skip logging this path"""
        skip_paths = [
            '/static/',
            '/media/',
            '/admin/jsi18n/',
            '/favicon.ico',
        ]
        return any(path.startswith(skip_path) for skip_path in skip_paths)
    
    def get_client_ip(self, request):
        """Get the client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR', 'Unknown')
        return ip
    
    def get_status_emoji(self, status_code):
        """Get emoji based on HTTP status code"""
        if 200 <= status_code < 300:
            return "✅"
        elif 300 <= status_code < 400:
            return "🔄"
        elif 400 <= status_code < 500:
            return "⚠️"
        else:
            return "❌"
