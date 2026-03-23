"""
Progress views - Mark lessons complete, get progress, and Badge System.
"""
from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.generics import ListAPIView, RetrieveAPIView

from apps.core.permissions import IsStudent
from apps.lessons.models import Lesson

from .models import CourseProgress, LessonProgress, AchievementBadge, StudentBadge
from .serializers import (
    CourseProgressSerializer,
    LessonProgressSerializer,
    MarkLessonCompleteSerializer,
    AchievementBadgeSerializer,
    StudentBadgeSerializer,
    LeaderboardEntrySerializer,
)


class MarkLessonCompleteView(APIView):
    """
    POST /api/v1/progress/complete/
    Mark a lesson as completed for the current student.
    Automatically recalculates course progress.
    """
    permission_classes = [IsAuthenticated, IsStudent]

    def post(self, request):
        serializer = MarkLessonCompleteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        lesson_id = serializer.validated_data['lesson_id']
        time_spent = serializer.validated_data.get('time_spent', 0)

        try:
            lesson = Lesson.objects.select_related('course').get(id=lesson_id, is_deleted=False)
        except Lesson.DoesNotExist:
            return Response(
                {'success': False, 'error': {'message': 'Lesson not found.'}},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Create or update lesson progress
        lp, created = LessonProgress.objects.get_or_create(
            student=request.user,
            lesson=lesson,
            defaults={'completed': True, 'completed_at': timezone.now(), 'time_spent': time_spent},
        )

        if not created and not lp.completed:
            lp.completed = True
            lp.completed_at = timezone.now()
            lp.time_spent += time_spent
            lp.save()

        # Update course progress
        cp, _ = CourseProgress.objects.get_or_create(
            student=request.user,
            course=lesson.course,
        )
        cp.last_lesson = lesson
        cp.recalculate()

        return Response({
            'success': True,
            'message': 'Lesson marked as completed.',
            'data': {
                'lesson_progress': LessonProgressSerializer(lp).data,
                'course_progress': CourseProgressSerializer(cp).data,
            }
        })


class CourseProgressView(APIView):
    """
    GET /api/v1/progress/course/<course_id>/
    Get lesson-by-lesson progress for a course.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, course_id):
        # Course progress
        try:
            cp = CourseProgress.objects.get(student=request.user, course_id=course_id)
        except CourseProgress.DoesNotExist:
            cp = None

        # Lesson progress
        lesson_progresses = LessonProgress.objects.filter(
            student=request.user,
            lesson__course_id=course_id,
        ).select_related('lesson').order_by('lesson__sequence_number')

        return Response({
            'success': True,
            'data': {
                'course_progress': CourseProgressSerializer(cp).data if cp else None,
                'lessons': LessonProgressSerializer(lesson_progresses, many=True).data,
            }
        })


# ─────────────────────────────────────────────────────────────
# 🎮 BADGE SYSTEM VIEWS
# ─────────────────────────────────────────────────────────────

class AvailableBadgesView(ListAPIView):
    """
    GET /api/v1/progress/badges/
    List all available badges that can be earned.
    """
    serializer_class = AchievementBadgeSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return AchievementBadge.objects.filter(total_awarded__gte=0).order_by('-rarity', 'name')


class MyBadgesView(ListAPIView):
    """
    GET /api/v1/progress/my-badges/
    Get current user's earned badges.
    """
    serializer_class = StudentBadgeSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return StudentBadge.objects.filter(
            student=self.request.user
        ).select_related('badge').order_by('-awarded_at')


class LeaderboardView(APIView):
    """
    GET /api/v1/progress/leaderboard/
    Get leaderboard with filters (global/school/class).
    Query params: scope (default: 'global'), timeframe (default: 'all_time')
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        scope = request.query_params.get('scope', 'global')
        
        # Base query for students with badges
        from django.db.models import Count, Q
        from apps.users.models import User
        
        query = StudentBadge.objects.filter(is_claimed=True).values('student').annotate(
            total_badges=Count('id'),
            rare_badges=Count('id', filter=Q(badge__rarity__in=['RARE', 'EPIC', 'LEGENDARY', 'MYTHIC']))
        )
        
        # Apply scope filter
        if scope == 'school' and hasattr(request.user, 'school'):
            query = query.filter(student__school=request.user.school)
        elif scope == 'class' and hasattr(request.user, 'class_section'):
            query = query.filter(student__class_section=request.user.class_section)
        
        # Build leaderboard data
        leaderboard_data = []
        for idx, entry in enumerate(query.order_by('-rare_badges', '-total_badges')[:100]):
            try:
                student = User.objects.get(id=entry['student'])
                leaderboard_data.append({
                    'rank': idx + 1,
                    'student_id': str(entry['student']),
                    'student_name': student.name,
                    'student_email': student.email,
                    'total_badges': entry['total_badges'],
                    'rare_badges': entry['rare_badges'],
                    'score': entry['rare_badges'] * 10 + entry['total_badges']
                })
            except User.DoesNotExist:
                continue
        
        serializer = LeaderboardEntrySerializer(leaderboard_data, many=True)
        return Response(serializer.data)


class AwardBadgeView(APIView):
    """
    POST /api/v1/progress/badges/earn/
    Automatically award badge to student if criteria met.
    Body: {"criteria_type": "quiz_mastery", "context_data": {...}}
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        from .services import check_and_award_badge
        
        criteria_type = request.data.get('criteria_type')
        context_data = request.data.get('context_data', {})
        
        if not criteria_type:
            return Response({
                'success': False,
                'error': {'message': 'criteria_type is required'}
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check and award badge
        result = check_and_award_badge(request.user, criteria_type, context_data)
        
        if result.get('awarded'):
            return Response({
                'success': True,
                'message': f"🏆 Badge earned: {result['badge_name']}",
                'data': result
            })
        else:
            return Response({
                'success': False,
                'message': result.get('message', 'Criteria not met yet'),
                'data': result
            }, status=status.HTTP_400_BAD_REQUEST)
