from django.db import models
from django.conf import settings
from apps.core.models import TimeStampedModel
from apps.courses.models import Course

class AttendanceSession(TimeStampedModel):
    """Represents a specific class session for which attendance is recorded."""
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='attendance_sessions')
    teacher = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    date = models.DateField(auto_now_add=True)
    start_time = models.TimeField()
    
    class Meta:
        db_table = 'attendance_sessions'
        ordering = ['-date', '-start_time']

    def __str__(self):
        return f"{self.course.title} - {self.date} {self.start_time}"

class AttendanceRecord(TimeStampedModel):
    """Individual attendance record for a student in a session."""
    session = models.ForeignKey(AttendanceSession, on_delete=models.CASCADE, related_name='records')
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='attendance_records')
    is_present = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'attendance_records'
        unique_together = ('session', 'student')

    def __str__(self):
        status = "Present" if self.is_present else "Absent"
        return f"{self.student.uid} - {self.session.date}: {status}"
