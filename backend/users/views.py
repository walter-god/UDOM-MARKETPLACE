from rest_framework import generics, status, permissions, serializers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import logout
from .models import User, AuditLog
from .serializers import (
    UserSerializer, RegisterSerializer, LoginSerializer,
    ChangePasswordSerializer, AuditLogSerializer, UserProfileSerializer,
    PasswordResetRequestSerializer, PasswordResetConfirmSerializer,
)
from .permissions import IsAdminUser, IsOwnerOrAdmin


def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0]
    return request.META.get('REMOTE_ADDR')


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        AuditLog.objects.create(
            user=user, action=AuditLog.ActionType.LOGIN,
            description='New account registered',
            ip_address=get_client_ip(request),
        )
        return Response({
            'user': UserSerializer(user).data,
            'tokens': {'access': str(refresh.access_token), 'refresh': str(refresh)},
        }, status=status.HTTP_201_CREATED)


class LoginView(generics.GenericAPIView):
    serializer_class = LoginSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            # Log failed attempt if user exists
            email = request.data.get('email', '').lower()
            user_qs = User.objects.filter(email=email)
            if user_qs.exists():
                AuditLog.objects.create(
                    user=user_qs.first(),
                    action=AuditLog.ActionType.FAILED_LOGIN,
                    description='Failed login attempt',
                    ip_address=get_client_ip(request),
                )
            raise serializers.ValidationError(serializer.errors)
        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)
        AuditLog.objects.create(
            user=user, action=AuditLog.ActionType.LOGIN,
            description='User logged in',
            ip_address=get_client_ip(request),
        )
        return Response({
            'user': UserSerializer(user).data,
            'tokens': {'access': str(refresh.access_token), 'refresh': str(refresh)},
        })


class LogoutView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            AuditLog.objects.create(
                user=request.user, action=AuditLog.ActionType.LOGOUT,
                description='User logged out',
                ip_address=get_client_ip(request),
            )
        except Exception:
            pass
        return Response({'detail': 'Successfully logged out.'})


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        response = super().update(request, *args, **kwargs)
        AuditLog.objects.create(
            user=request.user, action=AuditLog.ActionType.PROFILE_UPDATE,
            description='Profile updated',
            ip_address=get_client_ip(request),
        )
        return response


class ChangePasswordView(generics.GenericAPIView):
    serializer_class = ChangePasswordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user
        if not user.check_password(serializer.validated_data['old_password']):
            return Response({'old_password': 'Wrong password.'}, status=status.HTTP_400_BAD_REQUEST)
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        AuditLog.objects.create(
            user=user, action=AuditLog.ActionType.PASSWORD_CHANGE,
            description='Password changed',
            ip_address=get_client_ip(request),
        )
        return Response({'detail': 'Password changed successfully.'})


class UserListView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]
    queryset = User.objects.all()
    search_fields = ['email', 'first_name', 'last_name', 'registration_number']
    filterset_fields = ['role', 'is_active', 'is_verified']


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]
    queryset = User.objects.all()

    def destroy(self, request, *args, **kwargs):
        user = self.get_object()
        if user == request.user:
            from rest_framework.response import Response
            from rest_framework import status
            return Response({'detail': 'You cannot delete your own account.'},
                            status=status.HTTP_400_BAD_REQUEST)
        return super().destroy(request, *args, **kwargs)


class AuditLogListView(generics.ListAPIView):
    serializer_class = AuditLogSerializer
    permission_classes = [IsAdminUser]
    queryset = AuditLog.objects.all()
    filterset_fields = ['action', 'user']


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def me(request):
    return Response(UserSerializer(request.user).data)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def unlock_user(request, pk):
    try:
        user = User.objects.get(pk=pk)
    except User.DoesNotExist:
        return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
    user.failed_login_attempts = 0
    user.lockout_until = None
    user.save(update_fields=['failed_login_attempts', 'lockout_until'])
    AuditLog.objects.create(
        user=request.user,
        action=AuditLog.ActionType.ADMIN_ACTION,
        description=f'Unlocked account for {user.email}',
    )
    return Response({'detail': 'Account unlocked.'})


@api_view(['POST'])
@permission_classes([IsAdminUser])
def toggle_user_active(request, pk):
    try:
        user = User.objects.get(pk=pk)
        if user == request.user:
            return Response({'detail': 'You cannot deactivate your own account.'}, status=status.HTTP_400_BAD_REQUEST)
        user.is_active = not user.is_active
        user.save()
        AuditLog.objects.create(
            user=request.user, action=AuditLog.ActionType.ADMIN_ACTION,
            description=f'User {user.email} {"activated" if user.is_active else "deactivated"}',
        )
        return Response({'is_active': user.is_active})
    except User.DoesNotExist:
        return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)


class PasswordResetRequestView(generics.GenericAPIView):
    serializer_class = PasswordResetRequestSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        from django.contrib.auth.tokens import PasswordResetTokenGenerator
        from django.utils.encoding import force_bytes
        from django.utils.http import urlsafe_base64_encode
        from django.core.mail import send_mail
        from django.conf import settings

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']

        try:
            user = User.objects.get(email=email, is_active=True)
        except User.DoesNotExist:
            # Always return success to prevent email enumeration
            return Response({'detail': 'If that email exists, a reset link has been sent.'})

        token = PasswordResetTokenGenerator().make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        reset_url = f"{settings.FRONTEND_URL}/reset-password/{uid}/{token}/"

        send_mail(
            subject='Reset your UDOM Marketplace password',
            message=(
                f'Hi {user.first_name},\n\n'
                f'Click the link below to reset your password. This link expires in 1 hour.\n\n'
                f'{reset_url}\n\n'
                f'If you did not request a password reset, ignore this email.\n\n'
                f'UDOM Marketplace'
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )

        AuditLog.objects.create(
            user=user,
            action=AuditLog.ActionType.PASSWORD_CHANGE,
            description='Password reset requested',
            ip_address=get_client_ip(request),
        )

        return Response({'detail': 'If that email exists, a reset link has been sent.'})


class PasswordResetConfirmView(generics.GenericAPIView):
    serializer_class = PasswordResetConfirmSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        from django.contrib.auth.tokens import PasswordResetTokenGenerator
        from django.utils.encoding import force_str
        from django.utils.http import urlsafe_base64_decode

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            uid = force_str(urlsafe_base64_decode(serializer.validated_data['uid']))
            user = User.objects.get(pk=uid)
        except (User.DoesNotExist, ValueError, TypeError):
            return Response({'detail': 'Invalid reset link.'}, status=status.HTTP_400_BAD_REQUEST)

        if not PasswordResetTokenGenerator().check_token(user, serializer.validated_data['token']):
            return Response({'detail': 'Reset link is invalid or has expired.'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(serializer.validated_data['new_password'])
        user.failed_login_attempts = 0
        user.lockout_until = None
        user.save()

        AuditLog.objects.create(
            user=user,
            action=AuditLog.ActionType.PASSWORD_CHANGE,
            description='Password reset completed',
            ip_address=get_client_ip(request),
        )

        return Response({'detail': 'Password has been reset successfully.'})
