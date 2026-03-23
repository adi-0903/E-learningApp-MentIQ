"""
Offline Mode API Views.
Endpoints for listing downloadable micro-lessons, initiating downloads,
tracking download state, and syncing offline progress.
"""
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.pagination import StandardPagination

from .models import MicroLesson, OfflineDownload
from .serializers import (
    BulkSyncSerializer,
    InitiateDownloadSerializer,
    MicroLessonDetailSerializer,
    MicroLessonListSerializer,
    OfflineDownloadSerializer,
    SyncProgressSerializer,
)


class AvailableMicroLessonsView(generics.ListAPIView):
    """
    GET /api/v1/offline/micro-lessons/
    List all micro-lessons available for download.
    Optionally filter by course_id.
    """
    serializer_class = MicroLessonListSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination

    def get_queryset(self):
        qs = MicroLesson.objects.select_related(
            'lesson', 'lesson__course'
        ).filter(
            compression_status=MicroLesson.CompressionStatus.COMPLETED,
        )
        course_id = self.request.query_params.get('course_id')
        if course_id:
            qs = qs.filter(lesson__course_id=course_id)
        return qs


class MicroLessonDetailView(generics.RetrieveAPIView):
    """
    GET /api/v1/offline/micro-lessons/<id>/
    Get detail of a specific micro-lesson.
    """
    serializer_class = MicroLessonDetailSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'id'

    def get_queryset(self):
        return MicroLesson.objects.select_related(
            'lesson', 'lesson__course'
        )

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, context={'request': request})
        return Response({'success': True, 'data': serializer.data})


class InitiateDownloadView(APIView):
    """
    POST /api/v1/offline/download/
    Initiate a download for a micro-lesson.
    Creates an OfflineDownload record and returns the download URL.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = InitiateDownloadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        micro_lesson_id = serializer.validated_data['micro_lesson_id']
        device_info = serializer.validated_data.get('device_info', '')

        micro_lesson = MicroLesson.objects.select_related(
            'lesson', 'lesson__course'
        ).get(id=micro_lesson_id)

        # Check enrollment — student must be enrolled in the course
        from apps.enrollments.models import Enrollment
        if not Enrollment.objects.filter(
            student=request.user,
            course=micro_lesson.lesson.course,
            is_active=True,
        ).exists():
            return Response(
                {
                    'success': False,
                    'error': {'message': 'You must be enrolled in the course to download lessons.'},
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        # Upsert download record
        download, created = OfflineDownload.objects.update_or_create(
            student=request.user,
            micro_lesson=micro_lesson,
            defaults={
                'download_status': OfflineDownload.DownloadStatus.INITIATED,
                'device_info': device_info,
            },
        )

        return Response(
            {
                'success': True,
                'message': 'Download initiated.' if created else 'Download re-initiated.',
                'data': OfflineDownloadSerializer(download).data,
            },
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class ConfirmDownloadView(APIView):
    """
    POST /api/v1/offline/download/<id>/confirm/
    Confirm that a download has completed on the device.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, id):
        try:
            download = OfflineDownload.objects.get(
                id=id, student=request.user,
            )
        except OfflineDownload.DoesNotExist:
            return Response(
                {'success': False, 'error': {'message': 'Download record not found.'}},
                status=status.HTTP_404_NOT_FOUND,
            )

        download.download_status = OfflineDownload.DownloadStatus.COMPLETED
        download.downloaded_at = timezone.now()
        download.save(update_fields=['download_status', 'downloaded_at', 'updated_at'])

        return Response({
            'success': True,
            'message': 'Download confirmed.',
            'data': OfflineDownloadSerializer(download).data,
        })


class MyDownloadsView(generics.ListAPIView):
    """
    GET /api/v1/offline/my-downloads/
    List all of the user's offline downloads.
    """
    serializer_class = OfflineDownloadSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination

    def get_queryset(self):
        return OfflineDownload.objects.select_related(
            'micro_lesson', 'micro_lesson__lesson', 'micro_lesson__lesson__course'
        ).filter(
            student=self.request.user,
        ).exclude(
            download_status=OfflineDownload.DownloadStatus.DELETED,
        )


