from rest_framework import generics, status, permissions, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
from .models import Category, Project, Bookmark, Download, ProjectSubscription
from .filters import ProjectFilter
from .serializers import (
    CategorySerializer, ProjectListSerializer, ProjectDetailSerializer,
    ProjectCreateSerializer, BookmarkSerializer, DownloadSerializer,
    ProjectSubscriptionSerializer,
)
from users.permissions import IsAdminUser, IsLecturerOrAdmin, IsDeveloperOrAdmin


class CategoryListView(generics.ListCreateAPIView):
    queryset = Category.objects.filter(parent=None)
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def get_permissions(self):
        if self.request.method in ['POST', 'PUT', 'PATCH', 'DELETE']:
            return [IsAdminUser()]
        return [permissions.AllowAny()]


class ProjectListView(generics.ListAPIView):
    serializer_class = ProjectListSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = ProjectFilter
    search_fields = [
        'title', 'description', 'technologies', 'department',
        'developer__first_name', 'developer__last_name', 'developer__registration_number',
    ]
    ordering_fields = ['created_at', 'download_count', 'view_count', 'year', 'title']
    ordering = ['-created_at']

    def get_queryset(self):
        return Project.objects.filter(status=Project.Status.PUBLISHED)


class ProjectDetailView(generics.RetrieveAPIView):
    serializer_class = ProjectDetailSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'slug'

    def get_queryset(self):
        return Project.objects.filter(status=Project.Status.PUBLISHED)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.view_count += 1
        instance.save(update_fields=['view_count'])
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


class ProjectCreateView(generics.CreateAPIView):
    serializer_class = ProjectCreateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        project = serializer.save(status=Project.Status.PENDING_REVIEW)
        try:
            self._send_upload_notifications(project)
        except Exception:
            pass

    def _send_upload_notifications(self, project):
        from notifications.models import Notification

        Notification.objects.create(
            recipient=project.developer,
            notification_type=Notification.NotificationType.PROJECT_UPLOAD,
            title='Project Submitted for Review',
            message=f'Your project "{project.title}" has been submitted and is pending review.',
            action_url=f'/marketplace/{project.slug}',
        )


LOCKED_STATUSES = {Project.Status.PUBLISHED, Project.Status.APPROVED}


