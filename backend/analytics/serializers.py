from rest_framework import serializers
from .models import ProjectAnalytics, PlatformStats, UserActivity


class ProjectAnalyticsSerializer(serializers.ModelSerializer):
    project_title = serializers.ReadOnlyField(source='project.title')

    class Meta:
        model = ProjectAnalytics
        fields = [
            'project_title', 'total_views', 'total_downloads', 'total_bookmarks',
            'total_reviews', 'average_rating', 'monthly_views', 'monthly_downloads', 'updated_at',
        ]


class PlatformStatsSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlatformStats
        fields = '__all__'


class UserActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = UserActivity
        fields = ['id', 'activity_type', 'project', 'metadata', 'created_at']
