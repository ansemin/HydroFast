from django.contrib import admin
from .models import AIModel

@admin.register(AIModel)
class AIModelAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('name', 'description')
    readonly_fields = ('created_at',)
    
    fieldsets = (
        ('Model Information', {
            'fields': ('name', 'description')
        }),
        ('Model File', {
            'fields': ('model_file',)
        }),
        ('Timestamps', {
            'fields': ('created_at',)
        }),
    )
