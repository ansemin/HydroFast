from django.contrib import admin
from .models import Scan

@admin.register(Scan)
class ScanAdmin(admin.ModelAdmin):
    list_display = ('patient', 'user', 'created_at', 'is_processed')
    list_filter = ('is_processed', 'created_at', 'user')
    search_fields = ('patient__first_name', 'patient__last_name', 'user__username')
    readonly_fields = ('user', 'created_at')
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Scan Information', {
            'fields': ('patient', 'user', 'image')
        }),
        ('Processing Status', {
            'fields': ('is_processed', 'processed_image')
        }),
        ('Timestamps', {
            'fields': ('created_at',)
        }),
    )
