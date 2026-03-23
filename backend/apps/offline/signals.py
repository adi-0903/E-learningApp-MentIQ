"""
Signals for Offline Mode.
Auto-creates a MicroLesson when a Lesson with video content is created/updated.
"""
import logging

from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.lessons.models import Lesson

logger = logging.getLogger(__name__)


@receiver(post_save, sender=Lesson)
def create_micro_lesson_on_video_upload(sender, instance, created, **kwargs):
    """
    When a Lesson is created or updated with a video,
    automatically create/update the corresponding MicroLesson
    and trigger the compression pipeline.
    """
    from apps.offline.models import MicroLesson

    has_video = bool(instance.video_url) or bool(instance.video_file)

    if not has_video:
        return

    micro_lesson, ml_created = MicroLesson.objects.get_or_create(
        lesson=instance,
        defaults={
            'compression_status': MicroLesson.CompressionStatus.PENDING,
        },
    )

    if not ml_created and micro_lesson.compression_status == MicroLesson.CompressionStatus.COMPLETED:
        # Re-trigger compression if the video source changed
        current_url = instance.video_url or (instance.video_file.url if instance.video_file else '')
        if current_url and current_url != micro_lesson.original_video_url:
            micro_lesson.compression_status = MicroLesson.CompressionStatus.PENDING
            micro_lesson.save(update_fields=['compression_status', 'updated_at'])
            ml_created = True  # treat as new to trigger compression

    if ml_created or micro_lesson.compression_status == MicroLesson.CompressionStatus.PENDING:
        try:
            from apps.offline.tasks import compress_lesson_video, generate_micro_lesson_summary
            compress_lesson_video.delay(str(micro_lesson.id))
            generate_micro_lesson_summary.delay(str(micro_lesson.id))
            logger.info(f"Compression pipeline triggered for lesson: {instance.title}")
        except Exception as e:
            # Celery might not be running in dev — do immediate fallback
            logger.warning(f"Could not queue async tasks (Celery not running?): {e}")
            _fallback_sync_processing(micro_lesson, instance)


def _fallback_sync_processing(micro_lesson, lesson):
    """
    Synchronous fallback when Celery is not available.
    Creates the MicroLesson with the original video URL directly.
    """
    from apps.offline.models import MicroLesson

    video_url = lesson.video_url or ''
    if lesson.video_file:
        video_url = lesson.video_file.url

    micro_lesson.compressed_video_url = video_url
    micro_lesson.original_video_url = video_url
    micro_lesson.duration_seconds = lesson.duration * 60 if lesson.duration else 0
    micro_lesson.compression_ratio = 1.0
    micro_lesson.compression_status = MicroLesson.CompressionStatus.COMPLETED

    # Generate summary
    summary_parts = []
    if lesson.title:
        summary_parts.append(f"📚 {lesson.title}")
    if lesson.description:
        summary_parts.append(lesson.description)
    if lesson.content:
        summary_parts.append(lesson.content[:500])
    micro_lesson.summary_text = '\n\n'.join(summary_parts)

    micro_lesson.save()
