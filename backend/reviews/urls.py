from django.urls import path
from . import views

urlpatterns = [
    path('', views.ReviewListCreateView.as_view(), name='review-list'),
    path('<uuid:pk>/', views.ReviewDetailView.as_view(), name='review-detail'),
    path('<uuid:pk>/approve/', views.ApproveReviewView.as_view(), name='approve-review'),
    path('<uuid:pk>/respond/', views.DeveloperResponseView.as_view(), name='developer-response'),
    path('<uuid:pk>/helpful/', views.mark_helpful, name='mark-helpful'),
]
