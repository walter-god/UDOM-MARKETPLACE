from django.urls import path
from . import views

urlpatterns = [
    path('categories/', views.CategoryListView.as_view(), name='category-list'),
    path('projects/', views.ProjectListView.as_view(), name='project-list'),
    path('admin/projects/', views.AdminProjectListView.as_view(), name='admin-project-list'),
    path('projects/create/', views.ProjectCreateView.as_view(), name='project-create'),
    path('projects/my/', views.MyProjectsView.as_view(), name='my-projects'),
    path('projects/pending/', views.PendingProjectsView.as_view(), name='pending-projects'),
    path('projects/featured/', views.featured_projects, name='featured-projects'),
    path('projects/check-title/', views.check_project_title, name='check-project-title'),
    path('projects/stats/', views.marketplace_stats, name='marketplace-stats'),
    path('projects/<slug:slug>/', views.ProjectDetailView.as_view(), name='project-detail'),
    path('projects/<uuid:pk>/update/', views.ProjectUpdateView.as_view(), name='project-update'),
    path('projects/<uuid:pk>/review/', views.ReviewProjectView.as_view(), name='review-project'),
    path('projects/<uuid:pk>/source/', views.project_source_tree, name='project-source-tree'),
    path('projects/<uuid:pk>/source/file/', views.project_source_file, name='project-source-file'),
    path('projects/<uuid:pk>/bookmark/', views.BookmarkToggleView.as_view(), name='bookmark-toggle'),
    path('projects/<uuid:pk>/download/', views.download_project, name='download-project'),
    path('projects/<uuid:pk>/subscribe/', views.ProjectSubscribeView.as_view(), name='project-subscribe'),
    path('my-subscriptions/', views.UserProjectSubscriptionsView.as_view(), name='user-project-subscriptions'),
    path('bookmarks/', views.BookmarkListView.as_view(), name='bookmark-list'),
    path('lecturer/supervised/', views.LecturerSupervisedProjectsView.as_view(), name='lecturer-supervised'),
    path('lecturer/similar-titles/', views.similar_titles, name='similar-titles'),
    path('projects/<uuid:pk>/assign-supervisor/', views.assign_supervisor, name='assign-supervisor'),
]
