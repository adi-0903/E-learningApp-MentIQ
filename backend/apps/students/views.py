"""
Student-specific views.
All endpoints here are restricted to users with role='student'.
"""
from collections import defaultdict

from django.contrib.auth import get_user_model
from django.db import connection
from django.db.models import Avg, Count, ExpressionWrapper, F, FloatField, Q, Sum
from django.db.utils import DatabaseError
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.ai_tutor.models import FlashcardSession
from apps.analytics.models import UserActivityLog
from apps.core.pagination import StandardPagination
from apps.core.permissions import IsStudent
from apps.courses.models import Course
from apps.enrollments.models import Enrollment
from apps.lessons.models import Lesson
from apps.progress.models import CourseProgress, LessonProgress
from apps.quizzes.models import QuizAttempt

from apps.live_classes.models import SessionBooking
from apps.attendance.models import AttendanceRecord, AttendanceSession
from .serializers import (
    StudentCourseSerializer,
    StudentDashboardSerializer,
    StudentProgressSummarySerializer,
    StudentQuizResultSerializer,
    TeacherMentorSerializer,
    StudentSessionBookingSerializer,
)

User = get_user_model()


def _clamp(value, min_value=0.0, max_value=100.0):
    return max(min_value, min(max_value, value))


def _table_exists(table_name):
    try:
        return table_name in connection.introspection.table_names()
    except DatabaseError:
        return False


class StudentDashboardView(APIView):
    """
    GET /api/v1/students/dashboard/
    Returns aggregated dashboard data for the logged-in student.
    """
    permission_classes = [IsAuthenticated, IsStudent]

    def get(self, request):
        student = request.user

        # Enrolled courses
        enrolled_courses = Course.objects.filter(
            enrollments__student=student, 
            enrollments__is_active=True,
            is_deleted=False
        ).distinct()
        total_enrolled = enrolled_courses.count()

        # Progress stats
        course_progresses = CourseProgress.objects.filter(student=student, course__in=enrolled_courses)
        completed = course_progresses.filter(progress_percentage=100).count()
        in_progress = total_enrolled - completed

        # Lesson stats
        total_lessons_completed = LessonProgress.objects.filter(
            student=student, completed=True
        ).count()

        # Quiz stats
        quiz_attempts = QuizAttempt.objects.filter(student=student)
        total_quizzes = quiz_attempts.count()
        unique_quizzes = quiz_attempts.values('quiz').distinct().count()
        avg_score = quiz_attempts.aggregate(
            avg=Avg('score')
        )['avg'] or 0.0

        # Core Stats
        overall = course_progresses.aggregate(avg=Avg('progress_percentage'))['avg'] or 0.0
        records = AttendanceRecord.objects.filter(student=student)
        total_attendance = records.count()
        present_count = records.filter(is_present=True).count()
        attendance_percentage = round((present_count / total_attendance) * 100, 1) if total_attendance > 0 else 0.0

        # Per-course attendance
        course_attendance_stats = []
        for course in enrolled_courses:
            course_records = AttendanceRecord.objects.filter(student=student, session__course=course)
            c_total = course_records.count()
            c_present = course_records.filter(is_present=True).count()
            c_percentage = round((c_present / c_total) * 100, 1) if c_total > 0 else 0.0
            
            course_attendance_stats.append({
                'id': str(course.id),
                'title': course.title,
                'total': c_total,
                'present': c_present,
                'percentage': c_percentage
            })

        # Recent 5 courses
        recent_courses = enrolled_courses.order_by('-updated_at')[:5]

        data = {
            'total_enrolled_courses': total_enrolled,
            'completed_courses': completed,
            'in_progress_courses': in_progress,
            'total_quizzes_taken': total_quizzes,
            'unique_quizzes_count': unique_quizzes,
            'average_quiz_score': round(avg_score, 1),
            'total_lessons_completed': total_lessons_completed,
            'total_attendance_marked': total_attendance,
            'total_present': present_count,
            'attendance_percentage': attendance_percentage,
            'course_attendance': course_attendance_stats,
            'recent_courses': StudentCourseSerializer(
                recent_courses, many=True, context={'request': request}
            ).data,
            'overall_progress': round(overall, 1),
        }


        return Response({'success': True, 'data': data})


