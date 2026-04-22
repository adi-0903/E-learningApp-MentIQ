# MentiQ E-Learning Platform - System Flowcharts

## Flowchart 1: System Architecture & Data Flow

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#1a1a2e', 'primaryTextColor': '#000000', 'primaryBorderColor': '#16213e', 'lineColor': '#0f3460', 'secondaryColor': '#e94560', 'tertiaryColor': '#f5f5f5', 'fontSize': '16px', 'fontFamily': 'Arial, sans-serif'}}}%%
flowchart TB
    %% Define styles for high contrast
    classDef clientStyle fill:#e3f2fd,stroke:#1565c0,stroke-width:3px,color:#000000,font-weight:bold,font-size:14px
    classDef gatewayStyle fill:#fff3e0,stroke:#ef6c00,stroke-width:3px,color:#000000,font-weight:bold,font-size:14px
    classDef backendStyle fill:#f3e5f5,stroke:#6a1b9a,stroke-width:3px,color:#000000,font-weight:bold,font-size:14px
    classDef dataStyle fill:#e8f5e9,stroke:#2e7d32,stroke-width:3px,color:#000000,font-weight:bold,font-size:14px
    classDef workerStyle fill:#fce4ec,stroke:#c2185b,stroke-width:3px,color:#000000,font-weight:bold,font-size:14px
    classDef subgraphStyle fill:#fafafa,stroke:#424242,stroke-width:2px,color:#000000,font-weight:bold

    subgraph CLIENTS["📱 CLIENT LAYER"]
        direction TB
        WEB["<b>Web App</b><br/>React + Vite"]
        MOBILE["<b>Mobile App</b><br/>Expo/React Native"]
        ADMIN["<b>Admin Panel</b><br/>React"]
    end

    subgraph GATEWAY["🌐 API GATEWAY"]
        direction TB
        NGINX["<b>Nginx</b><br/>Reverse Proxy"]
        RATELIMIT["<b>Rate Limiter</b><br/>django-ratelimit"]
    end

    subgraph BACKEND["⚙️ BACKEND SERVICES - Django 5.x"]
        direction TB
        AUTH["<b>Auth Service</b><br/>JWT/OAuth"]
        COURSES["<b>Course Service</b>"]
        QUIZZES["<b>Quiz Service</b>"]
        LIVE["<b>Live Class</b><br/>Jitsi"]
        PROGRESS["<b>Progress & Badge</b>"]
        PARENT["<b>Parent Service</b>"]
        AI["<b>AI Tutor</b><br/>Groq"]
        NOTIFY["<b>Notifications</b><br/>FCM/Twilio"]
        PAYMENT["<b>Payments</b><br/>Stripe"]
    end

    subgraph DATA["💾 DATA LAYER"]
        direction TB
        PG[("<b>PostgreSQL</b><br/>Primary DB")]
        REDIS[("<b>Redis</b><br/>Cache/Queue")]
        ES[("<b>Elasticsearch</b><br/>Search Index")]
        CLOUD[("<b>Cloudinary</b><br/>Media Storage")]
    end

    subgraph WORKERS["🔧 BACKGROUND WORKERS - Celery"]
        direction TB
        EMAIL["<b>Email Worker</b>"]
        REPORT["<b>Report Generator</b>"]
        VIDEO["<b>Video Processor</b><br/>FFmpeg"]
        CERT["<b>Certificate Gen</b>"]
    end

    %% Apply styles
    class WEB,MOBILE,ADMIN clientStyle
    class NGINX,RATELIMIT gatewayStyle
    class AUTH,COURSES,QUIZZES,LIVE,PROGRESS,PARENT,AI,NOTIFY,PAYMENT backendStyle
    class PG,REDIS,ES,CLOUD dataStyle
    class EMAIL,REPORT,VIDEO,CERT workerStyle
    class CLIENTS,GATEWAY,BACKEND,DATA,WORKERS subgraphStyle

    %% Connections
    WEB --> NGINX
    MOBILE --> NGINX
    ADMIN --> NGINX
    
    NGINX --> RATELIMIT
    RATELIMIT --> AUTH
    RATELIMIT --> COURSES
    RATELIMIT --> QUIZZES
    RATELIMIT --> LIVE
    RATELIMIT --> PROGRESS
    RATELIMIT --> PARENT
    RATELIMIT --> AI
    RATELIMIT --> NOTIFY
    RATELIMIT --> PAYMENT

    AUTH --> PG
    COURSES --> PG
    QUIZZES --> PG
    LIVE --> PG
    PROGRESS --> PG
    PARENT --> PG
    AI --> PG
    NOTIFY --> REDIS
    PAYMENT --> PG

    COURSES --> CLOUD
    LIVE --> CLOUD
    PROGRESS --> CLOUD
    
    AUTH --> REDIS
    COURSES --> REDIS
    QUIZZES --> REDIS
    
    COURSES --> ES
    QUIZZES --> ES

    PROGRESS -.->|"<b>Generate Certificate</b>"| CERT
    PARENT -.->|"<b>Weekly Reports</b>"| REPORT
    NOTIFY -.->|"<b>Send Email</b>"| EMAIL
    COURSES -.->|"<b>Compress Video</b>"| VIDEO

    CERT --> CLOUD
    REPORT --> EMAIL
    EMAIL --> CLOUD
    VIDEO --> CLOUD
```

---

## Flowchart 2: User Authentication & Role-Based Access Flow

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000000', 'fontSize': '16px', 'fontFamily': 'Arial, sans-serif'}}}%%
flowchart TD
    %% High contrast styles
    classDef startEnd fill:#000000,stroke:#000000,stroke-width:4px,color:#ffffff,font-weight:bold,font-size:16px
    classDef process fill:#e3f2fd,stroke:#1565c0,stroke-width:3px,color:#000000,font-weight:bold,font-size:14px
    classDef decision fill:#fff8e1,stroke:#f57c00,stroke-width:3px,color:#000000,font-weight:bold,font-size:14px
    classDef error fill:#ffebee,stroke:#c62828,stroke-width:3px,color:#000000,font-weight:bold,font-size:14px
    classDef success fill:#e8f5e9,stroke:#2e7d32,stroke-width:3px,color:#000000,font-weight:bold,font-size:14px
    classDef role fill:#f3e5f5,stroke:#6a1b9a,stroke-width:3px,color:#000000,font-weight:bold,font-size:14px

    START(["<b>START</b><br/>User Opens App"]) --> SPLASH["<b>Splash Screen</b>"]
    SPLASH --> CHECK_TOKEN{"<b>Check LocalStorage</b><br/>for accessToken?"}
    
    CHECK_TOKEN -->|"<b>Token Found</b>"| VALIDATE["<b>GET /auth/profile/</b><br/>Validate Token"]
    CHECK_TOKEN -->|"<b>No Token</b>"| ONBOARDING{"<b>Seen Onboarding?</b>"}
    
    VALIDATE -->|"<b>Valid</b>"| SET_USER["<b>Set User Data & Role</b>"]
    VALIDATE -->|"<b>Invalid/Expired</b>"| REFRESH{"<b>Try Refresh Token?</b>"}
    
    REFRESH -->|"<b>Success</b>"| SET_USER
    REFRESH -->|"<b>Failed</b>"| ONBOARDING
    
    ONBOARDING -->|"<b>No</b>"| SHOW_ONBOARD["<b>Show Onboarding</b><br/>Introduction Screens"]
    ONBOARDING -->|"<b>Yes</b>"| LOGIN_TYPE{"<b>Select Login Type</b>"}
    
    SHOW_ONBOARD --> LOGIN_TYPE
    
    LOGIN_TYPE -->|"<b>Student/Teacher</b>"| CREDENTIALS["<b>Enter Credentials</b><br/>Email + Password"]
    LOGIN_TYPE -->|"<b>Parent</b>"| PARENT_LOGIN["<b>Parent Login</b><br/>Student ID + Phone OTP"]
    
    CREDENTIALS --> AUTH_API["<b>POST /auth/login/</b><br/>or Social OAuth"]
    PARENT_LOGIN --> PARENT_API["<b>POST /parents/login/</b>"]
    
    AUTH_API --> AUTH_SUCCESS{"<b>Auth Success?</b>"}
    PARENT_API --> AUTH_SUCCESS
    
    AUTH_SUCCESS -->|"<b>Yes ✓</b>"| STORE_TOKENS["<b>Store Tokens</b><br/>accessToken + refreshToken"]
    AUTH_SUCCESS -->|"<b>No ✗</b>"| SHOW_ERROR["<b>Show Error Message</b><br/>Invalid Credentials"]
    
    SHOW_ERROR --> CREDENTIALS
    
    STORE_TOKENS --> CHECK_ROLE{"<b>Check User Role</b>"}
    SET_USER --> CHECK_ROLE
    
    CHECK_ROLE -->|"<b>STUDENT</b>"| STUDENT_DASH["<b>Student Dashboard</b><br/>/app/(student)"]
    CHECK_ROLE -->|"<b>TEACHER</b>"| TEACHER_DASH["<b>Teacher Dashboard</b><br/>/app/(teacher)"]
    CHECK_ROLE -->|"<b>PARENT</b>"| PARENT_DASH["<b>Parent Dashboard</b><br/>Progress Reports"]
    CHECK_ROLE -->|"<b>ADMIN</b>"| ADMIN_DASH["<b>Admin Panel</b><br/>/admin/*"]
    
    STUDENT_DASH --> FEATURES_STUDENT["<b>Student Features:</b><br/>• My Courses<br/>• Quizzes & Exams<br/>• Badges & Leaderboard<br/>• Live Classes<br/>• AI Tutor (QBit)"]
    
    TEACHER_DASH --> FEATURES_TEACHER["<b>Teacher Features:</b><br/>• Curriculum Management<br/>• Attendance Tracking<br/>• Live Classes<br/>• Doubt Resolution<br/>• Parent Connect"]
    
    PARENT_DASH --> FEATURES_PARENT["<b>Parent Features:</b><br/>• Child Progress View<br/>• Weekly Reports<br/>• Attendance Monitor<br/>• Teacher Chat<br/>• Payment History"]
    
    ADMIN_DASH --> FEATURES_ADMIN["<b>Admin Features:</b><br/>• User Management<br/>• Course Oversight<br/>• Enrollment Stats<br/>• Announcements<br/>• Premium Management"]
    
    FEATURES_STUDENT --> LOGOUT{"<b>Logout?</b>"}
    FEATURES_TEACHER --> LOGOUT
    FEATURES_PARENT --> LOGOUT
    FEATURES_ADMIN --> LOGOUT
    
    LOGOUT -->|"<b>Yes</b>"| CLEAR_TOKENS["<b>Clear Tokens</b><br/>POST /auth/logout/"]
    LOGOUT -->|"<b>No</b>"| FEATURES_STUDENT
    
    CLEAR_TOKENS --> LOGIN_TYPE

    %% Apply styles
    class START,END startEnd
    class SPLASH,VALIDATE,SET_USER,SHOW_ONBOARD,CREDENTIALS,PARENT_LOGIN,AUTH_API,PARENT_API,STORE_TOKENS,SHOW_ERROR process
    class CHECK_TOKEN,ONBOARDING,REFRESH,LOGIN_TYPE,AUTH_SUCCESS,CHECK_ROLE,LOGOUT decision
    class CLEAR_TOKENS error
    class STUDENT_DASH,TEACHER_DASH,PARENT_DASH,ADMIN_DASH,FEATURES_STUDENT,FEATURES_TEACHER,FEATURES_PARENT,FEATURES_ADMIN role
```

