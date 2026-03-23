# 🚀 MentiQ - 2-Week Sprint Implementation Plan
## Based on ULTIMATE_FEATURE_MASTERPLAN.md

**Sprint Duration:** 14 Days (March 24 - April 6, 2026)  
**Focus:** Tier 1 Quick Wins with Maximum Impact  
**Platform Strategy:** Mobile-First (India market optimization)  
**Team Required:** 2 Backend + 2 Frontend + 1 ML Engineer (can be done by fewer with role overlap)

---

## 📱💻 PLATFORM DEPLOYMENT STRATEGY

### **Mobile-First Approach (Recommended for India)**

**Why Mobile-First?**
- 80%+ Indian students use mobile as primary device
- Offline mode critical for rural areas (mobile-only feature)
- Gamification works better with push notifications
- Competitive advantage: Weak mobile apps from competitors

### **Feature Platform Matrix**

| Feature | Mobile App (Expo/RN) | Website (Vite/React) | Backend (Django) |
|---------|---------------------|---------------------|------------------|
| **Gamified Badges** | ✅ Full features + push notifications | ✅ Display + leaderboards | ✅ All logic + APIs |
| **Parent Dashboard** | ✅ Summary view + alerts | ✅ Full dashboard + charts | ✅ Report generation |
| **Offline Mode** | ✅ **EXCLUSIVE** - Full downloads & playback | ❌ Not available (streaming only) | ✅ Compression + tracking |
| **Cognitive AI** | ✅ Touch-based emotion detection | ✅ Keyboard/mouse tracking | ✅ Emotion algorithms |
| **Study Rooms** | ⚡ Basic join/create | ⚡ Full interface | ✅ Jitsi integration |

### **Development Priority Split**
- **Days 1-10:** 70% Mobile, 30% Web
- **Days 11-14:** Polish web to "good enough"
- **Post-Sprint:** Enhance web in next iteration

---

## 👥 TEAM ALLOCATION WITH PLATFORM FOCUS

---

## 📋 SPRINT GOALS

### Primary Objectives (Must-Have):

#### 📱 MOBILE APP (Priority - 70% effort):
1. ✅ **Gamified Badge System** - Full mobile experience with push notifications
2. ✅ **Offline Mode** - Download & playback (MOBILE EXCLUSIVE FEATURE)
3. ✅ **Parent Dashboard Mobile View** - Summary metrics + alerts
4. ✅ **Cognitive AI** - Touch-based emotion detection integration

#### 💻 WEBSITE (30% effort - "Good Enough" launch):
1. ✅ **Badge Gallery + Leaderboards** - Display and view-only features
2. ✅ **Parent Dashboard Web** - Full dashboard with charts
3. ✅ **Cognitive AI** - Keyboard/mouse tracking integration

### Secondary Objectives (Nice-to-Have if Time Permits):
- ⚡ **Mobile:** Push notifications for badge earnings
- ⚡ **Web:** Certificate download/print functionality
- ⚡ **Both:** Peer Study Rooms (basic join/create)
- ⚡ **Web Only:** Skill Gap Visualization (static graph)

---

## 👥 TEAM ALLOCATION WITH PLATFORM FOCUS

| Role | Person | Platform Focus | Responsibilities | Time Commitment |
|------|--------|---------------|------------------|-----------------|
| **Backend Lead** | Developer 1 | Backend (Both) | Badge system, Parent reports API, Database models, All APIs | Full-time |
| **Backend/Frontend** | Developer 2 | Backend + Mobile | Offline mode models, Video compression, Mobile sync logic | Full-time |
| **Mobile Lead** | Developer 3 | Mobile Only | Badge UI (RN), Offline manager, Push notifications, Mobile parent view | Full-time |
| **Web Developer** | Developer 4 | Web Only | Badge display (Web), Leaderboards, Web parent dashboard, Charts | Full-time |
| **ML Engineer** | Developer 5 | Backend (Both) | Emotion detection algorithm, Cognitive load rules | Part-time (50%) |

### Platform-Specific Notes

**Mobile Team (Developer 2 + 3):**
- Focus on React Native components
- Implement offline-first architecture
- Add push notification support for badge earnings
- Test on real Android devices (low-end focus)
- Expo EAS build configuration

**Web Team (Developer 4):**
- Responsive design for desktop/tablet
- Recharts for data visualization
- PWA features (basic caching)
- Cross-browser compatibility (Chrome, Firefox, Safari)
- Vercel deployment

**Backend Team (Developer 1 + 2):**
- Single API serves both platforms
- Platform-specific response formatting if needed
- Device detection middleware
- Analytics tracking per platform type

**Note:** If team is smaller, combine roles:

**Scenario A (2 developers):** 
- Dev 1: Backend + Web (60/40 split)
- Dev 2: Backend + Mobile (60/40 split)

**Scenario B (3 developers):**
- Dev 1: Backend only
- Dev 2: Mobile only  
- Dev 3: Web only

ML tasks can be done by backend devs with guidance

---

## 📅 DAY-BY-DAY BREAKDOWN

### **WEEK 1: Foundation & Core Features (Days 1-7)**

---

#### **DAY 1 (March 24) - Sprint Kickoff & Setup**

**Morning (9 AM - 12 PM):**

**All Teams Together:**
- [ ] Sprint planning meeting (1 hour)
  - Review feature priorities with platform focus
  - Assign platform-specific tasks
  - Set up project boards (Jira/Trello/Notion)
- [ ] Environment setup (2 hours)
  - Create feature branches: 
    - `feature/badge-system-mobile` (Mobile team)
    - `feature/badge-system-web` (Web team)
    - `feature/backend-apis` (Backend team)
  - Install required dependencies

**Afternoon (1 PM - 6 PM):**

#### 🖥️ BACKEND TEAM (Developer 1 + 2):
- [ ] Design database schemas for badges and parent accounts
- [ ] Create Django models:
  - `apps/progress/models.py` → AchievementBadge, StudentBadge
  - `apps/users/models.py` → ParentAccount
- [ ] Create initial API endpoint structure:
  - `/api/v1/progress/badges/` (GET list, POST earn)
  - `/api/v1/progress/leaderboard/` (GET)
  - `/api/v1/users/parent-dashboard/` (GET)
- [ ] Run migrations on development database

#### 📱 MOBILE TEAM (Developer 3):
- [ ] Create component wireframes for mobile:
  - BadgeCard.tsx (React Native)
  - LeaderboardView.tsx
  - MyBadgesScreen.tsx
- [ ] Set up Zustand store for badge state:
  ```typescript
  // store/badgeStore.ts
  const useBadgeStore = create((set) => ({
    badges: [],
    earnedBadges: [],
    fetchBadges: async () => {...},
  }))
  ```
- [ ] Design mobile badge card with animations (react-native-reanimated)

#### 💻 WEB TEAM (Developer 4):
- [ ] Create web component structure:
  - BadgeGallery.tsx (grid layout)
  - LeaderboardPage.tsx (table view)
  - ParentDashboard.tsx (chart integration)
- [ ] Set up Recharts for leaderboard visualization
- [ ] Design responsive badge cards (CSS grid)

