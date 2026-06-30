from django.db import models
from django.conf import settings
import uuid


class Plan(models.Model):
    class PlanType(models.TextChoices):
        FREE = 'free', 'Free'
        STUDENT = 'student', 'Student'
        PREMIUM = 'premium', 'Premium'
        INSTITUTIONAL = 'institutional', 'Institutional'

    class BillingCycle(models.TextChoices):
        MONTHLY = 'monthly', 'Monthly'
        SEMESTER = 'semester', 'Semester'
        ANNUAL = 'annual', 'Annual'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    plan_type = models.CharField(max_length=20, choices=PlanType.choices, unique=True)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    billing_cycle = models.CharField(max_length=20, choices=BillingCycle.choices, default=BillingCycle.MONTHLY)
    max_downloads = models.IntegerField(default=-1, help_text='-1 means unlimited')
    max_projects_access = models.IntegerField(default=-1)
    can_access_premium = models.BooleanField(default=False)
    can_publish = models.BooleanField(default=False)
    has_analytics = models.BooleanField(default=False)
    support_priority = models.CharField(max_length=20, default='basic')
    is_active = models.BooleanField(default=True)
    trial_days = models.IntegerField(default=0)
    features = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'subscription_plans'
        ordering = ['price']

    def __str__(self):
        return f'{self.name} - {self.get_billing_cycle_display()}'


class Subscription(models.Model):
    class Status(models.TextChoices):
        ACTIVE = 'active', 'Active'
        EXPIRED = 'expired', 'Expired'
        CANCELLED = 'cancelled', 'Cancelled'
        TRIAL = 'trial', 'Trial'
        PENDING = 'pending', 'Pending'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='subscriptions')
    plan = models.ForeignKey(Plan, on_delete=models.PROTECT, related_name='subscriptions')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    start_date = models.DateTimeField(auto_now_add=True)
    end_date = models.DateTimeField()
    is_trial = models.BooleanField(default=False)
    auto_renew = models.BooleanField(default=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    stripe_subscription_id = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'subscriptions'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user.email} - {self.plan.name} ({self.status})'

    @property
    def is_active(self):
        from django.utils import timezone
        return self.status == self.Status.ACTIVE and self.end_date > timezone.now()


class SubscriptionUsage(models.Model):
    subscription = models.ForeignKey(Subscription, on_delete=models.CASCADE, related_name='usage')
    downloads_used = models.IntegerField(default=0)
    projects_accessed = models.IntegerField(default=0)
    last_activity = models.DateTimeField(auto_now=True)
    period_start = models.DateTimeField()
    period_end = models.DateTimeField()

    class Meta:
        db_table = 'subscription_usage'

    def __str__(self):
        return f'Usage for {self.subscription}'