---

## Flowchart 3: Gamification & Badge System Flow

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000000', 'fontSize': '16px', 'fontFamily': 'Arial, sans-serif'}}}%%
flowchart TD
    %% High contrast styles
    classDef triggerStyle fill:#fff3e0,stroke:#ef6c00,stroke-width:3px,color:#000000,font-weight:bold,font-size:14px
    classDef checkStyle fill:#e8f5e9,stroke:#2e7d32,stroke-width:3px,color:#000000,font-weight:bold,font-size:14px
    classDef dbStyle fill:#e3f2fd,stroke:#1565c0,stroke-width:3px,color:#000000,font-weight:bold,font-size:14px
    classDef awardStyle fill:#f3e5f5,stroke:#6a1b9a,stroke-width:3px,color:#000000,font-weight:bold,font-size:14px
    classDef displayStyle fill:#fce4ec,stroke:#c2185b,stroke-width:3px,color:#000000,font-weight:bold,font-size:14px
    classDef decisionStyle fill:#fff8e1,stroke:#f57c00,stroke-width:3px,color:#000000,font-weight:bold,font-size:14px
    classDef endStyle fill:#000000,stroke:#000000,stroke-width:4px,color:#ffffff,font-weight:bold,font-size:16px
    classDef subgraphStyle fill:#fafafa,stroke:#424242,stroke-width:2px,color:#000000,font-weight:bold

    subgraph TRIGGERS["🎯 ACTIVITY TRIGGERS"]
        direction TB
        QUIZ_COMPLETE["<b>Quiz Completed</b>"]
        LOGIN_STREAK["<b>Daily Login</b>"]
        COURSE_COMPLETE["<b>Course Finished</b>"]
        PERFECT_SCORE["<b>Perfect Score (100%)</b>"]
        HELP_PEER["<b>Helped Peer</b>"]
    end

    subgraph CHECK_LOGIC["🔍 BADGE CHECK LOGIC"]
        direction TB
        CHECK_QUIZ["<b>check_quiz_badge()</b><br/>Score ≥ threshold?"]
        CHECK_STREAK["<b>check_streak_badge()</b><br/>Consecutive days?"]
        CHECK_COURSE["<b>check_course_badge()</b><br/>100% complete?"]
        CHECK_PERFECT["<b>check_perfect_badge()</b><br/>Score = 100%?"]
        CHECK_HELP["<b>check_helper_badge()</b><br/>Help count ≥ 5?"]
    end

    subgraph BADGE_DB["📊 BADGE DATABASE"]
        direction TB
        BADGE_DEF["<b>AchievementBadge</b><br/>• name, description<br/>• icon, rarity<br/>• criteria_type<br/>• points_value"]
        STUDENT_BADGE["<b>StudentBadge</b><br/>• student (FK)<br/>• badge (FK)<br/>• earned_at<br/>• certificate_url"]
    end

    subgraph AWARD_PROCESS["🏆 AWARD PROCESS"]
        direction TB
        CHECK_EXIST{"<b>Already Earned?</b>"}
        CREATE_RECORD["<b>Create StudentBadge Record</b>"]
        GEN_CERT["<b>generate_certificate()</b><br/>Cloudinary Overlay"]
        SAVE_CERT["<b>Save certificate_url</b>"]
        UPDATE_POINTS["<b>Update Total Points</b><br/>update_leaderboard()"]
        SEND_NOTIF["<b>Send Push + Email</b><br/>Notification"]
    end

    subgraph DISPLAY["📱 DISPLAY LAYERS"]
        direction TB
        MOBILE_GALLERY["<b>Mobile App:</b><br/>MyBadgesScreen<br/>BadgeCard Components"]
        WEB_GALLERY["<b>Web App:</b><br/>BadgeGallery.jsx<br/>Glassmorphism UI"]
        LEADERBOARD["<b>Leaderboard</b><br/>Global / School / Class<br/>Podium Display"]
    end

    QUIZ_COMPLETE --> CHECK_QUIZ
    LOGIN_STREAK --> CHECK_STREAK
    COURSE_COMPLETE --> CHECK_COURSE
    PERFECT_SCORE --> CHECK_PERFECT
    HELP_PEER --> CHECK_HELP

    CHECK_QUIZ -->|"<b>✓ Criteria Met</b>"| BADGE_DEF
    CHECK_STREAK -->|"<b>✓ Criteria Met</b>"| BADGE_DEF
    CHECK_COURSE -->|"<b>✓ Criteria Met</b>"| BADGE_DEF
    CHECK_PERFECT -->|"<b>✓ Criteria Met</b>"| BADGE_DEF
    CHECK_HELP -->|"<b>✓ Criteria Met</b>"| BADGE_DEF

    BADGE_DEF --> CHECK_EXIST
    CHECK_EXIST -->|"<b>No</b>"| CREATE_RECORD
    CHECK_EXIST -->|"<b>Yes</b>"| END1(["<b>SKIP</b><br/>Already Owned"])
    
    CREATE_RECORD --> GEN_CERT
    GEN_CERT --> SAVE_CERT
    SAVE_CERT --> STUDENT_BADGE
    SAVE_CERT --> UPDATE_POINTS
    UPDATE_POINTS --> SEND_NOTIF
    
    SEND_NOTIF --> SHOW_ANIMATION["<b>Show BadgeEarnedModal</b><br/>Animation + Confetti"]
    
    STUDENT_BADGE -->|"<b>API: GET /my-badges/</b>"| MOBILE_GALLERY
    STUDENT_BADGE -->|"<b>API: GET /my-badges/</b>"| WEB_GALLERY
    UPDATE_POINTS -->|"<b>API: GET /leaderboard/</b>"| LEADERBOARD

    SHOW_ANIMATION --> END2(["<b>SUCCESS!</b><br/>User Sees New Badge"])

    %% Apply styles
    class QUIZ_COMPLETE,LOGIN_STREAK,COURSE_COMPLETE,PERFECT_SCORE,HELP_PEER triggerStyle
    class CHECK_QUIZ,CHECK_STREAK,CHECK_COURSE,CHECK_PERFECT,CHECK_HELP checkStyle
    class BADGE_DEF,STUDENT_BADGE dbStyle
    class CHECK_EXIST decisionStyle
    class CREATE_RECORD,GEN_CERT,SAVE_CERT,UPDATE_POINTS,SEND_NOTIF,SHOW_ANIMATION awardStyle
    class MOBILE_GALLERY,WEB_GALLERY,LEADERBOARD displayStyle
    class END1,END2 endStyle
    class TRIGGERS,CHECK_LOGIC,BADGE_DB,AWARD_PROCESS,DISPLAY subgraphStyle
