# MentiQ Capstone Project

<div align="center">
  <img src="frontendweb/public/Logo.png" alt="MentiQ Logo" width="120" />
  <h3>AI-Enabled Learning Platform (Mobile + Web + Django API)</h3>
  <img src="https://readme-typing-svg.herokuapp.com?font=Space+Grotesk&weight=600&size=22&duration=2600&pause=900&color=0EA5E9&center=true&vCenter=true&width=980&lines=Django+REST+Backend+%7C+React+Native+Expo+App+%7C+Vite+Web+Portal;Courses+%C2%B7+Lessons+%C2%B7+Live+Classes+%C2%B7+Quizzes+%C2%B7+AI+Tutor+QBit;Built+as+a+full-stack+capstone+project" alt="Animated project intro" />
  <br/><br/>
  <img src="https://img.shields.io/badge/Backend-Django_5.x-0C4B33?style=for-the-badge&logo=django&logoColor=white" alt="Django" />
  <img src="https://img.shields.io/badge/API-DRF-8C1D18?style=for-the-badge&logo=fastapi&logoColor=white" alt="DRF" />
  <img src="https://img.shields.io/badge/Mobile-React_Native_0.81-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React Native" />
  <img src="https://img.shields.io/badge/Expo-SDK_54-1C1E24?style=for-the-badge&logo=expo&logoColor=white" alt="Expo" />
  <img src="https://img.shields.io/badge/Web-Vite_React-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Database-PostgreSQL-336791?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Queue-Celery-37814A?style=for-the-badge&logo=celery&logoColor=white" alt="Celery" />
  <img src="https://img.shields.io/badge/AI-Groq-111111?style=for-the-badge" alt="Groq" />
</div>

---

## Table Of Contents

