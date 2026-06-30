from rest_framework import serializers
from .models import Review, ReviewHelpful


class ReviewSerializer(serializers.ModelSerializer):
    reviewer_name = serializers.ReadOnlyField(source='reviewer.full_name')
    reviewer_picture = serializers.ImageField(source='reviewer.profile_picture', read_only=True)
    project_title = serializers.ReadOnlyField(source='project.title')
    is_helpful = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = [
            'id', 'project', 'project_title', 'reviewer_name', 'reviewer_picture', 'rating',
            'title', 'body', 'is_approved', 'is_verified_purchase',
            'developer_response', 'developer_response_at', 'helpful_count',
            'is_helpful', 'created_at',
        ]
        read_only_fields = [
            'id', 'project_title', 'reviewer_name', 'is_approved', 'is_verified_purchase',
            'developer_response', 'developer_response_at', 'helpful_count', 'created_at',
        ]

    def get_is_helpful(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.helpful_votes.filter(user=request.user).exists()
        return False

    def create(self, validated_data):
        validated_data['reviewer'] = self.context['request'].user
        return super().create(validated_data)


class DeveloperResponseSerializer(serializers.Serializer):
    response = serializers.CharField()