```

---

## Flowchart 4: Learning Content Delivery Flow

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000000', 'fontSize': '16px', 'fontFamily': 'Arial, sans-serif'}}}%%
flowchart TD
    %% High contrast styles
    classDef creatorStyle fill:#fff3e0,stroke:#ef6c00,stroke-width:3px,color:#000000,font-weight:bold,font-size:14px
    classDef processStyle fill:#e8f5e9,stroke:#2e7d32,stroke-width:3px,color:#000000,font-weight:bold,font-size:14px
    classDef enrollStyle fill:#e3f2fd,stroke:#1565c0,stroke-width:3px,color:#000000,font-weight:bold,font-size:14px
    classDef consumeStyle fill:#f3e5f5,stroke:#6a1b9a,stroke-width:3px,color:#000000,font-weight:bold,font-size:14px
    classDef aiStyle fill:#fce4ec,stroke:#c2185b,stroke-width:3px,color:#000000,font-weight:bold,font-size:14px
    classDef decisionStyle fill:#fff8e1,stroke:#f57c00,stroke-width:3px,color:#000000,font-weight:bold,font-size:14px
    classDef arrowStyle fill:#ffebee,stroke:#c62828,stroke-width:3px,color:#000000,font-weight:bold,font-size:14px
    classDef subgraphStyle fill:#fafafa,stroke:#424242,stroke-width:2px,color:#000000,font-weight:bold

    subgraph CREATION["📝 CONTENT CREATION"]
        direction TB
        TEACHER["<b>Teacher / Admin</b>"]
        CREATE_COURSE["<b>Create Course</b><br/>POST /courses/"]
        ADD_LESSON["<b>Add Lesson</b><br/>POST /lessons/"]
        UPLOAD_VIDEO["<b>Upload Video</b><br/>Cloudinary Storage"]
        CREATE_QUIZ["<b>Create Quiz</b><br/>POST /quizzes/"]
        ADD_QUESTIONS["<b>Add Questions</b><br/>MCQ / Short / Long"]
    end

    subgraph PROCESSING["⚙️ PROCESSING PIPELINE"]
        direction TB
        COMPRESS["<b>Video Compression</b><br/>FFmpeg: 240p/360p/720p"]
        EXTRACT_AUDIO["<b>Audio Extraction</b><br/>For Offline Mode"]
        GEN_THUMBNAIL["<b>Auto Thumbnail</b><br/>Cloudinary"]
        INDEX_ES["<b>Index to Elasticsearch</b><br/>Searchable Content"]
        NOTIFY_STUDENTS["<b>Notify Students</b><br/>FCM Push Notification"]
    end

    subgraph ENROLLMENT["🎓 ENROLLMENT"]
        direction TB
        STUDENT_BROWSE["<b>Student Browses</b><br/>Course Catalog"]
        SEARCH["<b>Search Courses</b><br/>GET /courses/?search="]
        FILTER["<b>Filter Options:</b><br/>• Subject<br/>• Grade Level<br/>• Price Range"]
        SELECT["<b>Select Course</b>"]
        CHECK_ENROLL{"<b>Already Enrolled?</b>"}
        PAYMENT["<b>Payment Gateway</b><br/>Stripe / UPI"]
        ENROLL_CONFIRM["<b>Enrollment Confirmed</b><br/>Create Progress Record"]
    end

    subgraph CONSUMPTION["📚 CONTENT CONSUMPTION"]
        direction TB
        MY_COURSES["<b>My Courses Page</b>"]
        SELECT_LESSON["<b>Select Lesson</b>"]
        CHECK_OFFLINE{"<b>Offline Mode?</b>"}
        STREAM["<b>Stream Video</b><br/>Adaptive Quality"]
        DOWNLOAD["<b>Download Offline</b><br/>HLS / DASH"]
        TAKE_QUIZ["<b>Take Quiz</b>"]
        SUBMIT["<b>Submit Answers</b>"]
        AUTO_GRADE["<b>Auto-Grade MCQ</b><br/>AI-Grade Written"]
        SHOW_RESULT["<b>Show Results</b><br/>Explanations"]
        UPDATE_PROGRESS["<b>Update Progress %</b><br/>Check Badge Triggers"]
    end

    subgraph AI_SUPPORT["🤖 AI SUPPORT"]
        direction TB
        TRACK_EMOTION["<b>Track Emotion</b><br/>Interaction Patterns"]
        DETECT_CONFUSED{"<b>Confusion Detected?</b>"}
        ADAPT_CONTENT["<b>Adapt Content:</b><br/>• Slower Pace<br/>• Show Hints<br/>• Simpler Explain"]
        ASK_DOUBT["<b>Ask Doubt</b><br/>QBit AI Tutor"]
        AI_RESPONSE["<b>Groq LLM</b><br/>Context-Aware Answer"]
    end

    TEACHER --> CREATE_COURSE
    CREATE_COURSE --> ADD_LESSON
    ADD_LESSON --> UPLOAD_VIDEO
    ADD_LESSON --> CREATE_QUIZ
    CREATE_QUIZ --> ADD_QUESTIONS
    
    UPLOAD_VIDEO --> COMPRESS
    COMPRESS --> EXTRACT_AUDIO
    COMPRESS --> GEN_THUMBNAIL
    ADD_LESSON --> INDEX_ES
    CREATE_QUIZ --> INDEX_ES
    GEN_THUMBNAIL --> NOTIFY_STUDENTS

    STUDENT_BROWSE --> SEARCH
    SEARCH --> FILTER
    FILTER --> SELECT
    SELECT --> CHECK_ENROLL
    CHECK_ENROLL -->|"<b>No</b>"| PAYMENT
    CHECK_ENROLL -->|"<b>Yes ✓</b>"| MY_COURSES
    PAYMENT --> ENROLL_CONFIRM
    ENROLL_CONFIRM --> MY_COURSES

    MY_COURSES --> SELECT_LESSON
    SELECT_LESSON --> CHECK_OFFLINE
    CHECK_OFFLINE -->|"<b>No</b>"| STREAM
    CHECK_OFFLINE -->|"<b>Yes ✓</b>"| DOWNLOAD
    
    STREAM --> TRACK_EMOTION
    DOWNLOAD --> TAKE_QUIZ
    
    TRACK_EMOTION --> DETECT_CONFUSED
    DETECT_CONFUSED -->|"<b>Yes ✓</b>"| ADAPT_CONTENT
    DETECT_CONFUSED -->|"<b>No</b>"| TAKE_QUIZ
    
    SELECT_LESSON --> ASK_DOUBT
    ASK_DOUBT --> AI_RESPONSE
    
    TAKE_QUIZ --> SUBMIT
    SUBMIT --> AUTO_GRADE
    AUTO_GRADE --> SHOW_RESULT
    SHOW_RESULT --> UPDATE_PROGRESS
    UPDATE_PROGRESS -->|"<b>→ Badge System</b>"| TRIGGERS["<b>Badge Check</b>"]

    %% Apply styles
    class TEACHER,CREATE_COURSE,ADD_LESSON,UPLOAD_VIDEO,CREATE_QUIZ,ADD_QUESTIONS creatorStyle
    class COMPRESS,EXTRACT_AUDIO,GEN_THUMBNAIL,INDEX_ES,NOTIFY_STUDENTS processStyle
    class STUDENT_BROWSE,SEARCH,FILTER,SELECT,PAYMENT,ENROLL_CONFIRM enrollStyle
    class MY_COURSES,SELECT_LESSON,STREAM,DOWNLOAD,TAKE_QUIZ,SUBMIT,AUTO_GRADE,SHOW_RESULT,UPDATE_PROGRESS consumeStyle
    class TRACK_EMOTION,ADAPT_CONTENT,ASK_DOUBT,AI_RESPONSE aiStyle
    class CHECK_ENROLL,CHECK_OFFLINE,DETECT_CONFUSED decisionStyle
    class TRIGGERS arrowStyle
    class CREATION,PROCESSING,ENROLLMENT,CONSUMPTION,AI_SUPPORT subgraphStyle
```

---

