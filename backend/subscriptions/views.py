from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
from .models import Plan, Subscription
from .serializers import PlanSerializer, SubscriptionSerializer, SubscribeSerializer
from users.permissions import IsAdminUser


class PlanListView(generics.ListAPIView):
    queryset = Plan.objects.filter(is_active=True)
    serializer_class = PlanSerializer
    permission_classes = [permissions.AllowAny]


class PlanManageView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Plan.objects.all()
    serializer_class = PlanSerializer
    permission_classes = [IsAdminUser]


class PlanCreateView(generics.CreateAPIView):
    queryset = Plan.objects.all()
    serializer_class = PlanSerializer
    permission_classes = [IsAdminUser]


class MySubscriptionView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        subscription = request.user.subscriptions.filter(status='active').first()
        if not subscription:
            return Response(None, status=status.HTTP_200_OK)
        return Response(SubscriptionSerializer(subscription).data)


class SubscriptionHistoryView(generics.ListAPIView):
    serializer_class = SubscriptionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.request.user.subscriptions.all()


class SubscribeView(generics.GenericAPIView):
    serializer_class = SubscribeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            plan = Plan.objects.get(pk=serializer.validated_data['plan_id'], is_active=True)
        except Plan.DoesNotExist:
            return Response({'detail': 'Plan not found.'}, status=status.HTTP_404_NOT_FOUND)

        billing_cycle = serializer.validated_data['billing_cycle']
        if billing_cycle == 'monthly':
            end_date = timezone.now() + timedelta(days=30)
        elif billing_cycle == 'semester':
            end_date = timezone.now() + timedelta(days=180)
        else:
            end_date = timezone.now() + timedelta(days=365)

        request.user.subscriptions.filter(status='active').update(status='cancelled')

        subscription = Subscription.objects.create(
            user=request.user,
            plan=plan,
            status=Subscription.Status.ACTIVE if plan.plan_type == 'free' else Subscription.Status.PENDING,
            end_date=end_date,
        )
        return Response(SubscriptionSerializer(subscription).data, status=status.HTTP_201_CREATED)


class CancelSubscriptionView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        subscription = request.user.subscriptions.filter(status='active').first()
        if not subscription:
            return Response({'detail': 'No active subscription to cancel.'}, status=status.HTTP_404_NOT_FOUND)
        subscription.status = Subscription.Status.CANCELLED
        subscription.cancelled_at = timezone.now()
        subscription.save()
        return Response({'detail': 'Subscription cancelled.'})


class AdminSubscriptionListView(generics.ListAPIView):
    serializer_class = SubscriptionSerializer
    permission_classes = [IsAdminUser]
    queryset = Subscription.objects.all()
    filterset_fields = ['status', 'plan']
