from django.db import models
from django.conf import settings
import uuid


class Category(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, blank=True)
    parent = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='children')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'categories'
        verbose_name_plural = 'categories'
        ordering = ['name']

    def __str__(self):
        return self.name


class Project(models.Model):
    class Status(models.TextChoices):
        DRAFT = 'draft', 'Draft'
        PENDING_REVIEW = 'pending_review', 'Pending Review'
        APPROVED = 'approved', 'Approved'
        REJECTED = 'rejected', 'Rejected'
        PUBLISHED = 'published', 'Published'
        ARCHIVED = 'archived', 'Archived'

    class AccessLevel(models.TextChoices):
        FREE = 'free', 'Free'
        STUDENT = 'student', 'Student Plan'
        PREMIUM = 'premium', 'Premium Plan'
        INSTITUTIONAL = 'institutional', 'Institutional'

    class ProjectType(models.TextChoices):
        FYP = 'fyp', 'Final Year Project'
        RESEARCH = 'research', 'Research Project'
        PERSONAL = 'personal', 'Personal Project'
        OTHERS = 'others', 'Others'

    class TechStack(models.TextChoices):
        WEB = 'web', 'Web Application'
        MOBILE_ANDROID = 'mobile_android', 'Mobile (Android)'
        MOBILE_IOS = 'mobile_ios', 'Mobile (iOS)'
        DESKTOP = 'desktop', 'Desktop'
        API = 'api', 'API/Backend'
        ML_AI = 'ml_ai', 'ML/AI'
        DATA_SCIENCE = 'data_science', 'Data Science'
        EMBEDDED = 'embedded', 'Embedded Systems'
        OTHER = 'other', 'Other'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project_code = models.CharField(max_length=20, unique=True, blank=True, editable=False)
    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    description = models.TextField()
    short_description = models.CharField(max_length=300)
    developer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='projects')
    supervisor = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='supervised_projects'
    )
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='projects')
    department = models.CharField(max_length=100, blank=True)
    tech_stack = models.CharField(max_length=30, choices=TechStack.choices, default=TechStack.OTHER)
    project_type = models.CharField(max_length=20, choices=ProjectType.choices, default=ProjectType.FYP)
    technologies = models.JSONField(default=list)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    access_level = models.CharField(max_length=20, choices=AccessLevel.choices, default=AccessLevel.FREE)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    thumbnail = models.ImageField(upload_to='projects/thumbnails/', blank=True, null=True)
    demo_video_url = models.URLField(blank=True)
    demo_url = models.URLField(blank=True)
    source_code = models.FileField(upload_to='projects/source/', blank=True, null=True)
    apk_file = models.FileField(upload_to='projects/apk/', blank=True, null=True)
    documentation = models.FileField(upload_to='projects/docs/', blank=True, null=True)
    year = models.IntegerField()
    version = models.CharField(max_length=20, default='1.0.0')
    download_count = models.IntegerField(default=0)
    view_count = models.IntegerField(default=0)
    is_featured = models.BooleanField(default=False)
    rejection_reason = models.TextField(blank=True)
    reviewer_notes = models.TextField(blank=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_projects'
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    published_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'projects'
        ordering = ['-created_at']
        constraints = [
            models.UniqueConstraint(
                models.functions.Lower('title'),
                name='unique_project_title_case_insensitive',
            )
        ]

    def save(self, *args, **kwargs):
        if not self.project_code:
            from django.db import transaction
            from django.utils import timezone
            year = self.created_at.year if self.created_at else timezone.now().year
            with transaction.atomic():
                count = Project.objects.filter(project_code__startswith=f'UDOM-{year}-').count() + 1
                self.project_code = f'UDOM-{year}-{count:04d}'
                # Retry on collision
                while Project.objects.filter(project_code=self.project_code).exists():
                    count += 1
                    self.project_code = f'UDOM-{year}-{count:04d}'
        super().save(*args, **kwargs)

    def __str__(self):
        return f'[{self.project_code}] {self.title}'

    @property
    def average_rating(self):
        reviews = self.reviews.filter(is_approved=True)
        if reviews.exists():
            return round(reviews.aggregate(models.Avg('rating'))['rating__avg'], 1)
        return 0

    @property
    def review_count(self):
        return self.reviews.filter(is_approved=True).count()


class ProjectScreenshot(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='screenshots')
    image = models.ImageField(upload_to='projects/screenshots/')
    caption = models.CharField(max_length=200, blank=True)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'project_screenshots'
        ordering = ['order']

    def __str__(self):
        return f'Screenshot for {self.project.title}'


class ProjectSubscription(models.Model):
    """Records a user's time-limited paid access to a specific project."""

    DURATION_CHOICES = [
        (30,  '1 Month'),
        (90,  '3 Months'),
        (180, '6 Months'),
        (365, '1 Year'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='project_subscriptions')
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='project_subscriptions')
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    payment_method = models.CharField(max_length=30, default='mobile_money')
    duration_days = models.IntegerField(default=30, choices=DURATION_CHOICES)
    expires_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    renewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'project_subscriptions'
        unique_together = ['user', 'project']

    def __str__(self):
        return f'{self.user.email} → {self.project.title}'

    @property
    def is_active(self):
        if self.expires_at is None:
            return True  # legacy records without expiry remain active
        from django.utils import timezone
        return self.expires_at > timezone.now()

    @property
    def days_remaining(self):
        if self.expires_at is None:
            return None
        from django.utils import timezone
        delta = self.expires_at - timezone.now()
        return max(0, delta.days)

    @property
    def is_expired(self):
        return not self.is_active


class Bookmark(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='bookmarks')
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='bookmarks')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'bookmarks'
        unique_together = ['user', 'project']

    def __str__(self):
        return f'{self.user.email} bookmarked {self.project.title}'


class Download(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='downloads')
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='downloads')
    downloaded_at = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        db_table = 'downloads'
        ordering = ['-downloaded_at']
        unique_together = ['user', 'project']

    def __str__(self):
        return f'{self.user.email} downloaded {self.project.title}'
