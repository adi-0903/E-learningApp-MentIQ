<div align="center">

# 🎓 MentiQ — E-Learning Platform

### *Intelligent Learning. Anywhere. Anytime.*

[![Django](https://img.shields.io/badge/Django-5.x-0C4B33?style=for-the-badge&logo=django&logoColor=white)](https://www.djangoproject.com/)
[![React Native](https://img.shields.io/badge/React_Native-0.81-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-54-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

---

**MentiQ** is a full-stack, cross-platform e-learning platform built as a Capstone Project. It connects teachers and students through structured courses, live sessions, AI-powered tutoring, quizzes, analytics, and real-time notifications — all delivered through a polished React Native (Expo) mobile app and a React Web frontend, backed by a production-grade Django REST API.

</div>

---

## 📑 Table of Contents

1. [Project Overview](#-project-overview)
2. [Key Features](#-key-features)
3. [Tech Stack](#-tech-stack)
4. [System Architecture](#-system-architecture)
5. [Project Structure](#-project-structure)
6. [Backend — Deep Dive](#-backend--deep-dive)
   - [Apps / Modules](#apps--modules)
   - [Authentication & Security](#authentication--security)
   - [Database Models](#database-models)
   - [API Endpoints Reference](#api-endpoints-reference)
   - [Background Tasks (Celery)](#background-tasks-celery)
   - [AI Tutor — Qbit](#ai-tutor--qbit)
7. [Frontend — Deep Dive](#-frontend--deep-dive)
   - [Screens & Navigation](#screens--navigation)
   - [State Management (Zustand)](#state-management-zustand)
   - [Central API Service](#central-api-service)
   - [Key Components](#key-components)
8. [Third-Party Integrations](#-third-party-integrations)
9. [Environment Variables](#-environment-variables)
10. [Getting Started](#-getting-started)
    - [Prerequisites](#prerequisites)
    - [Backend Setup](#backend-setup)
    - [Frontend Setup](#frontend-setup)
11. [Running the Application](#-running-the-application)
12. [API Documentation](#-api-documentation)
13. [User Roles & Permissions](#-user-roles--permissions)
14. [Screenshots / Features Walkthrough](#-features-walkthrough)
15. [Contributing](#-contributing)

---

## 🌟 Project Overview

MentiQ is designed to be a comprehensive learning management system (LMS) tailor-made for mobile-first users. The platform supports two primary user roles:

- **Teachers** — Create and manage courses, lessons, video lectures, quizzes, live classes, and announcements.
- **Students** — Enroll in courses, consume lessons and videos, attend live classes, attempt quizzes, and interact with the AI study companion "Qbit."

The project demonstrates end-to-end full-stack engineering: a RESTful Django backend with JWT auth, background tasks via Celery/Redis, cloud media storage via Cloudinary, push notifications via Firebase, payments via Stripe, and a sleek React Native Expo mobile app.

---

## ✨ Key Features

### 🧑‍🎓 For Students

| Feature | Description |
|---|---|
| **Personalized Dashboard** | Enrolled courses, recent activity, progress stats at a glance |
| **Course Browser** | Browse all published courses with category and level filters |
| **Video Lectures** | Stream recorded video lectures directly in-app |
| **Lesson Reader** | Structured text/content lessons with completion tracking |
| **Progress Tracking** | Per-course lesson completion and overall progress percentage |
| **Quiz System** | Timed quizzes with MCQs, instant grading, detailed per-question analysis |
| **Live Classes** | Join scheduled live sessions via integrated Jitsi Meet |
| **AI Tutor (Qbit)** | Ask study questions, get AI-generated quizzes, flashcards & study plans |
| **Announcements** | Receive course-specific and global announcements from teachers |
| **Push Notifications** | FCM-powered real-time notifications for live classes, quizzes, announcements |
| **Profile Management** | Edit profile, upload avatar, verify phone with OTP (Firebase), change password |
| **Biometric Security** | Fingerprint / Face ID login via `expo-local-authentication` |

### 🧑‍🏫 For Teachers

| Feature | Description |
|---|---|
| **Teacher Dashboard** | Overview of total students, published courses, revenue, and quick actions |
| **Course Management** | Create, edit, publish/unpublish courses with cover images and pricing |
| **Lesson Management** | Add text-content lessons, sequence/reorder them per course |
| **Video Lecture Management** | Upload and attach video lectures with Cloudinary storage |
| **Quiz Builder** | Create quizzes with MCQ questions, correct answer keys, and explanations |
| **Live Class Scheduling** | Schedule, start, end Jitsi-powered live classes with participant tracking |
| **Announcement System** | Post rich announcements with file attachments and priority flags |
| **Student Progress Monitoring** | View individual student progress, quiz scores, and lesson completion |
| **Analytics** | Per-course views, enrollments, completions, average quiz scores, and revenue |

### 🤖 AI Tutor — Qbit

| Capability | Description |
|---|---|
| **Chat Q&A** | Ask subject-related questions with lesson context injected automatically |
| **Quiz Generator** | Generate 5-question MCQ quizzes from any lesson content or custom topic |
| **Flashcard Generator** | Create 10 study flashcards (front/back) for any topic |
| **Study Plan Generator** | Get a detailed, day-by-day, hour-by-hour study plan based on exam date and available hours |
| **Image Upload Support** | Attach images alongside questions for richer context |

---

## 🛠 Tech Stack

### Backend

| Technology | Version | Purpose |
|---|---|---|
| **Python** | 3.11+ | Core language |
| **Django** | 5.x | Web framework |
| **Django REST Framework** | 3.14+ | REST API layer |
| **PostgreSQL** | 16 | Primary database |
| **Redis** | 7 | Caching & Celery broker |
| **Celery** | 5.3+ | Async background task queue |
| **Celery Beat** | 2.6+ | Periodic task scheduler |
| **Simple JWT** | 5.3+ | JWT access & refresh tokens |
| **drf-spectacular** | 0.27 | OpenAPI/Swagger documentation |
| **Cloudinary** | 1.36+ | Cloud media/image storage |
| **Firebase Admin SDK** | 6.4+ | Push notifications & OTP |
| **Stripe** | 8.x | Payment processing |
| **Gmail / EmailJS** | — | Core email system (SMTP/IMAP) & contact forms |
| **Twilio** | 9.x | SMS OTP (alternate) |
| **Gunicorn** | 21.x | WSGI production server |
| **Whitenoise** | 6.6+ | Static file serving |
| **Sentry** | 1.40+ | Error monitoring |
| **Groq API** | — | AI model provider for Qbit |

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| **React Native** | 0.81.5 | Cross-platform mobile framework |
| **Expo SDK** | 54 | Build toolchain & native APIs |
| **Expo Router** | 6.x | File-based navigation |
| **TypeScript** | 5.9 | Type-safe development |
| **Zustand** | 4.4 | Lightweight global state management |
| **React Navigation** | 7.x | Navigation stacks & bottom tabs |
| **Expo AV / Video** | 16/3 | Audio/video playback |
| **Expo Image Picker** | 17 | Gallery & camera access |
| **Expo Print / Sharing** | 15/14 | PDF generation & file sharing |
| **Firebase SDK** | 12.x | Phone OTP verification |
| **Expo Linear Gradient** | 15 | UI gradient backgrounds |
| **React Native Reanimated** | 4.1 | Smooth animations |
| **React Native Paper** | 5.12 | Material Design components |
| **React Native Markdown Display** | 7.x | Render AI markdown responses |
| **AsyncStorage** | 2.x | Persistent token storage |
| **date-fns** | 2.30 | Date formatting utilities |

---

## 🏗 System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                                  │
│   ┌─────────────────────────────────────────┐ ┌──────────────────┐  │
│   │ React Native + Expo (iOS/Android/Web)   │ │  React Web App   │  │
│   │ Expo Router · Zustand · Firebase SDK    │ │   Vite · Roles   │  │
│   └─────────────────────────────────────────┘ └──────────────────┘  │
│                              │ HTTPS / REST                          │
└──────────────────────────────┼──────────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────────┐
│                        API GATEWAY LAYER                             │
│   ┌──────────────────────────────────────────────────────────────┐  │
│   │  Django REST Framework · JWT Auth · CORS · Rate Limiting     │  │
│   │  drf-spectacular (Swagger/ReDoc) · Custom Exception Handler  │  │
│   └──────────────────────────────────────────────────────────────┘  │
│                     │                    │                           │
│         ┌───────────▼──────┐  ┌──────────▼──────────┐              │
│         │  Business Logic   │  │  Background Workers  │              │
│         │  Django Apps (14) │  │  Celery + Celery Beat│              │
│         └───────────┬───────┘  └──────────┬───────────┘              │
│                     │                     │                           │
└─────────────────────┼─────────────────────┼───────────────────────  ┘
                      │                     │
        ┌─────────────▼─────┐     ┌─────────▼──────┐
        │    PostgreSQL DB   │     │    Redis Cache  │
        │  (Primary Store)   │     │  (Task Broker) │
        └───────────────────┘     └────────────────┘
                      │
        ┌─────────────▼──────────────────────────────────┐
        │          External Services                      │
        │  Cloudinary · Firebase FCM · Stripe · SendGrid  │
        │  Twilio · Groq AI · Jitsi Meet · Sentry         │
        └────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
Capstone Project/
├── backend/                        # Django REST API
│   ├── config/                     # Core Django configuration
│   │   ├── settings.py             # All settings (DB, JWT, Celery, etc.)
│   │   ├── urls.py                 # Root URL routing (API v1)
│   │   ├── celery.py               # Celery app configuration
│   │   ├── asgi.py                 # ASGI entrypoint
│   │   └── wsgi.py                 # WSGI entrypoint
│   ├── apps/                       # Django application modules
│   │   ├── core/                   # Shared base models, middleware, exceptions
│   │   ├── users/                  # Auth, registration, profile, OTP
│   │   ├── students/               # Student-specific dashboard & views
│   │   ├── teachers/               # Teacher-specific dashboard & views
│   │   ├── courses/                # Course CRUD, reviews
│   │   ├── lessons/                # Lesson CRUD, content
│   │   ├── quizzes/                # Quiz, questions, attempts
│   │   ├── enrollments/            # Enroll/unenroll, status
│   │   ├── progress/               # Lesson completion, course progress %
│   │   ├── live_classes/           # Live sessions, participants, chat
│   │   ├── announcements/          # Teacher announcements with attachments
│   │   ├── notifications/          # In-app & push notifications + settings
│   │   ├── payments/               # Stripe checkout, payment history
│   │   ├── analytics/              # Daily snapshots, course & user activity
│   │   ├── media/                  # Media file upload & management
│   │   ├── emails/                 # Email logging, IMAP inbox, Contact form
│   │   └── ai_tutor/               # Qbit AI: chat, quiz gen, flashcards, plans
│   ├── media/                      # Local media uploads (dev)
│   ├── static/                     # Static assets
│   ├── logs/                       # Rotating log files
│   ├── requirements.txt            # Python dependencies
│   ├── .env.example                # Environment variable template
│   └── manage.py                   # Django management script
│
└── frontend/                       # React Native Expo App
    ├── app/                        # Expo Router file-based navigation
    │   ├── (tabs)/                 # Bottom tab navigator
    │   ├── (student)/              # Student-specific route group
    │   ├── (teacher)/              # Teacher-specific route group
    │   ├── screens/                # All screen components
    │   │   ├── auth/               # Login, Signup, Onboarding
    │   │   ├── student/            # Student feature screens
    │   │   │   └── ai-center/      # Qbit AI Hub (single large screen)
    │   │   ├── teacher/            # Teacher feature screens
    │   │   └── shared/             # Screens used by both roles
    │   ├── MainApp.tsx             # Root screen dispatcher (role routing)
    │   └── index.tsx               # Entry redirect
    ├── components/                 # Reusable UI components
    │   ├── LoginScreen.tsx
    │   ├── SignupScreen.tsx
    │   ├── StudentDashboard.tsx
    │   ├── TeacherDashboard.tsx
    │   ├── OnboardingScreen.tsx
    │   ├── UsageTracker.tsx
    │   ├── ai/                     # AI-related components
    │   └── ui/                     # Generic UI primitives
    ├── services/                   # API layer
    │   ├── api.ts                  # Central API client (JWT, refresh, all endpoints)
    │   ├── ai.service.ts           # AI-specific API calls
    │   ├── firebase.ts             # Firebase SDK initialization
    │   ├── mediaUpload.ts          # File/media upload helpers
    │   └── videoStreamingService.ts# Jitsi Meet integration helpers
    ├── store/                      # Zustand global state stores
    │   ├── authStore.ts            # Auth tokens, user profile
    │   ├── courseStore.ts          # Course lists
    │   ├── quizStore.ts            # Quiz state
    │   ├── liveClassStore.ts       # Live class state
    │   ├── announcementStore.ts    # Announcements
    │   ├── notificationStore.ts    # Notification list & unread count
    │   ├── progressStore.ts        # Student progress
    │   ├── videoStreamStore.ts     # Video stream state
    │   └── liveClassChatStore.ts   # In-room chat messages
    ├── constants/                  # App-wide constants (colors, fonts, etc.)
    ├── hooks/                      # Custom React hooks
    ├── assets/                     # Images, icons, splash screen
    ├── app.json                    # Expo app configuration (version, permissions)
    ├── eas.json                    # EAS Build configuration
    ├── package.json                # JS dependencies
    └── tsconfig.json               # TypeScript compiler config
│
└── frontendweb/                    # Vite React Web Frontend
    ├── src/                        # React source files for web interfaces
    ├── public/                     # Static web assets
    ├── index.html                  # HTML entry point
    └── package.json                # Web JS dependencies
```

---

## 🔧 Backend — Deep Dive

### Apps / Modules

The backend is organized into **14 Django apps**, each responsible for a clearly bounded domain:

| App | Responsibility |
|---|---|
| `core` | Base abstract models (`TimeStampedModel`, `SoftDeleteModel`), custom exception handler, request logging middleware, `HealthCheckView` |
| `users` | `User` model (email-auth, roles), Registration, Login, JWT Logout, Profile CRUD, Phone OTP, FCM Token update |
| `students` | Student dashboard aggregation, enrolled course listing, progress summary, quiz history |
| `teachers` | Teacher dashboard aggregation, course/student oversight, per-student detail view |
| `courses` | `Course` CRUD, `CourseReview`, publishing/un-publishing, cover image upload |
| `lessons` | `Lesson` CRUD per course, content, video URL, sequence ordering, reorder endpoint |
| `quizzes` | `Quiz` + `QuizQuestion` management, student attempt submission, scoring, daily attempt limits |
| `enrollments` | Enroll/unenroll students, enrollment status check, active enrollment tracking |
| `progress` | Lesson completion marking, course progress percentage calculation |
| `live_classes` | `LiveClass` scheduling (Jitsi), start/end/join/leave, participant tracking, in-class chat |
| `announcements` | Teacher announcements with priority (low/normal/high/urgent), file attachments, pinning |
| `notifications` | In-app `Notification` model, FCM push dispatch, per-user `NotificationSetting` preferences |
| `payments` | Stripe checkout session creation, webhook handling, payment history |
| `analytics` | `DailyAnalytics`, `CourseAnalytics`, `UserActivityLog` snapshots; platform-wide stats |
| `media` | Media file upload (Cloudinary), listing, deletion |
| `emails` | System email logs, bulk campaigns, contact us messages, and IMAP inbox viewer |
| `ai_tutor` | **Qbit** AI service: chat, AI quiz generation, flashcards, study plan generation (Groq API) |

---

### Authentication & Security

MentiQ uses **email-based authentication** with JWT tokens powered by `djangorestframework-simplejwt`:

```
POST /api/v1/auth/register/  →  Create account (student or teacher)
POST /api/v1/auth/login/     →  Returns { access, refresh } JWT pair
POST /api/v1/auth/logout/    →  Blacklists the refresh token
POST /api/v1/auth/token/refresh/ → Returns new access token
```

**Token Lifecycle:**

- `Access Token` — Short-lived (60 min default), sent as `Authorization: Bearer <token>`
- `Refresh Token` — Long-lived (24 hours default), rotated on every refresh
- `Token Blacklist` — Refresh tokens are blacklisted on logout (via `rest_framework_simplejwt.token_blacklist`)

**Additional Security:**

- Custom user IDs: Teachers get 5-digit numeric IDs; students get 8-digit IDs prefixed with enrollment year
- Phone OTP verification: Firebase Auth integration for phone number verification
- Biometric unlock: `expo-local-authentication` for fingerprint/Face ID on the mobile app
- Rate Limiting: Anonymous users — `100/hour`; Authenticated — `1,000/hour`
- Production hardening: HSTS, SSL redirect, secure cookies, XSS filter, CSP-ready

---

### Database Models

#### Users (`apps/users`)

```
User
├── email (unique, pk field)
├── name
├── role: student | teacher | admin
├── bio, profile_image, profile_avatar, phone_number
├── is_email_verified, is_phone_verified
├── fcm_token (for push notifications)
├── teacher_id (5-digit, auto-generated)
├── student_id (8-digit, year-prefixed, auto-generated)
└── last_login_ip

PhoneOTP
├── user → User
├── otp_code
├── is_used
└── expires_at
```

#### Courses (`apps/courses`)

```
Course
├── teacher → User
├── title, description, category, level
├── cover_image (Cloudinary)
├── duration, is_published, is_featured
├── is_free, price
└── [SoftDelete: deleted_at]

CourseReview
├── course → Course
├── student → User
├── rating (1–5)
└── comment
```

#### Lessons (`apps/lessons`)

```
Lesson
├── course → Course
├── title, description, content (rich text)
├── video_url, file_url
├── sequence_number
└── duration (minutes)
```

#### Quizzes (`apps/quizzes`)

```
Quiz
├── course → Course
├── title, description
├── duration (minutes), passing_score (%)
├── max_attempts (0 = unlimited)
└── is_published

QuizQuestion
├── quiz → Quiz
├── question_text
├── option_a, option_b, option_c, option_d
├── correct_answer (a|b|c|d)
├── sequence_number
└── explanation

QuizAttempt
├── quiz → Quiz
├── student → User
├── score, total_questions
├── answers (JSONField: {question_id: selected_answer})
├── time_taken (seconds)
└── percentage / passed (computed properties)
```

#### Live Classes (`apps/live_classes`)

```
LiveClass
├── teacher → User, course → Course
├── title, description
├── scheduled_at, started_at, ended_at
├── status: scheduled | live | ended | cancelled
├── channel_name (unique, Jitsi room identifier)
├── max_participants, recording_url
└── jitsi_room_url (property)

LiveClassParticipant
├── live_class → LiveClass
├── user → User
├── joined_at, left_at

LiveClassChat
├── live_class → LiveClass
├── user → User
└── message, timestamp
```

#### Announcements (`apps/announcements`)

```
Announcement
├── teacher → User
├── course → Course (null = global)
├── title, content
├── priority: low | normal | high | urgent
├── is_pinned
└── attachment (file upload)
```

#### Notifications (`apps/notifications`)

```
Notification
├── user → User
├── title, body
├── notification_type: announcement | quiz | live_class | enrollment | progress | system
├── is_read
└── data (JSONField: {course_id, quiz_id, etc.})

NotificationSetting
├── user → User (OneToOne)
├── announcements, assignments, quizzes, courses, general (bool)
└── sound, vibration, email_notifications (bool)
```

#### Payments (`apps/payments`)

```
Payment
├── student → User, course → Course
├── amount, currency
├── status: pending | completed | failed | refunded | cancelled
├── payment_method: stripe | free
├── stripe_payment_intent_id, stripe_charge_id
└── receipt_url, refund_reason
```

#### Analytics (`apps/analytics`)

```
DailyAnalytics     - Platform-wide daily snapshots
CourseAnalytics    - Per-course daily snapshots (views, enrollments, completions, revenue)
UserActivityLog    - User session duration tracking
```

---

### API Endpoints Reference

All endpoints are versioned under `/api/v1/`. Full interactive docs available at `/api/docs/` (Swagger UI).

```
# HEALTH
GET  /api/health/                          → System health status

# AUTH
POST /api/v1/auth/register/                → Register new user
POST /api/v1/auth/login/                   → Obtain JWT token pair
POST /api/v1/auth/logout/                  → Blacklist refresh token
POST /api/v1/auth/token/refresh/           → Refresh access token
GET  /api/v1/auth/profile/                 → Get current user profile
PUT  /api/v1/auth/profile/                 → Update profile (incl. avatar)
POST /api/v1/auth/change-password/         → Change password
POST /api/v1/auth/fcm-token/               → Update Firebase push token
POST /api/v1/auth/request-phone-otp/       → Send phone OTP
POST /api/v1/auth/verify-phone-otp/        → Verify phone OTP

# STUDENTS
GET  /api/v1/students/dashboard/           → Student dashboard stats
GET  /api/v1/students/courses/             → Enrolled courses
GET  /api/v1/students/browse/              → Browse all published courses
GET  /api/v1/students/progress/            → Overall progress summary
GET  /api/v1/students/quiz-history/        → Past quiz attempts

# TEACHERS
GET  /api/v1/teachers/dashboard/           → Teacher dashboard stats
GET  /api/v1/teachers/courses/             → Teacher's courses
GET  /api/v1/teachers/students/            → All students in teacher's courses
GET  /api/v1/teachers/courses/{id}/students/ → Students per course
GET  /api/v1/teachers/students/{id}/       → Individual student detail

# COURSES
GET  /api/v1/courses/                      → List courses
POST /api/v1/courses/                      → Create course (teacher)
GET  /api/v1/courses/{id}/                 → Course detail
PUT  /api/v1/courses/{id}/                 → Update course
DEL  /api/v1/courses/{id}/                 → Delete course (soft)
GET  /api/v1/courses/{id}/reviews/         → Course reviews
POST /api/v1/courses/{id}/reviews/         → Submit review (student)

# LESSONS
GET  /api/v1/lessons/?course={id}          → List lessons for a course
POST /api/v1/lessons/                      → Create lesson
GET  /api/v1/lessons/{id}/                 → Lesson detail
PUT  /api/v1/lessons/{id}/                 → Update lesson
DEL  /api/v1/lessons/{id}/                 → Delete lesson
POST /api/v1/lessons/reorder/              → Reorder lesson sequence

# QUIZZES
GET  /api/v1/quizzes/?course={id}          → List quizzes
POST /api/v1/quizzes/                      → Create quiz (teacher)
GET  /api/v1/quizzes/{id}/                 → Quiz detail
PUT  /api/v1/quizzes/{id}/                 → Update quiz
DEL  /api/v1/quizzes/{id}/                 → Delete quiz
GET  /api/v1/quizzes/{id}/questions/       → List questions
POST /api/v1/quizzes/{id}/questions/       → Add question
POST /api/v1/quizzes/{id}/submit/          → Submit quiz attempt
GET  /api/v1/quizzes/{id}/attempts/        → Attempts for a quiz
GET  /api/v1/quizzes/attempts/all/         → All student attempts

# ENROLLMENTS
POST /api/v1/enrollments/enroll/           → Enroll in a course
POST /api/v1/enrollments/unenroll/         → Unenroll from a course
GET  /api/v1/enrollments/status/{courseId}/ → Enrollment status

# PROGRESS
POST /api/v1/progress/complete/            → Mark lesson as complete
GET  /api/v1/progress/course/{id}/         → Get course-level progress

# LIVE CLASSES
GET  /api/v1/live-classes/                 → List all live classes
POST /api/v1/live-classes/                 → Create live class (teacher)
GET  /api/v1/live-classes/{id}/            → Live class detail
PUT  /api/v1/live-classes/{id}/            → Update live class
DEL  /api/v1/live-classes/{id}/            → Delete live class
POST /api/v1/live-classes/{id}/start/      → Start session (teacher)
POST /api/v1/live-classes/{id}/end/        → End session (teacher)
POST /api/v1/live-classes/{id}/join/       → Join session (student)
POST /api/v1/live-classes/{id}/leave/      → Leave session
GET  /api/v1/live-classes/{id}/participants/ → List participants
GET  /api/v1/live-classes/{id}/chat/       → Fetch chat messages
POST /api/v1/live-classes/{id}/chat/       → Send chat message

# ANNOUNCEMENTS
GET  /api/v1/announcements/                → List announcements
POST /api/v1/announcements/                → Create announcement (multipart)
GET  /api/v1/announcements/{id}/           → Announcement detail
PUT  /api/v1/announcements/{id}/           → Update announcement
DEL  /api/v1/announcements/{id}/           → Delete announcement

# NOTIFICATIONS
GET  /api/v1/notifications/                → List notifications
GET  /api/v1/notifications/unread-count/   → Get unread notification count
POST /api/v1/notifications/{id}/read/      → Mark as read
POST /api/v1/notifications/mark-all-read/  → Mark all as read
GET  /api/v1/notifications/settings/       → Get notification preferences
PATCH /api/v1/notifications/settings/      → Update notification preferences

# PAYMENTS
POST /api/v1/payments/checkout/             → Create Stripe checkout session
GET  /api/v1/payments/history/              → Payment history

# ANALYTICS
GET  /api/v1/analytics/platform/            → Platform-wide stats
GET  /api/v1/analytics/platform/history/    → Historical analytics
GET  /api/v1/analytics/course/{id}/         → Per-course analytics
POST /api/v1/analytics/user-activity/       → Start activity session
PATCH /api/v1/analytics/user-activity/      → Update/end activity session
GET  /api/v1/analytics/user-activity/       → Activity logs

# MEDIA
GET  /api/v1/media/                         → List media files
POST /api/v1/media/upload/                  → Upload media file (multipart)
DEL  /api/v1/media/{id}/                    → Delete media file

# AI TUTOR (Qbit)
POST /api/v1/ai/ask/                        → Chat with Qbit (text + optional image)
POST /api/v1/ai/generate-quiz/              → AI-generate quiz from lesson/topic
POST /api/v1/ai/generate-flashcards/        → AI-generate flashcards for a topic
POST /api/v1/ai/generate-study-plan/        → AI-generate a study plan

# API DOCS
GET  /api/docs/                             → Swagger UI
GET  /api/redoc/                            → ReDoc UI
GET  /api/schema/                           → OpenAPI JSON Schema
```

---

### Background Tasks (Celery)

MentiQ uses **Celery** with **Redis** as the message broker for asynchronous operations:

- **Email notifications** — Async sending via SendGrid (login alerts, enrollment confirmations)
- **Push notifications** — Firebase FCM token dispatch via background tasks
- **Analytics snapshots** — Scheduled daily snapshots of platform-wide data via Celery Beat
- **Task monitoring** — Flower dashboard available for task inspection

```bash
# Start Celery worker
celery -A config worker --loglevel=info

# Start Celery Beat scheduler
celery -A config beat --loglevel=info

# Monitor tasks (Flower)
celery -A config flower
```

---

### AI Tutor — Qbit

**Qbit** is MentiQ's intelligent study companion, powered by the **Groq API** (ultra-fast LLM inference). The `QbitService` class in `apps/ai_tutor/services.py` implements:

- **Automatic model fallback**: Tries `llama-3.1-8b-instant` → `gemma2-9b-it` → `llama-3.3-70b-versatile` in sequence if a model is overloaded or unavailable.
- **Context injection**: For lesson-scoped questions, the lesson title and content are automatically prepended. For global questions, enrolled course titles form the context.
- **Personalization**: The student's name is always included in the context for personalized responses.
- **Structured output**: Quiz and flashcard endpoints instruct the model to return strict JSON arrays for reliable parsing.
- **Study plan**: The plan prompt enforces a detailed day-by-day, time-slot breakdown structure in Markdown.

```python
# AI endpoints payload examples
POST /api/v1/ai/ask/
{ "query": "Explain Newton's laws", "lesson_id": "uuid", "scope": "lesson" }

POST /api/v1/ai/generate-quiz/
{ "lesson_id": "uuid" }
# OR
{ "topic": "Photosynthesis" }

POST /api/v1/ai/generate-flashcards/
{ "topic": "Data Structures" }

POST /api/v1/ai/generate-study-plan/
{ "exam_date": "2026-04-15", "hours_per_day": 3, "subject": "Mathematics" }
```

---

## 📱 Frontend — Deep Dive

### Screens & Navigation

MentiQ uses **Expo Router's file-based navigation** (similar to Next.js) with nested route groups for role-based navigation.

#### Navigation Architecture

```
_layout.tsx (root)
└── index.tsx → MainApp.tsx (role dispatcher)
    ├── OnboardingScreen       (first launch)
    ├── LoginScreen
    ├── SignupScreen
    ├── StudentDashboard  ───── Student Tab Navigator
    │   ├── Home (StudentHomeScreen)
    │   ├── Courses (BrowseCoursesScreen / StudentVideoLecturesScreen)
    │   ├── Progress (StudentProgressScreen)
    │   ├── Quizzes (AllQuizzesScreen)
    │   ├── Live Classes (BrowseLiveClassesScreen / StudentLiveClassRoomScreen)
    │   ├── AI Center (Qbit: Chat, Quiz Gen, Flashcards, Study Plan, PDF Export)
    │   ├── Announcements
    │   ├── Profile (ProfileScreen)
    │   ├── Security (SecurityScreen)
    │   ├── Notifications (NotificationSettingsScreen)
    │   └── Course/Lesson Detail screens
    └── TeacherDashboard ────── Teacher Tab Navigator
        ├── Home (TeacherHomeScreen)
        ├── My Courses (MyCoursesScreen)
        ├── Manage Lessons (ManageLessonsScreen)
        ├── Manage Videos (ManageVideoLecturesScreen)
        ├── Manage Quizzes (ManageQuizzesScreen / CreateQuizScreen)
        ├── Live Classes (ManageLiveClassesScreen / LiveClassRoomScreen)
        ├── Announcements (CreateAnnouncementScreen)
        ├── Analytics (TeacherProgressScreen)
        ├── Student Detail (StudentDetailScreen)
        └── Profile (shared ProfileScreen)
```

#### Key Screens

| Screen | Role | Description |
|---|---|---|
| `MainApp.tsx` | Both | Root dispatcher — checks auth, extracts role from token, routes to correct dashboard |
| `OnboardingScreen.tsx` | — | First-launch multi-step introduction with swipe-through slides |
| `LoginScreen.tsx` | Both | Email/password login with biometric quick-login option |
| `SignupScreen.tsx` | Both | Role-selection registration (Student / Teacher) |
| `StudentDashboard.tsx` | Student | Stats overview (enrolled courses, progress %, quizzes done, upcoming live classes) |
| `TeacherDashboard.tsx` | Teacher | Stats overview (total courses, students, revenue, pending tasks) |
| `BrowseCoursesScreen.tsx` | Student | Filterable course catalog, enroll flow |
| `StudentVideoLecturesScreen.tsx` | Student | In-app video player (expo-video) for recorded lectures |
| `StudentProgressScreen.tsx` | Student | Per-course lesson completion rings and progress bars |
| `AllQuizzesScreen.tsx` | Student | Quiz catalog, attempt history per quiz |
| `QuizScreen.tsx` | Student | Timed MCQ quiz experience |
| `QuizResultScreen.tsx` | Student | Graded result with pass/fail, score %, re-attempt control |
| `QuizAnalysisScreen.tsx` | Student | Per-question breakdown with correct answers and explanations |
| `ai-center/index.tsx` | Student | Qbit hub — Chat, Quiz Generator, Flashcard Generator, Study Planner, PDF export |
| `BrowseLiveClassesScreen.tsx` | Student | Browse upcoming & live sessions |
| `StudentLiveClassRoomScreen.tsx` | Student | Jitsi Meet WebView integration for attending live classes |
| `AnnouncementsScreen.tsx` | Both | Timeline of pinned + regular announcements with attachments |
| `ProfileScreen.tsx` | Both | Profile editing, avatar selection, phone OTP verification, image upload |
| `SecurityScreen.tsx` | Both | Password change, biometric toggle, active sessions |
| `NotificationSettingsScreen.tsx` | Both | Granular notification preference toggles |
| `CreateCourseScreen.tsx` | Teacher | Course creation with image picker and publishing toggle |
| `CreateLessonScreen.tsx` | Teacher | Lesson content editor with rich text and file attachment |
| `ManageVideoLecturesScreen.tsx` | Teacher | Video upload to Cloudinary, manage lecture list |
| `CreateQuizScreen.tsx` | Teacher | Quiz builder: add questions, options, mark correct answers |
| `ManageLiveClassesScreen.tsx` | Teacher | Schedule, view, start/end live classes |
| `LiveClassRoomScreen.tsx` | Teacher | Jitsi host view with participant panel and chat |
| `CreateAnnouncementScreen.tsx` | Teacher | Rich announcement editor with file attachment, priority, pinning |
| `TeacherProgressScreen.tsx` | Teacher | Analytics dashboard — enrollments, quiz scores, revenue charts |
| `StudentDetailScreen.tsx` | Teacher | Individual student's progress in a specific course |
| `CourseDetailScreen.tsx` | Both | Full course info, reviews, enroll button (student) |
| `LessonDetailScreen.tsx` | Both | Lesson content reader with completion marking |
| `AboutScreen.tsx` | Both | App info and credits |

---

### State Management (Zustand)

MentiQ uses **Zustand** for lightweight, boilerplate-free global state management. Each domain has its own store:

| Store | Manages |
|---|---|
| `authStore.ts` | JWT tokens, decoded user profile, login/logout actions, biometric state |
| `courseStore.ts` | Course lists (enrolled, browsable, teacher's courses) |
| `quizStore.ts` | Quiz data, current attempt state, answers buffer |
| `liveClassStore.ts` | Live class listings, current class status |
| `announcementStore.ts` | Announcement lists, read status |
| `notificationStore.ts` | Notification items, unread count |
| `progressStore.ts` | Per-course lesson completion states |
| `videoStreamStore.ts` | Video streaming metadata |
| `liveClassChatStore.ts` | Chat messages for an active live class room |

---

### Central API Service

All HTTP communication is handled by `services/api.ts`, which provides:

1. **Auto IP detection** — Uses Expo's `hostUri` to automatically detect the dev machine's IP so the mobile app connects without manual configuration.
2. **JWT Bearer injection** — Automatically attaches `Authorization: Bearer <token>` to every request.
3. **Silent token refresh** — On `401 Unauthorized`, silently refreshes the access token using the stored refresh token and retries the original request exactly once.
4. **Force logout** — If the refresh token is also expired, triggers the `onAuthFailure` callback to redirect the user to login.
5. **FormData support** — `api.upload()` correctly omits the `Content-Type` header so the browser sets the multipart boundary automatically.
6. **Domain-grouped exports** — Every API domain (auth, courses, quizzes, live classes, AI, etc.) has its own typed export object for clean, auto-completable usage.

```typescript
// Usage examples
import { courseApi, quizApi, aiApi } from '../services/api';

const { data } = await courseApi.list();
const { data: quiz } = await quizApi.get(quizId);
await quizApi.submit(quizId, { answers: { "q1": "b", "q2": "a" } });
```

---

### Key Components

| Component | Description |
|---|---|
| `StudentDashboard.tsx` | Stats cards, enrolled course grid, upcoming live class banner |
| `TeacherDashboard.tsx` | Metric tiles, recent student activity, quick-action buttons |
| `UsageTracker.tsx` | Silently logs session start/end to `UserActivityLog` via analytics API |
| `ai/` | Qbit chat bubble, suggestion chips, markdown renderer |
| `ui/` | Button variants, card containers, loading skeletons, empty states |

---

## 🔗 Third-Party Integrations

| Service | Purpose | Config Key |
|---|---|---|
| **Groq API** | Powers the Qbit AI tutor (LLM chat, quiz/flashcard/plan generation) | `GROQ_API_KEY` |
| **Firebase** | Phone OTP authentication + FCM push notification delivery | `FCM_SERVER_KEY`, Firebase Admin SDK credentials JSON |
| **Cloudinary** | Cloud storage for course covers, profile images, video thumbnails | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` |
| **Stripe** | Paid course checkout sessions and payment history | `STRIPE_PUBLIC_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` |
| **Gmail / EmailJS** | Core email system (SMTP outbound, IMAP inbound) & frontend contact forms | `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, EmailJS Integration |
| **Twilio** | Alternate SMS OTP delivery | Twilio credentials |
| **Jitsi Meet** | Free, embeddable live class video conferencing | `JITSI_DOMAIN`, `JITSI_APP_ID`, `JITSI_SECRET` |
| **Sentry** | Real-time error monitoring and crash reporting | `SENTRY_DSN` |
| **Redis** | Celery task broker + result backend + session cache | `REDIS_URL`, `CELERY_BROKER_URL` |

---

## ⚙️ Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in your values:

```env
# ── Django Core ─────────────────────────────────
DEBUG=True
SECRET_KEY=your-very-secret-key-change-in-production
ALLOWED_HOSTS=localhost,127.0.0.1,0.0.0.0
DJANGO_SETTINGS_MODULE=config.settings

# ── Database (PostgreSQL) ────────────────────────
DATABASE_URL=postgresql://user:password@localhost:5432/mentiq_db

# ── Redis & Celery ───────────────────────────────
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/1
CELERY_RESULT_BACKEND=redis://localhost:6379/2

# ── JWT Authentication ───────────────────────────
JWT_SECRET_KEY=your-jwt-secret-key
JWT_ACCESS_TOKEN_LIFETIME=60        # minutes
JWT_REFRESH_TOKEN_LIFETIME=1440     # minutes (24 hours)
JWT_ALGORITHM=HS256

# ── AI Tutor (Qbit) ──────────────────────────────
GROQ_API_KEY=gsk_your-groq-api-key

# ── Firebase (OTP + Push Notifications) ──────────
FCM_SERVER_KEY=your-firebase-cloud-messaging-server-key
FIREBASE_CREDENTIALS_PATH=mentiq-b4f42-firebase-adminsdk-fbsvc-d67b424bd9.json

# ── Cloudinary (Media Storage) ───────────────────
USE_CLOUDINARY=True
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# ── Email (SendGrid) ─────────────────────────────
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
SENDGRID_API_KEY=SG.your-sendgrid-api-key
DEFAULT_FROM_EMAIL=noreply@mentiq.com
ADMIN_EMAIL=admin@mentiq.com

# ── Stripe (Payments) ────────────────────────────
STRIPE_PUBLIC_KEY=pk_test_your-stripe-public-key
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# ── Live Classes (Jitsi) ─────────────────────────
JITSI_DOMAIN=meet.jit.si
JITSI_APP_ID=
JITSI_SECRET=

# ── Sentry (Error Monitoring) ────────────────────
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# ── File Uploads ─────────────────────────────────
MAX_UPLOAD_SIZE=104857600   # 100MB

# ── Logging ──────────────────────────────────────
LOG_LEVEL=INFO
```

---

## 🚀 Getting Started

### Prerequisites

**Backend:**

- Python 3.11+
- PostgreSQL 14+
- Redis 6+
- `pip` and `virtualenv` or `venv`

**Frontend:**

- Node.js 18+ and npm
- Expo CLI: `npm install -g expo-cli`
- Expo Go app on your physical device (or an Android/iOS emulator)

---

### Backend Setup

```bash
# 1. Navigate to backend directory
cd "Capstone Project/backend"

# 2. Create and activate virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Set up environment variables
copy .env.example .env
# Edit .env with your credentials

# 5. Create the database (PostgreSQL)
createdb mentiq_db

# 6. Run migrations
python manage.py migrate

# 7. Create a superuser (admin)
python manage.py createsuperuser

# 8. Collect static files
python manage.py collectstatic --noinput

# 9. Start the development server
python manage.py runserver 0.0.0.0:8000
```

> ℹ️ The `0.0.0.0` binding makes Django accessible from your mobile device on the same Wi-Fi network.

---

### Frontend Setup

```bash
# 1. Navigate to frontend directory
cd "Capstone Project/frontend"

# 2. Install dependencies
npm install

# 3. Start the Expo development server
npx expo start
```

Scan the QR code with the **Expo Go** app on your phone, or press `a` for Android emulator / `i` for iOS simulator.

> 💡 The API service auto-detects the backend IP via Expo's `hostUri`, so no manual IP configuration is needed in development.

---

### Web Frontend Setup (frontendweb)

```bash
# 1. Navigate to frontendweb directory
cd "Capstone Project/frontendweb"

# 2. Install dependencies
npm install

# 3. Start the Vite development server
npm run dev
```

The app will be available at `http://localhost:5173/`.

---

## ▶️ Running the Application

To run all services simultaneously in development:

**Terminal 1 — Django Backend:**

```bash
cd "Capstone Project/backend"
source venv/bin/activate   # or venv\Scripts\activate on Windows
python manage.py runserver 0.0.0.0:8000
```

**Terminal 2 — Celery Worker (optional for background tasks):**

```bash
cd "Capstone Project/backend"
source venv/bin/activate
celery -A config worker --loglevel=info --pool=solo    # --pool=solo for Windows
```

**Terminal 3 — Celery Beat (optional for scheduled tasks):**

```bash
cd "Capstone Project/backend"
source venv/bin/activate
celery -A config beat --loglevel=info
```

**Terminal 4 — Expo Frontend:**

```bash
cd "Capstone Project/frontend"
npx expo start
```

**Terminal 5 — Web Frontend (Optional):**

```bash
cd "Capstone Project/frontendweb"
npm run dev
```

---

## 📖 API Documentation

Once the backend server is running, interactive API documentation is auto-generated by **drf-spectacular**:

| Documentation Type | URL |
|---|---|
| **Swagger UI** (interactive) | [http://localhost:8000/api/docs/](http://localhost:8000/api/docs/) |
| **ReDoc** (readable) | [http://localhost:8000/api/redoc/](http://localhost:8000/api/redoc/) |
| **OpenAPI JSON Schema** | [http://localhost:8000/api/schema/](http://localhost:8000/api/schema/) |
| **Django Admin** | [http://localhost:8000/admin/](http://localhost:8000/admin/) |
| **Health Check** | [http://localhost:8000/api/health/](http://localhost:8000/api/health/) |

---

## 👤 User Roles & Permissions

| Permission | Student | Teacher | Admin |
|---|:-:|:-:|:-:|
| Register / Login / Profile | ✅ | ✅ | ✅ |
| Browse & Enroll in Courses | ✅ | ❌ | ✅ |
| View Lessons & Videos | ✅ | ✅ | ✅ |
| Attempt Quizzes | ✅ | ❌ | ✅ |
| Track Progress | ✅ | ❌ | ✅ |
| Join Live Classes | ✅ | ❌ | ✅ |
| Use Qbit AI Tutor | ✅ | ✅ | ✅ |
| Read Announcements | ✅ | ✅ | ✅ |
| Create/Manage Courses | ❌ | ✅ | ✅ |
| Create/Manage Lessons | ❌ | ✅ | ✅ |
| Create/Manage Quizzes | ❌ | ✅ | ✅ |
| Host/Manage Live Classes | ❌ | ✅ | ✅ |
| Post Announcements | ❌ | ✅ | ✅ |
| View Student Analytics | ❌ | ✅ | ✅ |
| Access Django Admin | ❌ | ❌ | ✅ |
| Manage Payment Records | ❌ | ❌ | ✅ |

---

## ✨ Features Walkthrough

### 🔐 Authentication Flow

1. User opens the app → **OnboardingScreen** (first launch only)
2. Taps **Register** → selects role (Student / Teacher) → fills form → JWT tokens stored
3. Subsequent launches → **LoginScreen** → email/password or biometric shortcut
4. Tokens auto-refresh silently in the background; expired sessions force re-login

### 📚 Student Learning Flow

1. Dashboard shows enrolled courses progress and upcoming live classes
2. **Browse Courses** → filter by category/level → tap a course → **Enroll**
3. Open course → lessons list → read content → watch video → **Mark Complete**
4. Take **Quiz** → timed MCQs → instant scoring → **Analysis** per question
5. Join **Live Class** via Jitsi WebView; chat with teacher and peers in-room
6. Ask **Qbit** any question; generate flashcards or study plan for upcoming exams

### 🧑‍🏫 Teacher Content Creation Flow

1. Dashboard shows revenue, student count, and quick actions
2. **Create Course** → fill details, upload cover image, set pricing → publish
3. **Add Lessons** → write content, upload video, sequence lessons
4. **Create Quiz** → add MCQ questions with explanations and correct answer keys
5. **Schedule Live Class** → set time, start → Jitsi room auto-created
6. **Post Announcement** → with priority, attachment, and pinning option
7. **View Analytics** → per-course enrollments, completion rates, quiz performance

---

## 🤝 Contributing

This project is a Capstone Project. Contributions, bug reports, and feature suggestions are welcome!

1. **Fork** the repository
2. Create a **feature branch**: `git checkout -b feature/your-feature-name`
3. **Commit** your changes: `git commit -m "feat: add your feature"`
4. **Push** to the branch: `git push origin feature/your-feature-name`
5. Open a **Pull Request**

---

<div align="center">

Built with ❤️ as a Capstone Project

**MentiQ** — *Empowering learners, one lesson at a time.*

</div>