class DeleteDownloadView(APIView):
    """
    DELETE /api/v1/offline/download/<id>/
    Mark a download as deleted (student removed it from device).
    """
    permission_classes = [IsAuthenticated]

    def delete(self, request, id):
        try:
            download = OfflineDownload.objects.get(
                id=id, student=request.user,
            )
        except OfflineDownload.DoesNotExist:
            return Response(
                {'success': False, 'error': {'message': 'Download record not found.'}},
                status=status.HTTP_404_NOT_FOUND,
            )

        download.download_status = OfflineDownload.DownloadStatus.DELETED
        download.save(update_fields=['download_status', 'updated_at'])

        return Response({
            'success': True,
            'message': 'Download removed.',
        })


class SyncProgressView(APIView):
    """
    POST /api/v1/offline/sync/
    Sync offline progress for a single download.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = SyncProgressSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            download = OfflineDownload.objects.get(
                id=serializer.validated_data['download_id'],
                student=request.user,
            )
        except OfflineDownload.DoesNotExist:
            return Response(
                {'success': False, 'error': {'message': 'Download record not found.'}},
                status=status.HTTP_404_NOT_FOUND,
            )

        download.progress_percentage = serializer.validated_data['progress_percentage']
        download.last_position_seconds = serializer.validated_data['last_position_seconds']
        download.last_synced_at = timezone.now()

        if serializer.validated_data.get('is_lesson_completed'):
            download.is_lesson_completed = True
            download.completed_at_offline = serializer.validated_data.get(
                'completed_at_offline', timezone.now()
            )

            # Also sync completion to the main progress system
            try:
                from apps.progress.models import LessonProgress
                LessonProgress.objects.update_or_create(
                    student=request.user,
                    lesson=download.micro_lesson.lesson,
                    defaults={
                        'is_completed': True,
                        'completed_at': download.completed_at_offline or timezone.now(),
                    },
                )
            except Exception:
                pass  # Don't fail sync if progress sync fails

        download.save()

        return Response({
            'success': True,
            'message': 'Progress synced.',
            'data': OfflineDownloadSerializer(download).data,
        })


class BulkSyncView(APIView):
    """
    POST /api/v1/offline/sync/bulk/
    Sync multiple offline progress records at once.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = BulkSyncSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        results = []
        for item_data in serializer.validated_data['items']:
            try:
                download = OfflineDownload.objects.get(
                    id=item_data['download_id'],
                    student=request.user,
                )
                download.progress_percentage = item_data['progress_percentage']
                download.last_position_seconds = item_data['last_position_seconds']
                download.last_synced_at = timezone.now()

                if item_data.get('is_lesson_completed'):
                    download.is_lesson_completed = True
                    download.completed_at_offline = item_data.get(
                        'completed_at_offline', timezone.now()
                    )
                download.save()
                results.append({'id': str(download.id), 'synced': True})
            except OfflineDownload.DoesNotExist:
                results.append({
                    'id': str(item_data['download_id']),
                    'synced': False,
                    'error': 'Not found',
                })

        return Response({
            'success': True,
            'message': f'Synced {sum(1 for r in results if r["synced"])}/{len(results)} records.',
            'data': results,
        })


class StorageSummaryView(APIView):
    """
    GET /api/v1/offline/storage/
    Get summary of offline storage usage for the current user.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from django.db.models import Sum, Count

        downloads = OfflineDownload.objects.filter(
            student=request.user,
            download_status=OfflineDownload.DownloadStatus.COMPLETED,
        )

        stats = downloads.aggregate(
            total_files=Count('id'),
            total_bytes=Sum('micro_lesson__file_size_bytes'),
        )

        total_bytes = stats['total_bytes'] or 0

        return Response({
            'success': True,
            'data': {
                'total_downloads': stats['total_files'] or 0,
                'total_bytes': total_bytes,
                'total_mb': round(total_bytes / (1024 * 1024), 2) if total_bytes else 0,
                'completed_lessons': downloads.filter(is_lesson_completed=True).count(),
            },
        })
