from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import ParentAccount, StudentLinkRequest, WeeklyProgressReport

User = get_user_model()

class StudentMinimalSerializer(serializers.ModelSerializer):
    """Minimal student info for the parent's dashboard."""
    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'student_id', 'profile_image']


class ParentProfileSerializer(serializers.ModelSerializer):
    """Detailed parent profile including linked children."""
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.name', read_only=True)
    children = StudentMinimalSerializer(many=True, read_only=True)

    class Meta:
        model = ParentAccount
        fields = [
            'id', 'user_email', 'user_name', 'children', 
            'receive_weekly_reports', 'receive_immediate_alerts'
        ]


class StudentLinkRequestSerializer(serializers.ModelSerializer):
    """Serializer for requesting a link to a student."""
    student_id = serializers.CharField(write_only=True)
    display_student_id = serializers.CharField(source='student.student_id', read_only=True)
    student_name = serializers.CharField(source='student.name', read_only=True)

    class Meta:
        model = StudentLinkRequest
        fields = ['id', 'student_id', 'display_student_id', 'student_name', 'status', 'created_at']
        read_only_fields = ['id', 'status', 'created_at', 'display_student_id', 'student_name']

    def validate_student_id(self, value):
        if not User.objects.filter(student_id=value, role=User.RoleChoices.STUDENT).exists():
            raise serializers.ValidationError("No student found with this ID.")
        return value

    def create(self, validated_data):
        student_id = validated_data.pop('student_id')
        student = User.objects.get(student_id=student_id)
        parent = self.context['parent']
        
        # Check if already linked
        if parent.children.filter(id=student.id).exists():
            raise serializers.ValidationError("This student is already linked to your account.")
            
        # Instantly approve and link
        parent.children.add(student)
        
        link_request, created = StudentLinkRequest.objects.get_or_create(
            parent=parent,
            student=student,
            defaults={'status': StudentLinkRequest.Status.APPROVED}
        )
        
        if not created and link_request.status != StudentLinkRequest.Status.APPROVED:
            link_request.status = StudentLinkRequest.Status.APPROVED
            link_request.save()
            
        return link_request


class WeeklyReportSerializer(serializers.ModelSerializer):
    """Serializer for weekly progress reports."""
    student_name = serializers.CharField(source='student.name', read_only=True)
    
    class Meta:
        model = WeeklyProgressReport
        fields = [
            'id', 'student_name', 'week_start_date', 'week_end_date',
            'quizzes_completed', 'average_quiz_score', 'lessons_watched',
            'badges_earned', 'attendance_rate', 'time_spent_seconds',
            'ai_summary', 'teacher_notes', 'report_pdf_url', 'created_at'
        ]
