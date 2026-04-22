from apps.users.models import User
import random
import string

def generate_password(length=12):
    # Using simpler passwords for ease of use as requested, but still secure
    chars = string.ascii_letters + string.digits
    return ''.join(random.choice(chars) for i in range(length))

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
    {'name': 'Admin', 'email': 'admin@mentiq.com', 'role': 'admin', 'is_staff': True, 'is_superuser': True}
]

created_users = []

for user_data in users_to_create:
    password = generate_password()
    email = user_data['email']
    name = user_data['name']
    role = user_data['role']
    
    if User.objects.filter(email=email).exists():
        # If user exists, update password to ensure we can provide it
        user = User.objects.get(email=email)
        user.set_password(password)
        user.save()
        created_users.append({'email': email, 'password': password, 'role': role, 'status': 'updated'})
    else:
        if user_data.get('is_superuser'):
            user = User.objects.create_superuser(email=email, password=password, name=name)
        else:
            user = User.objects.create_user(email=email, password=password, name=name, role=role)
        created_users.append({'email': email, 'password': password, 'role': role, 'status': 'created'})

print("---RESULTS---")
for u in created_users:
    print(f"Role: {u['role']} | Email: {u['email']} | Password: {u['password']} ({u['status']})")
