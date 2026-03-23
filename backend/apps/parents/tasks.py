import logging
from datetime import timedelta
from django.utils import timezone
from django.db.models import Avg, Sum, Count, Q
from celery import shared_task
from django.contrib.auth import get_user_model

from .models import ParentAccount, WeeklyProgressReport
from apps.quizzes.models import QuizAttempt
from apps.progress.models import LessonProgress, StudentBadge
from apps.attendance.models import AttendanceRecord
from apps.notifications.utils import create_notification
from apps.notifications.models import Notification

User = get_user_model()
logger = logging.getLogger(__name__)

@shared_task(name="apps.parents.tasks.generate_weekly_reports")
def generate_weekly_reports():
    """
    Weekly task to generate progress reports for all linked children.
    Typically runs on Sunday night/Monday morning.
    """
    today = timezone.now().date()
    # Week range: Last Monday to Last Sunday
    start_date = today - timedelta(days=today.weekday() + 7)
    end_date = start_date + timedelta(days=6)
    
    logger.info(f"Generating weekly reports for range {start_date} to {end_date}")
    
    parents = ParentAccount.objects.filter(receive_weekly_reports=True)
    count = 0
    
    for parent in parents:
        for student in parent.children.all():
            # Check if report already exists for this week
            if WeeklyProgressReport.objects.filter(
                student=student, 
                parent=parent, 
                week_end_date=end_date
            ).exists():
                continue
                
            try:
                report_data = _calculate_student_metrics(student, start_date, end_date)
                
                WeeklyProgressReport.objects.create(
                    student=student,
                    parent=parent,
                    week_start_date=start_date,
                    week_end_date=end_date,
                    **report_data,
                    ai_summary=_generate_ai_summary(student, report_data)
                )
                
                # Notify parent
                create_notification(
                    user=parent.user,
                    title="Weekly Progress Report Ready",
                    body=f"The weekly report for {student.name} is now available in your dashboard.",
                    notification_type=Notification.TypeChoices.SYSTEM,
                    data={"type": "weekly_report", "student_id": student.id}
                )
                count += 1
            except Exception as e:
                logger.error(f"Failed to generate report for {student.name}: {e}")
                
    return f"Generated {count} weekly reports."


def _calculate_student_metrics(student, start_date, end_date):
    """Aggregates metrics for a student within a date range."""
    
    # Convert dates to aware datetimes for filtering
    start_dt = timezone.make_aware(timezone.datetime.combine(start_date, timezone.datetime.min.time()))
    end_dt = timezone.make_aware(timezone.datetime.combine(end_date, timezone.datetime.max.time()))
    
    # 1. Quizzes
    quiz_attempts = QuizAttempt.objects.filter(
        student=student,
        completed_at__range=(start_dt, end_dt)
    )
    quizzes_completed = quiz_attempts.count()
    avg_score = 0.0
    if quizzes_completed > 0:
        # We need to calculate percentage manually if not stored, 
        # but QuizAttempt has a 'score' and 'total_questions'
        # Let's assume average of (score/total_questions)*100
        scores = [a.percentage for a in quiz_attempts]
        avg_score = sum(scores) / len(scores)
        
    # 2. Lessons
    lessons = LessonProgress.objects.filter(
        student=student,
        completed=True,
        completed_at__range=(start_dt, end_dt)
    )
    lessons_watched = lessons.count()
    time_spent = lessons.aggregate(total=Sum('time_spent'))['total'] or 0
    
    # 3. Badges
    badges_earned = StudentBadge.objects.filter(
        student=student,
        awarded_at__range=(start_dt, end_dt)
    ).count()
    
    # 4. Attendance
    attendance = AttendanceRecord.objects.filter(
        student=student,
        session__date__range=(start_date, end_date)
    )
    total_sessions = attendance.count()
    present_sessions = attendance.filter(is_present=True).count()
    attendance_rate = (present_sessions / total_sessions * 100) if total_sessions > 0 else 0.0
    
    return {
        'quizzes_completed': quizzes_completed,
        'average_quiz_score': round(avg_score, 1),
        'lessons_watched': lessons_watched,
        'badges_earned': badges_earned,
        'attendance_rate': round(attendance_rate, 1),
        'time_spent_seconds': time_spent
    }


def _generate_ai_summary(student, data):
    """
    Generates a simple text-based summary. 
    In the future, this could use an LLM API.
    """
    summary = f"Hello! This week, {student.name} showed "
    
    if data['quizzes_completed'] > 0:
        summary += f"great engagement with quizzes, completing {data['quizzes_completed']} with an average score of {data['average_quiz_score']}%."
    else:
        summary += "no quiz activity this week."
        
    if data['badges_earned'] > 0:
        summary += f" We're also proud to report {data['badges_earned']} new achievement badges earned!"
        
    if data['attendance_rate'] < 75 and data['attendance_rate'] > 0:
        summary += f" Attendance was a bit low ({data['attendance_rate']}%); we recommend checking in on forthcoming live sessions."
    elif data['attendance_rate'] >= 90:
        summary += " Excellent attendance record this week!"
        
    return summary
