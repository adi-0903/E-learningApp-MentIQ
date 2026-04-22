import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.users.models import User

users_to_create = [
    # Teachers
    {'name': 'Ram Kumar', 'email': 'ramkumar@mentiq.com', 'role': 'teacher'},
    {'name': 'Shyam Singh', 'email': 'shyamsharma@mentiq.com', 'role': 'teacher'},
    {'name': 'Sita Devi', 'email': 'sitapuri@mentiq.com', 'role': 'teacher'},
    {'name': 'Geeta Rao', 'email': 'geetajoshi@mentiq.com', 'role': 'teacher'},
    # Students
    {'name': 'Arjun Patel', 'email': 'arjunpatel@mentiq.com', 'role': 'student'},
    {'name': 'Krishna Iyer', 'email': 'krishnaiyer@mentiq.com', 'role': 'student'},
    {'name': 'Meera Bai', 'email': 'meerabai@mentiq.com', 'role': 'student'},
    {'name': 'Radha Sharma', 'email': 'radhasharma@mentiq.com', 'role': 'student'},
    # Admin
    {'name': 'Admin User', 'email': 'admin@mentiq.com', 'role': 'admin', 'is_staff': True, 'is_superuser': True}
]

created_users = []

print("Updating user passwords to: firstname@12345")

for user_data in users_to_create:
    email = user_data['email']
    name = user_data['name']
    role = user_data['role']
    
    # Generate password: firstname + "@12345"
    first_name = name.split()[0].lower()
    password = f"{first_name}@12345"
    
    if User.objects.filter(email=email).exists():
        user = User.objects.get(email=email)
        user.set_password(password)
        # Ensure role is set correctly if it was different
        user.role = role
        if user_data.get('is_superuser'):
            user.is_staff = True
            user.is_superuser = True
        user.save()
        created_users.append({'email': email, 'password': password, 'role': role, 'status': 'updated'})
    else:
        if user_data.get('is_superuser'):
            user = User.objects.create_superuser(email=email, password=password, name=name)
            user.role = 'admin'
            user.save()
        else:
            user = User.objects.create_user(email=email, password=password, name=name, role=role)
        created_users.append({'email': email, 'password': password, 'role': role, 'status': 'created'})

print("\n--- USER CREDENTIALS ---")
for u in created_users:
    print(f"Role: {u['role']:8} | Email: {u['email']:25} | Password: {u['password']}")
