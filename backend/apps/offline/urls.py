from django.urls import path
from . import views

app_name = 'offline'

urlpatterns = [
    # Micro-lessons
    path('micro-lessons/', views.AvailableMicroLessonsView.as_view(), name='micro-lessons-list'),
    path('micro-lessons/<uuid:id>/', views.MicroLessonDetailView.as_view(), name='micro-lesson-detail'),

    # Downloads
    path('download/', views.InitiateDownloadView.as_view(), name='initiate-download'),
    path('download/<uuid:id>/confirm/', views.ConfirmDownloadView.as_view(), name='confirm-download'),
    path('download/<uuid:id>/', views.DeleteDownloadView.as_view(), name='delete-download'),
    path('my-downloads/', views.MyDownloadsView.as_view(), name='my-downloads'),

    # Sync
    path('sync/', views.SyncProgressView.as_view(), name='sync-progress'),
    path('sync/bulk/', views.BulkSyncView.as_view(), name='bulk-sync'),

    # Storage
    path('storage/', views.StorageSummaryView.as_view(), name='storage-summary'),
]
