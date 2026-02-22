# 🎓 MentiQ: AI-Enabled E-Learning Ecosystem

<div align="center">
  <img src="frontendweb/public/Logo.png" alt="MentiQ Logo" width="160" />
  <br/>
  <h3>Next-Generation Learning Management System</h3>
  <p><i>Empowering students and teachers with AI-driven insights, live classrooms, and automated workflows.</i></p>
</div>

<div align="center">
  <img src="https://img.shields.io/badge/Backend-Django_5.x-0C4B33?style=for-the-badge&logo=django&logoColor=white" alt="Django" />
  <img src="https://img.shields.io/badge/API-DRF_3.15-8C1D18?style=for-the-badge&logo=django&logoColor=white" alt="DRF" />
  <img src="https://img.shields.io/badge/Mobile-React_Native_Expo-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React Native" />
  <img src="https://img.shields.io/badge/Web-Vite_React-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Database-PostgreSQL-336791?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Realtime-Jitsi_Meet-44A8FD?style=for-the-badge&logo=jitsi&logoColor=white" alt="Jitsi" />
  <img src="https://img.shields.io/badge/AI-Groq_Llama_3-f3ac2e?style=for-the-badge" alt="AI Agent" />
</div>

<br/>

<div align="center">
  <img src="https://readme-typing-svg.herokuapp.com?font=Space+Grotesk&weight=600&size=24&duration=3000&pause=1000&color=0EA5E9&center=true&vCenter=true&width=1000&lines=Robust+Django+REST+API;Full-Featured+Expo+Mobile+App;Stunning+Vite+Web+Portal;Integrated+AI+Tutor+_QBit;Advanced+Email+%26+Attendance+Systems" alt="Typing SVG" />
</div>

---

## 📖 Overview

**MentiQ** is a comprehensive e-learning platform designed for the modern era. It bridges the gap between traditional learning and AI-assisted education by offering a seamless experience across Mobile, Web, and a powerful Backend API.

Whether you are a student tracking your progress through an **AI Knowledge Graph** or a teacher managing live classes and automated attendance, MentiQ provides the tools to succeed.

---

## 🚀 Key Modules & Features

### 🤖 1. AI Intelligence Center (QBit)

* **Conversational Tutor**: Chat with QBit, a Groq-powered AI that understands course context.
* **Smart Flashcards**: Automatically generate flashcards from lessons and track mastery.
* **Adaptive Study Planner**: Generate personalized study schedules based on your goals with PDF export.
* **Knowledge Graph**: Visualize your learning journey with live signals from quizzes, doubts, and time spent.

### 🎥 2. Virtual Classroom & Attendance

* **One-Click Live Classes**: Integrated Jitsi Meet for low-latency video sessions.
* **Live Chat & Participation**: Real-time interaction during classes.
* **Automated Attendance**: Teachers can mark and students can view attendance sessions with synchronized dashboard updates.
* **Session Booking**: Request 1:1 sessions with mentors directly from the app.

### 📝 3. Assessment & Growth Tracking

* **Advanced Quiz Engine**: Support for multiple question types, time limits, and detailed result analysis.
* **Re-attempt System**: Students can re-attempt quizzes (up to 3 times daily) to improve mastery.
* **Gamified Progress**: Circle-based progress tracking and lesson completion lifecycle.

### 📧 4. Communication & Automation

* **Enterprise Email System**: Comprehensive outbound logging, promotional campaigns, and IMAP inbox synchronization.
* **Multi-Channel Notifications**: In-app notifications and email alerts for announcements and reminders.
* **Premium Announcements**: Rich-text announcements with attachments and priority levels.

### 💳 5. Business & Operations

* **Stripe Integration**: Secure payment processing for premium courses.
* **Pro Analytics**: Daily platform-wide reports and per-course performance deep dives for teachers.
* **Media Management**: Centralized media library with Cloudinary support for file persistence.

---

## 🏗️ System Architecture

```mermaid
flowchart TB
    subgraph Clients[Frontend & Mobile]
        Mobile[React Native Expo App\nTypeScript + Zustand]
        Web[Vite React Portal\nAxios + CSS-Modules]
    end

    subgraph API[Django Service Layer]
        DRF[Django REST Framework\nJWT Auth + RBAC + API v1]
        Logic[19 Domain-Driven Apps\nBusiness Logic & Services]
        Tasks[Celery Workers\nAsync Jobs & Schedules]
    end

    subgraph Data[Persistence & Cache]
        DB[(PostgreSQL)]
        Redis[(Redis\nBroker & Result Backend)]
    end

    subgraph External[Integrations]
        LLM[Groq AI]
        Media[Cloudinary]
        Live[Jitsi Meet]
        Pay[Stripe]
        Email[Gmail / EmailJS]
        Notify[Firebase FCM]
    end

    Mobile -->|HTTPS/REST| DRF
    Web -->|HTTPS/REST| DRF
    DRF --> Logic
    Logic --> DB
    Logic --> Redis
    Tasks --> Redis
    Logic --> External
```

