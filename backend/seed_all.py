import importlib
import os
import sys

import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()


def run_seeder(script_name):
    print(f"\n{'='*50}")
    print(f"RUNNING SEEDER: {script_name}")
    print(f"{'='*50}")

    module_name = os.path.splitext(script_name)[0]
    try:
        module = importlib.import_module(module_name)
        if hasattr(module, 'create_quizzes'):
            module.create_quizzes()
        elif hasattr(module, 'seed_lessons'):
            module.seed_lessons()
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
