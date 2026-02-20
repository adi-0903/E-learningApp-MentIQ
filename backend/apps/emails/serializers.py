"""
Email Serializers
"""
from rest_framework import serializers
from .models import ContactMessage, EmailCampaign, EmailLog, InboxEmail


class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = [
            'id', 'sender_name', 'sender_email', 'subject',
            'message', 'status', 'reply_text', 'replied_at', 'created_at',
        ]
        read_only_fields = ['id', 'status', 'reply_text', 'replied_at', 'created_at']


class EmailCampaignSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailCampaign
        fields = [
            'id', 'title', 'subject', 'body_html', 'body_text',
            'audience', 'status', 'scheduled_at', 'sent_at',
            'total_recipients', 'sent_count', 'failed_count', 'created_at',
        ]
        read_only_fields = [
            'id', 'status', 'sent_at',
            'total_recipients', 'sent_count', 'failed_count', 'created_at',
        ]


class EmailLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailLog
        fields = [
            'id', 'recipient_email', 'recipient_name', 'subject',
            'email_type', 'status', 'error_message', 'created_at',
        ]
        read_only_fields = fields


class InboxEmailSerializer(serializers.ModelSerializer):
    class Meta:
        model = InboxEmail
        fields = [
            'id', 'sender_email', 'sender_name', 'subject',
            'body', 'received_at', 'is_read', 'created_at',
        ]
        read_only_fields = fields
