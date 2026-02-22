from rest_framework import generics, status, views
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.core.permissions import IsTeacher
from .models import AttendanceSession, AttendanceRecord
from .serializers import AttendanceSessionSerializer, AttendanceBulkCreateSerializer
from apps.courses.models import Course
from apps.users.models import User
from apps.users.serializers import UserProfileSerializer

class CourseStudentsView(views.APIView):
    """Returns list of students enrolled in a specific course."""
    permission_classes = [IsAuthenticated, IsTeacher]
    
    def get(self, request, course_id):
        try:
            course = Course.objects.get(id=course_id, teacher=request.user)
            # Find all students enrolled in this course
            students = User.objects.filter(
                enrollments__course=course,
                enrollments__is_active=True,
                role='student'
            ).distinct()
            
            serializer = UserProfileSerializer(students, many=True)
            return Response({
                'success': True,
                'data': serializer.data
            })
        except Course.DoesNotExist:
            return Response({
                'success': False,
                'error': {'message': 'Course not found or unauthorized.'}
            }, status=status.HTTP_404_NOT_FOUND)

class AttendanceSessionCreateView(generics.CreateAPIView):
    """Mark attendance for a class session."""
    permission_classes = [IsAuthenticated, IsTeacher]
    serializer_class = AttendanceBulkCreateSerializer
    
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        session = serializer.save()
        return Response({
            'success': True,
            'message': 'Attendance marked successfully.',
            'data': AttendanceSessionSerializer(session).data
        }, status=status.HTTP_201_CREATED)

class AttendanceHistoryView(generics.ListAPIView):
    """View history of attendance sessions for a course."""
    permission_classes = [IsAuthenticated, IsTeacher]
    serializer_class = AttendanceSessionSerializer
    
    def get_queryset(self):
        course_id = self.request.query_params.get('course_id')
        return AttendanceSession.objects.filter(
            course_id=course_id,
            teacher=self.request.user
        ).prefetch_related('records', 'records__student')