#### 🤖 ML ENGINEER (Developer 5 - Part-time):
- [ ] Research emotion detection algorithms
- [ ] Set up scikit-learn environment
- [ ] Draft interaction pattern tracking middleware
- [ ] Define metrics to track: typing_speed_std, repeat_attempts, etc.

**End of Day Deliverables:**
✅ Backend: Database models created with migrations  
✅ Mobile: Badge card component skeleton ready  
✅ Web: Badge gallery layout complete  
✅ ML: Emotion detection spec document shared  

---

#### **DAY 2 (March 25) - Badge System Backend**

**Backend Team (Badge Focus):**
```python
# TASKS - Complete by EOD:
1. Create AchievementBadge model with all fields
2. Create StudentBadge model (user-badge relationship)
3. Create BadgeCategory model (optional, for organization)
4. Implement badge earning logic (triggers)
5. Write unit tests for badge models
```

**Specific Implementation:**
```python
# apps/progress/models.py - ADD THESE MODELS

class AchievementBadge(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    name = models.CharField(max_length=100)
    description = models.TextField()
    rarity = models.CharField(max_length=20, choices=[
        ('COMMON', 'Common'), ('RARE', 'Rare'), 
        ('EPIC', 'Epic'), ('LEGENDARY', 'Legendary'), ('MYTHIC', 'Mythic')
    ])
    icon_url = models.URLField()
    criteria_type = models.CharField(max_length=50)
    criteria_threshold = models.IntegerField()
    tradeable = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)


class StudentBadge(models.Model):
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    badge = models.ForeignKey(AchievementBadge, on_delete=models.CASCADE)
    awarded_at = models.DateTimeField(auto_now_add=True)
    progress = models.IntegerField(default=0)  # e.g., 3/7 day streak
    is_claimed = models.BooleanField(default=False)
    showcase_on_profile = models.BooleanField(default=True)
```

**Frontend Team (Badge UI):**
```typescript
// TASKS - Complete by EOD:
1. Create BadgeCard component (React Native)
2. Create BadgeCard component (Web - Vite)
3. Implement badge fetching from API
4. Add badge collection view screen/page
5. Test on multiple devices/screen sizes
```

**ML Engineer (Emotion Detection Prep):**
```python
# TASKS - Complete by EOD:
1. Define interaction metrics to track:
   - typing_speed_std
   - repeat_attempts
   - help_request_frequency
   - video_rewind_rate
   
2. Create middleware skeleton:
   apps/core/middleware/interaction_tracker.py
   
3. Draft emotion scoring algorithm (rule-based first)
```

**End of Day Deliverables:**
✅ Badge models complete with migrations  
✅ Badge API endpoints functional (CRUD)  
✅ Frontend badge cards rendering dummy data  
✅ Interaction tracker middleware draft  

---

#### **DAY 3 (March 26) - Badge Earning Logic & Cloudinary Integration**

**Backend Team:**
```python
# MORNING (9 AM - 1 PM): Badge Earning Automation
1. Create signals/listeners for badge triggers:
   - On quiz completion → check for quiz badges
   - On daily login → update streak counters
   - On course completion → achievement badges
   
2. Implement auto-award logic:
   @receiver(post_save, sender=QuizAttempt)
   def check_badge_earnings(sender, instance, created, **kwargs):
       if created:
           award_badges_if_qualified(instance.student)
   
3. Write comprehensive tests for edge cases
```

```python
# AFTERNOON (2 PM - 6 PM): Cloudinary Certificate Generation
from cloudinary import CloudinaryImage

def generate_badge_certificate(badge, student):
    """Generate shareable certificate image"""
    
    result = cloudinary.uploader.upload(
        f"https://mentiq.com/templates/{badge.rarity.lower()}_template.png",
        transformation=[
            {"overlay": student.profile_photo, "gravity": "north", "y": -80},
            {"overlay": {"text": student.name, "font_size": 40}, "gravity": "center"},
            {"overlay": badge.icon_url, "gravity": "south_east", "x": -40, "y": -40}
        ]
    )
    
    return result['secure_url']

# TEST with all badge rarities
```

**Frontend Team:**
```typescript
// MORNING: Leaderboard System
1. Create LeaderboardView component
2. Implement multiple leaderboard tabs:
   - Weekly Grind (hours this week)
   - Consistency King (longest streak)
   - Quiz Dominator (highest avg score)
   - Helping Hand (most peer help sessions)
   
3. Add filters: Global / School / Class
4. Real-time updates via polling (every 30 sec)

// AFTERNOON: Social Sharing
1. Add "Share Badge" button to each badge card
2. Integrate with native sharing (mobile) / Web Share API
3. Auto-generate share image with certificate + student photo
4. Pre-fill social media captions
```

**ML Engineer:**
```python
# Complete emotion detection algorithm:
class EmotionDetector:
    def detect_frustration(self, interactions):
        score = 0.0
        
        # Typing speed variance > 40%
        if interactions['typing_speed_std'] / interactions['typing_speed_mean'] > 0.4:
            score += 0.3
        
        # Repeated attempts on same question (3+)
        if interactions['repeat_attempts'] >= 3:
            score += 0.4
        
        # Frequent help requests (< 30 sec between)
        if interactions['help_requests_per_10min'] > 2:
            score += 0.2
        
        # Negative sentiment in queries
        if self.contains_negative_sentiment(interactions['recent_queries']):
            score += 0.1
        
        return min(score, 1.0)
    
    def get_adaptation_recommendations(self, emotion_score):
        if emotion_score > 0.7:
            return {
                'tone': 'encouraging',
                'difficulty_adjustment': -0.3,
                'add_analogies': True,
                'suggest_break': True,
                'show_motivational_message': True
            }
        elif emotion_score > 0.4:
            return {
                'tone': 'supportive',
                'difficulty_adjustment': -0.15,
                'provide_examples': True
            }
        else:
            return {'maintain_current_approach': True}
```

**End of Day Deliverables:**
✅ Badges auto-awarded on user actions  
✅ Certificate generation working  
✅ Leaderboards displaying real data  
✅ Emotion detection algorithm ready for integration  

---

#### **DAY 4 (March 27) - Parent Dashboard Backend**

