from rest_framework import serializers
from .models import Plan, Subscription, SubscriptionUsage


class PlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = Plan
        fields = [
            'id', 'name', 'plan_type', 'description', 'price', 'billing_cycle',
            'max_downloads', 'max_projects_access', 'can_access_premium', 'can_publish',
            'has_analytics', 'support_priority', 'is_active', 'trial_days', 'features',
        ]


class SubscriptionUsageSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionUsage
        fields = ['downloads_used', 'projects_accessed', 'last_activity', 'period_start', 'period_end']


class SubscriptionSerializer(serializers.ModelSerializer):
    plan = PlanSerializer(read_only=True)
    plan_id = serializers.UUIDField(write_only=True)
    user_email = serializers.ReadOnlyField(source='user.email')
    is_active = serializers.ReadOnlyField()
    usage = SubscriptionUsageSerializer(many=True, read_only=True)

    class Meta:
        model = Subscription
        fields = [
            'id', 'user_email', 'plan', 'plan_id', 'status', 'start_date',
            'end_date', 'is_trial', 'auto_renew', 'cancelled_at', 'is_active', 'usage',
        ]
        read_only_fields = ['id', 'user_email', 'status', 'start_date']


class SubscribeSerializer(serializers.Serializer):
    plan_id = serializers.UUIDField()
    billing_cycle = serializers.ChoiceField(choices=Plan.BillingCycle.choices)
    payment_method = serializers.CharField()
