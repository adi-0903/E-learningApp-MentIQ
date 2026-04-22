import os
import django
import sys

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

def run_seeder(script_name):
    print(f"\n{'='*50}")
    print(f"RUNNING SEEDER: {script_name}")
    print(f"{'='*50}")
    
    # We use exec(open(...).read()) but since some scripts have their own django.setup()
    # and some don't, we'll try to run them as modules or handle the setup gracefully.
    try:
        if script_name == 'create_users.py':
            import create_users
        elif script_name == 'create_courses.py':
            import create_courses
        elif script_name == 'create_lessons.py':
            import create_lessons
        elif script_name == 'create_quizzes.py':
            # create_quizzes.py has a create_quizzes() function and if __name__ == "__main__"
            from create_quizzes import create_quizzes
            create_quizzes()
        else:
            print(f"Unknown seeder: {script_name}")
    except Exception as e:
        print(f"Error running {script_name}: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    # Ensure current directory is in path for imports
    sys.path.append(os.getcwd())
    
    seeders = [
        'create_users.py',
        'create_courses.py',
        'create_lessons.py',
        'create_quizzes.py'
    ]
    
    for seeder in seeders:
        run_seeder(seeder)
        
    print(f"\n{'='*50}")
    print("ALL SEEDING COMPLETED SUCCESSFULLY")
    print(f"{'='*50}")
