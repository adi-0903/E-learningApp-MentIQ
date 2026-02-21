"""
Live class views - Create, start, end, join, leave, chat.
"""
from django.conf import settings
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.pagination import StandardPagination
from apps.core.permissions import IsStudent, IsTeacher

from apps.enrollments.models import Enrollment
from .models import Attendance, LiveClass, LiveClassChat, LiveClassParticipant
from .serializers import (
    AttendanceSerializer,
    LiveClassChatSerializer,
    LiveClassCreateSerializer,
    LiveClassDetailSerializer,
    LiveClassListSerializer,
    LiveClassParticipantSerializer,
)


class LiveClassListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/v1/live-classes/       - List live classes
    POST /api/v1/live-classes/       - Create (teacher only)
    """
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return LiveClassCreateSerializer
        return LiveClassListSerializer

    def get_queryset(self):
        queryset = LiveClass.objects.select_related('teacher', 'course')
        user = self.request.user

        if user.role == 'teacher':
            queryset = queryset.filter(teacher=user)
        else:
            # Students see scheduled and live classes
            queryset = queryset.filter(status__in=['scheduled', 'live'])

        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        return queryset

    def create(self, request, *args, **kwargs):
        if request.user.role != 'teacher':
            return Response(
                {'success': False, 'error': {'message': 'Only teachers can create live classes.'}},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = LiveClassCreateSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        live_class = serializer.save()
        return Response({
            'success': True,
            'message': 'Live class created.',
            'data': LiveClassDetailSerializer(live_class).data,
        }, status=status.HTTP_201_CREATED)


class LiveClassDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET/PUT/DELETE /api/v1/live-classes/<id>/"""
    serializer_class = LiveClassDetailSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'id'

    def get_queryset(self):
        return LiveClass.objects.select_related('teacher', 'course')

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        return Response({'success': True, 'data': LiveClassDetailSerializer(instance).data})


class StartLiveClassView(APIView):
    """POST /api/v1/live-classes/<id>/start/ - Teacher starts the class."""
    permission_classes = [IsAuthenticated, IsTeacher]

    def post(self, request, id):
        try:
            live_class = LiveClass.objects.get(id=id, teacher=request.user)
        except LiveClass.DoesNotExist:
            return Response({'success': False, 'error': {'message': 'Not found.'}}, status=404)

        live_class.status = 'live'
        live_class.started_at = timezone.now()
        live_class.save()

        # Jitsi doesn't require server-side token generation for free public rooms
        # But we return the necessary config for the frontend to embed the jitsi frame

        return Response({
            'success': True,
            'message': 'Live class started.',
            'data': {
                'room_name': live_class.channel_name,
                'jitsi_domain': settings.JITSI_DOMAIN,
                'is_class_host': True,
                'meeting_url': live_class.jitsi_room_url,
            }
        })


class EndLiveClassView(APIView):
    """POST /api/v1/live-classes/<id>/end/ - Teacher ends the class."""
    permission_classes = [IsAuthenticated, IsTeacher]

    def post(self, request, id):
        try:
            live_class = LiveClass.objects.get(id=id, teacher=request.user)
        except LiveClass.DoesNotExist:
            return Response({'success': False, 'error': {'message': 'Not found.'}}, status=404)

        live_class.status = 'ended'
        live_class.ended_at = timezone.now()
        live_class.save()

        # Mark all participants as left
        LiveClassParticipant.objects.filter(
            live_class=live_class, left_at__isnull=True
        ).update(left_at=timezone.now())

        return Response({'success': True, 'message': 'Live class ended.'})


