from apps.courses.models import Course
from apps.lessons.models import Lesson

courses = Course.objects.all()

if not courses:
    print("No courses found! Please create courses first.")
    exit()

lessons_templates = [
    {
        "title": "Introduction to {course_title}", 
        "content": "Welcome to the first lesson of {course_title}. In this module, we will cover the foundational concepts and set the stage for your learning journey. This course is designed to provide you with a comprehensive understanding of the subject matter."
    },
    {
        "title": "Core Concepts & Principles", 
        "content": "This lesson dives into the essential theories and principles that define {course_title}. We will explore the key pillars of the subject and how they interact with each other in professional environments."
    },
    {
        "title": "Practical Methodologies", 
        "content": "Learn the step-by-step methodologies used in {course_title}. This section includes detailed explanations, industry standards, and practical frameworks to strengthen your technical or conceptual understanding."
    },
    {
        "title": "Advanced Applications", 
        "content": "See {course_title} in action! We will walk through several advanced use cases, case studies, and practical exercises to help you apply what you've learned to complex real-world problems."
    },
    {
        "title": "Course Review & Final Summary", 
        "content": "Congratulations on reaching the end of the course! In this final lesson, we summarize the key takeaways, review critical concepts, and provide additional resources for your continued professional development."
    }
]

created_count = 0

for course in courses:
    for i, template in enumerate(lessons_templates):
        title = template["title"].format(course_title=course.title)
        content = template["content"].format(course_title=course.title)
        
        # Using update_or_create to ensure we have at least 5 lessons even if some exist
        lesson, created = Lesson.objects.update_or_create(
            course=course,
            sequence_number=i + 1,
            defaults={
                "title": title,
                "content": content,
                "description": f"Module {i+1} of {course.title}",
                "file_type": "document",
                "duration": 20
            }
        )
        if created:
            created_count += 1

print(f"---SUCCESS---")
print(f"Processed {courses.count()} courses. Created {created_count} new lessons.")