**Backend Team:**
```python
# PARENT ACCOUNT MODELS (apps/users/models.py)

class ParentAccount(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    phone = models.CharField(max_length=20)
    whatsapp_opt_in = models.BooleanField(default=True)
    preferred_language = models.CharField(max_length=10, default='en')
    
    # Link to students (one parent can have multiple children)
    students = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='parent_accounts',
        limit_choices_to={'role': 'student'}
    )


# WEEKLY REPORT GENERATOR (apps/emails/weekly_report.py)

def generate_weekly_report(student):
    """Generate PDF report for parents - sent every Sunday"""
    from django.template.loader import render_to_string
    import io
    from xhtml2pdf import pisa
    
    week_start = timezone.now() - timedelta(days=7)
    
    # Gather metrics
    metrics = {
        'hours_studied': get_total_study_hours(student, week_start),
        'quizzes_taken': QuizAttempt.objects.filter(
            student=student, completed_at__gte=week_start
        ).count(),
        'avg_quiz_score': calculate_avg_score(student, week_start),
        'attendance_percentage': calculate_attendance(student, week_start),
        'topics_completed': LessonProgress.objects.filter(
            student=student, completed=True, completed_at__gte=week_start
        ).count(),
        'badges_earned': StudentBadge.objects.filter(
            student=student, awarded_at__gte=week_start
        ).count(),
        'streak_days': get_current_streak(student)
    }
    
    # Determine report tone based on performance
    if metrics['avg_quiz_score'] > 85:
        tone = 'celebratory'
        headline = f"🌟 {student.name} had an EXCELLENT week!"
    elif metrics['avg_quiz_score'] > 70:
        tone = 'positive'
        headline = f"📚 {student.name} made good progress"
    else:
        tone = 'supportive'
        headline = f"💪 Let's support {student.name}"
    
    # Render HTML template
    html_template = render_to_string('emails/parent_weekly_report.html', {
        'student': student,
        'metrics': metrics,
        'tone': tone,
        'headline': headline,
        'week_dates': f"{week_start.strftime('%d %b')} - {timezone.now().strftime('%d %b')}"
    })
    
    # Convert to PDF
    pdf_buffer = io.BytesIO()
    pisa.CreatePDF(html_template, dest=pdf_buffer)
    
    return pdf_buffer.getvalue()


# CELERY TASK FOR AUTOMATION (apps/emails/tasks.py)

@shared_task
def send_weekly_reports_to_all_parents():
    """Run every Sunday at 6 PM"""
    from django.core.mail import EmailMessage
    
    parents = ParentAccount.objects.filter(whatsapp_opt_in=True)
    
    for parent in parents:
        for student in parent.students.all():
            report_pdf = generate_weekly_report(student)
            
            # Email attachment
            email = EmailMessage(
                subject=f"{student.name}'s Weekly Report - {timezone.now().strftime('%d %b %Y')}",
                body=f"Hi {parent.user.first_name},\n\nAttached is {student.name}'s weekly learning report.",
                to=[parent.user.email],
            )
            email.attach(f"report_{student.name}.pdf", report_pdf.getvalue(), 'application/pdf')
            email.send()
            
            # WhatsApp message (if opted in)
            if parent.whatsapp_opt_in:
                send_whatsapp_message(
                    parent.phone,
                    f"📊 {student.name}'s weekly report is ready!\n\n"
                    f"⏱️ Hours: {metrics['hours_studied']:.1f}\n"
                    f"📝 Avg Score: {metrics['avg_quiz_score']}%\n"
                    f"🏆 Badges: {metrics['badges_earned']}\n\n"
                    f"Check your email for details!"
                )
```

**Frontend Team:**
```typescript
// PARENT DASHBOARD COMPONENTS

// 1. ParentDashboard.tsx (Main container)
const ParentDashboard = () => {
    const [children, setChildren] = useState([]);
    const [selectedChild, setSelectedChild] = useState(null);
    
    return (
        <View>
            <ChildSelector 
                children={children} 
                onSelect={setSelectedChild} 
            />
            
            {selectedChild && (
                <>
                    <WeeklyReportChart history={last8Weeks} />
                    <MetricsGrid metrics={currentWeekMetrics} />
                    <TeacherMessages messages={unreadMessages} />
                    <BookParentTeacherMeeting student={selectedChild} />
                </>
            )}
        </View>
    );
};

// 2. WeeklyReportChart.tsx (Recharts visualization)
const WeeklyReportChart = ({ history }) => (
    <ResponsiveContainer width="100%" height={300}>
        <LineChart data={history}>
            <XAxis dataKey="week" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="hours_studied" stroke="#8884d8" />
            <Line type="monotone" dataKey="avg_quiz_score" stroke="#82ca9d" />
        </LineChart>
    </ResponsiveContainer>
);

// 3. MetricsGrid.tsx (Quick stats)
const MetricsGrid = ({ metrics }) => (
    <View style={styles.grid}>
        <MetricCard icon="⏱️" label="Hours Studied" value={metrics.hours} />
        <MetricCard icon="📝" label="Quizzes Taken" value={metrics.quizzes} />
        <MetricCard icon="🏆" label="Badges Earned" value={metrics.badges} />
        <MetricCard icon="🔥" label="Current Streak" value={`${metrics.streak} days`} />
    </View>
);
```

**End of Day Deliverables:**
✅ Parent account models created  
✅ Weekly report PDF generator working  
✅ Celery task scheduled (Sundays 6 PM)  
✅ Parent dashboard UI components built  

---

#### **DAY 5 (March 28) - Offline Mode Foundation**

**Backend Team:**
```python
# OFFLINE MODE DATABASE MODELS (apps/lessons/models.py)

class MicroLesson(models.Model):
    """Chunked lessons for offline viewing (3-7 min each)"""
    parent_lesson = models.ForeignKey('lessons.Lesson', on_delete=models.CASCADE)
    chunk_number = models.IntegerField(default=1)
    title = models.CharField(max_length=200)
    
    # Compressed media files
    video_low_res = models.FileField(upload_to='micro_lessons/video/240p/')
    video_medium_res = models.FileField(upload_to='micro_lessons/video/360p/', blank=True)
    audio_only = models.FileField(upload_to='micro_lessons/audio/', blank=True)
    slides_pdf = models.FileField(upload_to='micro_lessons/pdf/', blank=True)
    
    # Metadata
    duration_seconds = models.IntegerField()
    file_size_mb = models.FloatField()
    download_count = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['chunk_number']


class OfflineDownload(models.Model):
    """Track user's offline downloads"""
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    micro_lesson = models.ForeignKey(MicroLesson, on_delete=models.CASCADE)
    downloaded_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()  # 30 days from download
    last_accessed = models.DateTimeField(auto_now=True)
    watch_progress = models.FloatField(default=0.0)  # 0-100%
    
    # Device info for sync
    device_id = models.CharField(max_length=100)
    storage_location = models.CharField(max_length=255, blank=True)
    
    class Meta:
        unique_together = ['student', 'micro_lesson']


# VIDEO COMPRESSION PIPELINE (apps/media/video_processor.py)

import subprocess

def compress_video_for_offline(input_path, output_dir, quality='low'):
    """Compress video using ffmpeg for offline mobile viewing"""
    
    import os
    os.makedirs(output_dir, exist_ok=True)
    
    output_filename = f"{quality}_{os.path.basename(input_path)}"
    output_path = os.path.join(output_dir, output_filename)
    
    if quality == 'low':
        # 240p, 300kbps video, 64kbps audio (~15MB per 5min)
        command = [
            'ffmpeg', '-i', input_path,
            '-vf', 'scale=426:240',
            '-b:v', '300k',
            '-b:a', '64k',
            '-c:v', 'h264',
            '-c:a', 'aac',
            '-y',  # Overwrite output
            output_path
        ]
    elif quality == 'medium':
        # 360p, 500kbps video, 96kbps audio (~30MB per 5min)
        command = [
            'ffmpeg', '-i', input_path,
            '-vf', 'scale=640:360',
            '-b:v', '500k',
            '-b:a', '96k',
            '-y',
            output_path
        ]
    
    subprocess.run(command, check=True)
    
    # Return file size in MB
    file_size_mb = os.path.getsize(output_path) / (1024 * 1024)
    return output_path, file_size_mb


# AUTO-CHUNKING LOGIC (apps/lessons/auto_chunker.py)

def create_micro_lessons_from_lesson(lesson):
    """Automatically split lesson into 3-7 minute chunks"""
    
    video = lesson.video_file
    duration_seconds = get_video_duration(video.path)
    
    # Simple chunking: split into 5-minute segments
    # Advanced: Use scene detection for natural breakpoints
    chunk_duration = 300  # 5 minutes
    num_chunks = ceil(duration_seconds / chunk_duration)
    
    chunks = []
    for i in range(num_chunks):
        start_time = i * chunk_duration
        end_time = min((i + 1) * chunk_duration, duration_seconds)
        
        # Extract segment using ffmpeg
        chunk_video_path = extract_video_segment(
            video.path, start_time, end_time
        )
        
        # Compress versions
        low_res_path, low_size = compress_video_for_offline(chunk_video_path, '240p')
        med_res_path, med_size = compress_video_for_offline(chunk_video_path, '360p')
        audio_path, _ = extract_audio_track(chunk_video_path)
        slides_path = export_slides_as_pdf(lesson, start_time, end_time)
        
        micro_lesson = MicroLesson.objects.create(
            parent_lesson=lesson,
            chunk_number=i+1,
            title=f"{lesson.title} - Part {i+1}",
            video_low_res=low_res_path,
            video_medium_res=med_res_path,
            audio_only=audio_path,
            slides_pdf=slides_path,
            duration_seconds=end_time - start_time,
            file_size_mb=low_size  # Default to low-res size
        )
        
        chunks.append(micro_lesson)
    
    return chunks
```