## Flowchart 5: Live Class Session Flow

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000000', 'fontSize': '16px', 'fontFamily': 'Arial, sans-serif'}}}%%
flowchart TD
    %% High contrast styles
    classDef initStyle fill:#fff3e0,stroke:#ef6c00,stroke-width:3px,color:#000000,font-weight:bold,font-size:14px
    classDef teacherStyle fill:#e3f2fd,stroke:#1565c0,stroke-width:3px,color:#000000,font-weight:bold,font-size:14px
    classDef studentStyle fill:#e8f5e9,stroke:#2e7d32,stroke-width:3px,color:#000000,font-weight:bold,font-size:14px
    classDef featureStyle fill:#f3e5f5,stroke:#6a1b9a,stroke-width:3px,color:#000000,font-weight:bold,font-size:14px
    classDef endStyle fill:#000000,stroke:#000000,stroke-width:4px,color:#ffffff,font-weight:bold,font-size:16px
    classDef subgraphStyle fill:#fafafa,stroke:#424242,stroke-width:2px,color:#000000,font-weight:bold

    SCHEDULE["<b>Schedule Live Class</b><br/>POST /live-classes/"]
    NOTIFY_ENROLL["<b>Notify Enrolled Students</b><br/>Push + Email Alert"]
    
    subgraph TEACHER_START["👨‍🏫 TEACHER START"]
        direction TB
        TEACHER_LOGIN["<b>Teacher Login</b>"]
        GO_LIVE["<b>Click 'Go Live'</b>"]
        CREATE_JITSI["<b>Create Jitsi Room</b><br/>Generate JWT Token"]
        START_STREAM["<b>Start Broadcasting</b><br/>Optional: YouTube RTMP"]
        SHARE_SCREEN["<b>Share Screen / PDF</b><br/>Whiteboard Tools"]
    end

    subgraph STUDENT_JOIN["👨‍🎓 STUDENT JOIN"]
        direction TB
        STUDENT_LOGIN["<b>Student Login</b>"]
        SEE_NOTIFICATION["<b>See 'Live Now' Badge</b><br/>In-App Notification"]
        CLICK_JOIN["<b>Click 'Join Class'</b>"]
        ENTER_JITSI["<b>Enter Jitsi Room</b><br/>WebRTC Connection"]
        INTERACT["<b>Interact:</b><br/>• Raise Hand<br/>• Chat Message<br/>• Send Emojis"]
    end

    subgraph CLASS_FEATURES["⚡ CLASS FEATURES"]
        direction TB
        WHITEBOARD["<b>Collaborative Whiteboard</b><br/>Excalidraw Integration"]
        POLL["<b>Live Polls</b><br/>Real-time Results"]
        QUIZ["<b>In-class Quiz</b><br/>Instant Grading"]
        RECORD["<b>Auto Record</b><br/>Save to Cloudinary"]
    end

    subgraph END_CLASS["🏁 END SESSION"]
        direction TB
        TEACHER_END["<b>Teacher Ends Class</b>"]
        SAVE_ATTENDANCE["<b>Save Attendance</b><br/>Duration Tracked"]
        UPLOAD_RECORDING["<b>Upload Recording</b><br/>For Replays"]
        NOTIFY_UPLOAD["<b>Notify Students:</b><br/>Recording Ready"]
    end

    SCHEDULE --> NOTIFY_ENROLL
    NOTIFY_ENROLL --> TEACHER_LOGIN
    NOTIFY_ENROLL --> STUDENT_LOGIN
    
    TEACHER_LOGIN --> GO_LIVE
    GO_LIVE --> CREATE_JITSI
    CREATE_JITSI --> START_STREAM
    START_STREAM --> SHARE_SCREEN
    
    STUDENT_LOGIN --> SEE_NOTIFICATION
    SEE_NOTIFICATION --> CLICK_JOIN
    CLICK_JOIN --> ENTER_JITSI
    ENTER_JITSI --> INTERACT
    
    SHARE_SCREEN --> WHITEBOARD
    SHARE_SCREEN --> POLL
    SHARE_SCREEN --> QUIZ
    START_STREAM --> RECORD
    
    WHITEBOARD --> TEACHER_END
    POLL --> TEACHER_END
    QUIZ --> TEACHER_END
    RECORD --> TEACHER_END
    INTERACT --> TEACHER_END
    
    TEACHER_END --> SAVE_ATTENDANCE
    SAVE_ATTENDANCE --> UPLOAD_RECORDING
    UPLOAD_RECORDING --> NOTIFY_UPLOAD
    
    NOTIFY_UPLOAD --> END1(["<b>SESSION COMPLETE</b>"])

    %% Apply styles
    class SCHEDULE,NOTIFY_ENROLL initStyle
    class TEACHER_LOGIN,GO_LIVE,CREATE_JITSI,START_STREAM,SHARE_SCREEN teacherStyle
    class STUDENT_LOGIN,SEE_NOTIFICATION,CLICK_JOIN,ENTER_JITSI,INTERACT studentStyle
    class WHITEBOARD,POLL,QUIZ,RECORD featureStyle
    class TEACHER_END,SAVE_ATTENDANCE,UPLOAD_RECORDING,NOTIFY_UPLOAD endStyle
    class END1 endStyle
    class TEACHER_START,STUDENT_JOIN,CLASS_FEATURES,END_CLASS subgraphStyle
```

---

## Flowchart 6: Payment & Subscription Flow

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000000', 'fontSize': '16px', 'fontFamily': 'Arial, sans-serif'}}}%%
flowchart TD
    %% High contrast styles
    classDef browseStyle fill:#e3f2fd,stroke:#1565c0,stroke-width:3px,color:#000000,font-weight:bold,font-size:14px
    classDef planStyle fill:#fff3e0,stroke:#ef6c00,stroke-width:3px,color:#000000,font-weight:bold,font-size:14px
    classDef payStyle fill:#e8f5e9,stroke:#2e7d32,stroke-width:3px,color:#000000,font-weight:bold,font-size:14px
    classDef processStyle fill:#f3e5f5,stroke:#6a1b9a,stroke-width:3px,color:#000000,font-weight:bold,font-size:14px
    classDef confirmStyle fill:#fce4ec,stroke:#c2185b,stroke-width:3px,color:#000000,font-weight:bold,font-size:14px
    classDef decisionStyle fill:#fff8e1,stroke:#f57c00,stroke-width:3px,color:#000000,font-weight:bold,font-size:14px
    classDef endStyle fill:#000000,stroke:#000000,stroke-width:4px,color:#ffffff,font-weight:bold,font-size:16px
    classDef subgraphStyle fill:#fafafa,stroke:#424242,stroke-width:2px,color:#000000,font-weight:bold

    subgraph BROWSE["🔍 COURSE BROWSING"]
        direction TB
        VIEW_COURSE["<b>View Course Details</b>"]
        CHECK_PRICE{"<b>Free or Paid?</b>"}
        FREE_ENROLL["<b>Free: Direct Enroll</b>"]
        SEE_PLANS["<b>Paid: See Pricing Plans</b>"]
    end

    subgraph PLANS["💎 SUBSCRIPTION PLANS"]
        direction TB
        BASIC["<b>BASIC - Free</b><br/>Limited Access"]
        PREMIUM["<b>PREMIUM - ₹999/mo</b><br/>Full Access + Features"]
        SCHOLARSHIP["<b>Scholarship - ₹0</b><br/>Merit-Based"]
        SELECT_PLAN["<b>Select Plan</b>"]
    end

    subgraph PAYMENT_GATEWAY["💳 PAYMENT PROCESSING"]
        direction TB
        ENTER_DETAILS["<b>Enter Payment Details</b>"]
        CHOOSE_METHOD{"<b>Payment Method?</b>"}
        STRIPE["<b>Stripe</b><br/>Card/UPI"]
        RAZORPAY["<b>Razorpay</b><br/>UPI/Wallet/NetBanking"]
        PROCESS_PAY["<b>Process Payment</b>"]
    end

    subgraph CONFIRMATION["✅ PAYMENT CONFIRMATION"]
        direction TB
        VERIFY{"<b>Payment Success?</b>"}
        SUCCESS["<b>Payment Successful</b>"]
        FAILED["<b>Payment Failed</b>"]
        RETRY["<b>Retry / Change Method</b>"]
        ACTIVATE["<b>Activate Subscription</b>"]
        SEND_INVOICE["<b>Send Invoice Email</b><br/>PDF Receipt"]
    end

    subgraph ACCESS["🎓 POST-PAYMENT ACCESS"]
        direction TB
        FULL_ACCESS["<b>Full Course Access</b>"]
        PREMIUM_FEATURES["<b>Premium Features:</b><br/>• Download Offline<br/>• AI Tutor Unlimited<br/>• Priority Support"]
        RENEWAL{"<b>Auto-Renewal?</b>"}
        RENEW["<b>Auto-Renew Monthly</b>"]
        EXPIRE["<b>Subscription Expires</b>"]
    end

    VIEW_COURSE --> CHECK_PRICE
    CHECK_PRICE -->|"<b>Free ✓</b>"| FREE_ENROLL
    CHECK_PRICE -->|"<b>Paid ₹</b>"| SEE_PLANS
    
    SEE_PLANS --> BASIC
    SEE_PLANS --> PREMIUM
    SEE_PLANS --> SCHOLARSHIP
    BASIC --> SELECT_PLAN
    PREMIUM --> SELECT_PLAN
    SCHOLARSHIP --> SELECT_PLAN
    
    SELECT_PLAN --> ENTER_DETAILS
    ENTER_DETAILS --> CHOOSE_METHOD
    CHOOSE_METHOD -->|"<b>International</b>"| STRIPE
    CHOOSE_METHOD -->|"<b>India</b>"| RAZORPAY
    STRIPE --> PROCESS_PAY
    RAZORPAY --> PROCESS_PAY
    
    PROCESS_PAY --> VERIFY
    VERIFY -->|"<b>✓ Success</b>"| SUCCESS
    VERIFY -->|"<b>✗ Failed</b>"| FAILED
    FAILED --> RETRY
    RETRY --> ENTER_DETAILS
    
    SUCCESS --> ACTIVATE
    ACTIVATE --> SEND_INVOICE
    ACTIVATE --> FULL_ACCESS
    FULL_ACCESS --> PREMIUM_FEATURES
    PREMIUM_FEATURES --> RENEWAL
    RENEWAL -->|"<b>Yes ✓</b>"| RENEW
    RENEWAL -->|"<b>No</b>"| EXPIRE
    
    FREE_ENROLL --> END1(["<b>ENROLLED</b>"])
    RENEW --> END2(["<b>SUBSCRIPTION ACTIVE</b>"])
    EXPIRE --> END3(["<b>ACCESS REVOKED</b>"])

    %% Apply styles
    class VIEW_COURSE,CHECK_PRICE browseStyle
    class FREE_ENROLL planStyle
    class SEE_PLANS,BASIC,PREMIUM,SCHOLARSHIP,SELECT_PLAN planStyle
    class ENTER_DETAILS,CHOOSE_METHOD payStyle
    class STRIPE,RAZORPAY,PROCESS_PAY processStyle
    class VERIFY decisionStyle
    class SUCCESS,FAILED,RETRY,ACTIVATE,SEND_INVOICE confirmStyle
    class FULL_ACCESS,PREMIUM_FEATURES,RENEWAL,RENEW,EXPIRE confirmStyle
    class END1,END2,END3 endStyle
    class BROWSE,PLANS,PAYMENT_GATEWAY,CONFIRMATION,ACCESS subgraphStyle
```