---

## 📂 Repository Breakdown

| Path | Responsibility |
|:---|:---|
| `backend/` | **Django 5.x REST API**. Contains all business logic, database migrations, and background tasks. |
| `frontend/` | **React Native Expo App**. Native mobile experience for iOS and Android with biometric auth support. |
| `frontendweb/` | **Vite React App**. Modern web dashboard with heavy focus on AI visualizations and classroom management. |

### 🛠️ Backend App Inventory (Core Domain Apps)

| App | Description |
|:---|:---|
| `apps.users` | JWT Auth, Role-Based Access, OTP (Firebase/Twilio), FCM tokens. |
| `apps.students` | Student dashboard, Knowledge Graph, Course browsing, Session booking. |
| `apps.teachers` | Teacher dashboard, Student analytics, Booking management. |
| `apps.courses` | Course lifecycle (Publishing, Reviews, CRUD). |
| `apps.lessons` | Lesson management with video Support and reordering logic. |
| `apps.quizzes` | Quiz engine, re-attempt logic, and submission analysis. |
| `apps.attendance` | **[NEW]** Session-based attendance tracking for live classes. |
| `apps.emails` | **[NEW]** SMTP/IMAP integration, Campaign manager, and Contact form logs. |
| `apps.live_classes` | Real-time class coordination, Jitsi links, and live chat. |
| `apps.ai_tutor` | QBit AI chat, Flashcard generation, and Study Plan logic. |
| `apps.payments` | Stripe checkout flows and webhook processing. |
| `apps.analytics` | Platform snapshots and detailed course reporting. |
| `apps.notifications` | In-app notification system with settings control. |
| `apps.announcements` | Global and course-specific updates. |

---

## 🎨 Visual Preview

<div align="center">
  <img src="frontendweb/public/mentor_graphic.png" width="30%" />
  <img src="frontendweb/public/ai_graphic.png" width="30%" />
  <img src="frontendweb/public/goals_graphic.png" width="30%" />
</div>

<div align="center">
  <img src="frontendweb/public/Qbit.png" alt="QBit" width="100" />
  &nbsp;&nbsp;&nbsp;&nbsp;
  <img src="frontend/assets/images/Logo.png" alt="MentIQ" width="100" />
</div>

---

## ⚙️ Environment Configuration

MentiQ uses a decoupled configuration system. Check `backend/.env.example` for the full list.

### Essential Backend Keys

```env
DEBUG=True
DATABASE_URL=postgresql://user:password@localhost:5432/mentiq_db
GROQ_API_KEY=your_groq_key
STRIPE_SECRET_KEY=your_stripe_key
EMAIL_HOST_USER=gmail@example.com
EMAIL_HOST_PASSWORD=app_password
```

### Essential Web Keys

```env
VITE_API_URL=http://localhost:8000/api/v1/
```

---

## 🛠️ Local Development Setup

### 1. Backend (Django)

```bash
cd backend
python -m venv .venv
# Activate venv: .venv\Scripts\activate (Windows) or source .venv/bin/activate (Mac/Linux)
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### 2. Background Tasks (Celery)

Requires Redis running on `localhost:6379`.

```bash
# In separate terminals (with venv active)
celery -A config worker -l info
celery -A config beat -l info
```

### 3. Mobile (Expo)

```bash
cd frontend
npm install
npx expo start
```

### 4. Web (Vite)

```bash
cd frontendweb
npm install
npm run dev
```

---

## 🧪 Verification & Runbook

1. **Health Check**: Visit `http://127.0.0.1:8000/api/health/`.
2. **API Docs**: Interactive Swagger documentation at `http://127.0.0.1:8000/api/docs/`.
3. **Authentication**: Test login with Email or Role ID (Teacher: 5 digits, Student: 8 digits).
4. **AI QBit**: Verify `ai/ask` and `ai/generate-plan` endpoints are responding.
5. **Attendance**: Mark attendance as teacher and verify student dashboard updates.

---

## ⚠️ Known Gaps & Future Roadmap

* [ ] **Task Consistency**: Some Celery task names in `beat_schedule` need alignment with recent refactors.
* [ ] **API Contract Sync**: Standardize payload shapes between Expo and DRF serializers for Quiz/Lesson reordering.
* [ ] **Testing**: Expand unit test coverage for the new Email and Attendance modules.
* [ ] **Edge Computing**: Investigate local LLM integration for basic QAs.

---

## 📬 Contact & Support

**The MentiQ Team**

* **Email**: <mentiq.learn@gmail.com>
* **Location**: Punjab, India
* **Project Goal**: Bridging the digital divide in modern education.

---
<div align="center">
  Built with ❤️ by the MentiQ Development Team.
</div>
