import os
import django
import random
import sys

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

def populate_ids():
    teachers = User.objects.filter(role='teacher', teacher_id__exact='') | User.objects.filter(role='teacher', teacher_id__isnull=True)
    count = 0
    print(f"Checking {teachers.count()} teachers for missing IDs...")
    
    for teacher in teachers:
        while True:
            tid = str(random.randint(10000, 99999))
            if not User.objects.filter(teacher_id=tid).exists():
                teacher.teacher_id = tid
                teacher.save(update_fields=['teacher_id'])
                count += 1
                break
                
    print(f"Successfully assigned IDs to {count} teachers.")

if __name__ == '__main__':
    populate_ids()
