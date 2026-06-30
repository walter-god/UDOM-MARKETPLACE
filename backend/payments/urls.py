from django.urls import path
from . import views

urlpatterns = [
    path('transactions/', views.TransactionListView.as_view(), name='transaction-list'),
    path('transactions/<uuid:pk>/', views.TransactionDetailView.as_view(), name='transaction-detail'),
    path('invoices/', views.InvoiceListView.as_view(), name='invoice-list'),
    path('refunds/', views.RefundListView.as_view(), name='refund-list'),
    path('refunds/request/', views.RequestRefundView.as_view(), name='request-refund'),
    path('refunds/<uuid:pk>/process/', views.process_refund, name='process-refund'),
    path('create-intent/', views.create_payment_intent, name='create-payment-intent'),
]
