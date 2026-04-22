import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.users.models import User
from apps.parents.models import ParentAccount

# Define parents and their linked students (by email to be safe)
parents_to_create = [
    {'name': 'David Patel', 'email': 'davidpatel@mentiq.com', 'child_email': 'arjunpatel@mentiq.com'},
    {'name': 'Robert Iyer', 'email': 'robertiyer@mentiq.com', 'child_email': 'krishnaiyer@mentiq.com'},
    {'name': 'Suman Bai', 'email': 'sumanbai@mentiq.com', 'child_email': 'meerabai@mentiq.com'},
    {'name': 'Vijay Sharma', 'email': 'vijaysharma@mentiq.com', 'child_email': 'radhasharma@mentiq.com'},
]

print("Creating/Updating 4 Parents and linking them to students...")

for p_data in parents_to_create:
    email = p_data['email']
    name = p_data['name']
    child_email = p_data['child_email']
    
    # Password: firstname@12345
    first_name = name.split()[0].lower()
    password = f"{first_name}@12345"
    
    # 1. Create/Update User
    user, created = User.objects.get_or_create(email=email, defaults={
        'name': name,
        'role': 'parent'
    })
    
    user.name = name
    user.role = 'parent'
    user.set_password(password)
    user.save()
    
    status = "Created" if created else "Updated"
    
    # 2. Create/Update ParentProfile
    parent_profile, pp_created = ParentAccount.objects.get_or_create(user=user)
    
    # 3. Link Student
    try:
        child = User.objects.get(email=child_email, role='student')
        parent_profile.children.add(child)
        print(f"{status} Parent: {name:15} | Linked to Student: {child.name:15} | Pass: {password}")
    except User.DoesNotExist:
        print(f"{status} Parent: {name:15} | ERROR: Student {child_email} not found | Pass: {password}")

print("\nSuccess: 4 Parents created and linked.")
