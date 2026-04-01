from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.db import connection
from django.db.utils import DatabaseError
from django.utils import timezone
from datetime import timedelta
from .services import QbitService
from .models import FlashcardSession, InteractionEvent, CognitiveState, CognitiveStateHistory
from .serializers import (
    BatchInteractionSerializer,
    CognitiveStateSerializer,
    CognitiveHistorySerializer,
)
from .emotion_detector import EmotionDetector
from apps.lessons.models import Lesson
from apps.enrollments.models import Enrollment
from PIL import Image
import logging

logger = logging.getLogger(__name__)


def _table_exists(table_name):
    try:
        return table_name in connection.introspection.table_names()
    except DatabaseError:
        return False

class AskQbitView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """
        Endpoint to ask Qbit a question.
        Now enhanced with cognitive state awareness — adapts response tone
        and difficulty based on the student's emotional state.
        
        Payload: { "query": "string", "lesson_id": "uuid" (optional), "scope": "lesson" | "global" }
        Files: "image" (optional)
        """
        query = request.data.get("query")
        lesson_id = request.data.get("lesson_id")
        scope = request.data.get("scope", "global")
        image_file = request.FILES.get("image")

        if not query and not image_file:
            return Response({"error": "Query or Image is required"}, status=status.HTTP_400_BAD_REQUEST)

        # User details for personalization
        user = request.user
        role = getattr(user, 'role', 'student').lower()
        full_name = f"{getattr(user, 'first_name', '')} {getattr(user, 'last_name', '')}".strip()
        user_name = full_name or getattr(user, 'name', '') or getattr(user, 'username', 'User')
        context = ""
        
        # Build context based on role and scope
        if role == 'teacher':
             # Teacher context: Fetch courses they teach
             from apps.courses.models import Course
             taught_courses = Course.objects.filter(teacher=user, is_deleted=False)
             course_list = [c.title for c in taught_courses]
             context = f"Instructor Name: {user_name}\nRole: Teacher/Instructor\nCourses Taught: {', '.join(course_list)}"
        else:
            # Student context
            if scope == "lesson" and lesson_id:
                try:
                    lesson = Lesson.objects.get(id=lesson_id)
                    context = f"Lesson Title: {lesson.title}\nContent: {lesson.content}\nDescription: {lesson.description}"
                except Lesson.DoesNotExist:
                    context = "Requested lesson context is unavailable."
            elif scope == "global":
                enrollments = Enrollment.objects.filter(student=user, is_active=True).select_related('course')
                course_titles = [e.course.title for e in enrollments]
                context = f"Enrolled Courses: {', '.join(course_titles)}"

            if not context:
                context = "No course context available for this student yet."
            context = f"Student Name: {user_name}\nRole: Student\n" + context

        # Process Image if present
        image = None
        if image_file:
            try:
                image = Image.open(image_file)
            except Exception:
                return Response({"error": "Invalid image file"}, status=status.HTTP_400_BAD_REQUEST)

        # ─── Cognitive AI Enhancement ────────────────────────────
        # Fetch cognitive state (attached by middleware or manual lookup)
        cognitive_state = getattr(request, 'cognitive_state', None)
        
        service = QbitService()
        answer = service.get_chat_response(
            query or "Analyze this image",
            context,
            image,
            role=role,
            cognitive_state=cognitive_state,
        )

        # Build response with optional cognitive adaptation metadata
        response_data = {"answer": answer}
        
        if cognitive_state and role == 'student':
            detector = EmotionDetector()
            adaptation = detector.get_adaptation_strategy(cognitive_state)
            response_data["cognitive_adaptation"] = {
                "detected_mood": cognitive_state.get('current_mood', 'neutral'),
                "tone_used": adaptation.get('tone', 'balanced'),
                "difficulty_adjusted": adaptation.get('difficulty_adjustment', 0) != 0,
                "suggestion": adaptation.get('nudge_message'),
            }

        return Response(response_data)

