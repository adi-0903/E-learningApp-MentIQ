
from django.db import migrations

def seed_announcements(apps, schema_editor):
    Announcement = apps.get_model('announcements', 'Announcement')
    
    announcements_data = [
        # STUDENTS ONLY (4)
        {
            'title': 'Upcoming Final Examinations Schedule',
            'content': 'The final examination schedule for the current semester has been released. Please check your student portal for detailed timings and room assignments.',
            'target_audience': 'students',
            'priority': 'high',
            'is_pinned': True
        },
        {
            'title': 'New Course Enrollment Open',
            'content': 'Enrollment for the Summer Specialization courses is now open. Students interested in Advanced AI and Robotics should register before Friday.',
            'target_audience': 'students',
            'priority': 'normal',
            'is_pinned': False
        },
        {
            'title': 'Library Extended Hours',
            'content': 'To support your exam preparation, the central library will remain open until midnight for the next two weeks.',
            'target_audience': 'students',
            'priority': 'low',
            'is_pinned': False
        },
        {
            'title': 'Student Hackathon 2026',
            'content': 'Join us for the annual MentIQ Hackathon! Build innovative solutions and win prizes worth ₹50,000.',
            'target_audience': 'students',
            'priority': 'normal',
            'is_pinned': False
        },

        # TEACHERS ONLY (4)
        {
            'title': 'Monthly Faculty Meeting',
            'content': 'The monthly faculty meeting is scheduled for this Wednesday at 4:00 PM in the Conference Hall. Agenda: Curriculum updates and student performance review.',
            'target_audience': 'teachers',
            'priority': 'high',
            'is_pinned': True
        },
        {
            'title': 'LMS Upgrade Maintenance',
            'content': 'The Learning Management System will undergo maintenance this Sunday from 2:00 AM to 6:00 AM. Please save your work accordingly.',
            'target_audience': 'teachers',
            'priority': 'normal',
            'is_pinned': False
        },
        {
            'title': 'Grant Applications Deadline',
            'content': 'Faculty members interested in applying for research grants for the upcoming academic year must submit their proposals by the end of this month.',
            'target_audience': 'teachers',
            'priority': 'high',
            'is_pinned': False
        },
        {
            'title': 'New Teaching Assistant Portal',
            'content': 'We have launched a new portal for managing Teaching Assistants. Please refer to the documentation sent to your email.',
            'target_audience': 'teachers',
            'priority': 'low',
            'is_pinned': False
        },

        # PARENTS ONLY (4)
        {
            'title': 'Parent-Teacher Conference Invitation',
            'content': 'We invite all parents to the upcoming Parent-Teacher Conference to discuss their child\'s academic progress and development.',
            'target_audience': 'parents',
            'priority': 'urgent',
            'is_pinned': True
        },
        {
            'title': 'School Bus Route Updates',
            'content': 'Please be advised that there are slight adjustments to the school bus routes starting next Monday to improve efficiency.',
            'target_audience': 'parents',
            'priority': 'normal',
            'is_pinned': False
        },
        {
            'title': 'Annual Sports Day Notice',
            'content': 'The Annual Sports Day will be held on the 25th of this month. We look forward to seeing you there to cheer for our students.',
            'target_audience': 'parents',
            'priority': 'normal',
            'is_pinned': False
        },
        {
            'title': 'Safety Drill Notification',
            'content': 'A routine safety drill will be conducted tomorrow. This is a standard procedure and no action is required from your side.',
            'target_audience': 'parents',
            'priority': 'low',
            'is_pinned': False
        },

        # EVERYONE (3)
        {
            'title': 'MentIQ Annual Foundation Day Celebration',
            'content': 'Celebrate with us as we mark another year of excellence in education. Cultural programs and refreshments will be provided for all.',
            'target_audience': 'all',
            'priority': 'high',
            'is_pinned': True
        },
        {
            'title': 'Holiday Notice: Independence Day',
            'content': 'The institution will remain closed on August 15th in observance of Independence Day.',
            'target_audience': 'all',
            'priority': 'normal',
            'is_pinned': False
        },
        {
            'title': 'New Wellness Program for All Members',
            'content': 'We are introducing a comprehensive wellness and mental health program accessible to all students, teachers, and staff members.',
            'target_audience': 'all',
            'priority': 'normal',
            'is_pinned': False
        },
    ]

    for data in announcements_data:
        # Use get_or_create to avoid duplicates if migration is re-run
        Announcement.objects.get_or_create(
            title=data['title'],
            defaults={
                'content': data['content'],
                'target_audience': data['target_audience'],
                'priority': data['priority'],
                'is_pinned': data['is_pinned'],
                'created_by_admin': True
            }
        )

def reverse_seed(apps, schema_editor):
    Announcement = apps.get_model('announcements', 'Announcement')
    titles = [
        'Upcoming Final Examinations Schedule', 'New Course Enrollment Open', 
        'Library Extended Hours', 'Student Hackathon 2026',
        'Monthly Faculty Meeting', 'LMS Upgrade Maintenance',
        'Grant Applications Deadline', 'New Teaching Assistant Portal',
        'Parent-Teacher Conference Invitation', 'School Bus Route Updates',
        'Annual Sports Day Notice', 'Safety Drill Notification',
        'MentIQ Annual Foundation Day Celebration', 'Holiday Notice: Independence Day',
        'New Wellness Program for All Members'
    ]
    Announcement.objects.filter(title__in=titles, created_by_admin=True).delete()

class Migration(migrations.Migration):

    dependencies = [
        ('announcements', '0004_alter_announcement_target_audience'),
    ]

    operations = [
        migrations.RunPython(seed_announcements, reverse_seed),
    ]