class StudentKnowledgeGraphView(APIView):
    """
    GET /api/v1/students/knowledge-graph/
    Returns live course mastery nodes + inferred prerequisite edges for the student.
    """
    permission_classes = [IsAuthenticated, IsStudent]

    LEVEL_ORDER = {
        'beginner': 1,
        'all_levels': 2,
        'intermediate': 3,
        'advanced': 4,
    }

    def _build_edges(self, nodes):
        categorized_nodes = defaultdict(list)
        for node in nodes:
            categorized_nodes[node['category']].append(node)

        edge_set = set()
        edges = []

        for category_nodes in categorized_nodes.values():
            if len(category_nodes) < 2:
                continue

            ordered_nodes = sorted(
                category_nodes,
                key=lambda n: (self.LEVEL_ORDER.get(n['level'], 2), n['label'].lower()),
            )

            for idx in range(1, len(ordered_nodes)):
                source_id = ordered_nodes[idx - 1]['id']
                target_id = ordered_nodes[idx]['id']
                edge_key = (source_id, target_id)
                if edge_key in edge_set:
                    continue

                edge_set.add(edge_key)
                edges.append({
                    'source': source_id,
                    'target': target_id,
                    'relation': 'prerequisite',
                })

        return edges

    def _apply_layout(self, nodes, edges):
        if not nodes:
            return []

        node_map = {node['id']: node for node in nodes}

        if not edges:
            ordered_ids = sorted(node_map.keys(), key=lambda n_id: node_map[n_id]['label'].lower())
            columns = min(4, max(1, len(ordered_ids)))
            rows = (len(ordered_ids) + columns - 1) // columns

            for idx, node_id in enumerate(ordered_ids):
                row = idx // columns
                col = idx % columns
                x = 12.0 if columns == 1 else 12.0 + (col * (76.0 / (columns - 1)))
                y = 50.0 if rows == 1 else 20.0 + (row * (60.0 / (rows - 1)))
                node_map[node_id]['x'] = round(x, 2)
                node_map[node_id]['y'] = round(y, 2)

            return [node_map[node['id']] for node in nodes]

        adjacency = defaultdict(list)
        incoming_counts = {node_id: 0 for node_id in node_map.keys()}

        for edge in edges:
            source = edge['source']
            target = edge['target']
            if source not in node_map or target not in node_map or source == target:
                continue
            adjacency[source].append(target)
            incoming_counts[target] += 1

        levels = {node_id: 0 for node_id in node_map.keys()}
        queue = [node_id for node_id, in_degree in incoming_counts.items() if in_degree == 0]
        visited = set()

        while queue:
            current_id = queue.pop(0)
            visited.add(current_id)

            for neighbor_id in adjacency[current_id]:
                levels[neighbor_id] = max(levels[neighbor_id], levels[current_id] + 1)
                incoming_counts[neighbor_id] -= 1
                if incoming_counts[neighbor_id] == 0:
                    queue.append(neighbor_id)

        for node_id in node_map.keys():
            if node_id not in visited:
                levels[node_id] = 0

        max_level = max(levels.values()) if levels else 0
        level_buckets = defaultdict(list)
        for node_id, level in levels.items():
            level_buckets[level].append(node_id)

        for level, node_ids in level_buckets.items():
            node_ids.sort(key=lambda n_id: node_map[n_id]['label'].lower())
            x = 12.0 if max_level == 0 else 12.0 + (level * (76.0 / max_level))
            count = len(node_ids)

            for idx, node_id in enumerate(node_ids, start=1):
                y = (idx * (100.0 / (count + 1)))
                node_map[node_id]['x'] = round(x, 2)
                node_map[node_id]['y'] = round(_clamp(y, 10.0, 90.0), 2)

        return [node_map[node['id']] for node in nodes]

    def get(self, request):
        student = request.user

        enrolled_courses = Course.objects.filter(
            enrollments__student=student,
            enrollments__is_active=True,
            is_deleted=False,
        ).distinct().order_by('category', 'created_at')
        course_ids = list(enrolled_courses.values_list('id', flat=True))

        progress_map = {
            str(row['course_id']): float(row['progress_percentage'])
            for row in CourseProgress.objects.filter(
                student=student,
                course_id__in=course_ids,
            ).values('course_id', 'progress_percentage')
        }

        total_lessons_map = {
            str(row['course']): int(row['total'])
            for row in Lesson.objects.filter(
                course_id__in=course_ids,
                is_deleted=False,
            ).values('course').annotate(total=Count('id'))
        }

        completed_lessons_map = {
            str(row['lesson__course']): int(row['completed'])
            for row in LessonProgress.objects.filter(
                student=student,
                completed=True,
                lesson__course_id__in=course_ids,
            ).values('lesson__course').annotate(completed=Count('id'))
        }

        percentage_expression = ExpressionWrapper(
            100.0 * F('score') / F('total_questions'),
            output_field=FloatField(),
        )

        course_quiz_stats = {
            str(row['quiz__course']): {
                'average_percentage': float(row['avg_percentage']) if row['avg_percentage'] is not None else None,
                'attempt_count': int(row['attempt_count']),
            }
            for row in QuizAttempt.objects.filter(
                student=student,
                quiz__course_id__in=course_ids,
                total_questions__gt=0,
            ).values('quiz__course').annotate(
                avg_percentage=Avg(percentage_expression),
                attempt_count=Count('id'),
            )
        }

        nodes = []
        for course in enrolled_courses:
            course_id = str(course.id)
            total_lessons = total_lessons_map.get(course_id, 0)
            completed_lessons = completed_lessons_map.get(course_id, 0)

            progress_percentage = progress_map.get(course_id)
            if progress_percentage is None:
                if total_lessons > 0:
                    progress_percentage = (completed_lessons / total_lessons) * 100.0
                else:
                    progress_percentage = 0.0

            quiz_stats = course_quiz_stats.get(course_id, {})
            quiz_average = quiz_stats.get('average_percentage')
            quiz_attempts = quiz_stats.get('attempt_count', 0)

            if quiz_average is None:
                mastery = progress_percentage
            else:
                mastery = (progress_percentage * 0.6) + (quiz_average * 0.4)

            level_rank = self.LEVEL_ORDER.get(course.level, 2)
            importance = 1
            if total_lessons >= 4:
                importance += 1
            if total_lessons >= 8:
                importance += 1
            if level_rank >= 3:
                importance += 1
            if quiz_attempts >= 3:
                importance += 1

            nodes.append({
                'id': course_id,
                'label': course.title,
                'mastery': round(_clamp(mastery), 1),
                'importance': min(5, max(1, importance)),
                'category': course.category,
                'level': course.level,
                'progress_percentage': round(_clamp(progress_percentage), 1),
                'quiz_average': round(quiz_average, 1) if quiz_average is not None else None,
            })

        edges = self._build_edges(nodes)
        positioned_nodes = self._apply_layout(nodes, edges)

        overall_quiz_accuracy = QuizAttempt.objects.filter(
            student=student,
            total_questions__gt=0,
        ).aggregate(avg=Avg(percentage_expression))['avg'] or 0.0

        lesson_time_seconds = LessonProgress.objects.filter(
            student=student,
            lesson__course_id__in=course_ids,
        ).aggregate(total=Sum('time_spent'))['total'] or 0

        quiz_time_seconds = QuizAttempt.objects.filter(
            student=student,
            quiz__course_id__in=course_ids,
        ).aggregate(total=Sum('time_taken'))['total'] or 0

        # Accurate course study time (Lessons + Quizzes) for the enrolled courses
        total_time_seconds = lesson_time_seconds + quiz_time_seconds
        warnings = []

        decks_generated = 0
        cards_generated = 0
        if _table_exists(FlashcardSession._meta.db_table):
            try:
                flashcard_qs = FlashcardSession.objects.filter(student=student)
                decks_generated = flashcard_qs.count()
                cards_generated = flashcard_qs.aggregate(total=Sum('cards_generated'))['total'] or 0
            except DatabaseError:
                warnings.append('flashcard_sessions_unavailable')
        else:
            warnings.append('flashcard_sessions_unavailable')

        expected_cards = max(20, len(positioned_nodes) * 20)
        flashcards_performance = (cards_generated / expected_cards) * 100 if cards_generated else 0.0

        doubts_asked = 0
        if _table_exists(SessionBooking._meta.db_table):
            try:
                doubts_asked = SessionBooking.objects.filter(student=student).count()
            except DatabaseError:
                warnings.append('session_bookings_unavailable')
        else:
            warnings.append('session_bookings_unavailable')

        data = {
            'nodes': positioned_nodes,
            'edges': edges,
            'signals': {
                'quiz_accuracy': round(_clamp(overall_quiz_accuracy), 1),
                'time_spent_hours': round(total_time_seconds / 3600.0, 1),
                'flashcards_performance': round(_clamp(flashcards_performance), 1),
                'flashcards_generated': decks_generated,
                'doubts_asked': doubts_asked,
            },
            'meta': {
                'node_count': len(positioned_nodes),
                'edge_count': len(edges),
                'source': 'live_backend',
                'warnings': warnings,
            }
        }

        return Response({'success': True, 'data': data})


