# 🎓 MentiQ: AI-Enabled E-Learning Ecosystem

<div align="center">
  <img src="frontendweb/public/Logo.png" alt="MentiQ Logo" width="160" />
  <br/>
  <img src="https://readme-typing-svg.herokuapp.com?font=Space+Grotesk&weight=700&size=32&duration=3000&pause=1000&color=0EA5E9&center=true&vCenter=true&width=1000&lines=NEXT-GEN+LEARNING+MANAGEMENT;INTEGRATED+AI+INTELLIGENCE;REAL-TIME+VIRTUAL+CLASSROOMS;MentiQ+E-Learning+Platform" alt="Title Typing SVG" />
  <p><i>Empowering students and teachers with AI-driven insights, live classrooms, and automated workflows.</i></p>
</div>

<div align="center">
  <img src="https://img.shields.io/badge/Backend-Django_5.x-0C4B33?style=for-the-badge&logo=django&logoColor=white" alt="Django" />
  <img src="https://img.shields.io/badge/API-DRF_3.15-8C1D18?style=for-the-badge&logo=django&logoColor=white" alt="DRF" />
  <img src="https://img.shields.io/badge/Mobile-React_Native_Expo-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React Native" />
  <img src="https://img.shields.io/badge/Web-Vite_React-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Database-PostgreSQL-336791?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Auth-Firebase_OTP-FFCA28?style=for-the-badge&logo=firebase&logoColor=white" alt="Firebase Auth" />
  <img src="https://img.shields.io/badge/Caching-Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" alt="Redis" />
  <img src="https://img.shields.io/badge/AI-Groq_Llama_3-f3ac2e?style=for-the-badge" alt="AI Agent" />
</div>

<br/>

<div align="center">
  <img src="https://img.shields.io/badge/Status-Active_Development-success?style=flat-square" />
  <img src="https://img.shields.io/badge/Build-Passing-brightgreen?style=flat-square" />
  <img src="https://img.shields.io/badge/Version-1.5.0--stable-blue?style=flat-square" />
</div>

---

## 📖 Project Overview

**MentiQ** is a state-of-the-art e-learning platform that harmonizes traditional educational workflows with cutting-edge **Generative AI** and **Real-Time Synchronization**. By providing a unified experience across **iOS/Android (Expo)**, **Web (Vite/React)**, and a robust **RESTful Backend (Django/DRF)**, MentiQ eliminates technical friction for both educators and learners.

### 🌟 Vision
> *"To democratize intelligence-driven education by making classroom management effortless, learning deeply personalized, and assessments fair and insightful."*

---

## 🚀 Key Modules & Perfect Detail

<details open>
<summary><b>🤖 AI Intelligence Center (QBit) & Planner</b></summary>
<br/>

* **⚡ Conversational Tutor**: Real-time context-aware chat utilizing Groq-powered Llama 3 models.
* **📚 Smart Flashcards**: Converts lesson content into interactive card decks with spaced-repetition logic.
* **📅 Dynamic Study Planner**: Generates weekly schedules using smart inputs (DataList integration) and exports them as **Premium Stylized PDFs**.
* **📊 Multi-Dimensional Knowledge Graph**: Maps course mastery, tracking `quiz_accuracy`, `time_spent`, and `flashcard_performance`.

</details>

<details>
<summary><b>🔐 Advanced Security & Smart Authentication</b></summary>
<br/>

* **📱 Firebase OTP Integration**: Passwordless, fast, and secure login verification utilizing Firebase Phone Authentication.
* **🔑 Multi-Mode Login**: Dynamic logic allowing users to authenticate via Email, Student ID, or Teacher ID accurately.
* **🛡️ JWT Token Management**: Secure stateless session handling via simpleJWT, complete with auto-refresh and blacklisting.
* **🌐 Dynamic IP Configuration**: Smart IP bypass mechanisms for seamless local network testing across multiple devices automatically capturing backend addresses.

</details>

<details>
<summary><b>🎥 Virtual Classroom & Live Sync</b></summary>
<br/>

* **🎬 Pro-Grade Video**: Seamless Jitsi Meet integration for 1:1 sessions and massive group classes.
* **💬 Real-Time Interaction**: Integrated chat system with immediate participation tracking.
* **📍 Synchronized Attendance Engine**:
  * *Teacher Side*: One-tap session creation and rapid student marking.
  * *Student Side*: Immediate automatic dashboard data updates reflecting their presence instantly.