class GenerateQuizView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """
        Generate a quiz for a specific lesson or topic.
        """
        lesson_id = request.data.get("lesson_id")
        topic = request.data.get("topic")

        content = ""
        if lesson_id:
            try:
                lesson = Lesson.objects.get(id=lesson_id)
                content = f"{lesson.title}\n{lesson.content}"
            except Lesson.DoesNotExist:
                return Response({"error": "Lesson not found"}, status=status.HTTP_404_NOT_FOUND)
        elif topic:
            content = topic
        else:
             return Response({"error": "Lesson ID or Topic is required"}, status=status.HTTP_400_BAD_REQUEST)

        service = QbitService()
        quiz_json = service.generate_quiz(content)
        
        import json
        try:
            data = json.loads(quiz_json)
            return Response(data)
        except json.JSONDecodeError:
            return Response({"error": "Failed to generate valid quiz data. Raw: " + quiz_json}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class GenerateFlashcardsView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        topic = request.data.get("topic")
        if not topic:
             return Response({"error": "Topic is required"}, status=status.HTTP_400_BAD_REQUEST)

        service = QbitService()
        cards_json = service.generate_flashcards(topic)

        import json
        try:
            data = json.loads(cards_json)
            if isinstance(data, list) and request.user.role == 'student' and _table_exists(FlashcardSession._meta.db_table):
                try:
                    FlashcardSession.objects.create(
                        student=request.user,
                        topic=str(topic)[:255],
                        cards_generated=len(data),
                    )
                except DatabaseError:
                    # Keep flashcard generation successful even if analytics table is unavailable.
                    pass
            return Response(data)
        except json.JSONDecodeError:
            return Response({"error": "Failed to generate flashcards"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class GenerateStudyPlanView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        exam_date = request.data.get("exam_date")
        hours = request.data.get("hours_per_day", 2)
        subject = request.data.get("subject", "")
        
        # Use subject if provided, otherwise fall back to enrolled courses
        if subject:
            courses = [subject]
        else:
            enrollments = Enrollment.objects.filter(student=request.user, is_active=True).select_related('course')
            courses = [e.course.title for e in enrollments]

        if not courses:
             return Response({"error": "Please enter a subject or enroll in a course."}, status=status.HTTP_400_BAD_REQUEST)

        service = QbitService()
        plan = service.generate_study_plan(courses, exam_date, hours)
        
        return Response({"plan": plan})


# ─────────────────────────────────────────────────────────────────
# 🧠 COGNITIVE AI COMPANION VIEWS
# ─────────────────────────────────────────────────────────────────

class RecordInteractionView(APIView):
    """
    POST /api/v1/ai/interactions/
    
    Accepts batched interaction events from mobile/web clients.
    Processes them through EmotionDetector and updates CognitiveState.
    
    Payload:
    {
        "session_id": "abc123",
        "platform": "mobile" | "web",
        "events": [
            {
                "event_type": "typing_pattern",
                "metrics": { "typing_speed_wpm": 45, "backspace_rate": 0.12, ... },
                "context": { "screen": "lesson_view", "lesson_id": "uuid" }
            },
            ...
        ]
    }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        if getattr(user, 'role', '') != 'student':
            return Response(
                {"error": "Interaction tracking is available for students only."},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = BatchInteractionSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        session_id = data['session_id']
        platform = data['platform']
        events = data['events']

        # Store interaction events
        created_events = []
        for event in events:
            try:
                ie = InteractionEvent.objects.create(
                    student=user,
                    session_id=session_id,
                    event_type=event['event_type'],
                    platform=platform,
                    metrics=event['metrics'],
                    context=event.get('context', {}),
                )
                created_events.append(ie)
            except Exception as e:
                logger.warning(f"Failed to store interaction event: {e}")

        # Run EmotionDetector on recent events (last 5 minutes)
        recent_cutoff = timezone.now() - timedelta(minutes=5)
        recent_events = InteractionEvent.objects.filter(
            student=user,
            created_at__gte=recent_cutoff,
        ).values('metrics', 'event_type', 'context')

        detector = EmotionDetector()
        state_dict = detector.analyze(list(recent_events))
        adaptation = detector.get_adaptation_strategy(state_dict)

        # Update or create CognitiveState
        cognitive_state, _ = CognitiveState.objects.update_or_create(
            student=user,
            defaults={
                'frustration_score': state_dict['frustration_score'],
                'engagement_score': state_dict['engagement_score'],
                'confidence_score': state_dict['confidence_score'],
                'cognitive_load': state_dict['cognitive_load'],
                'current_mood': state_dict['current_mood'],
                'last_signals': state_dict.get('signals', {}),
                'last_adaptation': adaptation,
            }
        )

        # Update daily history
        today = timezone.now().date()
        history, created = CognitiveStateHistory.objects.get_or_create(
            student=user,
            date=today,
            defaults={
                'avg_frustration': state_dict['frustration_score'],
                'avg_engagement': state_dict['engagement_score'],
                'avg_confidence': state_dict['confidence_score'],
                'dominant_mood': state_dict['current_mood'],
                'total_interaction_events': len(created_events),
            }
        )
        if not created:
            # Running average update
            n = history.total_interaction_events or 1
            new_n = n + len(created_events)
            history.avg_frustration = (
                (history.avg_frustration * n + state_dict['frustration_score'] * len(created_events)) / new_n
            )
            history.avg_engagement = (
                (history.avg_engagement * n + state_dict['engagement_score'] * len(created_events)) / new_n
            )
            history.avg_confidence = (
                (history.avg_confidence * n + state_dict['confidence_score'] * len(created_events)) / new_n
            )
            history.dominant_mood = state_dict['current_mood']
            history.total_interaction_events = new_n
            history.save()

        # Clean up old events (>20 days)
        cleanup_cutoff = timezone.now() - timedelta(days=20)
        InteractionEvent.objects.filter(
            student=user,
            created_at__lt=cleanup_cutoff,
        ).delete()

        return Response({
            "status": "recorded",
            "events_stored": len(created_events),
            "cognitive_state": {
                "frustration_score": state_dict['frustration_score'],
                "engagement_score": state_dict['engagement_score'],
                "confidence_score": state_dict['confidence_score'],
                "cognitive_load": state_dict['cognitive_load'],
                "current_mood": state_dict['current_mood'],
            },
            "adaptation": adaptation,
        }, status=status.HTTP_201_CREATED)


class GetCognitiveStateView(APIView):
    """
    GET /api/v1/ai/cognitive-state/
    
    Returns the current cognitive/emotional state for the authenticated student.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if getattr(user, 'role', '') != 'student':
            return Response(
                {"error": "Cognitive state is available for students only."},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            state = CognitiveState.objects.get(student=user)
            serializer = CognitiveStateSerializer(state)
            return Response(serializer.data)
        except CognitiveState.DoesNotExist:
            # Return default neutral state
            detector = EmotionDetector()
            default = detector._default_state()
            default['adaptation'] = detector.get_adaptation_strategy(default)
            return Response({
                "student": str(user.id),
                "student_name": user.name,
                **default,
                "computed_at": None,
                "message": "No interaction data recorded yet.",
            })


class CognitiveHistoryView(APIView):
    """
    GET /api/v1/ai/cognitive-state/history/
    
    Returns daily cognitive state trend for the last 20 days.
    Optional query param: ?days=7 (default: 20)
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if getattr(user, 'role', '') != 'student':
            return Response(
                {"error": "Cognitive history is available for students only."},
                status=status.HTTP_403_FORBIDDEN
            )

        days = int(request.query_params.get('days', 20))
        days = min(days, 90)  # Cap at 90 days
        cutoff = timezone.now().date() - timedelta(days=days)

        history = CognitiveStateHistory.objects.filter(
            student=user,
            date__gte=cutoff,
        ).order_by('date')

        serializer = CognitiveHistorySerializer(history, many=True)
        return Response({
            "days_requested": days,
            "data_points": len(serializer.data),
            "history": serializer.data,
        })