**Frontend/Mobile Team:**
```typescript
// OFFLINE MANAGER SERVICE (frontend/services/offlineManager.ts)

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

export const offlineManager = {
    /**
     * Download a micro lesson for offline viewing
     */
    downloadMicroLesson: async (microLessonId: string, quality: 'low' | 'medium' = 'low') => {
        try {
            // Check available storage
            const freeSpace = await FileSystem.getFreeDiskStorageAsync();
            const lessonSize = await getLessonFileSize(microLessonId, quality);
            
            if (freeSpace < lessonSize * 1.5) {
                throw new Error('Insufficient storage space');
            }
            
            // Download video file
            const downloadResult = await FileSystem.downloadAsync(
                `${API_URL}/v1/lessons/micro/${microLessonId}/download/?quality=${quality}`,
                `${FileSystem.documentDirectory}offline/${microLessonId}_${quality}.mp4`
            );
            
            if (downloadResult.status !== 200) {
                throw new Error('Download failed');
            }
            
            // Store metadata
            const metadata = {
                microLessonId,
                quality,
                downloadedAt: Date.now(),
                expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days
                localPath: downloadResult.uri,
                watchProgress: 0,
                lastAccessed: Date.now()
            };
            
            await AsyncStorage.setItem(
                `offline_${microLessonId}`,
                JSON.stringify(metadata)
            );
            
            // Mark as downloaded in backend
            await api.post('/v1/progress/offline-downloads/', {
                microLessonId,
                quality,
                deviceId: await getDeviceId()
            });
            
            return { success: true, localPath: downloadResult.uri };
            
        } catch (error) {
            console.error('Download error:', error);
            return { success: false, error: error.message };
        }
    },
    
    /**
     * Sync offline progress to server (call when online)
     */
    syncProgress: async () => {
        try {
            const keys = await AsyncStorage.getAllKeys();
            const offlineKeys = keys.filter(k => k.startsWith('offline_'));
            
            const updates = [];
            for (const key of offlineKeys) {
                const dataString = await AsyncStorage.getItem(key);
                if (!dataString) continue;
                
                const data = JSON.parse(dataString);
                
                if (data.watchProgress > 0 || data.completed) {
                    updates.push({
                        microLessonId: data.microLessonId,
                        progress: data.watchProgress,
                        completedAt: data.completed ? new Date().toISOString() : null,
                        deviceTimestamp: data.lastAccessed
                    });
                }
            }
            
            if (updates.length === 0) return;
            
            // Batch upload to server
            const response = await api.post('/v1/progress/sync-offline/', {
                updates
            });
            
            // Handle conflicts if any
            if (response.data.conflicts) {
                await handleConflicts(response.data.conflicts);
            }
            
            // Clear synced data to free space
            for (const key of offlineKeys) {
                const data = JSON.parse(await AsyncStorage.getItem(key)!);
                if (updates.find(u => u.microLessonId === data.microLessonId)) {
                    await AsyncStorage.removeItem(key);
                }
            }
            
        } catch (error) {
            console.error('Sync error:', error);
            // Will retry next time online
        }
    },
    
    /**
     * Get all downloaded lessons (not expired)
     */
    getOfflineLessons: async () => {
        const keys = await AsyncStorage.getAllKeys();
        const offlineKeys = keys.filter(k => k.startsWith('offline_'));
        
        const lessons = [];
        for (const key of offlineKeys) {
            const dataString = await AsyncStorage.getItem(key);
            if (!dataString) continue;
            
            const data = JSON.parse(dataString);
            
            // Check if expired
            if (Date.now() > data.expiresAt) {
                // Delete expired
                await FileSystem.deleteAsync(data.localPath);
                await AsyncStorage.removeItem(key);
                continue;
            }
            
            lessons.push({
                microLessonId: data.microLessonId,
                localPath: data.localPath,
                progress: data.watchProgress,
                expiresAt: data.expiresAt
            });
        }
        
        return lessons;
    },
    
    /**
     * Delete offline lesson to free space
     */
    deleteLesson: async (microLessonId: string) => {
        const dataString = await AsyncStorage.getItem(`offline_${microLessonId}`);
        if (!dataString) return;
        
        const data = JSON.parse(dataString);
        
        // Delete file
        await FileSystem.deleteAsync(data.localPath);
        
        // Delete metadata
        await AsyncStorage.removeItem(`offline_${microLessonId}`);
        
        // Notify backend
        await api.delete(`/v1/progress/offline-downloads/${microLessonId}/`);
    }
};
```

**End of Day Deliverables:**
✅ MicroLesson and OfflineDownload models created  
✅ Video compression pipeline working  
✅ Mobile offline manager service complete  
✅ Download/delete/sync functionality tested  

---

#### **DAY 6 (March 29) - Cognitive AI Integration**

