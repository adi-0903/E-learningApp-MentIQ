"""
Celery tasks for sending push notifications via FCM.
"""
from celery import shared_task
import logging
from django.conf import settings

logger = logging.getLogger(__name__)


def bulk_create_notifications(users, title, body, notification_type='system', data=None):
    """Create notifications for multiple users."""
    from .models import Notification
    notifications = [
        Notification(
            user=user,
            title=title,
            body=body,
            notification_type=notification_type,
            data=data or {},
        )
        for user in users
    ]
    Notification.objects.bulk_create(notifications)


@shared_task
def send_push_notification(user_id, title, body, data):
    """Send FCM push notification via Firebase Admin SDK."""
    try:
        from django.contrib.auth import get_user_model
        User = get_user_model()
        user = User.objects.get(id=user_id)

        if not user.fcm_token:
            return

        # FCM push (requires firebase-admin SDK)
        try:
            import firebase_admin
            from firebase_admin import messaging, credentials
            import os

            if not firebase_admin._apps:
                # Check for service account file
                cred_path = os.path.join(settings.BASE_DIR, 'config', 'firebase-credentials.json')
                if os.path.exists(cred_path):
                    cred = credentials.Certificate(cred_path)
                    firebase_admin.initialize_app(cred)
                else:
                    logger.warning("No firebase-credentials.json found, using default initialization.")
                    firebase_admin.initialize_app()

            message = messaging.Message(
                notification=messaging.Notification(title=title, body=body),
                data={k: str(v) for k, v in data.items()},
                token=user.fcm_token,
                # Add Android/iOS specific config for better "app-closed" reliability
                android=messaging.AndroidConfig(
                    priority='high',
                    notification=messaging.AndroidNotification(
                        sound='default',
                        tag=user_id
                    )
                ),
                apns=messaging.APNSConfig(
                    payload=messaging.APNSPayload(
                        aps=messaging.Aps(sound='default', badge=1)
                    )
                )
            )
            response = messaging.send(message)
            logger.info(f"Push notification sent to {user.email}: {response}")
        except ImportError:
            logger.warning("firebase-admin not installed, skipping FCM push.")
        except Exception as e:
            logger.error(f"FCM push failed for {user.email}: {e}")

    except Exception as e:
        logger.error(f"Push notification task error: {e}")
