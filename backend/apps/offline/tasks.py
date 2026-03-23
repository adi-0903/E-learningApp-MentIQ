"""
Video Compression Pipeline (Celery Tasks).
Compresses lesson videos into mobile-optimized versions for offline download.
Uses Cloudinary's built-in video transformation for compression.
"""
import logging

from celery import shared_task
from django.utils import timezone

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def compress_lesson_video(self, micro_lesson_id):
    """
    Compress a lesson video and update the MicroLesson record.
    Uses Cloudinary transformations for server-side compression.
    """
    from apps.offline.models import MicroLesson

    try:
        micro_lesson = MicroLesson.objects.select_related('lesson').get(id=micro_lesson_id)
    except MicroLesson.DoesNotExist:
        logger.error(f"MicroLesson {micro_lesson_id} not found.")
        return

    # Mark as processing
    micro_lesson.compression_status = MicroLesson.CompressionStatus.PROCESSING
    micro_lesson.save(update_fields=['compression_status', 'updated_at'])

    lesson = micro_lesson.lesson
    original_url = lesson.video_url or ''
    if lesson.video_file:
        original_url = lesson.video_file.url

    if not original_url:
        micro_lesson.compression_status = MicroLesson.CompressionStatus.FAILED
        micro_lesson.save(update_fields=['compression_status', 'updated_at'])
        logger.warning(f"No video source for lesson {lesson.id}")
        return

    micro_lesson.original_video_url = original_url

    try:
        compressed_url = _compress_via_cloudinary(original_url)

        if compressed_url:
            # Estimate compressed size (Cloudinary typically achieves ~35% of original)
            estimated_size = _estimate_file_size(compressed_url)

            micro_lesson.compressed_video_url = compressed_url
            micro_lesson.file_size_bytes = estimated_size
            micro_lesson.duration_seconds = lesson.duration * 60 if lesson.duration else 0
            micro_lesson.compression_ratio = 0.35  # approximate
            micro_lesson.compression_status = MicroLesson.CompressionStatus.COMPLETED
            micro_lesson.save()

            logger.info(
                f"Video compressed for lesson '{lesson.title}' → "
                f"{round(estimated_size / (1024 * 1024), 2)} MB"
            )
        else:
            # Fallback: use original URL as-is
            micro_lesson.compressed_video_url = original_url
            micro_lesson.file_size_bytes = _estimate_file_size(original_url)
            micro_lesson.duration_seconds = lesson.duration * 60 if lesson.duration else 0
            micro_lesson.compression_ratio = 1.0
            micro_lesson.compression_status = MicroLesson.CompressionStatus.COMPLETED
            micro_lesson.save()

            logger.info(f"Using original video for lesson '{lesson.title}' (no compression)")

    except Exception as exc:
        micro_lesson.compression_status = MicroLesson.CompressionStatus.FAILED
        micro_lesson.save(update_fields=['compression_status', 'updated_at'])
        logger.error(f"Compression failed for lesson '{lesson.title}': {exc}")
        raise self.retry(exc=exc)


def _compress_via_cloudinary(original_url):
    """
    Generate a compressed video URL using Cloudinary transformations.
    This applies server-side transcoding: lower bitrate, 720p, efficient codec.
    """
    try:
        import cloudinary.utils

        # If the URL is already a Cloudinary URL, apply transformation
        if 'cloudinary' in original_url or 'res.cloudinary.com' in original_url:
            # Extract the public_id from the URL
            # Cloudinary URLs follow: .../video/upload/v1234/public_id.mp4
            parts = original_url.split('/upload/')
            if len(parts) == 2:
                base = parts[0] + '/upload/'
                # Insert transformation: scale to 720p, lower quality, mp4
                transformation = 'c_scale,w_720,q_auto:low,f_mp4,vc_h264'
                compressed_url = f"{base}{transformation}/{parts[1]}"
                return compressed_url

        # For non-Cloudinary URLs, return None (will use original as fallback)
        return None

    except ImportError:
        logger.warning("Cloudinary not available, skipping compression.")
        return None


def _estimate_file_size(url):
    """
    Estimate file size by making a HEAD request.
    Falls back to a default estimate based on typical compression ratios.
    """
    try:
        import requests
        response = requests.head(url, timeout=10, allow_redirects=True)
        content_length = response.headers.get('Content-Length')
        if content_length:
            return int(content_length)
    except Exception:
        pass

    # Default estimate: 15 MB for a compressed lesson video
    return 15 * 1024 * 1024


@shared_task
def generate_micro_lesson_summary(micro_lesson_id):
    """
    Generate a text summary for a micro-lesson from the lesson content.
    This is a simple extraction — can be enhanced with AI later.
    """
    from apps.offline.models import MicroLesson

    try:
        micro_lesson = MicroLesson.objects.select_related('lesson').get(id=micro_lesson_id)
    except MicroLesson.DoesNotExist:
        return

    lesson = micro_lesson.lesson
    summary_parts = []

    if lesson.title:
        summary_parts.append(f"📚 {lesson.title}")
    if lesson.description:
        summary_parts.append(lesson.description)
    if lesson.content:
        # Take first 500 characters of content as summary
        content_preview = lesson.content[:500]
        if len(lesson.content) > 500:
            content_preview += '...'
        summary_parts.append(content_preview)

    if summary_parts:
        micro_lesson.summary_text = '\n\n'.join(summary_parts)
        micro_lesson.save(update_fields=['summary_text', 'updated_at'])
        logger.info(f"Summary generated for micro-lesson: {lesson.title}")


@shared_task
def recompress_all_pending():
    """
    Utility task to retry compression for all pending/failed micro-lessons.
    Can be scheduled as a periodic Celery Beat task.
    """
    from apps.offline.models import MicroLesson

    pending = MicroLesson.objects.filter(
        compression_status__in=[
            MicroLesson.CompressionStatus.PENDING,
            MicroLesson.CompressionStatus.FAILED,
        ]
    ).values_list('id', flat=True)

    for ml_id in pending:
        compress_lesson_video.delay(str(ml_id))

    logger.info(f"Queued {len(pending)} micro-lessons for (re)compression.")
