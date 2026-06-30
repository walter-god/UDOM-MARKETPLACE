from django.urls import path
from . import views

urlpatterns = [
    path('plans/', views.PlanListView.as_view(), name='plan-list'),
    path('plans/create/', views.PlanCreateView.as_view(), name='plan-create'),
    path('plans/<uuid:pk>/', views.PlanManageView.as_view(), name='plan-manage'),
    path('my/', views.MySubscriptionView.as_view(), name='my-subscription'),
    path('history/', views.SubscriptionHistoryView.as_view(), name='subscription-history'),
    path('subscribe/', views.SubscribeView.as_view(), name='subscribe'),
    path('cancel/', views.CancelSubscriptionView.as_view(), name='cancel-subscription'),
    path('all/', views.AdminSubscriptionListView.as_view(), name='admin-subscription-list'),
]
