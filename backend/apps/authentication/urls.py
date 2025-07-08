from django.urls import path
from .views import CustomAuthToken, register_user, get_user_info

urlpatterns = [
    path('login/', CustomAuthToken.as_view(), name='api_token_auth'),
    path('register/', register_user, name='register'),
    path('user-info/', get_user_info, name='user_info'),
]
