import uuid
from django.contrib.auth import get_user_model
from django.test import TestCase

from apps.courses.models import Course
from apps.lessons.models import Lesson
from apps.offline.models import MicroLesson
from apps.offline.serializers import InitiateDownloadSerializer

User = get_user_model()


class InitiateDownloadSerializerTests(TestCase):
    def setUp(self):
        self.teacher = User.objects.create_user(
            email='teacher@mentiq.com',
            password='Password123!',
            name='Test Teacher',
            role='teacher',
        )
        self.course = Course.objects.create(
            title='Test Course',
            teacher=self.teacher,
            is_published=True,
        )
        self.lesson = Lesson.objects.create(
            course=self.course,
            title='Test Lesson',
            sequence_number=1,
        )
        self.micro_lesson = MicroLesson.objects.create(
            lesson=self.lesson,
            compressed_video_url='https://example.com/video.mp4',
            summary_text='Lesson summary',
            file_size_bytes=10485760,
            duration_seconds=300,
            compression_status=MicroLesson.CompressionStatus.COMPLETED,
        )

    def test_validate_micro_lesson_id_success(self):
        """Valid micro_lesson_id for a ready MicroLesson passes validation."""
        data = {
            'micro_lesson_id': str(self.micro_lesson.id),
            'device_info': 'Test Phone',
        }
        serializer = InitiateDownloadSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        self.assertEqual(
            serializer.validated_data['micro_lesson_id'],
            self.micro_lesson.id,
        )
        self.assertEqual(serializer.validated_data['device_info'], 'Test Phone')

    def test_validate_micro_lesson_id_default_device_info(self):
        """device_info defaults to empty string if omitted."""
        data = {
            'micro_lesson_id': str(self.micro_lesson.id),
        }
        serializer = InitiateDownloadSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data['device_info'], '')

    def test_validate_micro_lesson_id_not_found(self):
        """Non-existent micro_lesson_id raises validation error."""
        non_existent_id = uuid.uuid4()
        data = {
            'micro_lesson_id': str(non_existent_id),
        }
        serializer = InitiateDownloadSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('micro_lesson_id', serializer.errors)
        self.assertEqual(
            serializer.errors['micro_lesson_id'][0],
            'Micro-lesson not found.',
        )

    def test_validate_micro_lesson_id_not_ready(self):
        """MicroLesson with non-completed status raises validation error specifying status."""
        unready_statuses = [
            MicroLesson.CompressionStatus.PENDING,
            MicroLesson.CompressionStatus.PROCESSING,
            MicroLesson.CompressionStatus.FAILED,
        ]
        for idx, compression_status in enumerate(unready_statuses, start=2):
            unready_micro_lesson = MicroLesson.objects.create(
                lesson=Lesson.objects.create(
                    course=self.course,
                    title=f'Lesson {compression_status}',
                    sequence_number=idx,
                ),
                compression_status=compression_status,
            )
            data = {
                'micro_lesson_id': str(unready_micro_lesson.id),
            }
            serializer = InitiateDownloadSerializer(data=data)
            self.assertFalse(serializer.is_valid())
            self.assertIn('micro_lesson_id', serializer.errors)
            expected_msg = (
                f'This micro-lesson is not ready for download yet. '
                f'Current status: {compression_status}.'
            )
            self.assertEqual(
                serializer.errors['micro_lesson_id'][0],
                expected_msg,
            )

    def test_validate_micro_lesson_id_invalid_uuid(self):
        """Invalid UUID format raises standard DRF UUIDField validation error."""
        data = {
            'micro_lesson_id': 'invalid-uuid-string',
        }
        serializer = InitiateDownloadSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('micro_lesson_id', serializer.errors)
