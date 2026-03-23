from rest_framework import serializers
from .models import AttendanceSession, AttendanceRecord
from apps.users.serializers import UserProfileSerializer

class AttendanceRecordSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.name', read_only=True)
    student_uid = serializers.CharField(source='student.uid', read_only=True)
    
    class Meta:
        model = AttendanceRecord
        fields = ['id', 'student', 'student_name', 'student_uid', 'is_present']

class AttendanceRecordCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttendanceRecord
        fields = ['student', 'is_present']

class AttendanceSessionSerializer(serializers.ModelSerializer):
    records = AttendanceRecordSerializer(many=True, read_only=True)
    course_title = serializers.CharField(source='course.title', read_only=True)
    
    class Meta:
        model = AttendanceSession
        fields = ['id', 'course', 'course_title', 'date', 'start_time', 'records']

class AttendanceBulkCreateSerializer(serializers.Serializer):
    course_id = serializers.UUIDField()
    start_time = serializers.TimeField()
    records = AttendanceRecordCreateSerializer(many=True)

    def create(self, validated_data):
        course_id = validated_data['course_id']
        start_time = validated_data['start_time']
        records_data = validated_data['records']
        teacher = self.context['request'].user
        
        session = AttendanceSession.objects.create(
            course_id=course_id,
            teacher=teacher,
            start_time=start_time
        )
        
        for record_item in records_data:
            AttendanceRecord.objects.create(
                session=session,
                student=record_item['student'],
                is_present=record_item['is_present']
            )
        return session