1. [Project Snapshot](#project-snapshot)
2. [Visual Preview (From Repository Assets)](#visual-preview-from-repository-assets)
3. [System Architecture](#system-architecture)
4. [Repository Structure](#repository-structure)
5. [Backend Deep Dive](#backend-deep-dive)
6. [Mobile App Deep Dive (Expo)](#mobile-app-deep-dive-expo)
7. [Web App Deep Dive (Vite)](#web-app-deep-dive-vite)
8. [Integrations](#integrations)
9. [Environment Variables](#environment-variables)
10. [Local Development Setup](#local-development-setup)
11. [Runbook: Health, Docs, And Verification](#runbook-health-docs-and-verification)
12. [Known Gaps Found In Code Audit](#known-gaps-found-in-code-audit)
13. [Suggested Next Improvements](#suggested-next-improvements)

---

## Project Snapshot

MentiQ is a full-stack e-learning system with:

- A Django REST backend (`backend/`) with JWT auth, role-based permissions, media upload, analytics, payments, notifications, and AI endpoints.
- A React Native + Expo app (`frontend/`) for students and teachers.
- A React + Vite web portal (`frontendweb/`) with onboarding, role-aware dashboards, classroom, AI assistant, quizzes, and profile management.

Core domains implemented in code:

- Authentication and profile management (teacher/student roles, OTP verification, biometric login integration on mobile).
- Course, lesson, enrollment, and progress lifecycle.
- Quiz creation/submission/attempt analysis.
- Live classes with Jitsi links, participant tracking, chat, and attendance.
- Announcements, notification settings, and notification delivery hooks.
- AI tutor (`QBit`) for chat, flashcards, quiz generation, and study plan generation.
- Student-only **AI Knowledge Graph** (web) with live backend signals and no seeded/demo graph data.
- Media upload service and email/contact workflows.

Audit baseline for this README: **February 22, 2026**.

---

## Visual Preview (From Repository Assets)

<div align="center">
  <img src="frontendweb/public/Qbit.png" alt="QBit" width="130" />
  <img src="frontendweb/public/Logo.png" alt="MentIQ Logo" width="130" />
  <img src="frontend/assets/images/Qbit.png" alt="QBit Mobile Asset" width="130" />
  <img src="frontend/assets/images/Logo.png" alt="MentIQ Mobile Asset" width="130" />
</div>

<div align="center">
  <img src="frontendweb/public/mentor_graphic.png" alt="Mentor Graphic" width="245" />
  <img src="frontendweb/public/ai_graphic.png" alt="AI Graphic" width="245" />
  <img src="frontendweb/public/goals_graphic.png" alt="Goals Graphic" width="245" />
</div>

<div align="center">
  <img src="frontendweb/public/premium_student_portrait.png" alt="Student Portrait" width="245" />
  <img src="frontendweb/public/premium_student_portrait_female.png" alt="Student Portrait Female" width="245" />
  <img src="frontendweb/public/avatar.png" alt="Avatar Asset" width="245" />
</div>

---

## System Architecture

```mermaid
flowchart TB
    subgraph ClientLayer[Client Layer]
        Mobile[Expo Mobile App\nReact Native + TypeScript + Zustand]
        Web[Vite Web App\nReact + Axios + CSS Components]
    end

    Mobile -->|HTTPS REST| API
    Web -->|HTTPS REST| API

    subgraph ApiLayer[Django API Layer]
        API[Django REST Framework\nJWT + RBAC + Pagination + Throttling]
        Apps[Domain Apps\nusers, courses, lessons, quizzes,\nlive_classes, announcements,\nnotifications, payments, analytics,\nai_tutor, emails, media...]
        Tasks[Celery Workers + Beat]
        API --> Apps
        API --> Tasks
    end

    subgraph DataLayer[Data Layer]
        DB[(PostgreSQL)]
        Cache[(LocMem Cache in current settings)]
        Broker[(Redis for Celery broker/result backend)]
    end

    Apps --> DB
    API --> Cache
    Tasks --> DB
    Tasks --> Broker

    subgraph ExternalServices[External Services]
        Jitsi[Jitsi Meet]
        Stripe[Stripe]
        Cloudinary[Cloudinary]
        Firebase[Firebase]
        Twilio[Twilio]
        Groq[Groq API]
        Gmail[Gmail SMTP/IMAP + EmailJS]
    end

    Apps --> Jitsi
    Apps --> Stripe
    Apps --> Cloudinary
    Apps --> Firebase
    Apps --> Twilio
    Apps --> Groq
    Apps --> Gmail
```

---

## Repository Structure

```text
Capstone Project/
├── backend/                     # Django + DRF backend
│   ├── config/                  # settings.py, urls.py, celery.py, asgi.py, wsgi.py
│   ├── apps/                    # Domain apps (18 local apps)
│   ├── requirements.txt
│   ├── .env.example
│   └── manage.py
├── frontend/                    # Expo React Native mobile app
│   ├── app/                     # Navigation + role/screen routing
│   ├── components/              # Reusable UI + AI components
│   ├── services/                # API, AI, media, Jitsi, Firebase services
│   ├── store/                   # Zustand stores
│   ├── assets/images/           # Local image assets
│   ├── package.json
│   └── app.json
├── frontendweb/                 # Vite React web app
│   ├── src/components/          # Dashboard, onboarding, courses, quiz, profile, classroom
│   ├── src/api.js               # Axios client + token refresh
│   ├── public/                  # Web static assets used above in this README
│   └── package.json
└── README.md
```

---

## Backend Deep Dive

### App Inventory (Code-Level)

| App | Purpose |
|---|---|
| `apps.core` | Base models (UUID/timestamps/soft delete), custom permissions, middleware, exception handler, health check |
| `apps.users` | JWT login/register/logout, profile update, password change, phone OTP, FCM token |
| `apps.students` | Student dashboard, live knowledge graph, enrolled courses, progress summary, quiz history, teacher list, 1:1 session booking |
| `apps.teachers` | Teacher dashboard, own courses, student analytics, per-student detailed breakdown, booking management |
| `apps.courses` | Course CRUD, publish/unpublish, reviews |
| `apps.lessons` | Lesson CRUD, reorder, content/media fields |
| `apps.quizzes` | Quiz CRUD, question management, submission, attempt listing |
| `apps.enrollments` | Enroll/unenroll/status + teacher enrollment view |
| `apps.progress` | Lesson completion and course progress calculations |
| `apps.live_classes` | Schedule/start/end/join/leave classes, chat, participants, attendance, session booking model |
| `apps.announcements` | Course/global announcements with attachment and priority |
| `apps.notifications` | Notification model, unread count, mark read/all read, settings |
| `apps.payments` | Stripe checkout, webhook handling, payment history |
| `apps.analytics` | Daily analytics, course analytics, user activity logs |
| `apps.media` | Upload/list/delete media files with MIME/file-type inference |
| `apps.ai_tutor` | QBit AI chat + generation endpoints + flashcard session persistence for live analytics |
| `apps.emails` | Contact forms, campaigns, email logs, IMAP inbox sync, EmailJS config endpoint |
| `apps.intelligence` | Present but currently scaffold-level only |

### Authentication And Access Control

- Auth mechanism: `djangorestframework-simplejwt`.
- Login accepts:
  - Email
  - Teacher ID (5 digits)
  - Student ID (8 digits)
- Roles: `student`, `teacher`, `admin`.
- Permission classes in `apps/core/permissions.py` enforce role and ownership checks.
- Throttles are enabled:
  - `anon`: `100/hour`
  - `user`: `1000/hour`

### Data Model Highlights

| Domain | Key Models |
|---|---|
| User/Auth | `User`, `PhoneOTP` |
| Learning | `Course`, `Lesson`, `Enrollment`, `LessonProgress`, `CourseProgress` |
| Assessment | `Quiz`, `QuizQuestion`, `QuizAttempt` |
| AI | `FlashcardSession` |
| Live | `LiveClass`, `LiveClassParticipant`, `LiveClassChat`, `Attendance`, `SessionBooking` |
| Communication | `Announcement`, `Notification`, `NotificationSetting`, `ContactMessage`, `EmailCampaign`, `InboxEmail` |
| Business/Insights | `Payment`, `DailyAnalytics`, `CourseAnalytics`, `UserActivityLog` |
| Files | `MediaFile` |

### API Surface Map

All backend routes are mounted in `backend/config/urls.py`.

| Domain | Prefix | Notable Endpoints |
|---|---|---|
| Health | `/api/health/` | `GET` health |
| Auth | `/api/v1/auth/` | `login`, `register`, `logout`, `token/refresh`, `profile`, OTP, FCM token |
| Students | `/api/v1/students/` | `dashboard`, `knowledge-graph`, `courses`, `browse`, `progress`, `quiz-history`, `my-teachers`, `book-session` |
| Teachers | `/api/v1/teachers/` | `dashboard`, `courses`, `students`, `courses/<id>/students`, `bookings` |
| Courses | `/api/v1/courses/` | list/create/detail, reviews |
| Lessons | `/api/v1/lessons/` | list/create/detail/reorder |
| Quizzes | `/api/v1/quizzes/` | list/create/detail, questions, submit, attempts |
| Enrollments | `/api/v1/enrollments/` | enroll, unenroll, status, teacher view |
| Progress | `/api/v1/progress/` | mark complete, course progress |
| Live Classes | `/api/v1/live-classes/` | list/create/detail/start/end/join/leave/chat/attendance |
| Announcements | `/api/v1/announcements/` | list/create/detail |
| Notifications | `/api/v1/notifications/` | list, unread-count, settings, read actions |
| Payments | `/api/v1/payments/` | checkout, webhook, history |
| Analytics | `/api/v1/analytics/` | platform, history, course analytics, user activity |
| Media | `/api/v1/media/` | list, upload, delete |
| AI Tutor | `/api/v1/ai/` | ask, generate quiz, flashcards, study plan (flashcard sessions are logged for students) |
| Emails | `/api/v1/emails/` | contact, admin contact, campaigns, inbox, logs, EmailJS config |

### Async Workloads

Celery tasks are implemented across:

- `apps/analytics/tasks.py`
- `apps/emails/tasks.py`
- `apps/live_classes/tasks.py`
- `apps/users/tasks.py`
- `apps/notifications/tasks.py`

Current schedules are defined in both:

- `backend/config/settings.py` (`CELERY_BEAT_SCHEDULE`)
- `backend/config/celery.py` (`app.conf.beat_schedule`)

This dual definition is important for deployment consistency (see Known Gaps section).

---

## Mobile App Deep Dive (Expo)

### Navigation Model

- Root switch in `frontend/app/index.tsx`: splash -> onboarding -> auth -> role-based main app.
- Main role router in `frontend/app/MainApp.tsx`:
  - Student tabs: Learn, Live, AI Center, Progress, Profile
  - Teacher tabs: Home, Live Class, Updates, Analytics, Profile
- AI Center stack: `frontend/app/navigation/StudentAIStackNavigator.tsx`.

### Mobile Feature Coverage

| Student Side | Teacher Side |
|---|---|
| Browse and enroll in courses | Create and manage courses |
| View lessons and video lectures | Create/manage lessons and video lectures |
| Attempt quizzes and review analysis | Create/manage quizzes and questions |
| Join live classes | Create/start/end live classes |
| Track progress and attendance | Monitor student progress and details |
| Use QBit AI (chat/cards/plan) | Use QBit AI assistant workflows |
| Manage profile and notification preferences | Manage profile and notification preferences |

### State Management (Zustand Stores)

Stores in `frontend/store/`:

- `authStore.ts`
- `courseStore.ts`
- `quizStore.ts`
- `liveClassStore.ts`
- `liveClassChatStore.ts`
- `announcementStore.ts`
- `notificationStore.ts`
- `progressStore.ts`
- `videoStreamStore.ts`

### Mobile AI Center Highlights

`frontend/app/screens/student/ai-center/index.tsx` includes:

- Chat with Markdown AI responses.
- Image attach flow.
- Flashcard generation and card deck interface.
- Study plan generation with calendar selector and PDF export.
- Haptic feedback and Reanimated transitions.

### Mobile Security Details

- Biometric login support via `expo-local-authentication`.
- Token storage via AsyncStorage.
- Automatic token refresh integrated in central API service.
- Phone OTP request/verify wired through backend auth endpoints.

---

## Web App Deep Dive (Vite)

### Web App Flow

`frontendweb/src/App.jsx` orchestrates:

- Onboarding
- Login
- Dashboard by role
- Profile and notifications
- Courses and course detail
- Quiz taking and quiz result
- Classroom
- Doubts/AI interaction
- Contact page

### Web AI Integration

`frontendweb/src/components/AIAssistantCard.jsx` supports:

- AI chat (`ai/ask/`)
- Flashcard generation (`ai/generate-flashcards/`)
- Study plan generation (`ai/generate-plan/`)
- Modal expansion with multi-tab AI workflows

### Student AI Knowledge Graph (Live)

`frontendweb/src/components/KnowledgeGraphCard.jsx` adds a student-only flagship graph card to the dashboard.

- Route used: `GET /api/v1/students/knowledge-graph/`
- Scope: student dashboard only (`frontendweb/src/components/StudentDashboard.jsx`)
- Graph semantics:
  - Nodes = enrolled courses (mastery + importance)
  - Edges = inferred prerequisite progression inside category/level ordering
  - Node color = mastery band
  - Node size = importance signal
- Live signals currently exposed to UI:
  - `quiz_accuracy`
  - `time_spent_hours`
  - `flashcards_performance`
  - `doubts_asked`
- Signal calculation summary:
  - `quiz_accuracy`: average of attempt percentages where each attempt uses `(score / total_questions) * 100`
  - `time_spent_hours`: `max(user_activity_seconds, lesson_time_seconds + quiz_time_seconds) / 3600`
  - `flashcards_performance`: cards generated from persisted student flashcard sessions against expected-card baseline
  - `doubts_asked`: count of student `SessionBooking` records
- Reliability behavior:
  - Primary source is `students/knowledge-graph`
  - If that endpoint is temporarily unavailable, web falls back to live `students/courses` + `students/progress` (still no demo data)

Migration note for new environments:

```powershell
cd backend
python manage.py migrate ai_tutor
```

### Web Styling And Motion

The web layer includes:

- Custom component-level CSS files.
- Multiple animated states (`slide-up`, modal transitions, float effects, loaders, shimmer skeletons).
- Dashboard card-based responsive layout.

---

## Integrations

| Integration | Used For |
|---|---|
| Groq API | QBit conversational and content-generation features |
| Jitsi Meet | Live class room links and sessions |
| Stripe | Paid-course checkout and webhook completion |
| Cloudinary | Media storage when enabled (`USE_CLOUDINARY`) |
| Firebase | FCM token storage path + mobile firebase setup |
| Twilio | SMS OTP send path in user verification |
| Gmail SMTP/IMAP | Outbound emails and inbox syncing |
| EmailJS | Frontend email sending support with backend-exposed keys |

---

## Environment Variables

Use `backend/.env.example` as a starting point, then align with **actual runtime usage in `backend/config/settings.py`**.

### Minimum Practical Backend Variables

```env
DEBUG=True
SECRET_KEY=replace-me
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=postgresql://user:password@localhost:5432/mentiq_db

JWT_SECRET_KEY=replace-me
JWT_ACCESS_TOKEN_LIFETIME=60
JWT_REFRESH_TOKEN_LIFETIME=1440

CELERY_BROKER_URL=redis://localhost:6379/1
CELERY_RESULT_BACKEND=redis://localhost:6379/2

FRONTEND_URL=http://localhost:8081
JITSI_DOMAIN=meet.jit.si

STRIPE_PUBLIC_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
USE_CLOUDINARY=False

EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=
EMAIL_HOST_PASSWORD=
DEFAULT_FROM_EMAIL=MentiQ <noreply@mentiq.com>
ADMIN_EMAIL=admin@mentiq.com

IMAP_HOST=imap.gmail.com
IMAP_PORT=993
IMAP_USE_SSL=True
IMAP_USER=
IMAP_PASSWORD=

EMAILJS_SERVICE_ID=
EMAILJS_TEMPLATE_ID=
EMAILJS_PUBLIC_KEY=

GROQ_API_KEY=
FCM_SERVER_KEY=
```

### Frontend Web Variable

`frontendweb` optionally reads:

```env
VITE_API_URL=http://localhost:8000/api/v1/
```

### Mobile Frontend Variables

The Expo app auto-detects local host IP for development API base. No mandatory `.env` file is present in the current repository.

---

## Local Development Setup

### 1) Backend (Django)

```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
pip install dj-database-url
python manage.py migrate
python manage.py runserver
```

Default local server: `http://127.0.0.1:8000`

### 2) Celery Worker + Beat

From `backend/` with virtualenv active:

```powershell
celery -A config worker -l info
celery -A config beat -l info
```

### 3) Mobile App (Expo)

```powershell
cd frontend
npm install
npm start
```

Optional targets:

```powershell
npm run android
npm run ios
npm run web
```

### 4) Web App (Vite)

```powershell
cd frontendweb
npm install
npm run dev
```

Default local web URL: `http://localhost:5173`

---

## Runbook: Health, Docs, And Verification

### Health Check

- `GET http://127.0.0.1:8000/api/health/`

### API Docs

- Swagger UI: `http://127.0.0.1:8000/api/docs/`
- ReDoc: `http://127.0.0.1:8000/api/redoc/`
- OpenAPI schema: `http://127.0.0.1:8000/api/schema/`

### Basic Verification Pass

1. Register/login from mobile or web.
2. Create a course (teacher account).
3. Create lessons and quiz for that course.
4. Enroll as student and submit quiz.
5. Start and join a live class.
6. Open AI Center and generate flashcards/study plan.
7. Open student web dashboard and confirm AI Knowledge Graph loads enrolled course nodes from live backend data.
8. Confirm notification, progress, analytics, and graph endpoints return expected data.

---

## Known Gaps Found In Code Audit

These are implementation-level findings from current repository state.

1. `backend/config/celery.py`:
   Beat schedule references tasks that are not present with matching names:
   - `apps.analytics.tasks.generate_daily_report` (existing function is `generate_daily_analytics`)
   - `apps.notifications.tasks.send_weekly_progress_reminders` (current reminder task exists in `apps.users.tasks`)
2. Frontend/backend payload mismatches exist in several paths:
   - Lesson reorder payload shape mismatch (`frontend/services/api.ts` vs `backend/apps/lessons/views.py`).
   - Live class create/update field mismatch (`scheduled_start_time` vs `scheduled_at`).
   - Live class status mapping mismatch (`active/completed` in some frontend stores vs `live/ended` in backend).
   - Quiz create/update field mismatch (`time_limit`, `total_questions` vs backend serializer `duration`, `questions`).
3. `backend/.env.example` includes legacy service variables (Agora/S3/SendGrid) not aligned with current code paths (Jitsi/Cloudinary/Gmail/Groq).
4. Firebase config is hardcoded in `frontend/services/firebase.ts`; while client Firebase keys are usually public, environment-driven configuration is still recommended.

---

## Suggested Next Improvements

1. Align all frontend API payload contracts with backend serializers and add typed DTOs for strict compile-time checks.
2. Consolidate Celery schedules to one source of truth and add startup validation for task names.
3. Add integration tests for auth, enrollment, quiz submission, live class lifecycle, and AI endpoints.
4. Update `.env.example` to match active settings and remove obsolete variable groups.
5. Add CI checks for:
   - backend lint/tests
   - mobile TypeScript/lint
   - web build and lint
6. Add a proper `LICENSE` file if open-source distribution is intended.

---

## Notes

- This README was rewritten from direct code inspection of backend, mobile, and web modules in this repository.
- The visual section intentionally uses image assets already present in the project folders, as requested.
