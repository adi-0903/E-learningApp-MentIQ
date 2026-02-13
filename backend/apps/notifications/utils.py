from .models import Notification, NotificationSetting

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
        return notification
    except Exception as e:
        print(f"Error creating notification: {e}")
        return None
