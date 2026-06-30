from django.db import models
from django.conf import settings
import uuid


class ProjectAnalytics(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.OneToOneField('marketplace.Project', on_delete=models.CASCADE, related_name='analytics')
    total_views = models.IntegerField(default=0)
    total_downloads = models.IntegerField(default=0)
    total_bookmarks = models.IntegerField(default=0)
    total_reviews = models.IntegerField(default=0)
    average_rating = models.FloatField(default=0)
    monthly_views = models.JSONField(default=dict)
    monthly_downloads = models.JSONField(default=dict)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'project_analytics'

    def __str__(self):
        return f'Analytics for {self.project.title}'


class PlatformStats(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    date = models.DateField(unique=True)
    total_users = models.IntegerField(default=0)
    new_users = models.IntegerField(default=0)
    active_subscriptions = models.IntegerField(default=0)
    new_subscriptions = models.IntegerField(default=0)
    total_revenue = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_projects = models.IntegerField(default=0)
    new_projects = models.IntegerField(default=0)
    total_downloads = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'platform_stats'
        ordering = ['-date']

    def __str__(self):
        return f'Stats for {self.date}'


class UserActivity(models.Model):
    class ActivityType(models.TextChoices):
        PAGE_VIEW = 'page_view', 'Page View'
        PROJECT_VIEW = 'project_view', 'Project View'
        DOWNLOAD = 'download', 'Download'
        SEARCH = 'search', 'Search'
        SUBSCRIPTION = 'subscription', 'Subscription'
        PAYMENT = 'payment', 'Payment'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='activities')
    activity_type = models.CharField(max_length=20, choices=ActivityType.choices)
    project = models.ForeignKey('marketplace.Project', on_delete=models.SET_NULL, null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'user_activities'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user.email} - {self.activity_type}'