---

## Flowchart 7: Parent Dashboard & Weekly Reporting Flow

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000000', 'fontSize': '16px', 'fontFamily': 'Arial, sans-serif'}}}%%
flowchart TD
    %% High contrast styles
    classDef linkStyle fill:#e3f2fd,stroke:#1565c0,stroke-width:3px,color:#000000,font-weight:bold,font-size:14px
    classDef viewStyle fill:#fff3e0,stroke:#ef6c00,stroke-width:3px,color:#000000,font-weight:bold,font-size:14px
    classDef reportStyle fill:#e8f5e9,stroke:#2e7d32,stroke-width:3px,color:#000000,font-weight:bold,font-size:14px
    classDef alertStyle fill:#ffebee,stroke:#c62828,stroke-width:3px,color:#000000,font-weight:bold,font-size:14px
    classDef successStyle fill:#e8f5e9,stroke:#2e7d32,stroke-width:3px,color:#000000,font-weight:bold,font-size:14px
    classDef failStyle fill:#ffebee,stroke:#c62828,stroke-width:3px,color:#000000,font-weight:bold,font-size:14px
    classDef decisionStyle fill:#fff8e1,stroke:#f57c00,stroke-width:3px,color:#000000,font-weight:bold,font-size:14px
    classDef endStyle fill:#000000,stroke:#000000,stroke-width:4px,color:#ffffff,font-weight:bold,font-size:16px
    classDef subgraphStyle fill:#fafafa,stroke:#424242,stroke-width:2px,color:#000000,font-weight:bold

    subgraph LINKING["🔗 PARENT-CHILD LINKING"]
        direction TB
        PARENT_REG["<b>Parent Registration</b><br/>Phone + Email"]
        REQUEST_LINK["<b>Request to Link Child</b><br/>Enter Student ID"]
        NOTIFY_STUDENT["<b>Notify Student</b><br/>Approval Request"]
        STUDENT_APPROVE{"<b>Student Approves?</b>"}
        LINKED["<b>✓ Linked Successfully</b>"]
        REJECTED["<b>✗ Link Rejected</b>"]
    end

    subgraph DASHBOARD["📊 PARENT DASHBOARD VIEW"]
        direction TB
        SELECT_CHILD["<b>Select Child</b><br/>If Multiple"]
        VIEW_PROGRESS["<b>View Progress</b><br/>Courses & Completion"]
        VIEW_ATTENDANCE["<b>View Attendance</b><br/>Live Classes & Quizzes"]
        VIEW_GRADES["<b>View Grades</b><br/>Quiz Scores & Trends"]
        VIEW_BADGES["<b>View Badges Earned</b>"]
    end

    subgraph WEEKLY_REPORT["📈 WEEKLY REPORT GENERATION"]
        direction TB
        CELERY_TASK["<b>Celery Scheduled Task</b><br/>Every Sunday 8 AM"]
        AGGREGATE["<b>Aggregate Data:</b><br/>• Study Hours<br/>• Quiz Scores<br/>• Attendance %<br/>• Badges Earned"]
        GEN_PDF["<b>Generate PDF Report</b><br/>Styled Template"]
        SEND_EMAIL["<b>Send Email</b><br/>Weekly Summary"]
        IN_APP_NOTIF["<b>In-App Notification</b><br/>Report Ready"]
    end

    subgraph ALERTS["🚨 SMART ALERTS"]
        direction TB
        LOW_SCORE{"<b>Quiz Score < 40%?</b>"}
        LOW_ATTENDANCE{"<b>Attendance < 75%?</b>"}
        NO_ACTIVITY{"<b>No Login > 3 Days?</b>"}
        ALERT_PARENT["<b>Alert Parent</b><br/>Immediate Email/SMS"]
        SUGGEST_ACTION["<b>Suggest Action:</b><br/>Contact Teacher / Schedule Chat"]
    end

    subgraph ACTIONS["👥 PARENT ACTIONS"]
        direction TB
        CHAT_TEACHER["<b>Chat with Teacher</b>"]
        SCHEDULE_MEETING["<b>Schedule 1:1 Meeting</b>"]
        VIEW_PAYMENTS["<b>View Payment History</b>"]
        SET_GOALS["<b>Set Study Goals</b><br/>For Child"]
    end

    PARENT_REG --> REQUEST_LINK
    REQUEST_LINK --> NOTIFY_STUDENT
    NOTIFY_STUDENT --> STUDENT_APPROVE
    STUDENT_APPROVE -->|"<b>Yes ✓</b>"| LINKED
    STUDENT_APPROVE -->|"<b>No ✗</b>"| REJECTED
    REJECTED --> REQUEST_LINK
    
    LINKED --> SELECT_CHILD
    SELECT_CHILD --> VIEW_PROGRESS
    SELECT_CHILD --> VIEW_ATTENDANCE
    SELECT_CHILD --> VIEW_GRADES
    SELECT_CHILD --> VIEW_BADGES
    
    VIEW_PROGRESS --> CELERY_TASK
    VIEW_ATTENDANCE --> CELERY_TASK
    VIEW_GRADES --> CELERY_TASK
    VIEW_BADGES --> CELERY_TASK
    
    CELERY_TASK --> AGGREGATE
    AGGREGATE --> GEN_PDF
    GEN_PDF --> SEND_EMAIL
    GEN_PDF --> IN_APP_NOTIF
    
    VIEW_GRADES --> LOW_SCORE
    VIEW_ATTENDANCE --> LOW_ATTENDANCE
    VIEW_PROGRESS --> NO_ACTIVITY
    
    LOW_SCORE -->|"<b>Yes</b>"| ALERT_PARENT
    LOW_ATTENDANCE -->|"<b>Yes</b>"| ALERT_PARENT
    NO_ACTIVITY -->|"<b>Yes</b>"| ALERT_PARENT
    
    ALERT_PARENT --> SUGGEST_ACTION
    SUGGEST_ACTION --> CHAT_TEACHER
    SUGGEST_ACTION --> SCHEDULE_MEETING
    
    SEND_EMAIL --> VIEW_PAYMENTS
    IN_APP_NOTIF --> SET_GOALS
    
    CHAT_TEACHER --> END1(["<b>PARENT ENGAGED</b>"])
    SCHEDULE_MEETING --> END1
    VIEW_PAYMENTS --> END1
    SET_GOALS --> END1

    %% Apply styles
    class PARENT_REG,REQUEST_LINK,NOTIFY_STUDENT,STUDENT_APPROVE linkStyle
    class LINKED successStyle
    class REJECTED failStyle
    class SELECT_CHILD,VIEW_PROGRESS,VIEW_ATTENDANCE,VIEW_GRADES,VIEW_BADGES viewStyle
    class CELERY_TASK,AGGREGATE,GEN_PDF,SEND_EMAIL,IN_APP_NOTIF reportStyle
    class LOW_SCORE,LOW_ATTENDANCE,NO_ACTIVITY decisionStyle
    class ALERT_PARENT,SUGGEST_ACTION alertStyle
    class CHAT_TEACHER,SCHEDULE_MEETING,VIEW_PAYMENTS,SET_GOALS alertStyle
    class END1 endStyle
    class LINKING,DASHBOARD,WEEKLY_REPORT,ALERTS,ACTIONS subgraphStyle
