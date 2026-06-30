from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.conf import settings
from django.utils import timezone
from .models import Transaction, Invoice, Refund
from .serializers import TransactionSerializer, InvoiceSerializer, RefundSerializer, CreatePaymentIntentSerializer
from subscriptions.models import Subscription
from users.permissions import IsAdminUser
import stripe
import uuid

stripe.api_key = settings.STRIPE_SECRET_KEY


class TransactionListView(generics.ListAPIView):
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role == 'admin':
            return Transaction.objects.all()
        return Transaction.objects.filter(user=self.request.user)


class TransactionDetailView(generics.RetrieveAPIView):
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role == 'admin':
            return Transaction.objects.all()
        return Transaction.objects.filter(user=self.request.user)


class InvoiceListView(generics.ListAPIView):
    serializer_class = InvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role == 'admin':
            return Invoice.objects.all()
        return Invoice.objects.filter(transaction__user=self.request.user)


class RefundListView(generics.ListAPIView):
    serializer_class = RefundSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role == 'admin':
            return Refund.objects.all()
        return Refund.objects.filter(requested_by=self.request.user)


class RequestRefundView(generics.CreateAPIView):
    serializer_class = RefundSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        transaction_id = request.data.get('transaction_id')
        try:
            transaction = Transaction.objects.get(pk=transaction_id, user=request.user, status='completed')
        except Transaction.DoesNotExist:
            return Response({'detail': 'Transaction not found.'}, status=status.HTTP_404_NOT_FOUND)

        refund = Refund.objects.create(
            transaction=transaction,
            requested_by=request.user,
            amount=transaction.amount,
            reason=request.data.get('reason', ''),
        )
        return Response(RefundSerializer(refund).data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def create_payment_intent(request):
    serializer = CreatePaymentIntentSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    from subscriptions.models import Plan
    try:
        plan = Plan.objects.get(pk=serializer.validated_data['plan_id'])
    except Plan.DoesNotExist:
        return Response({'detail': 'Plan not found.'}, status=status.HTTP_404_NOT_FOUND)

    transaction = Transaction.objects.create(
        user=request.user,
        amount=plan.price,
        currency='TZS',
        payment_method=serializer.validated_data['payment_method'],
        description=f'Subscription: {plan.name}',
    )

    # Link transaction to the user's pending subscription
    pending_subscription = request.user.subscriptions.filter(status='pending').order_by('-created_at').first()
    if pending_subscription:
        transaction.subscription = pending_subscription
        transaction.save()

    stripe_key = settings.STRIPE_SECRET_KEY
    is_real_stripe_key = stripe_key and not stripe_key.endswith('xxx') and len(stripe_key) > 20

    if is_real_stripe_key and plan.price > 0:
        try:
            intent = stripe.PaymentIntent.create(
                amount=int(plan.price * 100),
                currency='tzs',
                metadata={'transaction_id': str(transaction.id), 'user_id': str(request.user.id)},
            )
            transaction.stripe_payment_intent_id = intent['id']
            transaction.save()
            return Response({
                'client_secret': intent['client_secret'],
                'transaction_id': str(transaction.id),
            })
        except stripe.error.StripeError as e:
            transaction.status = 'failed'
            transaction.save()
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    transaction.status = 'completed'
    transaction.completed_at = timezone.now()
    transaction.save()

    if pending_subscription:
        pending_subscription.status = 'active'
        pending_subscription.save()

    Invoice.objects.create(
        transaction=transaction,
        due_date=timezone.now().date(),
    )

    return Response({'transaction_id': str(transaction.id), 'status': 'completed'})


@api_view(['POST'])
@permission_classes([IsAdminUser])
def process_refund(request, pk):
    try:
        refund = Refund.objects.get(pk=pk)
    except Refund.DoesNotExist:
        return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

    action = request.data.get('action')
    if action == 'approve':
        refund.status = 'approved'
    elif action == 'reject':
        refund.status = 'rejected'
    else:
        return Response({'detail': 'Action must be approve or reject.'}, status=status.HTTP_400_BAD_REQUEST)

    refund.processed_at = timezone.now()
    refund.save()
    return Response(RefundSerializer(refund).data)
