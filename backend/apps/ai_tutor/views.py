from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.db import connection
from django.db.utils import DatabaseError
from .services import QbitService
from .models import FlashcardSession
from apps.lessons.models import Lesson
from apps.enrollments.models import Enrollment
from PIL import Image


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
        user_name = full_name or getattr(user, 'username', 'User')
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

        service = QbitService()
        answer = service.get_chat_response(query or "Analyze this image", context, image, role=role)

        return Response({"answer": answer})

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