**ML Engineer + Backend Team:**
```python
# INTEGRATE EMOTION DETECTION INTO AI TUTOR

# apps/ai_tutor/services.py - ENHANCE QbitService

class QbitService:
    def __init__(self):
        self.api_key = os.environ.get("GROQ_API_KEY")
        self.emotion_detector = EmotionDetector()
    
    def get_chat_response(self, query, context="", image=None, role='student', student_id=None):
        """Enhanced with emotion-aware responses"""
        
        # Get current emotional state if student_id provided
        emotion_score = 0.0
        if student_id:
            recent_interactions = get_recent_interactions(student_id, window_minutes=10)
            emotion_score = self.emotion_detector.detect_frustration(recent_interactions)
        
        # Get adaptation recommendations
        adaptations = self.emotion_detector.get_adaptation_recommendations(emotion_score)
        
        # Modify system instruction based on emotion
        if role == 'student':
            base_instruction = """
You are Qbit, the intelligent AI Tutor for the MentIQ e-learning platform.
Your Mission: Empower students to master subjects.
"""
            
            if emotion_score > 0.7:
                # High frustration - be extra supportive
                adapted_instruction = """
IMPORTANT: This student is currently frustrated. Be EXTRA patient and encouraging.
- Use simpler language
- Break explanations into smaller steps
- Provide concrete examples and analogies
- Suggest taking a short break if appropriate
- Celebrate small wins
- Tone: Warm, supportive, like a helpful friend
"""
            elif emotion_score > 0.4:
                # Moderate frustration - provide scaffolding
                adapted_instruction = """
This student needs some extra support. Provide clear explanations with examples.
- Use structured formatting (bullet points, numbered lists)
- Include 1-2 analogies to make concepts relatable
- Offer to clarify if anything is confusing
- Tone: Friendly and helpful
"""
            else:
                # Normal state - proceed normally
                adapted_instruction = base_instruction
            
            system_instruction = adapted_instruction + """
Personality:
- Name: Qbit
- Role: Student Mentor / AI Tutor
- Style: Use Markdown. Break down complex concepts.
"""
        
        # Call Groq API with adapted instruction
        messages = [
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": query}
        ]
        
        response = self._call_ai(messages)
        
        # Log interaction for future emotion analysis
        if student_id:
            log_interaction(student_id, query, response, emotion_score)
        
        return response
```

**Frontend Team:**
```typescript
// INTEGRATE EMOTION TRACKING IN FRONTEND

// frontend/hooks/useInteractionTracker.ts
import { useEffect, useRef } from 'react';

export const useInteractionTracker = (studentId: string) => {
    const typingSpeeds = useRef<number[]>([]);
    const lastKeystrokeTime = useRef<number>(0);
    
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const now = Date.now();
            
            if (lastKeystrokeTime.current > 0) {
                const interval = now - lastKeystrokeTime.current;
                const wordsPerMinute = (60000 / interval) * 5; // Approximate
                
                typingSpeeds.current.push(wordsPerMinute);
                
                // Keep last 50 measurements
                if (typingSpeeds.current.length > 50) {
                    typingSpeeds.current.shift();
                }
            }
            
            lastKeystrokeTime.current = now;
        };
        
        window.addEventListener('keydown', handleKeyDown);
        
        // Send metrics to backend every 2 minutes
        const intervalId = setInterval(() => {
            if (typingSpeeds.current.length > 5) {
                const mean = typingSpeeds.current.reduce((a, b) => a + b, 0) / typingSpeeds.current.length;
                const std = Math.sqrt(
                    typingSpeeds.current.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / typingSpeeds.current.length
                );
                
                api.post('/v1/analytics/interaction-metrics/', {
                    student_id: studentId,
                    typing_speed_mean: mean,
                    typing_speed_std: std,
                    timestamp: Date.now()
                });
            }
        }, 120000);
        
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            clearInterval(intervalId);
        };
    }, [studentId]);
};


// Usage in chat component
const QbitChatWindow = ({ studentId }) => {
    useInteractionTracker(studentId);
    
    // ... rest of chat logic
};
```

**End of Day Deliverables:**
✅ Emotion detection integrated into QBit AI  
✅ Frontend interaction tracking live  
✅ AI responses adapt to student frustration  
✅ Interaction metrics logged for ML improvement  

---

#### **DAY 7 (March 30) - Testing & Bug Fixes**

**Full Team - Integration Testing:**

**Morning (9 AM - 1 PM):**
- [ ] **Badge System Testing:**
  - Test all badge earning scenarios
  - Verify leaderboard calculations
  - Test certificate generation for all rarities
  - Check social sharing on iOS/Android/Web
  - Edge cases: What happens if badge criteria changes?

- [ ] **Parent Dashboard Testing:**
  - Trigger manual report generation
  - Verify PDF formatting on different devices
  - Test email delivery
  - Test WhatsApp integration (if using Twilio sandbox)
  - Check metrics accuracy

- [ ] **Offline Mode Testing:**
  - Download lessons on slow network (throttle to 3G speeds)
  - Test playback in airplane mode
  - Verify progress sync after reconnection
  - Test on low-end Android devices (1GB RAM)
  - Check storage management (auto-cleanup of expired downloads)

**Afternoon (2 PM - 6 PM):**
- [ ] Bug fixes from morning testing
- [ ] Performance optimization:
  - Optimize database queries (add indexes)
  - Implement caching for leaderboards (Redis)
  - Compress images further for offline mode
  - Lazy-load badge images
- [ ] Documentation:
  - Update API docs with new endpoints
  - Write user guides for parents
  - Create teacher onboarding doc

**End of Day Deliverables:**
✅ All critical bugs fixed  
✅ Performance benchmarks met  
✅ Documentation updated  
✅ Sprint 1 features READY FOR LAUNCH  

---

### **WEEK 2: POLISH & DEPLOYMENT (Days 8-14)**

---

#### **DAYS 8-9 (March 31 - April 1) - Peer Study Rooms (Optional Stretch Goal)**

**If ahead of schedule, implement basic study rooms:**

```python
# QUICK STUDY ROOM IMPLEMENTATION

# apps/live_classes/models.py

class StudyRoom(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    name = models.CharField(max_length=200)
    creator = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    max_participants = models.IntegerField(default=6)
    access_code = models.CharField(max_length=10, unique=True)
    scheduled_start = models.DateTimeField()
    scheduled_end = models.DateTimeField()
    jitsi_room_name = models.CharField(max_length=255, unique=True)
    
    def generate_jitsi_token(self):
        """Generate JWT token for Jitsi authentication"""
        import jwt
        payload = {
            "context": {
                "user": {
                    "name": self.creator.name,
                    "email": self.creator.email
                }
            },
            "aud": "jitsi",
            "iss": "mentiq",
            "sub": "mentiq.com",
            "room": self.jitsi_room_name
        }
        return jwt.encode(payload, settings.JITSI_SECRET, algorithm='HS256')
```

**Frontend:**
```typescript
// Simple study room creation form + Jitsi WebView
const CreateStudyRoomScreen = () => {
    const [room, setRoom] = useState(null);
    
    const createRoom = async (formData) => {
        const response = await api.post('/v1/live-classes/study-rooms/', formData);
        setRoom(response.data);
    };
    
    if (!room) {
        return <StudyRoomForm onSubmit={createRoom} />;
    }
    
    return (
        <View>
            <JitsiMeeting
                roomName={room.jitsi_room_name}
                token={room.jitsi_token}
                config={{
                    startWithAudioMuted: false,
                    startWithVideoMuted: false
                }}
            />
            <ShareInviteButton code={room.access_code} />
        </View>
    );
};
```

---

#### **DAYS 10-11 (April 2-3) - Deployment Preparation**

