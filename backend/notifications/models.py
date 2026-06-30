from django.db import models
from django.conf import settings
import uuid


class Notification(models.Model):
    class NotificationType(models.TextChoices):
        SUBSCRIPTION_EXPIRY = 'subscription_expiry', 'Subscription Expiry'
        SUBSCRIPTION_RENEWED = 'subscription_renewed', 'Subscription Renewed'
        PAYMENT_CONFIRMED = 'payment_confirmed', 'Payment Confirmed'
        PAYMENT_FAILED = 'payment_failed', 'Payment Failed'
        PROJECT_APPROVED = 'project_approved', 'Project Approved'
        PROJECT_REJECTED = 'project_rejected', 'Project Rejected'
        NEW_REVIEW = 'new_review', 'New Review'
        REVIEW_RESPONSE = 'review_response', 'Review Response'
        SYSTEM_ANNOUNCEMENT = 'system_announcement', 'System Announcement'
        PROJECT_UPLOAD = 'project_upload', 'Project Upload'
        DOWNLOAD_COMPLETE = 'download_complete', 'Download Complete'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=40, choices=NotificationType.choices)
    title = models.CharField(max_length=200)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    action_url = models.CharField(max_length=500, blank=True)
    extra_data = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.notification_type} for {self.recipient.email}'


class Announcement(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    message = models.TextField()
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='announcements')
    target_roles = models.JSONField(default=list)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'announcements'
        ordering = ['-created_at']

    def __str__(self):
        return self.title
