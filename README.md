# UDOM Marketplace SaaS System

A centralized SaaS-based digital marketplace platform for storing, managing, subscribing to, and accessing student-developed software applications and digital services at the University of Dodoma (UDOM).

## Tech Stack
- **Backend**: Django 6 + Django REST Framework + PostgreSQL
- **Frontend**: React 18 + Vite + Tailwind CSS
- **Auth**: JWT (Simple JWT)
- **Payments**: Stripe integration
- **Task Queue**: Celery + Redis

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 16

### Backend Setup
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # Edit with your settings
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env  # Edit VITE_API_URL
npm run dev
```

### Docker (Full Stack)
```bash
docker-compose up --build
```

## Default Admin Credentials
- **Email**: admin@udom.ac.tz
- **Password**: Admin@1234

## API Documentation
- Swagger UI: http://localhost:8000/api/docs/
- ReDoc: http://localhost:8000/api/redoc/

## System Modules
1. **User Authentication** - JWT auth, roles (Student/Developer/Lecturer/Admin/External)
2. **Subscription Management** - Free/Student/Premium/Institutional plans
3. **Payment Gateway** - Stripe integration, transaction history, invoices
4. **Marketplace** - Project browsing, filtering, download
5. **Project Repository** - Upload, review workflow, file management
6. **Reviews & Ratings** - Community reviews, developer responses
7. **Analytics Dashboard** - Admin and developer dashboards
8. **Notifications** - In-app notifications, announcements
9. **Admin Management** - User management, project approval, analytics
