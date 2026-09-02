from .models import Notification, NotificationSetting
from .tasks import send_push_notification

def create_notification(user, title, body, notification_type=Notification.TypeChoices.SYSTEM, data=None):
    """
    Creates an in-app notification for a user.
    Checks user preferences before creating.
    """
    try:
        # Check if user has settings, create if not
        settings, _ = NotificationSetting.objects.get_or_create(user=user)
        
        # Check preference based on type
        should_notify = True
        if notification_type == Notification.TypeChoices.ANNOUNCEMENT:
            should_notify = settings.announcements
        elif notification_type == Notification.TypeChoices.ASSIGNMENT:
            should_notify = settings.assignments
        elif notification_type == Notification.TypeChoices.COURSE:
            should_notify = settings.courses
        elif notification_type == Notification.TypeChoices.QUIZ:
            should_notify = settings.quizzes
        elif notification_type == Notification.TypeChoices.SYSTEM:
            should_notify = settings.general

        if not should_notify:
            return None

        notification = Notification.objects.create(
            user=user,
            title=title,
            body=body,
            notification_type=notification_type,
            data=data or {}
        )
        # Trigger push notification if user has a token
        if user.fcm_token:
            send_push_notification.delay(str(user.id), title, body, data or {})
        return notification
    except Exception as e:
        print(f"Error creating notification: {e}")
        return None


def bulk_create_notifications(users, title, body, notification_type=Notification.TypeChoices.SYSTEM, data=None):
    """
    Creates in-app notifications for multiple users in bulk.
    Checks user preferences before creating and enqueues push notifications where applicable.
    """
    try:
        if not users:
            return []

        user_list = list(users)
        if not user_list:
            return []

        # Map notification_type to preference setting field
        setting_field_map = {
            Notification.TypeChoices.ANNOUNCEMENT: 'announcements',
            Notification.TypeChoices.ASSIGNMENT: 'assignments',
            Notification.TypeChoices.COURSE: 'courses',
            Notification.TypeChoices.QUIZ: 'quizzes',
            Notification.TypeChoices.SYSTEM: 'general',
        }

        setting_field = setting_field_map.get(notification_type)

        target_users = user_list
        if setting_field:
            opted_out_ids = set(
                NotificationSetting.objects.filter(
                    user__in=user_list,
                    **{setting_field: False}
                ).values_list('user_id', flat=True)
            )
            if opted_out_ids:
                target_users = [u for u in user_list if u.id not in opted_out_ids]

        if not target_users:
            return []

        notifications = [
            Notification(
                user=u,
                title=title,
                body=body,
                notification_type=notification_type,
                data=data or {}
            )
            for u in target_users
        ]

        created = Notification.objects.bulk_create(notifications)

        for u in target_users:
            if getattr(u, 'fcm_token', None):
                try:
                    send_push_notification.delay(str(u.id), title, body, data or {})
                except Exception as e:
                    print(f"Error queueing push notification for user {u.id}: {e}")

        return created
    except Exception as e:
        print(f"Error bulk creating notifications: {e}")
        return []
