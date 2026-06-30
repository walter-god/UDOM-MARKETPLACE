#!/bin/sh
python manage.py migrate --noinput

# Create superuser using Python script for reliable custom user model support
python manage.py shell << 'EOF'
import os
from users.models import User

email = os.environ.get('DJANGO_SUPERUSER_EMAIL', 'admin@udom.ac.tz')
password = os.environ.get('DJANGO_SUPERUSER_PASSWORD', '')
first_name = os.environ.get('DJANGO_SUPERUSER_FIRST_NAME', 'Admin')
last_name = os.environ.get('DJANGO_SUPERUSER_LAST_NAME', 'User')

if password and not User.objects.filter(email=email).exists():
    User.objects.create_superuser(
        email=email,
        password=password,
        first_name=first_name,
        last_name=last_name,
    )
    print(f'Superuser {email} created.')
else:
    print(f'Superuser {email} already exists or no password set.')
EOF

exec gunicorn core.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers 2 --timeout 120
