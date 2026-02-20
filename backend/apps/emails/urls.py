from django.urls import path
from . import views

app_name = 'emails'

urlpatterns = [
    # Contact form (public)
    path('contact/', views.ContactFormView.as_view(), name='contact-form'),
    path('contact/mine/', views.MyContactMessagesView.as_view(), name='my-contacts'),

    # Admin - contact management
    path('admin/contacts/', views.AdminContactListView.as_view(), name='admin-contacts'),
    path('admin/contacts/<uuid:id>/reply/', views.AdminContactReplyView.as_view(), name='admin-contact-reply'),

    # Campaigns (admin)
    path('campaigns/', views.EmailCampaignListCreateView.as_view(), name='campaigns'),
    path('campaigns/<uuid:id>/send/', views.SendCampaignView.as_view(), name='send-campaign'),

    # Logs (admin)
    path('logs/', views.EmailLogListView.as_view(), name='logs'),

    # Inbox - received emails (admin)
    path('inbox/', views.InboxEmailListView.as_view(), name='inbox'),
    path('inbox/sync/', views.SyncInboxView.as_view(), name='inbox-sync'),
    path('inbox/<uuid:id>/read/', views.MarkInboxReadView.as_view(), name='inbox-mark-read'),

    # EmailJS config for frontend
    path('emailjs-config/', views.EmailJSConfigView.as_view(), name='emailjs-config'),
]
