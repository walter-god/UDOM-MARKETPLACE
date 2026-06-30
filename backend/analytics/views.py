from rest_framework import generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Sum, Count, Avg
from django.utils import timezone
from datetime import timedelta
from .models import ProjectAnalytics, PlatformStats, UserActivity
from .serializers import ProjectAnalyticsSerializer, PlatformStatsSerializer, UserActivitySerializer
from marketplace.models import Project, Download
from subscriptions.models import Subscription
from payments.models import Transaction
from users.models import User
from users.permissions import IsAdminUser


class ProjectAnalyticsView(generics.RetrieveAPIView):
    serializer_class = ProjectAnalyticsSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'project__slug'
    queryset = ProjectAnalytics.objects.all()


class PlatformStatsListView(generics.ListAPIView):
    serializer_class = PlatformStatsSerializer
    permission_classes = [IsAdminUser]
    queryset = PlatformStats.objects.all()[:30]


@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_dashboard(request):
    now = timezone.now()
    thirty_days_ago = now - timedelta(days=30)

    total_users = User.objects.count()
    new_users_30d = User.objects.filter(date_joined__gte=thirty_days_ago).count()
    active_subscriptions = Subscription.objects.filter(status='active').count()
    total_revenue = Transaction.objects.filter(status='completed').aggregate(total=Sum('amount'))['total'] or 0
    revenue_30d = Transaction.objects.filter(
        status='completed', created_at__gte=thirty_days_ago
    ).aggregate(total=Sum('amount'))['total'] or 0
    total_projects = Project.objects.filter(status='published').count()
    total_downloads = Project.objects.aggregate(total=Sum('download_count'))['total'] or 0
    pending_reviews = Project.objects.filter(status='pending_review').count()

    top_projects = Project.objects.filter(status='published').order_by('-download_count')[:5].values(
        'title', 'download_count', 'view_count'
    )

    return Response({
        'users': {'total': total_users, 'new_30d': new_users_30d},
        'subscriptions': {'active': active_subscriptions},
        'revenue': {'total': float(total_revenue), 'last_30d': float(revenue_30d)},
        'projects': {
            'total': total_projects, 'total_downloads': total_downloads, 'pending_reviews': pending_reviews,
        },
        'top_projects': list(top_projects),
    })


@api_view(['GET'])
@permission_classes([IsAdminUser])
def project_stats(request):
    from django.db.models import F

    # Top 10 projects by downloads
    top_downloads = list(
        Project.objects.filter(status='published', download_count__gt=0)
        .order_by('-download_count')[:10]
        .values('title', 'project_code', 'download_count', 'view_count')
    )

    # Top 10 projects by views
    top_views = list(
        Project.objects.filter(status='published', view_count__gt=0)
        .order_by('-view_count')[:10]
        .values('title', 'project_code', 'view_count', 'download_count')
    )

    # Access level distribution
    access_dist = list(
        Project.objects.filter(status='published')
        .values('access_level')
        .annotate(count=Count('id'))
        .order_by('-count')
    )

    # Tech stack distribution
    tech_dist = list(
        Project.objects.filter(status='published')
        .values('tech_stack')
        .annotate(count=Count('id'))
        .order_by('-count')
    )

    # Downloads vs views totals
    totals = Project.objects.filter(status='published').aggregate(
        total_downloads=Sum('download_count'),
        total_views=Sum('view_count'),
    )

    return Response({
        'top_downloads': top_downloads,
        'top_views': top_views,
        'access_distribution': access_dist,
        'tech_distribution': tech_dist,
        'totals': {
            'downloads': totals['total_downloads'] or 0,
            'views': totals['total_views'] or 0,
        },
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def developer_dashboard(request):
    projects = Project.objects.filter(developer=request.user)
    return Response({
        'total_projects': projects.count(),
        'published_projects': projects.filter(status='published').count(),
        'total_downloads': projects.aggregate(total=Sum('download_count'))['total'] or 0,
        'total_views': projects.aggregate(total=Sum('view_count'))['total'] or 0,
        'average_rating': projects.aggregate(avg=Avg('reviews__rating'))['avg'] or 0,
        'pending_reviews': projects.filter(status='pending_review').count(),
    })
