"""
Analytics views - Platform and course analytics (teacher/admin only).
"""
from django.db.models import Avg, Sum
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.permissions import IsTeacher

from .models import CourseAnalytics, DailyAnalytics, UserActivityLog
from .serializers import CourseAnalyticsSerializer, DailyAnalyticsSerializer, UserActivityLogSerializer


class PlatformAnalyticsView(APIView):
    """
    GET /api/v1/analytics/platform/
    Returns the latest platform-wide analytics snapshot.
    """
    permission_classes = [IsAuthenticated, IsTeacher]

    def get(self, request):
        latest = DailyAnalytics.objects.first()
        if not latest:
            return Response({'success': True, 'data': None})
        return Response({
            'success': True,
            'data': DailyAnalyticsSerializer(latest).data,
        })


class PlatformAnalyticsHistoryView(generics.ListAPIView):
    """
    GET /api/v1/analytics/platform/history/?days=30
    Returns daily analytics for the last N days.
    """
    serializer_class = DailyAnalyticsSerializer
    permission_classes = [IsAuthenticated, IsTeacher]

    def get_queryset(self):
        days = int(self.request.query_params.get('days', 30))
        return DailyAnalytics.objects.all()[:days]


class CourseAnalyticsView(APIView):
    """
    GET /api/v1/analytics/course/<course_id>/
    Returns analytics for a specific course.
    """
    permission_classes = [IsAuthenticated, IsTeacher]

    def get(self, request, course_id):
        days = int(request.query_params.get('days', 30))
        analytics = CourseAnalytics.objects.filter(
            course_id=course_id
        ).order_by('-date')[:days]

        # Aggregates
        totals = CourseAnalytics.objects.filter(course_id=course_id).aggregate(
            total_views=Sum('views'),
            total_enrollments=Sum('enrollments'),
            total_completions=Sum('completions'),
            avg_progress=Avg('avg_progress'),
            avg_quiz_score=Avg('avg_quiz_score'),
            total_revenue=Sum('revenue'),
        )

        return Response({
            'success': True,
            'data': {
                'history': CourseAnalyticsSerializer(analytics, many=True).data,
                'totals': totals,
            },
        })


class UserActivityLogView(APIView):
    """
    View to record and fetch user activity sessions.
    GET: Get own activity logs.
    POST: Start a new activity session.
    PATCH: Update/End an existing activity session.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        logs = UserActivityLog.objects.filter(user=request.user)[:50]
        return Response({
            'success': True,
            'data': UserActivityLogSerializer(logs, many=True).data
        })

    def post(self, request):
        device_info = request.data.get('device_info', '')
        log = UserActivityLog.objects.create(
            user=request.user,
            device_info=device_info
        )
        return Response({
            'success': True,
            'data': UserActivityLogSerializer(log).data
        })

    def patch(self, request):
        log_id = request.data.get('log_id')
        duration = request.data.get('duration_seconds')
        
        if not log_id:
            return Response({'success': False, 'message': 'log_id is required'}, status=400)
            
        try:
            log = UserActivityLog.objects.get(id=log_id, user=request.user)
            if duration is not None:
                log.duration_seconds = duration
            
            # If they pass is_ending, set end_time
            if request.data.get('is_ending'):
                from django.utils import timezone
                log.end_time = timezone.now()
                
            log.save()
            return Response({
                'success': True,
                'data': UserActivityLogSerializer(log).data
            })
        except UserActivityLog.DoesNotExist:
            return Response({'success': False, 'message': 'Log not found'}, status=404)