```

---

## Flowchart 8: AI Tutor (QBit) Interaction Flow

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000000', 'fontSize': '16px', 'fontFamily': 'Arial, sans-serif'}}}%%
flowchart TD
    %% High contrast styles
    classDef triggerStyle fill:#e3f2fd,stroke:#1565c0,stroke-width:3px,color:#000000,font-weight:bold,font-size:14px
    classDef detectStyle fill:#fff3e0,stroke:#ef6c00,stroke-width:3px,color:#000000,font-weight:bold,font-size:14px
    classDef aiStyle fill:#f3e5f5,stroke:#6a1b9a,stroke-width:3px,color:#000000,font-weight:bold,font-size:14px
    classDef responseStyle fill:#e8f5e9,stroke:#2e7d32,stroke-width:3px,color:#000000,font-weight:bold,font-size:14px
    classDef feedbackStyle fill:#fce4ec,stroke:#c2185b,stroke-width:3px,color:#000000,font-weight:bold,font-size:14px
    classDef decisionStyle fill:#fff8e1,stroke:#f57c00,stroke-width:3px,color:#000000,font-weight:bold,font-size:14px
    classDef endStyle fill:#000000,stroke:#000000,stroke-width:4px,color:#ffffff,font-weight:bold,font-size:16px
    classDef subgraphStyle fill:#fafafa,stroke:#424242,stroke-width:2px,color:#000000,font-weight:bold

    subgraph TRIGGERS["🎯 INTERACTION TRIGGERS"]
        direction TB
        STUDENT_ASK["<b>Student Asks Doubt</b><br/>Type Question"]
        AUTO_DETECT["<b>Auto-Detect Confusion</b><br/>From Interaction Patterns"]
        STRUGGLE_DETECT["<b>Struggle Detected</b><br/>Wrong Answers Repeated"]
        CONTEXT_AWARE["<b>Context-Aware</b><br/>Current Lesson Page"]
    end

    subgraph EMOTION["🧠 EMOTION DETECTION ENGINE"]
        direction TB
        TRACK_INPUT["<b>Track Input Patterns:</b><br/>• Typing Speed<br/>• Pause Duration<br/>• Mouse Movements<br/>• Scroll Behavior"]
        CALC_SCORE["<b>Calculate Emotion Score</b><br/>0.0 - 1.0"]
        DETECT_STATE{"<b>Detect State?</b>"}
        CONFUSED["<b>CONFUSED</b><br/>Score > 0.7"]
        FRUSTRATED["<b>FRUSTRATED</b><br/>Repeated Errors"]
        ENGAGED["<b>ENGAGED</b><br/>Normal Flow"]
    end

    subgraph AI_PROCESS["🤖 AI PROCESSING"]
        direction TB
        GROQ_API["<b>Groq LLM API</b><br/>llama-3.3-70b-versatile"]
        BUILD_PROMPT["<b>Build Context Prompt:</b><br/>• Student Grade<br/>• Subject<br/>• Lesson Context<br/>• Emotion State"]
        RAG_SEARCH["<b>RAG Search</b><br/>Relevant Lesson Content"]
        GENERATE["<b>Generate Response</b>"]
        FORMAT_OUTPUT["<b>Format Output:</b><br/>• Explanation<br/>• Examples<br/>• Practice Tips"]
    end

    subgraph RESPONSE["💬 RESPONSE DELIVERY"]
        direction TB
        ADAPT_TONE["<b>Adapt Tone:</b><br/>Based on Emotion"]
        SHOW_TEXT["<b>Show Text Response</b>"]
        TTS_OPTION["<b>Text-to-Speech</b><br/>Optional"]
        VISUAL_AID["<b>Show Visual Aid</b><br/>Diagram/Formula"]
    end

    subgraph FEEDBACK["📊 FEEDBACK LOOP"]
        direction TB
        ASK_HELPFUL{"<b>Was this helpful?</b>"}
        THUMBS_UP["<b>👍 Thumbs Up</b><br/>Log Positive"]
        THUMBS_DOWN["<b>👎 Thumbs Down</b><br/>Escalate to Teacher"]
        UPDATE_MODEL["<b>Update Preference Model</b><br/>Improve Future Responses"]
    end

    subgraph HISTORY["📝 INTERACTION HISTORY"]
        direction TB
        SAVE_CHAT["<b>Save Chat Log</b><br/>PostgreSQL"]
        PRIVACY_RETAIN{"<b>Retention Policy:</b><br/>20 Days"}
        DELETE_OLD["<b>Auto-Delete Old</b><br/>Privacy Compliance"]
        ANALYTICS["<b>Analytics Dashboard</b><br/>Teacher View"]
    end

    STUDENT_ASK --> TRACK_INPUT
    AUTO_DETECT --> TRACK_INPUT
    STRUGGLE_DETECT --> TRACK_INPUT
    CONTEXT_AWARE --> BUILD_PROMPT
    
    TRACK_INPUT --> CALC_SCORE
    CALC_SCORE --> DETECT_STATE
    DETECT_STATE -->|"<b>Confused</b>"| CONFUSED
    DETECT_STATE -->|"<b>Frustrated</b>"| FRUSTRATED
    DETECT_STATE -->|"<b>Engaged</b>"| ENGAGED
    
    CONFUSED --> BUILD_PROMPT
    FRUSTRATED --> BUILD_PROMPT
    ENGAGED --> BUILD_PROMPT
    
    BUILD_PROMPT --> GROQ_API
    GROQ_API --> RAG_SEARCH
    RAG_SEARCH --> GENERATE
    GENERATE --> FORMAT_OUTPUT
    
    FORMAT_OUTPUT --> ADAPT_TONE
    ADAPT_TONE --> SHOW_TEXT
    SHOW_TEXT --> TTS_OPTION
    SHOW_TEXT --> VISUAL_AID
    
    SHOW_TEXT --> ASK_HELPFUL
    ASK_HELPFUL -->|"<b>Yes ✓</b>"| THUMBS_UP
    ASK_HELPFUL -->|"<b>No ✗</b>"| THUMBS_DOWN
    
    THUMBS_UP --> UPDATE_MODEL
    THUMBS_DOWN --> UPDATE_MODEL
    
    SHOW_TEXT --> SAVE_CHAT
    SAVE_CHAT --> PRIVACY_RETAIN
    PRIVACY_RETAIN --> DELETE_OLD
    SAVE_CHAT --> ANALYTICS
    
    UPDATE_MODEL --> END1(["<b>LEARNING OPTIMIZED</b>"])
    ANALYTICS --> END1
    DELETE_OLD --> END1

    %% Apply styles
    class STUDENT_ASK,AUTO_DETECT,STRUGGLE_DETECT,CONTEXT_AWARE triggerStyle
    class TRACK_INPUT,CALC_SCORE,DETECT_STATE detectStyle
    class CONFUSED,FRUSTRATED,ENGAGED detectStyle
    class GROQ_API,BUILD_PROMPT,RAG_SEARCH,GENERATE,FORMAT_OUTPUT aiStyle
    class ADAPT_TONE,SHOW_TEXT,TTS_OPTION,VISUAL_AID responseStyle
    class ASK_HELPFUL decisionStyle
    class THUMBS_UP,THUMBS_DOWN,UPDATE_MODEL feedbackStyle
    class SAVE_CHAT,PRIVACY_RETAIN,DELETE_OLD,ANALYTICS feedbackStyle
    class END1 endStyle
    class TRIGGERS,EMOTION,AI_PROCESS,RESPONSE,FEEDBACK,HISTORY subgraphStyle
```

---

# Data Flow Diagrams (DFD)

## Level 0: Context Diagram

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000000', 'fontSize': '16px', 'fontFamily': 'Arial, sans-serif'}}}%%
flowchart LR
    %% High contrast styles
    classDef entityStyle fill:#e3f2fd,stroke:#1565c0,stroke-width:4px,color:#000000,font-weight:bold,font-size:16px
    classDef systemStyle fill:#000000,stroke:#000000,stroke-width:5px,color:#ffffff,font-weight:bold,font-size:18px
    classDef dataStyle fill:#fff8e1,stroke:#f57c00,stroke-width:3px,color:#000000,font-weight:bold,font-size:14px

    STUDENT["<b>STUDENT</b><br/>(External Entity)"]
    TEACHER["<b>TEACHER</b><br/>(External Entity)"]
    PARENT["<b>PARENT</b><br/>(External Entity)"]
    ADMIN["<b>ADMIN</b><br/>(External Entity)"]
    
    MENTIQ(["<b>MentIQ E-Learning System</b><br/>(Process 0.0)"])
    
    STRIPE["<b>STRIPE</b><br/>(Payment Gateway)"]
    RAZORPAY["<b>RAZORPAY</b><br/>(Payment Gateway)"]
    JITSI["<b>JITSI</b><br/>(Video Platform)"]
    CLOUDINARY["<b>CLOUDINARY</b><br/>(Media Storage)"]
    GROQ["<b>GROQ AI</b><br/>(LLM API)"]

    %% Data Flows
    STUDENT -->|"<b>Login Credentials</b>"| MENTIQ
    STUDENT -->|"<b>Course Requests</b>"| MENTIQ
    STUDENT -->|"<b>Quiz Answers</b>"| MENTIQ
    MENTIQ -->|"<b>Course Content</b>"| STUDENT
    MENTIQ -->|"<b>Quiz Results</b>"| STUDENT
    MENTIQ -->|"<b>Badges</b>"| STUDENT
    
    TEACHER -->|"<b>Login Credentials</b>"| MENTIQ
    TEACHER -->|"<b>Course Content</b>"| MENTIQ
    TEACHER -->|"<b>Quiz Questions</b>"| MENTIQ
    MENTIQ -->|"<b>Student Progress</b>"| TEACHER
    MENTIQ -->|"<b>Class Analytics</b>"| TEACHER
    
    PARENT -->|"<b>Registration Data</b>"| MENTIQ
    MENTIQ -->|"<b>Weekly Reports</b>"| PARENT
    MENTIQ -->|"<b>Alerts</b>"| PARENT
    
    ADMIN -->|"<b>Admin Credentials</b>"| MENTIQ
    ADMIN -->|"<b>System Config</b>"| MENTIQ
    MENTIQ -->|"<b>System Reports</b>"| ADMIN
    
    MENTIQ -->|"<b>Payment Requests</b>"| STRIPE
    STRIPE -->|"<b>Payment Status</b>"| MENTIQ
    
    MENTIQ -->|"<b>Payment Requests</b>"| RAZORPAY
    RAZORPAY -->|"<b>Payment Status</b>"| MENTIQ
    
    MENTIQ -->|"<b>Stream Data</b>"| JITSI
    JITSI -->|"<b>Video Feed</b>"| MENTIQ
    
    MENTIQ -->|"<b>Upload Video</b>"| CLOUDINARY
    CLOUDINARY -->|"<b>Video URL</b>"| MENTIQ
    
    MENTIQ -->|"<b>AI Prompts</b>"| GROQ
    GROQ -->|"<b>AI Responses</b>"| MENTIQ

    class STUDENT,TEACHER,PARENT,ADMIN,STRIPE,RAZORPAY,JITSI,CLOUDINARY,GROQ entityStyle
    class MENTIQ systemStyle

    %% Data flow labels
    linkStyle 1 stroke:#000000,stroke-width:2px
    linkStyle 2 stroke:#000000,stroke-width:2px
    linkStyle 3 stroke:#000000,stroke-width:2px
    linkStyle 4 stroke:#000000,stroke-width:2px
    linkStyle 5 stroke:#000000,stroke-width:2px
    linkStyle 6 stroke:#000000,stroke-width:2px
    linkStyle 7 stroke:#000000,stroke-width:2px
    linkStyle 8 stroke:#000000,stroke-width:2px
    linkStyle 9 stroke:#000000,stroke-width:2px
    linkStyle 10 stroke:#000000,stroke-width:2px
    linkStyle 11 stroke:#000000,stroke-width:2px
    linkStyle 12 stroke:#000000,stroke-width:2px
    linkStyle 13 stroke:#000000,stroke-width:2px
    linkStyle 14 stroke:#000000,stroke-width:2px
    linkStyle 15 stroke:#000000,stroke-width:2px
    linkStyle 16 stroke:#000000,stroke-width:2px
    linkStyle 17 stroke:#000000,stroke-width:2px
    linkStyle 18 stroke:#000000,stroke-width:2px
    linkStyle 19 stroke:#000000,stroke-width:2px
    linkStyle 20 stroke:#000000,stroke-width:2px
    linkStyle 21 stroke:#000000,stroke-width:2px
    linkStyle 22 stroke:#000000,stroke-width:2px
    linkStyle 23 stroke:#000000,stroke-width:2px
    linkStyle 24 stroke:#000000,stroke-width:2px
    linkStyle 25 stroke:#000000,stroke-width:2px