class StudentEnrolledCoursesView(generics.ListAPIView):
    """
    GET /api/v1/students/courses/
    Lists all courses the student is enrolled in with progress.
    """
    serializer_class = StudentCourseSerializer
    permission_classes = [IsAuthenticated, IsStudent]
    pagination_class = StandardPagination

    def get_queryset(self):
        enrolled_ids = Enrollment.objects.filter(
            student=self.request.user, is_active=True
        ).values_list('course_id', flat=True)
        return Course.objects.filter(id__in=enrolled_ids).select_related('teacher')

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response({'success': True, 'data': serializer.data})


class StudentTeachersView(generics.ListAPIView):
    """
    GET /api/v1/students/my-teachers/
    Lists all teachers of the courses the student is enrolled in.
    """
    serializer_class = TeacherMentorSerializer
    permission_classes = [IsAuthenticated, IsStudent]

    def get_queryset(self):
        enrolled_course_ids = Enrollment.objects.filter(
            student=self.request.user, is_active=True
        ).values_list('course_id', flat=True)
        
        teacher_ids = Course.objects.filter(id__in=enrolled_course_ids).values_list('teacher_id', flat=True)
        return User.objects.filter(id__in=teacher_ids, role='teacher', is_active=True)

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        data = serializer.data

        # Inject Personal AI Mentor at the top
        ai_mentor = {
            'id': 'ai-mentor',
            'name': 'MentIQ AI Mentor',
            'role': 'Advanced AI Assistant',
            'bio': 'I am available 24/7 to help you with any doubts.',
            'expertise': ['Any Subject', 'Code Debugging', 'Concept Explanation'],
            'availability': 'Available 24/7',
            'rating': 5.0,
            'reviews': '10k+',
            'image': '/Logo.png',
            'phone_number': '+1 (800) MentIQ-AI',
            'subject': 'All Subjects',
            'is_ai': True
        }

        # Mark human teachers
        for mentor in data:
            mentor['is_ai'] = False

        data.insert(0, ai_mentor)

        return Response({'success': True, 'data': data})


