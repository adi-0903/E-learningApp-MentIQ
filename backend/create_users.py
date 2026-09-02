import os
import secrets
import string
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.users.models import User

def get_seed_password(user_email=None):
    """
    Generates a secure password or loads one from environment variables.
    Checks user-specific env var (e.g., SEED_PASSWORD_ADMIN_MENTIQ_COM) first,
    then SEED_DEFAULT_PASSWORD or SEED_PASSWORD,
    falling back to generating a cryptographically secure random password.
    """
    if user_email:
        env_key = f"SEED_PASSWORD_{user_email.replace('@', '_').replace('.', '_').replace('-', '_').upper()}"
        if os.environ.get(env_key):
            return os.environ[env_key]

    env_password = os.environ.get('SEED_DEFAULT_PASSWORD') or os.environ.get('SEED_PASSWORD')
    if env_password:
        return env_password

    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    while True:
        pwd = ''.join(secrets.choice(alphabet) for _ in range(16))
        if (any(c.islower() for c in pwd)
                and any(c.isupper() for c in pwd)
                and any(c.isdigit() for c in pwd)
                and any(c in "!@#$%^&*" for c in pwd)):
            return pwd

def create_users():
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

    print("Generating secure user passwords for database seeding...")

    for user_data in users_to_create:
        email = user_data['email']
        name = user_data['name']
        role = user_data['role']

        password = get_seed_password(email)

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
    return created_users

if __name__ == '__main__':
    create_users()
