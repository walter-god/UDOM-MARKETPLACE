from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User, UserProfile, AuditLog


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['github_url', 'linkedin_url', 'portfolio_url', 'skills', 'year_of_study']


class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    full_name = serializers.ReadOnlyField()
    is_locked = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'registration_number', 'staff_id', 'role', 'department', 'bio',
            'profile_picture', 'phone_number', 'is_verified',
            'two_factor_enabled', 'failed_login_attempts', 'lockout_until',
            'is_locked', 'date_joined', 'profile',
        ]
        read_only_fields = ['id', 'email', 'date_joined', 'is_verified', 'failed_login_attempts', 'lockout_until']

    def get_is_locked(self, obj):
        from django.utils import timezone
        return bool(obj.lockout_until and obj.lockout_until > timezone.now())


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            'email', 'first_name', 'last_name', 'password', 'password_confirm',
            'registration_number', 'staff_id', 'role', 'department', 'phone_number',
        ]

    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({'password': 'Passwords do not match.'})
        if data.get('role') == 'lecturer':
            if not data.get('staff_id', '').strip():
                raise serializers.ValidationError({'staff_id': 'Staff ID is required for lecturer registration.'})
            email = data.get('email', '')
            if not email.lower().endswith('@udom.ac.tz'):
                raise serializers.ValidationError(
                    {'email': 'Lecturers must register with an official UDOM email address (@udom.ac.tz).'}
                )
        return data

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        validated_data['email'] = validated_data['email'].lower()
        if not validated_data.get('registration_number'):
            validated_data['registration_number'] = None
        if not validated_data.get('staff_id'):
            validated_data['staff_id'] = None
        user = User.objects.create_user(**validated_data)
        UserProfile.objects.create(user=user)
        return user


MAX_LOGIN_ATTEMPTS = 5
LOCKOUT_DURATION_MINUTES = 30


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        from django.utils import timezone
        from datetime import timedelta

        email = data['email'].lower()

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError('Invalid credentials.')

        # Check lockout
        if user.lockout_until and user.lockout_until > timezone.now():
            remaining = (user.lockout_until - timezone.now()).seconds // 60 + 1
            raise serializers.ValidationError(
                f'Account locked due to too many failed attempts. Try again in {remaining} minute(s).'
            )

        # Reset expired lockout
        if user.lockout_until and user.lockout_until <= timezone.now():
            user.failed_login_attempts = 0
            user.lockout_until = None

        if not user.is_active:
            raise serializers.ValidationError('Account is disabled.')

        authenticated = authenticate(username=email, password=data['password'])
        if not authenticated:
            user.failed_login_attempts += 1
            if user.failed_login_attempts >= MAX_LOGIN_ATTEMPTS:
                user.lockout_until = timezone.now() + timedelta(minutes=LOCKOUT_DURATION_MINUTES)
                user.save(update_fields=['failed_login_attempts', 'lockout_until'])
                raise serializers.ValidationError(
                    f'Account locked after {MAX_LOGIN_ATTEMPTS} failed attempts. Try again in {LOCKOUT_DURATION_MINUTES} minutes.'
                )
            user.save(update_fields=['failed_login_attempts'])
            attempts_left = MAX_LOGIN_ATTEMPTS - user.failed_login_attempts
            raise serializers.ValidationError(
                f'Invalid credentials. {attempts_left} attempt(s) remaining before lockout.'
            )

        # Successful login — reset counter
        user.failed_login_attempts = 0
        user.lockout_until = None
        user.save(update_fields=['failed_login_attempts', 'lockout_until'])

        data['user'] = authenticated
        return data


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)
    new_password_confirm = serializers.CharField(write_only=True)

    def validate(self, data):
        if data['new_password'] != data['new_password_confirm']:
            raise serializers.ValidationError({'new_password': 'Passwords do not match.'})
        return data


class AuditLogSerializer(serializers.ModelSerializer):
    user_email = serializers.ReadOnlyField(source='user.email')

    class Meta:
        model = AuditLog
        fields = ['id', 'user_email', 'action', 'description', 'ip_address', 'timestamp']


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        return value.lower()


class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True, min_length=8)
    new_password_confirm = serializers.CharField(write_only=True)

    def validate(self, data):
        if data['new_password'] != data['new_password_confirm']:
            raise serializers.ValidationError({'new_password': 'Passwords do not match.'})
        return data