**Backend Team:**
```bash
# DEPLOYMENT CHECKLIST

# 1. Database migrations on production
python manage.py migrate

# 2. Collect static files
python manage.py collectstatic --noinput

# 3. Load initial badge data
python manage.py loaddata initial_badges.json

# 4. Set up Celery Beat schedules
# Add to celery.py:
app.conf.beat_schedule.update({
    'send-weekly-parent-reports': {
        'task': 'apps.emails.tasks.send_weekly_reports_to_all_parents',
        'schedule': crontab(hour=18, minute=0, day_of_week=6),  # Sunday 6 PM
    },
})

# 5. Configure environment variables
# Add to .env:
GROQ_API_KEY=your_key_here
CLOUDINARY_CLOUD_NAME=your_cloud_name
TWILIO_ACCOUNT_SID=your_sid (for WhatsApp)
```

**Frontend Team:**
```bash
# MOBILE APP BUILD
cd frontend
npm install
eas build --platform android --profile production
eas build --platform ios --profile production

# WEB APP DEPLOYMENT
cd frontendweb
npm install
npm run build
# Deploy dist/ to Vercel/Netlify
```

**Testing:**
- [ ] Smoke test all features on staging environment
- [ ] Load test badge API (100 concurrent users)
- [ ] Test offline mode on actual rural network conditions
- [ ] Verify email delivery across providers (Gmail, Outlook, Yahoo)

---

#### **DAYS 12-13 (April 4-5) - User Onboarding & Marketing Prep**

**Create User Documentation:**
```markdown
# BADGE SYSTEM USER GUIDE

## How to Earn Badges

### Quiz Badges
- Complete quizzes with scores above 70%, 85%, or 95%
- Different badges for different score thresholds
- Example: "Quiz Novice" (5 quizzes with 70%+) → "Quiz Warrior" (20 quizzes with 85%+)

### Consistency Badges
- Log in and study for consecutive days
- 7 days = Common badge
- 30 days = Rare badge
- 100 days = Legendary badge!

### Trading Badges
- Some badges can be traded with other students
- Go to Profile → My Badges → Tap "Trade" on a badge
- Set your asking price in badge coins
- Platform takes 5% fee on successful trades
```

**Prepare Launch Announcement:**
```markdown
EMAIL TO ALL USERS:

Subject: 🎉 Exciting New Features Coming to MentiQ!

Hi [Name],

We're thrilled to announce game-changing features launching next week:

🏆 GAMIFIED BADGES - Earn recognition for your achievements!
📊 PARENT DASHBOARD - Keep your parents in the loop automatically
📱 OFFLINE MODE - Learn anywhere, even without internet
🤖 SMARTER AI TUTOR - QBit now adapts to your emotional state

Be among the first to experience these innovations!

Best,
The MentiQ Team
```

---

#### **DAY 14 (April 6) - LAUNCH DAY! 🚀**

**Launch Schedule:**

**9:00 AM:** Final production deployment
- Deploy backend changes
- Push mobile app update (Expo OTA)
- Deploy web app

**10:00 AM:** Monitoring setup
- Set up Sentry alerts for errors
- Monitor API response times
- Track badge earning events
- Watch for database slow queries

**11:00 AM:** Team debrief
- Review launch checklist
- Confirm all systems operational
- Assign on-call rotation for bug fixes

**12:00 PM:** Public announcement
- Send email to all users
- Post on social media
- Update app store descriptions

**2:00 PM - 6:00 PM:** Live monitoring
- Watch for critical bugs
- Respond to user feedback
- Hotfix any showstopper issues

---

## 📦 DEPENDENCIES TO INSTALL

### Backend (requirements.txt):
```txt
# Machine Learning
scikit-learn==1.4.0
joblib==1.3.2

# Speech Processing (for future voice AI)
SpeechRecognition==3.10.0
gTTS==2.3.2

# PDF Generation
xhtml2pdf==0.2.11
reportlab==4.0.9

# Graph Visualization (for skill graphs)
networkx==3.2.1

# WhatsApp (optional)
twilio==8.11.0

# Existing deps you already have:
# cloudinary, django-celery-beat, etc.
```

### Frontend (package.json additions):
```json
{
  "dependencies": {
    "@react-native-async-storage/async-storage": "^2.2.0",
    "expo-file-system": "^19.0.17",
    "react-force-graph": "^1.24.0",
    "recharts": "^2.12.0",
    "xhtml2pdf": "^0.2.11"
  }
}
```

---

## 🎯 SUCCESS CRITERIA (By End of 2 Weeks)

### Must-Have (Minimum Viable Product):
- ✅ Users can earn and view badges
- ✅ Leaderboards display top performers
- ✅ Parent accounts linked to students
- ✅ Weekly PDF reports generated
- ✅ Offline downloads work (video + audio)
- ✅ Progress syncs when back online
- ✅ AI tutor shows emotion-adaptive responses

### Nice-to-Have (If Time Permits):
- ⚡ Badge trading marketplace
- ⚡ Peer study room creation
- ⚡ Skill gap visualization graph
- ⚡ WhatsApp report delivery

### Success Metrics (First Week Post-Launch):
- 40% of students earn at least 1 badge
- 25% of parents open weekly report email
- 15% of users download offline content
- 10% increase in daily session time

---

## 🔥 RISK MITIGATION

### High-Risk Areas:

**1. Video Compression Quality**
- **Risk:** Compressed videos unwatchable
- **Mitigation:** Test with 10 different videos before launch
- **Fallback:** Keep original quality as fallback option

**2. Emotion Detection Accuracy**
- **Risk:** False positives frustrate students more
- **Mitigation:** Start with conservative thresholds (only adapt at very high frustration)
- **Fallback:** Allow students to disable feature in settings

**3. Offline Sync Conflicts**
- **Risk:** Data loss during sync
- **Mitigation:** Extensive testing with simulated network failures
- **Fallback:** Manual conflict resolution UI ("Keep mine" vs "Use server")

**4. Parent Report Email Bounces**
- **Risk:** Emails marked as spam
- **Mitigation:** Use reputable email service (SendGrid/Mailgun)
- **Fallback:** In-app notification as backup

---

## 📊 DAILY STANDUP FORMAT

**Every Morning (9:15 AM - 9:30 AM):**

Each team member answers:
1. What did I complete yesterday?
2. What will I work on today?
3. Any blockers or challenges?

**Example:**
> "Yesterday I finished the badge models and API endpoints. Today I'm working on the certificate generation with Cloudinary. Blocker: Need Cloudinary API key from DevOps."

**Evening Wrap-up (5:45 PM - 6:00 PM):**
- Quick sync on progress
- Update sprint board
- Commit all code

---

## 🎉 POST-SPRINT RETROSPECTIVE (April 7)

**Schedule 2-hour team retrospective:**

**What Went Well:**
- Celebrate wins (no matter how small)
- Identify processes to keep

**What Could Be Better:**
- Honest discussion of challenges
- No blame, focus on systems

**Action Items for Next Sprint:**
- Top 3 improvements to implement
- Assign owners to each action

**Demo Day:**
- Show stakeholders what was built
- Collect feedback
- Plan next sprint based on learnings

---

## 📱 PLATFORM-SPECIFIC TESTING CHECKLIST

### **MOBILE APP (React Native/Expo) Testing**