* **📅 Intelligent Booking**: Role-aware calendar for scheduling mentorship sessions.

</details>

<details>
<summary><b>💯 Assessment & Advanced Analytics</b></summary>
<br/>

* **🧠 Comprehensive Quizzes**: Engaging assessments (MCQ, True/False, MSQ) backed by rigorous validation.
* **⚖️ Fair-Play Quiz Logic**: Integrated **Daily 3-Attempt Limits** per quiz to ensure honest learning progression and deliberate practice.
* **📈 Detailed Result Analysis**: Comprehensive post-quiz breakdowns revealing exact question counts, chosen answers versus correct answers, and mastery gaps seamlessly.
* **🎖️ Visual Gamification**: Premium card UI and circular progress tracks showcasing enrollment milestones.

</details>

<details>
<summary><b>📧 Enterprise Communication Engine</b></summary>
<br/>

* **📩 Advanced Emailing System**:
  * *Outbound*: Automated welcome, enrollment, and triggered progress update emails.
  * *Campaigns*: Admin-led promotional and informational bulk emailing targeted by cohorts.
  * *Inbound*: Integrated IMAP reader to sync platform inquiries directly to the dashboard.
* **🔔 Intelligent Notifications**: Trigger-based alerts for quiz publications, class announcements, and system updates.

</details>

---

## 🏗️ Technical Architecture

<div align="center">
  <img src="https://readme-typing-svg.herokuapp.com?font=Space+Grotesk&weight=600&size=20&duration=2500&pause=800&color=0EA5E9&center=true&vCenter=true&width=1000&lines=VISUALIZING+SYSTEM+ARCHITECTURE;Decoupled+Services+%7C+Real-time+Sync" alt="Arch Typing SVG" />
</div>

```mermaid
graph LR
    subgraph "Clients Layer"
        Mobile(📱 Expo Mobile App)
        Web(💻 Vite Web Portal)
    end

    subgraph "Backend Core (Django)"
        API[DRF Gateway | Auth & Rate Limits]
        Apps[20+ Local Domain Apps]
        Tasks[Celery Async Workers]
    end

    subgraph "Data & Cache"
        DB[(🛢️ PostgreSQL)]
        Redis[(⚡ Redis Broker)]
    end

    subgraph "Third-Party Cloud"
        Groq[🤖 Groq Llama 3]
        Firebase[🔥 Firebase OTP]
        Media[☁️ Cloudinary]
        Stripe[💳 Stripe API]
        Jitsi[📹 Jitsi Meet]
        Mail[📧 Gmail/EmailJS]
    end

    Mobile -->|JWT / OTP| API
    Web -->|JWT / OTP| API
    API --> Apps
    Apps --> DB
    Apps --> Redis
    Tasks --> Redis
    Apps --> Groq
    Apps --> Firebase
    Apps --> Media
    Apps --> Stripe
    Apps --> Jitsi
    Apps --> Mail
```

---

## 📂 Granular Folder Structure

```text
Capstone Project/
├── backend/                     # 🐍 Django 5.x REST API
│   ├── config/                  # Core settings, Celery, and ASGI/WSGI
│   ├── apps/                    # 📦 Core Domain Logic (20+ Apps)
│   │   ├── ai_tutor/            # QBit intelligence & premium plan generator
│   │   ├── emails/              # Campaign & IMAP integrations
│   │   ├── attendance/          # Teacher-Student synchronized tracking
│   │   ├── quizzes/             # 3-Attempt validation & result analysis
│   │   └── live_classes/        # Jitsi coordination & room management
│   ├── requirements.txt         # Dependencies
│   └── manage.py                # CLI Entrypoint
├── frontend/                    # 📱 React Native Expo Mobile
│   ├── app/                     # Navigation & Role-Based Routing
│   ├── store/                   # Zustand Global State
│   └── services/                # API, Firebase SDK & Third-party Clients
├── frontendweb/                 # 💻 Vite React Web Dashboard
│   ├── src/components/          # Premium Cards, Auto IPLinks & UI Elements
│   └── public/                  # Static Assets & Styling (Logo)
└── README.md                    # This master documentation
```

---

## ⚙️ Environment Perfect Detail

Align your local environment with these specific variable groups:

| Variable Group | Purpose | Key Keys |
|:---|:---|:---|
| **Core & Auth** | Platform Identity | `DEBUG`, `SECRET_KEY`, `ALLOWED_HOSTS` |
| **Database** | Persistence Engine | `DATABASE_URL` (Postgres Config) |
| **AI (Groq)** | Generative Intelligence | `GROQ_API_KEY` |
| **Messaging** | Comms & Sync | `EMAIL_HOST_USER`, `IMAP_USER`, `EMAILJS_PUBLIC_KEY` |
| **Payment** | Subscriptions/Courses | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` |
| **Firebase** | OTP Infrastructure | `google-services.json` setup required |
| **Background** | Job Scheduling | `CELERY_BROKER_URL`, `CELERY_RESULT_BACKEND` |

---

## 🛠️ Deployment & Execution

<div align="center">
  <img src="https://img.shields.io/badge/OS-Windows_/_Linux_/_macOS-0078D4?style=for-the-badge&logo=windows&logoColor=white" />
</div>

### 📦 1. Multi-Step Backend Initialization

```bash
# Move to backend
cd backend

# Create & activate isolated environment
python -m venv .venv
source .venv/bin/activate # or .venv\Scripts\activate on Windows

# Install Dependencies
pip install -r requirements.txt

# Migrate Database
python manage.py migrate

# Start Server (Dynamic IP logic auto-handles local network access)
python manage.py runserver 0.0.0.0:8000
```

### ⚡ 2. Real-Time Task Processing

```bash
# Requires Redis locally or via Docker: docker run -p 6379:6379 redis
# In separate terminals (with venv active)
celery -A config worker -l info
celery -A config beat -l info
```

### 📱 3. Cross-Platform Launch (Web & Mobile)

```bash
# Mobile Launch (Expo)
cd frontend
npm install
npx expo start --clear # Scan the QR with your phone

# Web Portal Launch (Vite)
cd frontendweb
npm install
npm run dev
```

---

## 🧪 System Verification Runbook

1. **🔐 Authentication Check**: Login with Mobile OTP via Firebase or test the Email/ID dual-login logic.
2. **📝 Fair-Play Quiz Test**: Attempt a quiz; verify that only up to **3 attempts per day** are allowed, and evaluate the post-quiz performance analysis.
3. **📍 Attendance Sync**: Mark a student present in the Teacher web portal, then view the instant sync on the Student's mobile dashboard metrics.
4. **🧠 AI Plan Generator**: Use the dynamic DataList to pick a subject and export the newly designed **Premium PDF Study Plan**.
5. **📧 Mail Audit**: Verify IMAP synchronization by sending an email to the support address and checking the admin console logs.
6. **📱 Dynamic Rendering**: Checkout the new Premium UI cards and the sleek premium Sidebar Icon integrations in Admin sections.

---

## 🗺️ Visual Roadmap & Milestones

<div align="center">
  <img src="https://geps.dev/progress/92?dangerColor=ff0000&warningColor=ffcc00&successColor=00ff00" alt="Progress Bar" width="80%" />
</div>

| Milestone | Status | Key Deliverables |
|:---|:---:|:---|
| **V1: Core Learning** | ✅ Done | Courses, Lessons, Unified Auth |
| **V2: Real-time** | ✅ Done | Live Classes, Jitsi, Auto-Attendance |
| **V3: AI Integration** | ✅ Done | QBit Chat, Flashcards, Premium Plan |
| **V4: Advanced Logic** | ✅ Done | Firebase OTP, 3-Attempts, Dynamic IP |
| **V5: Full Automation**| 🟡 Active| Campaign Emails, IMAP Sync, UI Cards |
| **V6: Global Scaling** | ⚪ Planned| Multi-Lingual AI, Advanced ML Profiles |

---

## 📬 Contact & Premium Support

<div align="center">
  <img src="frontendweb/public/Logo.png" width="80" alt="MentiQ Footer Logo" />
  <br/>
  <b>The MentiQ Core Development Team</b>
  <br/>
  <a href="mailto:mentiq.learn@gmail.com">Contact via Email</a> | <a href="http://mentiq.com">Official Website</a>
  <br/>
  <i>Bridging the digital divide in modern education with deeply integrated AI.</i>
  <br/>
  📍 Punjab, India
</div>

---
<div align="center">
  <img src="https://readme-typing-svg.herokuapp.com?font=Space+Grotesk&weight=500&size=16&duration=2000&pause=500&color=64748B&center=true&vCenter=true&width=1000&lines=Developed+with+passion+for+better+education;MentiQ+2026+All+Rights+Reserved" alt="Footer Typing SVG" />
</div>
