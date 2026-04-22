from apps.users.models import User
from apps.courses.models import Course
import random

# Get the teachers
teachers = list(User.objects.filter(role='teacher'))

if not teachers:
    print("No teachers found! Please create teachers first.")
    exit()

courses_data = [
    {
        'title': 'Python for Data Science',
        'description': 'Learn Python libraries like Pandas, NumPy, and Scikit-Learn for data analysis.',
        'category': 'technology',
        'level': 'intermediate',
        'price': 0.00
    },
    {
        'title': 'Business Management 101',
        'description': 'Master the basics of leadership, strategy, and organizational behavior.',
        'category': 'business',
        'level': 'beginner',
        'price': 0.00
    },
    {
        'title': 'Modern Web Development',
        'description': 'Build full-stack applications with React, Node.js, and PostgreSQL.',
        'category': 'technology',
        'level': 'advanced',
        'price': 0.00
    },
    {
        'title': 'Intro to Physics',
        'description': 'Understanding the fundamental laws of motion, energy, and thermodynamics.',
        'category': 'physics',
        'level': 'beginner',
        'price': 0.00
    },
    {
        'title': 'Creative Writing',
        'description': 'Develop your voice and craft compelling narratives in this hands-on workshop.',
        'category': 'arts',
        'level': 'all_levels',
        'price': 0.00
    },
    {
        'title': 'Calculus Fundamentals',
        'description': 'Derivatives, integrals, and their real-world applications.',
        'category': 'mathematics',
        'level': 'intermediate',
        'price': 0.00
    },
    {
        'title': 'History of Civilizations',
        'description': 'A journey through the rise and fall of major human societies.',
        'category': 'history',
        'level': 'all_levels',
        'price': 0.00
    },
    {
        'title': 'Digital Marketing Mastery',
        'description': 'SEO, SEM, social media strategy, and conversion optimization.',
        'category': 'business',
        'level': 'intermediate',
        'price': 0.00
    },
    {
        'title': 'Biology: Cells & Genetics',
        'description': 'Explore the building blocks of life and the mechanisms of inheritance.',
        'category': 'biology',
        'level': 'beginner',
        'price': 0.00
    },
    {
        'title': 'Music Theory for Beginners',
        'description': 'Learn to read notation, understand rhythm, and build harmonies.',
        'category': 'music',
        'level': 'beginner',
        'price': 0.00
    }
]

created_courses = []

for i, data in enumerate(courses_data):
    # Assign to teachers in a round-robin fashion
    teacher = teachers[i % len(teachers)]
    
    course, created = Course.objects.get_or_create(
        title=data['title'],
        defaults={
            'teacher': teacher,
            'description': data['description'],
            'category': data['category'],
            'level': data['level'],
            'price': data['price'],
            'is_free': data['price'] == 0,
            'is_published': True
        }
    )
    
    status = "created" if created else "already exists"
    created_courses.append({'title': course.title, 'teacher': teacher.name, 'status': status})

print("---RESULTS---")
for c in created_courses:
    print(f"Course: {c['title']} | Teacher: {c['teacher']} ({c['status']})")