class JoinLiveClassView(APIView):
    """POST /api/v1/live-classes/<id>/join/ - Student joins the class."""
    permission_classes = [IsAuthenticated]

    def post(self, request, id):
        try:
            live_class = LiveClass.objects.get(id=id, status='live')
        except LiveClass.DoesNotExist:
            return Response({'success': False, 'error': {'message': 'Class not live.'}}, status=404)

        # Check capacity
        if live_class.participant_count >= live_class.max_participants:
            return Response(
                {'success': False, 'error': {'message': 'Class is full.'}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        participant, created = LiveClassParticipant.objects.get_or_create(
            live_class=live_class,
            user=request.user,
            defaults={'joined_at': timezone.now()},
        )
        if not created and participant.left_at:
            participant.left_at = None
            participant.save()

        # Jitsi Logic
        return Response({
            'success': True,
            'message': 'Joined live class.',
            'data': {
                'room_name': live_class.channel_name,
                'jitsi_domain': settings.JITSI_DOMAIN,
                'is_class_host': False,
                'meeting_url': live_class.jitsi_room_url,
            }
        })


class LeaveLiveClassView(APIView):
    """POST /api/v1/live-classes/<id>/leave/"""
    permission_classes = [IsAuthenticated]

    def post(self, request, id):
        try:
            participant = LiveClassParticipant.objects.get(
                live_class_id=id, user=request.user, left_at__isnull=True
            )
        except LiveClassParticipant.DoesNotExist:
            return Response({'success': False, 'error': {'message': 'Not in this class.'}}, status=404)

        participant.left_at = timezone.now()
        participant.save()
        return Response({'success': True, 'message': 'Left live class.'})


class LiveClassParticipantsView(generics.ListAPIView):
    """GET /api/v1/live-classes/<id>/participants/"""
    serializer_class = LiveClassParticipantSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return LiveClassParticipant.objects.filter(
            live_class_id=self.kwargs['id']
        ).select_related('user')


class LiveClassChatView(APIView):
    """
    GET  /api/v1/live-classes/<id>/chat/ - Get chat history
    POST /api/v1/live-classes/<id>/chat/ - Send a message
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, id):
        messages = LiveClassChat.objects.filter(
            live_class_id=id
        ).select_related('user').order_by('timestamp')[:200]
        serializer = LiveClassChatSerializer(messages, many=True)
        return Response({'success': True, 'data': serializer.data})

    def post(self, request, id):
        message_text = request.data.get('message', '').strip()
        if not message_text:
            return Response(
                {'success': False, 'error': {'message': 'Message cannot be empty.'}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        msg = LiveClassChat.objects.create(
            live_class_id=id,
            user=request.user,
            message=message_text,
        )
        return Response({
            'success': True,
            'data': LiveClassChatSerializer(msg).data,
        }, status=status.HTTP_201_CREATED)


class LiveClassAttendanceView(APIView):
    """
    GET  /api/v1/live-classes/<id>/attendance/ - Get attendance list
    POST /api/v1/live-classes/<id>/attendance/ - Bulk mark attendance
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, id):
        try:
            live_class = LiveClass.objects.get(id=id)
        except LiveClass.DoesNotExist:
            return Response({'success': False, 'error': {'message': 'Not found.'}}, status=404)

        # Check if user is teacher of this class or student enrolled in the course
        if request.user.role == 'teacher' and live_class.teacher != request.user:
             return Response({'success': False, 'error': {'message': 'Forbidden.'}}, status=403)

        # Get existing attendance
        attendance_records = Attendance.objects.filter(live_class=live_class).select_related('student')
        
        if request.user.role == 'student':
            # Students only see their own attendance
            record = attendance_records.filter(student=request.user).first()
            return Response({
                'success': True,
                'data': AttendanceSerializer(record).data if record else None
            })

        # Teacher View: 
        # If class linked to course, show all enrolled students merged with records
        if live_class.course:
            enrolled_students = Enrollment.objects.filter(course=live_class.course, is_active=True).select_related('student')
            records_dict = {str(r.student_id): r for r in attendance_records}
            
            data = []
            for enrollment in enrolled_students:
                student = enrollment.student
                record = records_dict.get(str(student.id))
                data.append({
                    'student': student.id,
                    'student_name': student.name,
                    'student_id': student.student_id, # User custom ID
                    'is_present': record.is_present if record else False,
                    'marked_at': record.marked_at if record else None
                })
            return Response({'success': True, 'data': data})

        # Fallback for classes without a assigned course
        serializer = AttendanceSerializer(attendance_records, many=True)
        return Response({'success': True, 'data': serializer.data})

    def post(self, request, id):
        if request.user.role != 'teacher':
             return Response({'success': False, 'error': {'message': 'Only teachers can mark attendance.'}}, status=403)
             
        try:
            live_class = LiveClass.objects.get(id=id, teacher=request.user)
        except LiveClass.DoesNotExist:
            return Response({'success': False, 'error': {'message': 'Not found.'}}, status=404)

        attendance_data = request.data.get('attendance', []) # List of {student_id: int, is_present: bool}
        
        results = []
        for item in attendance_data:
            student_id = item.get('student_id')
            is_present = item.get('is_present', False)
            
            if not student_id: continue
            
            record, created = Attendance.objects.update_or_create(
                live_class=live_class,
                student_id=student_id,
                defaults={'is_present': is_present}
            )
            results.append(AttendanceSerializer(record).data)

        return Response({
            'success': True,
            'message': 'Attendance updated.',
            'data': results
        })
