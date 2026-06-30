from django.contrib import admin
from .models import Category, Project, ProjectScreenshot, Bookmark, Download

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'parent']
    prepopulated_fields = {'slug': ('name',)}

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ['title', 'developer', 'status', 'access_level', 'download_count', 'created_at']
    list_filter = ['status', 'access_level', 'tech_stack']
    search_fields = ['title', 'description']
    prepopulated_fields = {'slug': ('title',)}

@admin.register(Download)
class DownloadAdmin(admin.ModelAdmin):
    list_display = ['user', 'project', 'downloaded_at']
