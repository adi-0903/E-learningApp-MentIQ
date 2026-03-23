from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from .models import ParentAccount, StudentLinkRequest, WeeklyProgressReport
from .serializers import (
    ParentProfileSerializer, 
    StudentLinkRequestSerializer, 
    WeeklyReportSerializer
)


class BaseParentView(APIView):
    """Base view to ensure the user has a parent role and profile."""
    permission_classes = [permissions.IsAuthenticated]

    def get_parent(self):
        if not self.request.user.is_parent:
            return None
        parent, created = ParentAccount.objects.get_or_create(user=self.request.user)
        return parent


class ParentProfileView(BaseParentView):
    """View to get and update parent profile settings."""
    
    def get(self, request):
        parent = self.get_parent()
        if not parent:
            return Response({"error": "Only parents can access this view."}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = ParentProfileSerializer(parent)
        return Response(serializer.data)

    def patch(self, request):
        parent = self.get_parent()
        if not parent:
            return Response({"error": "Only parents can access this view."}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = ParentProfileSerializer(parent, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RequestStudentLinkView(BaseParentView):
    """Handles parent's request to link with a student via student_id."""
    
    def post(self, request):
        parent = self.get_parent()
        if not parent:
            return Response({"error": "Only parents can access this view."}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = StudentLinkRequestSerializer(data=request.data, context={'parent': parent})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class StudentLinkStatusView(BaseParentView):
    """List all link requests and their status."""
    
    def get(self, request):
        parent = self.get_parent()
        if not parent:
            return Response({"error": "Only parents can access this view."}, status=status.HTTP_403_FORBIDDEN)
        
        requests = parent.link_requests.all()
        serializer = StudentLinkRequestSerializer(requests, many=True)
        return Response(serializer.data)


class ChildrenReportsView(BaseParentView):
    """Fetch weekly reports for a specific linked child."""
    
    def get(self, request, student_id):
        parent = self.get_parent()
        if not parent:
            return Response({"error": "Only parents can access this view."}, status=status.HTTP_403_FORBIDDEN)
        
        # Ensure student is linked to this parent
        if not parent.children.filter(id=student_id).exists():
            return Response({"error": "This student is not linked to your account."}, status=status.HTTP_403_FORBIDDEN)
            
        reports = WeeklyProgressReport.objects.filter(student_id=student_id, parent=parent)
        serializer = WeeklyReportSerializer(reports, many=True)
        return Response(serializer.data)


class MyChildrenProgressView(BaseParentView):
    """
    Overview of all linked children's current progress.
    Used for the parent's dashboard home screen.
    """
    def get(self, request):
        parent = self.get_parent()
        if not parent:
            return Response({"error": "Only parents can access this view."}, status=status.HTTP_403_FORBIDDEN)
            
        children = parent.children.all()
        data = []
        for child in children:
            # We can integrate with existing progress model here
            # For now, just basic stats
            latest_report = WeeklyProgressReport.objects.filter(student=child).first()
            data.append({
                "id": child.id,
                "name": child.name,
                "student_id": child.student_id,
                "profile_image": getattr(child, 'profile_image_url', None),
                "latest_stats": WeeklyReportSerializer(latest_report).data if latest_report else None
            })
        return Response(data)


# ─── Student Side Approval ───────────────────────────────────────

class ListPendingLinkRequestsView(APIView):
    """View so students can see who is trying to link to them."""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        if not request.user.is_student:
            return Response({"error": "Only students can access this view."}, status=status.HTTP_403_FORBIDDEN)
            
        requests = StudentLinkRequest.objects.filter(student=request.user, status=StudentLinkRequest.Status.PENDING)
        data = []
        for req in requests:
            data.append({
                "id": req.id,
                "parent_name": req.parent.user.name,
                "parent_email": req.parent.user.email,
                "created_at": req.created_at
            })
        return Response(data)


class ApproveLinkRequestView(APIView):
    """View for students to approve or reject a link request."""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, request_id):
        if not request.user.is_student:
            return Response({"error": "Only students can access this view."}, status=status.HTTP_403_FORBIDDEN)
            
        link_request = get_object_or_404(StudentLinkRequest, id=request_id, student=request.user)
        action = request.data.get('action') # 'approve' or 'reject'
        
        if action == 'approve':
            link_request.status = StudentLinkRequest.Status.APPROVED
            link_request.save()
            
            # Add student to parent's children list
            parent_account = link_request.parent
            parent_account.children.add(request.user)
            return Response({"message": "Successfully linked with parent!"})
        elif action == 'reject':
            link_request.status = StudentLinkRequest.Status.REJECTED
            link_request.save()
            return Response({"message": "Link request rejected."})
        else:
            return Response({"error": "Invalid action."}, status=status.HTTP_400_BAD_REQUEST)

