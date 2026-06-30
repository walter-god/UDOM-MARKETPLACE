from django.urls import path
from . import views

urlpatterns = [
    path('admin-dashboard/', views.admin_dashboard, name='admin-dashboard'),
    path('developer-dashboard/', views.developer_dashboard, name='developer-dashboard'),
    path('platform-stats/', views.PlatformStatsListView.as_view(), name='platform-stats'),
    path('project-stats/', views.project_stats, name='project-stats'),
    path('projects/<slug:project__slug>/', views.ProjectAnalyticsView.as_view(), name='project-analytics'),
]
