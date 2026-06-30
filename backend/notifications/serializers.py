from rest_framework import serializers
from .models import Notification, Announcement


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            'id', 'notification_type', 'title', 'message',
            'is_read', 'action_url', 'created_at', 'read_at',
        ]
        read_only_fields = ['id', 'created_at']


class AnnouncementSerializer(serializers.ModelSerializer):
    created_by_name = serializers.ReadOnlyField(source='created_by.full_name')

    class Meta:
        model = Announcement
        fields = [
            'id', 'title', 'message', 'created_by_name',
            'target_roles', 'is_active', 'created_at', 'expires_at',
        ]
        read_only_fields = ['id', 'created_by_name', 'created_at']
