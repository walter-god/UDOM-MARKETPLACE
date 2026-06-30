from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.utils import timezone
from .models import Review, ReviewHelpful
from .serializers import ReviewSerializer, DeveloperResponseSerializer
from users.permissions import IsAdminUser


class ReviewListCreateView(generics.ListCreateAPIView):
    serializer_class = ReviewSerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        project_param = self.request.query_params.get('project')
        qs = Review.objects.filter(is_approved=True)
        if project_param:
            from uuid import UUID
            try:
                UUID(project_param)
                qs = qs.filter(project_id=project_param)
            except ValueError:
                qs = qs.filter(project__slug=project_param)
        return qs


class ReviewDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role == 'admin':
            return Review.objects.all()
        return Review.objects.filter(reviewer=self.request.user)


class ApproveReviewView(generics.GenericAPIView):
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        try:
            review = Review.objects.get(pk=pk)
        except Review.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        review.is_approved = True
        review.save()
        return Response(ReviewSerializer(review, context={'request': request}).data)


class DeveloperResponseView(generics.GenericAPIView):
    serializer_class = DeveloperResponseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            review = Review.objects.get(pk=pk, project__developer=request.user)
        except Review.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        review.developer_response = serializer.validated_data['response']
        review.developer_response_at = timezone.now()
        review.save()
        return Response(ReviewSerializer(review, context={'request': request}).data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def mark_helpful(request, pk):
    try:
        review = Review.objects.get(pk=pk)
    except Review.DoesNotExist:
        return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

    helpful, created = ReviewHelpful.objects.get_or_create(review=review, user=request.user)
    if not created:
        helpful.delete()
        review.helpful_count = max(0, review.helpful_count - 1)
    else:
        review.helpful_count += 1
    review.save(update_fields=['helpful_count'])
    return Response({'helpful_count': review.helpful_count})