class StudentProgressView(APIView):
    """
    GET /api/v1/students/progress/
    Returns progress summary for all enrolled courses.
    """
    permission_classes = [IsAuthenticated, IsStudent]

    def get(self, request):
        student = request.user
        enrolled_ids = Enrollment.objects.filter(
            student=student, is_active=True
        ).values_list('course_id', flat=True)

        courses = Course.objects.filter(id__in=enrolled_ids)
        progress_data = []

        for course in courses:
            total_lessons = course.lessons.count()
            completed_lessons = LessonProgress.objects.filter(
                student=student, lesson__course=course, completed=True
            ).count()

            progress_pct = 0
            if total_lessons > 0:
                progress_pct = round((completed_lessons / total_lessons) * 100, 1)

            # Course progress record
            cp, _ = CourseProgress.objects.get_or_create(
                student=student, course=course,
                defaults={'progress_percentage': progress_pct}
            )

            # Quiz average for this course
            quiz_avg = QuizAttempt.objects.filter(
                student=student, quiz__course=course
            ).aggregate(avg=Avg('score'))['avg']

            progress_data.append({
                'course_id': course.id,
                'course_title': course.title,
                'total_lessons': total_lessons,
                'completed_lessons': completed_lessons,
                'progress_percentage': progress_pct,
                'last_accessed': cp.updated_at,
                'quiz_average': round(quiz_avg, 1) if quiz_avg else None,
            })

        return Response({'success': True, 'data': progress_data})


class StudentQuizHistoryView(generics.ListAPIView):
    """
    GET /api/v1/students/quiz-history/
    Lists all quiz attempts by the student.
    """
    serializer_class = StudentQuizResultSerializer
    permission_classes = [IsAuthenticated, IsStudent]
    pagination_class = StandardPagination

    def get_queryset(self):
        return QuizAttempt.objects.filter(
            student=self.request.user
        ).select_related('quiz', 'quiz__course').order_by('-completed_at')


class StudentBrowseCoursesView(generics.ListAPIView):
    """
    GET /api/v1/students/browse/
    Browse all available courses with search & filter.
    """
    serializer_class = StudentCourseSerializer
    permission_classes = [IsAuthenticated, IsStudent]
    pagination_class = StandardPagination

    def get_queryset(self):
        queryset = Course.objects.filter(
            is_published=True, is_deleted=False
        ).select_related('teacher')

        # Search
        search = self.request.query_params.get('search', '')
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(description__icontains=search) |
                Q(category__icontains=search)
            )

        # Filter by category
        category = self.request.query_params.get('category', '')
        if category:
            queryset = queryset.filter(category__iexact=category)

        # Filter by level
        level = self.request.query_params.get('level', '')
        if level:
            queryset = queryset.filter(level__iexact=level)

        # Sorting
        sort = self.request.query_params.get('sort', '-created_at')
        allowed_sorts = ['created_at', '-created_at', 'title', '-title']
        if sort in allowed_sorts:
            queryset = queryset.order_by(sort)

        return queryset
class StudentSessionBookingCreateView(generics.CreateAPIView):
    """
    POST /api/v1/students/book-session/
    Allows students to book a 1:1 session with a teacher.
    """
    serializer_class = StudentSessionBookingSerializer
    permission_classes = [IsAuthenticated, IsStudent]

    def perform_create(self, serializer):
        serializer.save(student=self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response({
            'success': True, 
            'message': 'Session booked successfully.',
            'data': serializer.data
        }, status=status.HTTP_201_CREATED)
