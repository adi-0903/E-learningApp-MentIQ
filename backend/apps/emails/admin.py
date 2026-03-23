"""
Email Django Admin
"""
from django.contrib import admin
from django.utils.html import format_html
from .models import EmailLog, EmailCampaign, ContactMessage, InboxEmail


@admin.register(EmailLog)
class EmailLogAdmin(admin.ModelAdmin):
    list_display = ['recipient_email', 'subject', 'email_type', 'status_badge', 'created_at']
    list_filter = ['status', 'email_type']
    search_fields = ['recipient_email', 'subject']
    readonly_fields = ['recipient_email', 'recipient_name', 'subject',
                       'email_type', 'status', 'error_message', 'created_at']

    def status_badge(self, obj):
        colors = {
            'sent': '#10b981',
            'failed': '#ef4444',
            'pending': '#f59e0b',
        }
        color = colors.get(obj.status, '#6b7280')
        return format_html(
            '<span style="background:{};color:white;padding:2px 8px;border-radius:12px;font-size:11px;">{}</span>',
            color, obj.status.upper()
        )
    status_badge.short_description = 'Status'


@admin.register(EmailCampaign)
class EmailCampaignAdmin(admin.ModelAdmin):
    list_display = ['title', 'audience', 'status', 'total_recipients', 'sent_count', 'created_at']
    list_filter = ['status', 'audience']
    search_fields = ['title', 'subject']
    actions = ['send_campaign']

    def send_campaign(self, request, queryset):
        for campaign in queryset:
            if campaign.status in ['draft', 'scheduled']:
                from .tasks import send_campaign_task
                send_campaign_task.delay(campaign.id)
        self.message_user(request, f"Sending {queryset.count()} campaign(s).")
    send_campaign.short_description = '📧 Send selected campaigns'


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ['sender_name', 'sender_email', 'subject', 'status', 'created_at']
    list_filter = ['status']
    search_fields = ['sender_name', 'sender_email', 'subject']


@admin.register(InboxEmail)
class InboxEmailAdmin(admin.ModelAdmin):
    list_display = ['sender_email', 'sender_name', 'subject', 'received_at', 'is_read']
    list_filter = ['is_read']
    search_fields = ['sender_email', 'subject']
    readonly_fields = ['sender_email', 'sender_name', 'subject', 'body', 'received_at', 'message_id']
