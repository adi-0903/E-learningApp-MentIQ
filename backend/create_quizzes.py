import os
import django
import random

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.courses.models import Course
from apps.quizzes.models import Quiz, QuizQuestion

def create_quizzes():
    courses = Course.objects.all()
    if not courses.exists():
        print("No courses found. Please run create_courses.py first.")
        return

    print(f"Generating quizzes for {courses.count()} courses...")

    # Sample questions bank for different categories
    question_bank = {
        "Technology": [
            {"q": "What does CSS stand for?", "a": "Cascading Style Sheets", "b": "Creative Style Sheets", "c": "Computer Style Sheets", "d": "Colorful Style Sheets", "correct": "a"},
            {"q": "Which language is used for web structure?", "a": "Python", "b": "HTML", "c": "Java", "d": "C++", "correct": "b"},
            {"q": "What is the primary use of React.js?", "a": "Backend logic", "b": "User Interface design", "c": "Database management", "d": "Operating systems", "correct": "b"},
            {"q": "Which company developed Java?", "a": "Microsoft", "b": "Sun Microsystems", "c": "Google", "d": "Apple", "correct": "b"},
            {"q": "What does API stand for?", "a": "Application Programming Interface", "b": "Advanced Program Integration", "c": "Automated Protocol Interface", "d": "Application Process Indicator", "correct": "a"},
            {"q": "In React, what is a 'Hook'?", "a": "A way to fish data", "b": "A function to use state/features", "c": "A component type", "d": "A bug in code", "correct": "b"}
        ],
        "Business": [
            {"q": "What does ROI stand for?", "a": "Return on Investment", "b": "Rate of Interest", "c": "Risk of Inflation", "d": "Revenue on Income", "correct": "a"},
            {"q": "Which SWOT element is external?", "a": "Strengths", "b": "Weaknesses", "c": "Opportunities", "d": "Values", "correct": "c"},
            {"q": "What is a 'Niche' market?", "a": "A large general market", "b": "A specialized segment of a market", "c": "A supermarket", "d": "An illegal market", "correct": "b"},
            {"q": "What is B2B?", "a": "Back to Business", "b": "Business to Business", "c": "Business to Buyer", "d": "Buyer to Business", "correct": "b"},
            {"q": "What is the primary goal of a startup?", "a": "Stability", "b": "Scalable growth", "c": "Tax evasion", "d": "Hiring 1000 people", "correct": "b"}
        ],
        "Arts": [
            {"q": "Who painted the Mona Lisa?", "a": "Van Gogh", "b": "Leonardo da Vinci", "c": "Picasso", "d": "Michelangelo", "correct": "b"},
            {"q": "What is 'Perspective' in art?", "a": "The artist's opinion", "b": "Representation of 3D on 2D", "c": "Using bright colors", "d": "Painting from memory", "correct": "b"},
            {"q": "Which period followed the Renaissance?", "a": "Medieval", "b": "Baroque", "c": "Modernism", "d": "Gothic", "correct": "b"},
            {"q": "What is 'Chiaroscuro'?", "a": "A type of pasta", "b": "Contrast between light and dark", "c": "A blue pigment", "d": "A painting frame", "correct": "b"}
        ],
        "Science": [
            {"q": "What is the powerhouse of the cell?", "a": "Nucleus", "b": "Mitochondria", "c": "Ribosome", "d": "Wall", "correct": "b"},
            {"q": "What is the speed of light approx?", "a": "300,000 km/s", "b": "150,000 km/s", "c": "1,000 km/s", "d": "340 m/s", "correct": "a"},
            {"q": "Which planet is known as the Red Planet?", "a": "Venus", "b": "Mars", "c": "Jupiter", "d": "Saturn", "correct": "b"},
            {"q": "What is the atomic number of Hydrogen?", "a": "0", "b": "1", "c": "2", "d": "10", "correct": "b"}
        ],
        "General": [
            {"q": "What is the largest continent?", "a": "Africa", "b": "Asia", "c": "Europe", "d": "America", "correct": "b"},
            {"q": "Which is the longest river?", "a": "Amazon", "b": "Nile", "c": "Ganges", "d": "Thames", "correct": "b"},
            {"q": "What is the capital of France?", "a": "Berlin", "b": "Paris", "c": "London", "d": "Rome", "correct": "b"},
            {"q": "How many states are in India?", "a": "25", "b": "28", "c": "29", "d": "30", "correct": "b"}
        ]
    }

    quiz_count = 0
    question_count = 0

    for course in courses:
        # Determine category for question bank
        cat = "General"
        if "Technology" in course.category or "Data" in course.title:
            cat = "Technology"
        elif "Business" in course.category or "Marketing" in course.title:
            cat = "Business"
        elif "Arts" in course.category or "Photography" in course.title:
            cat = "Arts"
        elif "Science" in course.category or "Physics" in course.title:
            cat = "Science"

        for i in range(1, 6):
            quiz_title = f"{course.title} - Quiz {i}"
            quiz = Quiz.objects.create(
                course=course,
                title=quiz_title,
                description=f"Assessment for module {i} of {course.title}.",
                duration=random.choice([15, 20, 30]),
                passing_score=60,
                is_published=True,
                max_attempts=3
            )
            quiz_count += 1

            # Select 5 unique questions from the bank or generate variants
            available_qs = question_bank[cat] + question_bank["General"]
            selected_qs = random.sample(available_qs, min(len(available_qs), 5))

            for idx, q_data in enumerate(selected_qs):
                QuizQuestion.objects.create(
                    quiz=quiz,
                    question_text=q_data['q'],
                    option_a=q_data['a'],
                    option_b=q_data['b'],
                    option_c=q_data['c'],
                    option_d=q_data['d'],
                    correct_answer=q_data['correct'],
                    sequence_number=idx + 1,
                    explanation="Review the lesson material for more details."
                )
                question_count += 1

    print(f"Successfully created {quiz_count} quizzes and {question_count} questions!")

if __name__ == "__main__":
    create_quizzes()