#### ✅ Badge System Mobile Tests:
- [ ] Badge cards render correctly on 5" Android screen
- [ ] Badge animations smooth (60 FPS) on mid-range device
- [ ] Push notification received when badge earned
- [ ] Tap badge → shows detail modal with certificate
- [ ] "Share Badge" opens native share sheet
- [ ] Leaderboard scroll performance (100+ items)
- [ ] Offline mode: Badge collection viewable without internet
- [ ] Pull-to-refresh updates badge data

**Device Matrix:**
| Device Type | OS Version | Screen Size | Test Status |
|------------|-----------|-------------|-------------|
| Low-end Android | Android 10 | 5.0" | ⬜ To Test |
| Mid-range Android | Android 12 | 6.1" | ⬜ To Test |
| High-end Android | Android 14 | 6.7" | ⬜ To Test |
| iPhone SE | iOS 15 | 4.7" | ⬜ To Test |
| iPhone 14 | iOS 17 | 6.1" | ⬜ To Test |

#### ✅ Offline Mode Mobile Tests:
- [ ] Download button appears on micro-lesson
- [ ] Progress indicator shows download %
- [ ] Downloaded lesson marked with ✓ icon
- [ ] Airplane mode: Can play downloaded videos
- [ ] Video playback resumes from last position
- [ ] Quality toggle (240p/360p) works offline
- [ ] Storage warning if < 100MB free
- [ ] Expired downloads auto-delete after 30 days
- [ ] Reconnect to WiFi → progress syncs automatically

**Network Conditions:**
| Network Type | Speed | Test Scenario | Result |
|-------------|-------|---------------|--------|
| WiFi | 50 Mbps | Download 50MB lesson in 10 sec | ⬜ Pass/Fail |
| 4G | 5 Mbps | Download same lesson in 2 min | ⬜ Pass/Fail |
| 3G | 500 Kbps | Stream 240p without buffering | ⬜ Pass/Fail |
| 2G | 50 Kbps | Show "switch to offline" prompt | ⬜ Pass/Fail |
| Offline | 0 Mbps | Play downloaded content | ⬜ Pass/Fail |

#### ✅ Parent Dashboard Mobile Tests:
- [ ] Weekly summary card shows key metrics
- [ ] Tap card → detailed report screen
- [ ] Charts responsive on mobile screen
- [ ] WhatsApp alert received on Sunday 6 PM
- [ ] "Contact Teacher" button opens WhatsApp/SMS
- [ ] Multiple children → swipe between profiles
- [ ] Dark mode supported

---

### **WEBSITE (Vite/React) Testing**

#### ✅ Badge System Web Tests:
- [ ] Badge gallery grid responsive (desktop → tablet → mobile)
- [ ] Hover effects on badge cards
- [ ] Click badge → modal with full details + share button
- [ ] Leaderboard table sortable by clicking headers
- [ ] Filter leaderboards: Global/School/Class tabs work
- [ ] Certificate download as PDF
- [ ] Print certificate (Ctrl+P) formats correctly
- [ ] Social share opens Web Share API or fallback

**Browser Compatibility:**
| Browser | Version | OS | Status | Notes |
|---------|---------|----|--------|-------|
| Chrome | Latest | Windows 11 | ⬜ To Test | Primary target |
| Firefox | Latest | Windows 11 | ⬜ To Test | Secondary |
| Safari | Latest | macOS | ⬜ To Test | For Mac users |
| Edge | Latest | Windows 10 | ⬜ To Test | Chromium-based |
| Chrome | Latest | Android 12 | ⬜ To Test | Mobile web |

#### ✅ Parent Dashboard Web Tests:
- [ ] Dashboard loads in < 2 seconds
- [ ] Weekly report chart renders (Recharts)
- [ ] Metrics grid shows all 8 cards
- [ ] Click metric → drill-down modal
- [ ] "Download PDF Report" button works
- [ ] Email preferences toggle saves
- [ ] Multi-child selector dropdown
- [ ] Book parent-teacher meeting → calendar integration

**Performance Benchmarks:**
| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| First Contentful Paint | < 1.5s | ⬜ _ms | ⬜ Pass/Fail |
| Time to Interactive | < 3s | ⬜ _ms | ⬜ Pass/Fail |
| Lighthouse Score | > 90 | ⬜ __/100 | ⬜ Pass/Fail |
| Bundle Size | < 500KB | ⬜ _KB | ⬜ Pass/Fail |

#### ✅ Cognitive AI Web Tests:
- [ ] Chat interface responsive
- [ ] Typing detection tracks keyboard input
- [ ] Emotion adaptation visible (tone changes)
- [ ] Markdown rendering in AI responses
- [ ] Code syntax highlighting works
- [ ] Copy response button functional
- [ ] Chat history scrolls smoothly

---

### **BACKEND API Testing (Both Platforms)**

#### ✅ API Endpoint Tests:
```bash
# Test badge endpoints
curl -X GET https://api.mentiq.com/api/v1/progress/badges/ \
  -H "Authorization: Bearer {token}"
# Expected: JSON array of available badges

curl -X POST https://api.mentiq.com/api/v1/progress/badges/earn/ \
  -H "Authorization: Bearer {token}" \
  -d {"badge_id": "uuid-here"}
# Expected: {success: true, badge_earned: {...}}

curl -X GET https://api.mentiq.com/api/v1/progress/leaderboard/?scope=school
# Expected: {leaderboard: [{rank: 1, student_name: "...", score: 100}]}

# Test offline endpoints
curl -X POST https://api.mentiq.com/api/v1/lessons/micro/download/ \
  -H "Authorization: Bearer {token}" \
  -d {"microLessonId": "uuid-here", "quality": "low"}
# Expected: {downloadUrl: "https://...", expiresAt: "..."}

# Test parent dashboard
curl -X GET https://api.mentiq.com/api/v1/users/parent-dashboard/{student_id}/
# Expected: {metrics: {...}, weeklyReports: [...]}
```

**API Performance:**
| Endpoint | P50 | P95 | P99 | Status |
|----------|-----|-----|-----|--------|
| GET /badges/ | < 100ms | < 300ms | < 500ms | ⬜ _/_/_ |
| POST /badges/earn/ | < 150ms | < 400ms | < 600ms | ⬜ _/_/_ |
| GET /leaderboard/ | < 200ms | < 500ms | < 800ms | ⬜ _/_/_ |
| POST /offline/download/ | < 100ms | < 300ms | < 500ms | ⬜ _/_/_ |

#### ✅ Celery Task Tests:
- [ ] Weekly parent report scheduled for Sunday 6 PM
- [ ] Badge earning trigger fires on quiz completion
- [ ] Streak counter updates daily at midnight
- [ ] Failed tasks retry automatically (max 3 times)
- [ ] Task logs visible in Flower dashboard

#### ✅ Database Tests:
- [ ] All queries use indexes (check with EXPLAIN ANALYZE)
- [ ] No N+1 queries (use Django Debug Toolbar)
- [ ] Connection pooling working (pgBouncer if used)
- [ ] Migrations apply cleanly on fresh database

---

### **CROSS-PLATFORM CONSISTENCY Tests**