class ProjectUpdateView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ProjectCreateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role == 'admin':
            return Project.objects.all()
        return Project.objects.filter(developer=self.request.user)

    def update(self, request, *args, **kwargs):
        project = self.get_object()
        if request.user.role != 'admin' and project.status in LOCKED_STATUSES:
            return Response(
                {'detail': 'This project has been approved and published. It can no longer be edited.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().update(request, *args, **kwargs)

    def perform_update(self, serializer):
        extra = {}
        if self.request.user.role != 'admin':
            extra['status'] = Project.Status.PENDING_REVIEW
        serializer.save(**extra)

    def destroy(self, request, *args, **kwargs):
        if request.user.role != 'admin':
            return Response({'detail': 'Only administrators can delete projects.'},
                            status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)


class MyProjectsView(generics.ListAPIView):
    serializer_class = ProjectListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Project.objects.filter(developer=self.request.user)


class PendingProjectsView(generics.ListAPIView):
    serializer_class = ProjectDetailSerializer
    permission_classes = [IsLecturerOrAdmin]
    queryset = Project.objects.filter(status=Project.Status.PENDING_REVIEW)


class ReviewProjectView(generics.GenericAPIView):
    permission_classes = [IsLecturerOrAdmin]

    def post(self, request, pk):
        try:
            project = Project.objects.get(pk=pk)
        except Project.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        action = request.data.get('action')
        if action not in ['approve', 'reject']:
            return Response({'detail': 'Action must be approve or reject.'}, status=status.HTTP_400_BAD_REQUEST)

        project.reviewed_by = request.user
        project.reviewed_at = timezone.now()

        if action == 'approve':
            project.status = Project.Status.PUBLISHED
            project.published_at = timezone.now()
        else:
            project.status = Project.Status.REJECTED
            project.rejection_reason = request.data.get('reason', '')

        project.reviewer_notes = request.data.get('notes', '')
        project.save()

        # Notify developer
        from notifications.models import Notification
        notes = project.reviewer_notes
        if action == 'approve':
            notif_type = Notification.NotificationType.PROJECT_APPROVED
            title = 'Project Approved'
            message = f'Your project "{project.title}" has been approved and published.'
            if notes:
                message += f' Reviewer notes: {notes}'
        else:
            notif_type = Notification.NotificationType.PROJECT_REJECTED
            title = 'Project Rejected'
            reason = project.rejection_reason
            message = f'Your project "{project.title}" was rejected.'
            if reason:
                message += f' Reason: {reason}'
            if notes:
                message += f' Notes: {notes}'
        Notification.objects.create(
            recipient=project.developer,
            notification_type=notif_type,
            title=title,
            message=message,
            action_url=f'/marketplace/{project.slug}',
        )
        return Response(ProjectDetailSerializer(project).data)


class AdminProjectListView(generics.ListAPIView):
    serializer_class = ProjectListSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = ProjectFilter
    search_fields = ['title', 'description', 'department', 'developer__first_name', 'developer__last_name']
    ordering_fields = ['created_at', 'year', 'title', 'download_count']
    ordering = ['-created_at']

    def get_queryset(self):
        return Project.objects.all()


VALID_DURATIONS = {30, 90, 180, 365}


class ProjectSubscribeView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        from django.shortcuts import get_object_or_404
        project = get_object_or_404(Project, pk=pk, status=Project.Status.PUBLISHED)

        if project.access_level == 'free' or float(project.price) == 0:
            return Response({'detail': 'This project is free — no subscription needed.'},
                            status=status.HTTP_400_BAD_REQUEST)

        duration_days = int(request.data.get('duration_days', 30))
        if duration_days not in VALID_DURATIONS:
            return Response({'detail': 'Invalid duration. Choose 30, 90, 180, or 365 days.'},
                            status=status.HTTP_400_BAD_REQUEST)

        payment_method = request.data.get('payment_method', 'mobile_money')
        total_price = Decimal(str(float(project.price) * (duration_days / 30)))
        expires_at = timezone.now() + timedelta(days=duration_days)

        existing = ProjectSubscription.objects.filter(user=request.user, project=project).first()

        if existing and existing.is_active:
            return Response({'detail': 'You already have active access to this project.'},
                            status=status.HTTP_400_BAD_REQUEST)

        if existing:
            # Renew: extend from now
            existing.expires_at = expires_at
            existing.duration_days = duration_days
            existing.amount_paid = total_price
            existing.payment_method = payment_method
            existing.renewed_at = timezone.now()
            existing.save()
            sub = existing
            action = 'renewed'
        else:
            sub = ProjectSubscription.objects.create(
                user=request.user,
                project=project,
                amount_paid=total_price,
                payment_method=payment_method,
                duration_days=duration_days,
                expires_at=expires_at,
            )
            action = 'created'

        from payments.models import Transaction, Invoice
        transaction = Transaction.objects.create(
            user=request.user,
            amount=total_price,
            currency='TZS',
            payment_method=payment_method,
            description=f'Project access ({duration_days}d): {project.title}',
            status='completed',
            completed_at=timezone.now(),
        )
        Invoice.objects.create(transaction=transaction, due_date=timezone.now().date())

        return Response({
            'subscription_id': str(sub.id),
            'project': project.title,
            'status': 'active',
            'action': action,
            'expires_at': sub.expires_at.isoformat(),
            'duration_days': duration_days,
        }, status=status.HTTP_201_CREATED)


class UserProjectSubscriptionsView(generics.ListAPIView):
    serializer_class = ProjectSubscriptionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ProjectSubscription.objects.filter(user=self.request.user).select_related('project__developer')


class BookmarkToggleView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            project = Project.objects.get(pk=pk)
        except Project.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        bookmark, created = Bookmark.objects.get_or_create(user=request.user, project=project)
        if not created:
            bookmark.delete()
            return Response({'bookmarked': False})
        return Response({'bookmarked': True}, status=status.HTTP_201_CREATED)


class BookmarkListView(generics.ListAPIView):
    serializer_class = BookmarkSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Bookmark.objects.filter(user=self.request.user).select_related('project').order_by('-created_at')


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def download_project(request, pk):
    try:
        project = Project.objects.get(pk=pk, status=Project.Status.PUBLISHED)
    except Project.DoesNotExist:
        return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

    is_paid = project.access_level != 'free' and float(project.price) > 0
    is_privileged = request.user.role in ('admin', 'lecturer')
    is_admin = request.user.role == 'admin'

    if is_paid and not is_privileged:
        try:
            sub = ProjectSubscription.objects.get(user=request.user, project=project)
            if not sub.is_active:
                return Response({
                    'detail': 'Your subscription has expired. Please renew to continue accessing this project.',
                    'project_id': str(project.id),
                    'expired': True,
                }, status=status.HTTP_403_FORBIDDEN)
        except ProjectSubscription.DoesNotExist:
            return Response({'detail': 'Subscription required.', 'project_id': str(project.id)},
                            status=status.HTTP_403_FORBIDDEN)
        # Paid projects: allow re-download within active subscription period
        _, created = Download.objects.get_or_create(
            user=request.user, project=project,
            defaults={'ip_address': request.META.get('REMOTE_ADDR')}
        )
    else:
        # Free projects: one download per account, ever
        if Download.objects.filter(user=request.user, project=project).exists():
            return Response(
                {'detail': 'You have already downloaded this project. Each account is allowed one download only.'},
                status=status.HTTP_409_CONFLICT,
            )
        Download.objects.create(
            user=request.user,
            project=project,
            ip_address=request.META.get('REMOTE_ADDR'),
        )
        created = True

    if created:
        project.download_count += 1
        project.save(update_fields=['download_count'])

    download_url = None
    if is_admin:
        # Admins only get source code
        if project.source_code:
            download_url = request.build_absolute_uri(project.source_code.url)
        elif project.apk_file:
            download_url = request.build_absolute_uri(project.apk_file.url)
        elif project.documentation:
            download_url = request.build_absolute_uri(project.documentation.url)
    else:
        # Everyone else (including lecturers) receives APK or documentation only
        if project.apk_file:
            download_url = request.build_absolute_uri(project.apk_file.url)
        elif project.documentation:
            download_url = request.build_absolute_uri(project.documentation.url)

    return Response({
        'download_url': download_url,
        'project': project.title,
        'includes_source': is_admin,
        'file_type': 'source_code' if (is_admin and project.source_code) else ('apk' if project.apk_file else 'documentation'),
    })


def _can_access_source(user, project):
    return user.role == 'admin'


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def project_source_tree(request, pk):
    from django.shortcuts import get_object_or_404
    import zipfile as zf
    project = get_object_or_404(Project, pk=pk)
    if not _can_access_source(request.user, project):
        return Response({'detail': 'Source code access is restricted to administrators, lecturers, and the project owner.'},
                        status=status.HTTP_403_FORBIDDEN)
    if not project.source_code:
        return Response({'detail': 'No source code uploaded.'}, status=status.HTTP_404_NOT_FOUND)
    try:
        with zf.ZipFile(project.source_code.path, 'r') as z:
            names = sorted(z.namelist())
        return Response({'files': names, 'project_title': project.title})
    except zf.BadZipFile:
        return Response({'detail': 'Not a valid ZIP file.'}, status=status.HTTP_400_BAD_REQUEST)
    except Exception:
        return Response({'detail': 'Could not read archive.'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def project_source_file(request, pk):
    from django.shortcuts import get_object_or_404
    import zipfile as zf
    project = get_object_or_404(Project, pk=pk)
    if not _can_access_source(request.user, project):
        return Response({'detail': 'Source code access is restricted to administrators, lecturers, and the project owner.'},
                        status=status.HTTP_403_FORBIDDEN)
    if not project.source_code:
        return Response({'detail': 'No source code uploaded.'}, status=status.HTTP_404_NOT_FOUND)

    file_path = request.query_params.get('path', '')
    if not file_path or '..' in file_path:
        return Response({'detail': 'Invalid path.'}, status=status.HTTP_400_BAD_REQUEST)

    MAX_BYTES = 500 * 1024
    try:
        with zf.ZipFile(project.source_code.path, 'r') as z:
            try:
                info = z.getinfo(file_path)
            except KeyError:
                return Response({'detail': 'File not found in archive.'}, status=status.HTTP_404_NOT_FOUND)
            if info.file_size > MAX_BYTES:
                return Response({'detail': f'File too large to preview ({info.file_size // 1024} KB).', 'too_large': True},
                                status=status.HTTP_400_BAD_REQUEST)
            raw = z.read(file_path)
            for enc in ('utf-8', 'latin-1'):
                try:
                    content = raw.decode(enc)
                    return Response({'path': file_path, 'content': content, 'size': info.file_size})
                except UnicodeDecodeError:
                    continue
            return Response({'detail': 'Binary file — cannot preview.', 'binary': True},
                            status=status.HTTP_400_BAD_REQUEST)
    except zf.BadZipFile:
        return Response({'detail': 'Not a valid ZIP file.'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def check_project_title(request):
    title = request.query_params.get('title', '').strip()
    exclude_id = request.query_params.get('exclude', None)
    if not title:
        return Response({'available': False, 'detail': 'Title is required.'})
    qs = Project.objects.filter(title__iexact=title)
    if exclude_id:
        qs = qs.exclude(pk=exclude_id)
    if qs.exists():
        existing = qs.first()
        return Response({
            'available': False,
            'detail': f'"{existing.title}" ({existing.project_code}) already exists.',
        })
    return Response({'available': True})


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def featured_projects(request):
    projects = Project.objects.filter(status=Project.Status.PUBLISHED, is_featured=True)[:6]
    return Response(ProjectListSerializer(projects, many=True, context={'request': request}).data)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def marketplace_stats(request):
    return Response({
        'total_projects': Project.objects.filter(status=Project.Status.PUBLISHED).count(),
        'total_categories': Category.objects.count(),
        'total_downloads': sum(Project.objects.values_list('download_count', flat=True)),
    })


class LecturerSupervisedProjectsView(generics.ListAPIView):
    """Projects where current lecturer is set as supervisor."""
    serializer_class = ProjectDetailSerializer
    permission_classes = [IsLecturerOrAdmin]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'developer__first_name', 'developer__last_name',
                     'developer__registration_number', 'department']
    ordering_fields = ['created_at', 'year', 'status', 'title']
    ordering = ['-created_at']

    def get_queryset(self):
        return Project.objects.filter(supervisor=self.request.user).select_related('developer', 'category')


@api_view(['POST'])
@permission_classes([IsLecturerOrAdmin])
def assign_supervisor(request, pk):
    """Lecturer self-assigns as supervisor for a project."""
    from django.shortcuts import get_object_or_404
    project = get_object_or_404(Project, pk=pk)
    if project.supervisor and project.supervisor != request.user:
        return Response(
            {'detail': f'This project already has a supervisor: {project.supervisor.full_name}.'},
            status=status.HTTP_400_BAD_REQUEST,
        )
    project.supervisor = request.user
    project.save(update_fields=['supervisor'])
    from notifications.models import Notification
    Notification.objects.create(
        recipient=project.developer,
        notification_type=Notification.NotificationType.GENERAL,
        title='Supervisor Assigned',
        message=f'{request.user.full_name} has been assigned as supervisor for your project "{project.title}".',
        action_url=f'/marketplace/{project.slug}',
    )
    return Response({'detail': 'Assigned as supervisor.', 'supervisor': request.user.full_name})


@api_view(['GET'])
@permission_classes([IsLecturerOrAdmin])
def similar_titles(request):
    """Return projects with titles similar to the query (for duplication detection)."""
    query = request.query_params.get('q', '').strip()
    if len(query) < 3:
        return Response({'results': []})
    from django.db.models import Q
    matches = Project.objects.filter(
        Q(title__icontains=query) |
        Q(title__icontains=' '.join(query.split()[:3]))
    ).values('id', 'project_code', 'title', 'developer__first_name',
             'developer__last_name', 'developer__registration_number',
             'year', 'status', 'department')[:20]
    results = [
        {
            'id': str(m['id']),
            'project_code': m['project_code'],
            'title': m['title'],
            'developer': f"{m['developer__first_name']} {m['developer__last_name']}",
            'reg_number': m['developer__registration_number'],
            'year': m['year'],
            'status': m['status'],
            'department': m['department'],
        }
        for m in matches
    ]
    return Response({'results': results, 'query': query})
