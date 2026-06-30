import json
from rest_framework import serializers
from django.utils.text import slugify
from .models import Category, Project, ProjectScreenshot, Bookmark, Download, ProjectSubscription


class CategorySerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'icon', 'parent', 'children']

    def get_children(self, obj):
        return CategorySerializer(obj.children.all(), many=True).data


class ProjectScreenshotSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectScreenshot
        fields = ['id', 'image', 'caption', 'order']


class ProjectListSerializer(serializers.ModelSerializer):
    developer_name = serializers.ReadOnlyField(source='developer.full_name')
    category_name = serializers.ReadOnlyField(source='category.name')
    average_rating = serializers.ReadOnlyField()
    review_count = serializers.ReadOnlyField()
    is_bookmarked = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            'id', 'project_code', 'title', 'slug', 'short_description', 'developer_name',
            'category_name', 'tech_stack', 'project_type', 'status', 'access_level', 'price',
            'thumbnail', 'download_count', 'view_count', 'average_rating',
            'review_count', 'is_featured', 'year', 'is_bookmarked', 'created_at',
        ]

    def get_is_bookmarked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.bookmarks.filter(user=request.user).exists()
        return False


class ProjectDetailSerializer(serializers.ModelSerializer):
    developer_name = serializers.ReadOnlyField(source='developer.full_name')
    developer_id = serializers.ReadOnlyField(source='developer.id')
    developer_registration_number = serializers.ReadOnlyField(source='developer.registration_number')
    supervisor_name = serializers.SerializerMethodField()
    supervisor_id = serializers.ReadOnlyField(source='supervisor.id')
    reviewer_name = serializers.ReadOnlyField(source='reviewed_by.full_name')
    category = CategorySerializer(read_only=True)
    screenshots = ProjectScreenshotSerializer(many=True, read_only=True)
    average_rating = serializers.ReadOnlyField()
    review_count = serializers.ReadOnlyField()
    is_bookmarked = serializers.SerializerMethodField()
    is_subscribed = serializers.SerializerMethodField()
    has_downloaded = serializers.SerializerMethodField()
    subscription_expires_at = serializers.SerializerMethodField()
    subscription_is_expired = serializers.SerializerMethodField()
    subscription_days_remaining = serializers.SerializerMethodField()
    file_access = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            'id', 'project_code', 'title', 'slug', 'description', 'short_description',
            'developer_name', 'developer_id', 'developer_registration_number',
            'supervisor_name', 'supervisor_id', 'reviewer_name',
            'reviewer_notes', 'rejection_reason', 'reviewed_at',
            'category', 'department',
            'tech_stack', 'technologies', 'status', 'access_level', 'price',
            'thumbnail', 'demo_video_url', 'demo_url', 'year', 'version',
            'download_count', 'view_count', 'average_rating', 'review_count',
            'is_featured', 'screenshots', 'is_bookmarked', 'is_subscribed',
            'has_downloaded', 'project_type', 'file_access',
            'subscription_expires_at', 'subscription_is_expired', 'subscription_days_remaining',
            'created_at', 'published_at',
        ]

    def get_supervisor_name(self, obj):
        return obj.supervisor.full_name if obj.supervisor else None

    def get_is_bookmarked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.bookmarks.filter(user=request.user).exists()
        return False

    def get_is_subscribed(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            if request.user.role == 'admin':
                return True
            sub = obj.project_subscriptions.filter(user=request.user).first()
            return bool(sub and sub.is_active)
        return False

    def get_has_downloaded(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.downloads.filter(user=request.user).exists()
        return False

    def _get_user_sub(self, obj, request):
        if request and request.user.is_authenticated:
            return obj.project_subscriptions.filter(user=request.user).first()
        return None

    def get_subscription_expires_at(self, obj):
        sub = self._get_user_sub(obj, self.context.get('request'))
        return sub.expires_at.isoformat() if sub and sub.expires_at else None

    def get_subscription_is_expired(self, obj):
        sub = self._get_user_sub(obj, self.context.get('request'))
        return bool(sub and sub.is_expired)

    def get_subscription_days_remaining(self, obj):
        sub = self._get_user_sub(obj, self.context.get('request'))
        return sub.days_remaining if sub else None

    def get_file_access(self, obj):
        """Return which file types exist and which the current user may download."""
        request = self.context.get('request')
        has_source = bool(obj.source_code)
        has_apk = bool(obj.apk_file)
        has_docs = bool(obj.documentation)

        if not request or not request.user.is_authenticated:
            return {
                'source_code': False, 'apk': has_apk, 'documentation': has_docs,
                'has_source': has_source, 'has_apk': has_apk, 'has_docs': has_docs,
                'access_label': 'Login required',
            }

        user = request.user
        can_source = user.role == 'admin'

        if can_source:
            label = 'Administrator — full access including source code'
        elif user.role == 'lecturer':
            label = 'Lecturer — APK / Documentation (source code is admin-only)'
        else:
            label = 'APK / Documentation only (source code restricted to administrators)'

        return {
            'source_code': can_source and has_source,
            'apk': has_apk,
            'documentation': has_docs,
            'has_source': has_source,
            'has_apk': has_apk,
            'has_docs': has_docs,
            'can_access_source': can_source,
            'access_label': label,
        }


class ProjectSubscriptionSerializer(serializers.ModelSerializer):
    project_title = serializers.ReadOnlyField(source='project.title')
    project_slug = serializers.ReadOnlyField(source='project.slug')
    project_thumbnail = serializers.ImageField(source='project.thumbnail', read_only=True)
    project_tech_stack = serializers.ReadOnlyField(source='project.tech_stack')
    project_id = serializers.ReadOnlyField(source='project.id')
    project_price = serializers.ReadOnlyField(source='project.price')
    developer_name = serializers.ReadOnlyField(source='project.developer.full_name')
    is_active = serializers.ReadOnlyField()
    is_expired = serializers.ReadOnlyField()
    days_remaining = serializers.ReadOnlyField()

    class Meta:
        model = ProjectSubscription
        fields = [
            'id', 'project_id', 'project_title', 'project_slug', 'project_thumbnail',
            'project_tech_stack', 'project_price', 'developer_name', 'amount_paid',
            'payment_method', 'duration_days', 'expires_at', 'renewed_at',
            'is_active', 'is_expired', 'days_remaining', 'created_at',
        ]


class ProjectCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = [
            'title', 'description', 'short_description', 'category', 'department',
            'tech_stack', 'project_type', 'technologies', 'access_level', 'price', 'thumbnail',
            'demo_video_url', 'demo_url', 'source_code', 'apk_file', 'documentation',
            'year', 'version', 'supervisor',
        ]

    def validate_technologies(self, value):
        if isinstance(value, str):
            try:
                value = json.loads(value)
            except (json.JSONDecodeError, ValueError):
                value = [t.strip() for t in value.split(',') if t.strip()]
        return value if isinstance(value, list) else []

    def validate_title(self, value):
        qs = Project.objects.filter(title__iexact=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            existing = qs.first()
            raise serializers.ValidationError(
                f'A project titled "{existing.title}" ({existing.project_code}) already exists. '
                'Please choose a different title.'
            )
        return value

    def create(self, validated_data):
        validated_data['developer'] = self.context['request'].user
        validated_data['slug'] = slugify(validated_data['title'])
        base_slug = validated_data['slug']
        counter = 1
        while Project.objects.filter(slug=validated_data['slug']).exists():
            validated_data['slug'] = f'{base_slug}-{counter}'
            counter += 1
        return super().create(validated_data)


class BookmarkSerializer(serializers.ModelSerializer):
    project = ProjectListSerializer(read_only=True)

    class Meta:
        model = Bookmark
        fields = ['id', 'project', 'created_at']


class DownloadSerializer(serializers.ModelSerializer):
    project_title = serializers.ReadOnlyField(source='project.title')

    class Meta:
        model = Download
        fields = ['id', 'project_title', 'downloaded_at']
