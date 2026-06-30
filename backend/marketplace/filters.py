from django_filters import rest_framework as filters
from django.db.models import Q
from .models import Project


class ProjectFilter(filters.FilterSet):
    author = filters.CharFilter(method='filter_author', label='Author name')
    year_min = filters.NumberFilter(field_name='year', lookup_expr='gte')
    year_max = filters.NumberFilter(field_name='year', lookup_expr='lte')
    department = filters.CharFilter(field_name='department', lookup_expr='icontains')
    keywords = filters.CharFilter(method='filter_keywords', label='Keywords')

    def filter_author(self, queryset, name, value):
        return queryset.filter(
            Q(developer__first_name__icontains=value) |
            Q(developer__last_name__icontains=value) |
            Q(developer__registration_number__icontains=value)
        )

    def filter_keywords(self, queryset, name, value):
        return queryset.filter(
            Q(technologies__icontains=value) |
            Q(description__icontains=value)
        )

    class Meta:
        model = Project
        fields = ['status', 'access_level', 'tech_stack', 'project_type', 'category', 'department', 'year', 'supervisor']
