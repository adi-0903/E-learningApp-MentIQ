from django.urls import path
from .views import (
    ParentProfileView,
    RequestStudentLinkView,
    StudentLinkStatusView,
    ChildrenReportsView,
    MyChildrenProgressView,
    ListPendingLinkRequestsView,
    ApproveLinkRequestView
)

urlpatterns = [
    # Parent Profile Settings
    path('profile/', ParentProfileView.as_view(), name='parent-profile'),
    
    # Parent Handshake
    path('link/', RequestStudentLinkView.as_view(), name='link-student'),
    path('link/status/', StudentLinkStatusView.as_view(), name='link-status'),
    
    # Student Handshake (Approval)
    path('student/requests/', ListPendingLinkRequestsView.as_view(), name='student-link-requests'),
    path('student/requests/<int:request_id>/approve/', ApproveLinkRequestView.as_view(), name='approve-link-request'),
    
    # Dashboard Home
    path('children/', MyChildrenProgressView.as_view(), name='my-children'),
    
    # Reports per child
    path('children/<uuid:student_id>/reports/', ChildrenReportsView.as_view(), name='child-reports'),
]
