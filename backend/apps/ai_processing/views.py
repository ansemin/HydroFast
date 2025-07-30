from rest_framework import viewsets, permissions
# Commented out unused AIModel functionality
# from .models import AIModel
# from .serializers import AIModelSerializer

# Commented out unused AIModelViewSet - not used by frontend
# class AIModelViewSet(viewsets.ModelViewSet):
#     queryset = AIModel.objects.all()
#     serializer_class = AIModelSerializer
#     # permission_classes = [permissions.IsAuthenticated]

class IsAdminOrOwner(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.user.userprofile.is_admin:
            return True
        return view.action == 'retrieve' or view.action == 'list'