```

---

## Level 1: Main Processes & Data Stores

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000000', 'fontSize': '16px', 'fontFamily': 'Arial, sans-serif'}}}%%
flowchart TD
    %% High contrast styles
    classDef processStyle fill:#fff3e0,stroke:#ef6c00,stroke-width:3px,color:#000000,font-weight:bold,font-size:14px
    classDef storeStyle fill:#e8f5e9,stroke:#2e7d32,stroke-width:3px,color:#000000,font-weight:bold,font-size:14px
    classDef entityStyle fill:#e3f2fd,stroke:#1565c0,stroke-width:3px,color:#000000,font-weight:bold,font-size:14px
    classDef externalStyle fill:#f3e5f5,stroke:#6a1b9a,stroke-width:3px,color:#000000,font-weight:bold,font-size:14px

    %% External Entities
    STUDENT["<b>STUDENT</b>"]
    TEACHER["<b>TEACHER</b>"]
    PARENT["<b>PARENT</b>"]
    ADMIN["<b>ADMIN</b>"]

    %% Main Processes
    P1["<b>1.0 AUTHENTICATION</b><br/>Login / Register / Token Mgmt"]
    P2["<b>2.0 COURSE MANAGEMENT</b><br/>CRUD / Enrollment / Progress"]
    P3["<b>3.0 PAYMENT PROCESSING</b><br/>Subscription / Invoice / Renewal"]
    P4["<b>4.0 LIVE CLASSES</b><br/>Schedule / Stream / Recording"]
    P5["<b>5.0 QUIZ & ASSESSMENT</b><br/>Create / Take / Grade"]
    P6["<b>6.0 GAMIFICATION</b><br/>Badges / Leaderboard / Rewards"]
    P7["<b>7.0 AI TUTOR</b><br/>QBit / Emotion Detection"]
    P8["<b>8.0 PARENT DASHBOARD</b><br/>Reports / Alerts / Linking"]
    P9["<b>9.0 CONTENT PROCESSING</b><br/>Video / Compression / Indexing"]

    %% Data Stores
    D1[("D1<br/>USER_DB")]
    D2[("D2<br/>COURSE_DB")]
    D3[("D3<br/>PAYMENT_DB")]
    D4[("D4<br/>QUIZ_DB")]
    D5[("D5<br/>BADGE_DB")]
    D6[("D6<br/>CHAT_HISTORY")]
    D7[("D7<br/>PROGRESS_DB")]
    D8[("D8<br/>REDIS_CACHE")]

    %% External Systems
    STRIPE["<b>STRIPE</b>"]
    RAZORPAY["<b>RAZORPAY</b>"]
    JITSI["<b>JITSI</b>"]
    CLOUDINARY["<b>CLOUDINARY</b>"]
    GROQ["<b>GROQ AI</b>"]

    %% Flows - Authentication
    STUDENT --> P1
    TEACHER --> P1
    PARENT --> P1
    ADMIN --> P1
    P1 <--> D1

    %% Flows - Course Management
    TEACHER --> P2
    STUDENT --> P2
    P2 <--> D2
    P2 <--> D7
    P2 --> CLOUDINARY
    CLOUDINARY --> P2
    P2 --> P9
    P9 --> P2

    %% Flows - Payment
    STUDENT --> P3
    P3 <--> D3
    P3 <--> D1
    P3 --> STRIPE
    STRIPE --> P3
    P3 --> RAZORPAY
    RAZORPAY --> P3

    %% Flows - Live Classes
    TEACHER --> P4
    STUDENT --> P4
    P4 <--> D2
    P4 --> JITSI
    JITSI --> P4
    P4 --> CLOUDINARY

    %% Flows - Quiz
    TEACHER --> P5
    STUDENT --> P5
    P5 <--> D4
    P5 <--> D7

    %% Flows - Gamification
    P7 --> P6
    P5 --> P6
    P2 --> P6
    P4 --> P6
    P6 <--> D5
    P6 <--> D7

    %% Flows - AI Tutor
    STUDENT --> P7
    P7 <--> D6
    P7 <--> D2
    P7 --> GROQ
    GROQ --> P7
    P7 <--> D8

    %% Flows - Parent Dashboard
    PARENT --> P8
    P8 <--> D1
    P8 <--> D7
    P8 <--> D5
    P8 --> D6

    class P1,P2,P3,P4,P5,P6,P7,P8,P9 processStyle
    class D1,D2,D3,D4,D5,D6,D7,D8 storeStyle
    class STUDENT,TEACHER,PARENT,ADMIN entityStyle
    class STRIPE,RAZORPAY,JITSI,CLOUDINARY,GROQ externalStyle
```

---

## Level 2.1: Authentication Process Detail

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000000', 'fontSize': '16px', 'fontFamily': 'Arial, sans-serif'}}}%%
flowchart TD
    %% High contrast styles
    classDef processStyle fill:#fff3e0,stroke:#ef6c00,stroke-width:3px,color:#000000,font-weight:bold,font-size:14px
    classDef storeStyle fill:#e8f5e9,stroke:#2e7d32,stroke-width:3px,color:#000000,font-weight:bold,font-size:14px
    classDef entityStyle fill:#e3f2fd,stroke:#1565c0,stroke-width:3px,color:#000000,font-weight:bold,font-size:14px

    USER["<b>USER</b><br/>(Student/Teacher/Parent/Admin)"]

    P1_1["<b>1.1 REGISTER</b><br/>Create Account"]
    P1_2["<b>1.2 LOGIN</b><br/>Authenticate"]
    P1_3["<b>1.3 TOKEN REFRESH</b><br/>Access Token Mgmt"]
    P1_4["<b>1.4 LOGOUT</b><br/>Invalidate Tokens"]
    P1_5["<b>1.5 PASSWORD RESET</b><br/>Email Verification"]

    D1_1[("D1.1<br/>USERS")]
    D1_2[("D1.2<br/>TOKENS")]
    D1_3[("D1.3<br/>REDIS<br/>(Blacklist)")]
    EMAIL["<b>EMAIL SERVICE</b>"]

    USER --> P1_1
    P1_1 --> D1_1
    P1_1 --> P1_5
    P1_5 --> EMAIL
    EMAIL --> P1_5
    P1_5 --> D1_1

    USER --> P1_2
    P1_2 --> D1_1
    D1_1 --> P1_2
    P1_2 --> D1_2
    D1_2 --> P1_2
    P1_2 --> USER

    USER --> P1_3
    P1_3 --> D1_2
    D1_2 --> P1_3
    P1_3 --> D1_3

    USER --> P1_4
    P1_4 --> D1_3
    P1_4 --> D1_2

    class P1_1,P1_2,P1_3,P1_4,P1_5 processStyle
    class D1_1,D1_2,D1_3 storeStyle
    class USER,EMAIL entityStyle
