from django.contrib import admin
from .models import UserProfile

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'is_admin')
    list_filter = ('is_admin',)
    search_fields = ('user__username', 'user__email')
    readonly_fields = ('user',)
