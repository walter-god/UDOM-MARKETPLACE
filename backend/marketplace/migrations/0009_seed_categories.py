from django.db import migrations
import uuid


CATEGORIES = [
    {"name": "Web Development", "slug": "web-development", "icon": "🌐", "description": "Web applications and websites"},
    {"name": "Mobile Development", "slug": "mobile-development", "icon": "📱", "description": "Android and iOS applications"},
    {"name": "Machine Learning & AI", "slug": "machine-learning-ai", "icon": "🤖", "description": "AI, ML, and data science projects"},
    {"name": "Data Science", "slug": "data-science", "icon": "📊", "description": "Data analysis and visualization"},
    {"name": "Desktop Applications", "slug": "desktop-applications", "icon": "💻", "description": "Desktop software and tools"},
    {"name": "Database Systems", "slug": "database-systems", "icon": "🗄️", "description": "Database design and management systems"},
    {"name": "Networking & Security", "slug": "networking-security", "icon": "🔒", "description": "Network systems and cybersecurity"},
    {"name": "IoT & Embedded Systems", "slug": "iot-embedded", "icon": "⚙️", "description": "Internet of Things and embedded systems"},
    {"name": "Game Development", "slug": "game-development", "icon": "🎮", "description": "Games and interactive applications"},
    {"name": "Business Systems", "slug": "business-systems", "icon": "📈", "description": "ERP, CRM and business management systems"},
    {"name": "E-Commerce", "slug": "e-commerce", "icon": "🛒", "description": "Online shopping and payment systems"},
    {"name": "Education Technology", "slug": "education-technology", "icon": "🎓", "description": "E-learning and educational tools"},
    {"name": "Healthcare Systems", "slug": "healthcare-systems", "icon": "🏥", "description": "Medical and health management systems"},
    {"name": "Other", "slug": "other", "icon": "📁", "description": "Other project types"},
]


def seed_categories(apps, schema_editor):
    Category = apps.get_model('marketplace', 'Category')
    for cat in CATEGORIES:
        Category.objects.get_or_create(
            slug=cat['slug'],
            defaults={
                'id': uuid.uuid4(),
                'name': cat['name'],
                'icon': cat['icon'],
                'description': cat['description'],
            }
        )


def remove_categories(apps, schema_editor):
    Category = apps.get_model('marketplace', 'Category')
    Category.objects.filter(slug__in=[c['slug'] for c in CATEGORIES]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('marketplace', '0008_project_subscription_expiry'),
    ]

    operations = [
        migrations.RunPython(seed_categories, remove_categories),
    ]