#### ✅ Visual Consistency:
- [ ] Same badge icons on mobile and web
- [ ] Colors match brand guidelines (hex codes identical)
- [ ] Typography consistent (font family, sizes)
- [ ] Icons from same set (Lucide/Feather)

#### ✅ Data Consistency:
- [ ] Badge count same on both platforms
- [ ] Leaderboard rankings identical
- [ ] Parent metrics match exactly
- [ ] Sync happens in real-time (< 5 sec delay)

#### ✅ Feature Parity Check:
| Feature | Mobile App | Website | Notes |
|---------|-----------|---------|-------|
| View badges | ✅ Full | ✅ Full | Parity |
| Earn badges | ✅ Auto | ✅ Auto | Parity |
| Share badges | ✅ Native share | ✅ Web Share API | Different implementation |
| Leaderboards | ✅ View only | ✅ View + Filter | Mobile lacks filters |
| Offline mode | ✅ Full | ❌ None | Mobile exclusive |
| Parent reports | ✅ Summary | ✅ Full dashboard | Web has more detail |
| AI Chat | ✅ Touch tracking | ✅ Keyboard tracking | Different inputs |

---

## 🐛 BUG TRACKING BY PLATFORM

### Critical Bugs (Block Launch):
- [ ] **Mobile:** App crashes on low-end Android (< 2GB RAM)
- [ ] **Mobile:** Offline videos don't play in airplane mode
- [ ] **Web:** Leaderboard doesn't load on Firefox
- [ ] **Backend:** Badge earning triggers fire multiple times
- [ ] **Backend:** Parent reports not generating

### Major Bugs (Should Fix Before Launch):
- [ ] **Mobile:** Badge animations stutter on 3-year-old devices
- [ ] **Web:** Certificate PDF download fails on Safari
- [ ] **Mobile:** Push notifications delayed by 5+ minutes
- [ ] **Web:** Charts break on screens < 1200px wide

### Minor Bugs (Can Patch Post-Launch):
- [ ] **Mobile:** Badge icon slightly misaligned on iPhone SE
- [ ] **Web:** Hover state persists after click on touch laptops
- [ ] **Both:** Typos in onboarding tooltips

---

## 📊 SUCCESS METRICS BY PLATFORM

### Week 1 Post-Launch Targets:

#### 📱 MOBILE METRICS:
- [ ] **Downloads:** 1,000+ app installs (Android + iOS)
- [ ] **DAU/MAU Ratio:** > 0.40 (40% of monthly users active daily)
- [ ] **Session Duration:** 25+ minutes average
- [ ] **Offline Adoption:** 30% of users download at least 1 lesson
- [ ] **Badge Engagement:** 50% of students earn 1+ badge in first week
- [ ] **Push Notification OR:** 60% open rate on badge earned notifications
- [ ] **Crash Rate:** < 1% of sessions

#### 💻 WEB METRICS:
- [ ] **Unique Visitors:** 2,000+ per week
- [ ] **Bounce Rate:** < 40%
- [ ] **Avg Session:** 15+ minutes
- [ ] **Parent Dashboard Usage:** 25% of parents log in weekly
- [ ] **Leaderboard Views:** 100+ views per day
- [ ] **Lighthouse Score:** > 90 performance

#### 🖥️ BACKEND METRICS:
- [ ] **API Uptime:** 99.9% (max 8 min downtime/week)
- [ ] **Avg Response Time:** < 200ms across all endpoints
- [ ] **Error Rate:** < 0.1% of requests return 5xx
- [ ] **Celery Task Success:** > 98% complete on first try
- [ ] **Database Query Time:** P95 < 500ms

---

## 🚀 DEPLOYMENT STRATEGY BY PLATFORM

### **MOBILE APP Deployment:**

**Expo EAS Build Process:**
```bash
# 1. Submit to EAS Build
cd frontend
eas build --platform android --profile production
eas build --platform ios --profile production

# 2. Monitor build status
eas build:list

# 3. Submit to stores
eas submit --platform android
eas submit --platform ios
```

**Release Timeline:**
- **Day 11:** Internal testing (Expo Go)
- **Day 12:** Beta testing (TestFlight + Google Play Internal)
- **Day 13:** Production rollout (staged: 10% → 50% → 100%)
- **Day 14:** Public announcement

**App Store Optimization:**
- [ ] Update app title: "MentiQ - AI Learning with Badges"
- [ ] Add keywords: offline learning, gamification, education
- [ ] Update screenshots showing badges + offline mode
- [ ] Write what's new: "🏆 Earn badges! 📱 Learn offline! 🎯 Track progress!"

### **WEB Deployment:**

**Vercel Deployment:**
```bash
cd frontendweb
npm run build
vercel --prod
```

**Deployment Checklist:**
- [ ] Environment variables set in Vercel dashboard
- [ ] Custom domain configured (app.mentiq.com)
- [ ] SSL certificate auto-renewing
- [ ] Analytics connected (Google Analytics + Sentry)
- [ ] Sitemap.xml updated with new pages
- [ ] robots.txt allows crawling

**Rollback Plan:**
If critical bug found:
```bash
# Revert to previous deployment
vercel rollback
# Or redeploy specific commit
vercel --prod --commit-hash abc123
```

### **BACKEND Deployment:**

**Production Server:**
```bash
# SSH into server
ssh deploy@mentiq-backend

# Pull latest code
cd /var/www/mentiq/backend
git pull origin main

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Collect static files
python manage.py collectstatic --noinput

# Restart services
sudo systemctl restart gunicorn
sudo systemctl restart celery-worker
sudo systemctl restart celery-beat
sudo systemctl restart nginx
```

**Zero-Downtime Deployment:**
- Use Blue-Green deployment if possible
- Health check endpoint: `/api/health/`
- Rollback if error rate > 1%

---

## 📞 SUPPORT CONTACTS

### Technical Issues by Platform:

**📱 Mobile App Issues:**
- Developer 3 (Mobile Lead): [Name] - [Email/Phone]
- Backup: Developer 2 - [Email/Phone]

**💻 Website Issues:**
- Developer 4 (Web Dev): [Name] - [Email/Phone]

**🖥️ Backend/API Issues:**
- Developer 1 (Backend Lead): [Name] - [Email/Phone]
- Backup: Developer 2 - [Email/Phone]

**🤖 ML/AI Issues:**
- Developer 5 (ML Engineer): [Name] - [Email/Phone]

**DevOps/Deployment:**
- [DevOps Lead Name]: [Email/Phone]

### Product Questions:
- Product Owner: [Name] - [Email/Phone]
- Project Manager: [Name] - [Email/Phone]

### Emergency Escalation (24/7):
- CTO/Project Sponsor: [Name] - [Email/Phone]
- Technical Advisor: [Name] - [Email/Phone]

---

**© MentiQ 2026 — 2-Week Sprint Implementation Plan v2.0**  
*Platform-Specific Strategy: Mobile-First for Indian Market*  
*Last Updated: March 23, 2026*  

📧 mentiq.learn@gmail.com | 🌐 mentiq.com | 📍 Punjab, India

---

**© MentiQ 2026 — 2-Week Sprint Implementation Plan**  
*Let's build something amazing together! 🚀*