```

---

## Level 2.2: Course Management Process Detail

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000000', 'fontSize': '16px', 'fontFamily': 'Arial, sans-serif'}}}%%
flowchart TD
    %% High contrast styles
    classDef processStyle fill:#fff3e0,stroke:#ef6c00,stroke-width:3px,color:#000000,font-weight:bold,font-size:14px
    classDef storeStyle fill:#e8f5e9,stroke:#2e7d32,stroke-width:3px,color:#000000,font-weight:bold,font-size:14px
    classDef entityStyle fill:#e3f2fd,stroke:#1565c0,stroke-width:3px,color:#000000,font-weight:bold,font-size:14px

    TEACHER["<b>TEACHER</b>"]
    STUDENT["<b>STUDENT</b>"]

    P2_1["<b>2.1 CREATE COURSE</b><br/>Course Metadata"]
    P2_2["<b>2.2 ADD LESSON</b><br/>Content Upload"]
    P2_3["<b>2.3 ENROLL STUDENT</b><br/>Payment Check"]
    P2_4["<b>2.4 TRACK PROGRESS</b><br/>Completion %"]
    P2_5["<b>2.5 SEARCH COURSES</b><br/>Elasticsearch"]

    D2_1[("D2.1<br/>COURSES")]
    D2_2[("D2.2<br/>LESSONS")]
    D2_3[("D2.3<br/>ENROLLMENTS")]
    D2_4[("D2.4<br/>PROGRESS")]
    D2_5[("D2.5<br/>ELASTICSEARCH")]

    CLOUDINARY["<b>CLOUDINARY</b>"]
    VIDEO_PROCESS["<b>VIDEO PROCESSOR</b><br/>(FFmpeg)"]

    TEACHER --> P2_1
    P2_1 --> D2_1

    TEACHER --> P2_2
    P2_2 --> D2_2
    P2_2 --> CLOUDINARY
    CLOUDINARY --> P2_2
    P2_2 --> VIDEO_PROCESS
    VIDEO_PROCESS --> P2_2
    P2_2 --> D2_5

    STUDENT --> P2_5
    P2_5 --> D2_5
    D2_5 --> P2_5
    P2_5 --> STUDENT

    STUDENT --> P2_3
    P2_3 --> D2_3
    D2_3 --> P2_3
    P2_3 --> D2_1
    D2_1 --> P2_3
    P2_3 --> STUDENT

    STUDENT --> P2_4
    P2_4 --> D2_4
    D2_4 --> P2_4
    P2_4 --> STUDENT
    P2_4 --> D2_3

    class P2_1,P2_2,P2_3,P2_4,P2_5 processStyle
    class D2_1,D2_2,D2_3,D2_4,D2_5 storeStyle
    class TEACHER,STUDENT,CLOUDINARY,VIDEO_PROCESS entityStyle
```

---

## Level 2.3: Payment Processing Process Detail

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000000', 'fontSize': '16px', 'fontFamily': 'Arial, sans-serif'}}}%%
flowchart TD
    %% High contrast styles
    classDef processStyle fill:#fff3e0,stroke:#ef6c00,stroke-width:3px,color:#000000,font-weight:bold,font-size:14px
    classDef storeStyle fill:#e8f5e9,stroke:#2e7d32,stroke-width:3px,color:#000000,font-weight:bold,font-size:14px
    classDef entityStyle fill:#e3f2fd,stroke:#1565c0,stroke-width:3px,color:#000000,font-weight:bold,font-size:14px

    STUDENT["<b>STUDENT</b>"]

    P3_1["<b>3.1 SELECT PLAN</b><br/>Basic/Premium"]
    P3_2["<b>3.2 INITIATE PAYMENT</b><br/>Create Order"]
    P3_3["<b>3.3 PROCESS PAYMENT</b><br/>Gateway Call"]
    P3_4["<b>3.4 VERIFY PAYMENT</b><br/>Webhook Callback"]
    P3_5["<b>3.5 ACTIVATE SUB</b><br/>Grant Access"]
    P3_6["<b>3.6 GENERATE INVOICE</b><br/>PDF Receipt"]
    P3_7["<b>3.7 AUTO-RENEWAL</b><br/>Scheduled Task"]

    D3_1[("D3.1<br/>ORDERS")]
    D3_2[("D3.2<br/>PAYMENTS")]
    D3_3[("D3.3<br/>SUBSCRIPTIONS")]
    D3_4[("D3.4<br/>INVOICES")]

    STRIPE["<b>STRIPE</b>"]
    RAZORPAY["<b>RAZORPAY</b>"]
    EMAIL["<b>EMAIL SERVICE</b>"]
    CELERY["<b>CELERY<br/>(Scheduler)"]

    STUDENT --> P3_1
    P3_1 --> P3_2
    P3_2 --> D3_1
    P3_2 --> D3_3

    P3_2 --> P3_3
    P3_3 --> STRIPE
    STRIPE --> P3_3
    P3_3 --> RAZORPAY
    RAZORPAY --> P3_3

    STRIPE --> P3_4
    RAZORPAY --> P3_4
    P3_4 --> D3_2
    P3_4 --> D3_1

    P3_4 --> P3_5
    P3_5 --> D3_3
    P3_5 --> STUDENT

    P3_5 --> P3_6
    P3_6 --> D3_4
    P3_6 --> EMAIL
    EMAIL --> STUDENT

    CELERY --> P3_7
    P3_7 --> D3_3
    P3_7 --> P3_3
    P3_7 --> P3_6

    class P3_1,P3_2,P3_3,P3_4,P3_5,P3_6,P3_7 processStyle
    class D3_1,D3_2,D3_3,D3_4 storeStyle
    class STUDENT,STRIPE,RAZORPAY,EMAIL,CELERY entityStyle
```

---

## Level 2.4: AI Tutor (QBit) Process Detail

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryTextColor': '#000000', 'fontSize': '16px', 'fontFamily': 'Arial, sans-serif'}}}%%
flowchart TD
    %% High contrast styles
    classDef processStyle fill:#fff3e0,stroke:#ef6c00,stroke-width:3px,color:#000000,font-weight:bold,font-size:14px
    classDef storeStyle fill:#e8f5e9,stroke:#2e7d32,stroke-width:3px,color:#000000,font-weight:bold,font-size:14px
    classDef entityStyle fill:#e3f2fd,stroke:#1565c0,stroke-width:3px,color:#000000,font-weight:bold,font-size:14px

    STUDENT["<b>STUDENT</b>"]

    P7_1["<b>7.1 DETECT EMOTION</b><br/>Input Pattern Analysis"]
    P7_2["<b>7.2 BUILD CONTEXT</b><br/>Lesson + Grade + Emotion"]
    P7_3["<b>7.3 RAG SEARCH</b><br/>Relevant Content"]
    P7_4["<b>7.4 CALL LLM</b><br/>Groq API"]
    P7_5["<b>7.5 FORMAT RESPONSE</b><br/>Adapt Tone"]
    P7_6["<b>7.6 SAVE CHAT</b><br/>Log History"]
    P7_7["<b>7.7 FEEDBACK LOOP</b><br/>Thumbs Up/Down"]
    P7_8["<b>7.8 PRIVACY CLEANUP</b><br/>Auto-Delete"]

    D6_1[("D6.1<br/>CHAT_LOGS")]
    D6_2[("D6.2<br/>USER_PREFERENCES")]
    D6_3[("D6.3<br/>LESSON_CONTENT")]
    D6_4[("D6.4<br/>REDIS<br/>(Cache)")]

    GROQ["<b>GROQ LLM</b>"]
    CELERY["<b>CELERY<br/>(Cleanup Task)"]

    STUDENT --> P7_1
    P7_1 --> D6_4
    D6_4 --> P7_1
    P7_1 --> P7_2

    P7_2 --> D6_3
    D6_3 --> P7_2
    P7_2 --> D6_2
    D6_2 --> P7_2

    P7_2 --> P7_3
    P7_3 --> D6_3
    D6_3 --> P7_3

    P7_3 --> P7_4
    P7_4 --> GROQ
    GROQ --> P7_4

    P7_4 --> P7_5
    P7_5 --> STUDENT

    P7_5 --> P7_6
    P7_6 --> D6_1
    P7_6 --> D6_4

    STUDENT --> P7_7
    P7_7 --> D6_2
    D6_2 --> P7_7

    CELERY --> P7_8
    P7_8 --> D6_1
    P7_8 --> D6_4

    class P7_1,P7_2,P7_3,P7_4,P7_5,P7_6,P7_7,P7_8 processStyle
    class D6_1,D6_2,D6_3,D6_4 storeStyle
    class STUDENT,GROQ,CELERY entityStyle
```

---

## How to Use These Flowcharts

### Option 1: Mermaid Live Editor
1. Visit https://mermaid.live
2. Copy any diagram code between the ```mermaid markers
3. Export as PNG/SVG/PDF

### Option 2: VS Code Extension
Install "Markdown Preview Mermaid Support" extension to preview in VS Code.

### Option 3: Documentation Tools
- **Notion**: Paste mermaid code in code block with "mermaid" language
- **GitHub**: Renders automatically in .md files
- **Draw.io**: Import mermaid syntax

### Option 4: Convert to Images
```bash
# Using mermaid-cli
npm install -g @mermaid-js/mermaid-cli
mmdc -i FLOWCHARTS.md -o flowchart.png
```

---

## Key for Symbols

| Symbol | Meaning |
|--------|---------|
| 🔵 Circle | Start/End Point |
| 🔷 Diamond | Decision Point |
| 🟦 Rectangle | Process/Action |
| 🟩 Cylinder | Database/Storage |
| 🟨 Document | Document/File |
| ➡️ Arrow | Flow Direction |
| -.- Dotted | Background/Async Process |

---

*Generated for MentiQ Capstone Project Report*
*Date: April 22, 2026*
