import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.courses.models import Course
from apps.lessons.models import Lesson

def seed_lessons():
    courses = Course.objects.all()

    if not courses:
        print("No courses found! Please create courses first.")
        return

    # Real lesson content maps for each course title
    content_map = {
        "Python for Data Science": [
            {"title": "Introduction to Data Science with Python", "content": "Welcome to the world of Data Science. Python has become the lingua franca of this field due to its simplicity and powerful libraries. In this lesson, we will explore why Python is used and set up our environment with Anaconda and Jupyter Notebooks."},
            {"title": "NumPy: Numerical Computing", "content": "NumPy is the fundamental package for scientific computing with Python. It provides a powerful N-dimensional array object. We'll learn how to create arrays, perform vectorization, and understand broadcasting—the secret to NumPy's speed."},
            {"title": "Pandas for Data Manipulation", "content": "Pandas is built on top of NumPy and provides data structures like DataFrames. DataFrames are essentially tables that allow for easy data cleaning, transformation, and analysis. Today, we'll load our first CSV and explore basic slicing and dicing."},
            {"title": "Matplotlib & Seaborn: Visualization", "content": "Data is only as good as its story. Matplotlib is the grandfather of Python plotting, while Seaborn makes it beautiful. We'll create histograms, scatter plots, and heatmaps to find patterns in our data that numbers alone can't show."},
            {"title": "Intro to Machine Learning with Scikit-Learn", "content": "In our final lesson, we'll use Scikit-Learn to build our first predictive model. We'll cover the difference between supervised and unsupervised learning and train a simple Linear Regression model to predict house prices."}
        ],
        "Business Management 101": [
            {"title": "The Pillars of Modern Management", "content": "Management is the art of getting things done through people. We'll look at Henri Fayol's 14 principles of management and how they have evolved into the modern P-O-L-C framework: Planning, Organizing, Leading, and Controlling."},
            {"title": "Organizational Structure & Design", "content": "How a company is organized determines its efficiency. We'll compare Functional, Divisional, and Matrix structures. You'll learn which structure suits a startup versus a global corporation like Google or Toyota."},
            {"title": "Leadership vs. Management", "content": "Not all managers are leaders, and not all leaders are managers. We will explore leadership styles—from Autocratic to Transformational—and when to use each to motivate a diverse team."},
            {"title": "Strategic Planning & SWOT Analysis", "content": "Strategy is about choices. We'll perform a SWOT analysis (Strengths, Weaknesses, Opportunities, Threats) and use Porter's Five Forces to understand competitive dynamics in any industry."},
            {"title": "Effective Communication & Teamwork", "content": "Communication is the lifeblood of business. We'll study the communication loop, barriers to effective listening, and Bruce Tuckman's stages of group development: Forming, Storming, Norming, and Performing."}
        ],
        "Modern Web Development": [
            {"title": "The Evolution of the Web", "content": "From static HTML to dynamic Single Page Applications (SPAs). We'll discuss how the modern web works, including the Request-Response cycle, DOM manipulation, and why frameworks like React became dominant."},
            {"title": "React Fundamentals & Components", "content": "React is all about components. We'll learn about JSX, functional components, and props. By the end of this lesson, you'll understand how to break a UI into reusable, manageable pieces."},
            {"title": "State Management with Hooks", "content": "State is the 'memory' of a component. We'll dive deep into `useState` and `useEffect`. You'll learn how to handle user input, fetch data from APIs, and manage the lifecycle of your application."},
            {"title": "Modern Styling: CSS-in-JS & Tailwind", "content": "Standard CSS is great, but modern dev uses utilities. We'll explore Tailwind CSS for rapid UI development and look at how to build responsive layouts that look great on any device."},
            {"title": "Backend Integration & Deployment", "content": "A frontend needs data. We'll learn how to connect our React app to a REST API using Axios. Finally, we'll discuss CI/CD pipelines and how to deploy your app to platforms like Vercel or Netlify."}
        ],
        "Intro to Physics": [
            {"title": "Kinematics: The Study of Motion", "content": "How do things move? We'll define displacement, velocity, and acceleration. We will derive the four equations of motion and solve problems involving constant acceleration and free-fall."},
            {"title": "Newton's Laws of Motion", "content": "Isaac Newton changed the world with three laws. We'll explore Inertia (Law 1), F=ma (Law 2), and Action-Reaction (Law 3). You'll learn how to draw Free Body Diagrams to analyze forces on an object."},
            {"title": "Work, Energy, and Power", "content": "Energy is the capacity to do work. We'll look at Kinetic and Potential energy, the Work-Energy Theorem, and the Law of Conservation of Energy. We'll also calculate Power—the rate at which work is done."},
            {"title": "Universal Gravitation", "content": "Why do planets orbit the sun? We'll study Newton's Law of Universal Gravitation and explore how mass and distance affect the pull of gravity. We'll also touch upon orbits and escape velocity."},
            {"title": "Thermodynamics & Heat Transfer", "content": "Heat is energy in transit. We'll cover temperature scales, specific heat capacity, and the three methods of heat transfer: Conduction, Convection, and Radiation. We'll finish with the Laws of Thermodynamics."}
        ],
        "Creative Writing": [
            {"title": "The Power of Narrative Voice", "content": "Who is telling your story? We'll compare First Person, Third Person Limited, and Third Person Omniscient. You'll learn how to establish a consistent and compelling voice that hooks your reader from page one."},
            {"title": "Character Architecture", "content": "Great stories are driven by great characters. We'll discuss the 'Wants' vs. 'Needs' of a character and how to create multi-dimensional protagonists and antagonists through dialogue and action."},
            {"title": "Plot Structures & The Hero's Journey", "content": "A plot is not just a series of events; it's a sequence of cause and effect. We'll look at the 3-Act Structure and Joseph Campbell's 'The Hero's Journey' to map out your narrative's high and low points."},
            {"title": "The Art of World Building", "content": "Whether it's a small village or a galaxy, your setting must feel lived-in. We'll discuss how to use sensory details—sight, sound, smell—to ground your reader in your story's world without 'info-dumping'."},
            {"title": "Editing & Finding Your Audience", "content": "Writing is rewriting. We'll cover common editing pitfalls, how to kill your darlings, and the basics of the publishing world—from literary agents to self-publishing platforms."}
        ],
        "Calculus Fundamentals": [
            {"title": "Limits & Continuity", "content": "Calculus starts with the concept of a limit. We'll explore what happens as a variable approaches a specific value and define continuity—the idea that a function doesn't have jumps or holes."},
            {"title": "The Power Rule & Derivatives", "content": "The derivative is the instantaneous rate of change. We'll master the Power Rule, Product Rule, and Quotient Rule. You'll learn how to find the slope of a curve at any given point."},
            {"title": "Applications of Derivatives", "content": "Why do we find derivatives? To optimize! We'll use derivatives to find local maxima and minima, solve related rates problems, and analyze the motion of particles."},
            {"title": "Introduction to Integration", "content": "Integration is the inverse of differentiation. We'll learn how to find the area under a curve using Riemann Sums and introduce the power of the Indefinite Integral."},
            {"title": "The Fundamental Theorem of Calculus", "content": "This is the bridge between derivatives and integrals. We'll learn how to evaluate Definite Integrals and understand why this theorem is the most important concept in mathematics."}
        ],
        "History of Civilizations": [
            {"title": "The Cradle of Civilization: Mesopotamia", "content": "Between the Tigris and Euphrates rivers, the first cities were born. We'll explore the Sumerians, the invention of writing (Cuneiform), and the Code of Hammurabi—the world's first written laws."},
            {"title": "Ancient Egypt & The Pharaohs", "content": "The Nile was the lifeblood of Egypt. We'll study the Old, Middle, and New Kingdoms, the construction of the Great Pyramids, and the complex religious beliefs surrounding the afterlife."},
            {"title": "The Glory of Ancient Greece", "content": "From the democracy of Athens to the warriors of Sparta. We'll look at the birth of philosophy with Socrates, Plato, and Aristotle, and the cultural explosion that shaped Western civilization."},
            {"title": "The Rise and Fall of the Roman Empire", "content": "Rome wasn't built in a day. We'll trace its journey from a republic to a global superpower under Augustus, and examine the internal and external factors that led to its eventual collapse."},
            {"title": "The Silk Road & Global Trade", "content": "History is about connections. We'll explore the Silk Road, which linked China to the West, facilitating the exchange of silk, spices, technologies, and ideas across vast distances."}
        ],
        "Digital Marketing Mastery": [
            {"title": "The Digital Marketing Landscape", "content": "Marketing has shifted from traditional to digital. We'll explore the 'Inbound' marketing methodology and look at the customer journey—from Awareness to Consideration to Decision."},
            {"title": "Search Engine Optimization (SEO)", "content": "If you aren't on page 1 of Google, you don't exist. We'll cover On-Page SEO (keywords, tags), Off-Page SEO (backlinks), and Technical SEO to help your website rank higher organically."},
            {"title": "Content Marketing & Social Media Strategy", "content": "Content is king, but distribution is queen. We'll learn how to create valuable content and use platforms like Instagram, LinkedIn, and TikTok to build a loyal community for your brand."},
            {"title": "Paid Advertising: PPC & Social Ads", "content": "Sometimes you have to pay to play. We'll dive into Google Ads and Meta Ads Manager. You'll learn how to set budgets, target specific demographics, and calculate your Return on Ad Spend (ROAS)."},
            {"title": "Analytics & Data-Driven Growth", "content": "You can't manage what you don't measure. We'll use Google Analytics to track user behavior and learn how to run A/B tests to optimize conversion rates on your landing pages."}
        ],
        "Biology: Cells & Genetics": [
            {"title": "Cell Theory & Structure", "content": "Cells are the basic units of life. We'll compare Prokaryotic and Eukaryotic cells and explore the functions of organelles like the Nucleus, Ribosomes, and the Golgi Apparatus."},
            {"title": "Metabolism & Photosynthesis", "content": "How do organisms get energy? We'll look at Cellular Respiration in animals and Photosynthesis in plants. We'll break down the ATP cycle—the energy currency of the cell."},
            {"title": "DNA Structure & Replication", "content": "The double helix contains the blueprint of life. We'll explore the structure of nucleotides and the semi-conservative model of DNA replication that ensures genetic continuity."},
            {"title": "Mendelian Genetics", "content": "Why do you look like your parents? We'll study Gregor Mendel's pea plant experiments and learn how to use Punnett Squares to predict dominant and recessive trait inheritance."},
            {"title": "The Human Genome & Biotechnology", "content": "The 21st century is the age of biotech. We'll discuss the Human Genome Project, CRISPR gene editing, and the ethical considerations of modern genetic engineering."}
        ],
        "Music Theory for Beginners": [
            {"title": "The Musical Alphabet & Staff", "content": "Music is a language with its own alphabet (A-G). We'll learn how to read notes on the Treble and Bass Clef and understand the concept of pitch and the Grand Staff."},
            {"title": "Rhythm, Meter, and Time Signatures", "content": "Rhythm is the heartbeat of music. We'll cover Whole, Half, Quarter, and Eighth notes. You'll learn how to read common time signatures like 4/4 and 3/4 and how to count beats."},
            {"title": "Major & Minor Scales", "content": "Scales provide the 'color' for a song. We'll learn the formula for the Major scale (W-W-H-W-W-W-H) and explore how Minor scales differ to create more emotional or moody music."},
            {"title": "Chords & Harmony", "content": "Three or more notes played together form a chord. We'll build basic triads (Major and Minor) and learn how chord progressions create the harmony that supports a melody."},
            {"title": "Dynamics, Articulation, and Form", "content": "Music is about expression. We'll cover dynamics (Piano, Forte) and articulations (Staccato, Legato). Finally, we'll look at common song structures like Verse-Chorus form."}
        ]
    }

    created_count = 0
    updated_count = 0

    for course in courses:
        lessons_data = content_map.get(course.title)
        
        if not lessons_data:
            # Fallback for any course not in the specific map
            lessons_data = [
                {"title": f"Intro to {course.title}", "content": f"Welcome to {course.title}. This is the first module where we establish the foundations."},
                {"title": "Core Principles", "content": "In this lesson, we dive deep into the essential theories governing this subject."},
                {"title": "Practical Application", "content": "Learn how to apply the theories learned so far in real-world scenarios."},
                {"title": "Advanced Topics", "content": "Exploring the complex edge cases and modern advancements in the field."},
                {"title": "Summary and Next Steps", "content": "Wrapping up the course with key takeaways and further reading material."}
            ]

        for i, data in enumerate(lessons_data):
            lesson, created = Lesson.objects.update_or_create(
                course=course,
                sequence_number=i + 1,
                defaults={
                    "title": data["title"],
                    "content": data["content"],
                    "description": f"Module {i+1} of {course.title}",
                    "file_type": "document",
                    "duration": 20
                }
            )
            if created:
                created_count += 1
            else:
                updated_count += 1

    print(f"---SUCCESS---")
    print(f"Processed {courses.count()} courses.")
    print(f"Created {created_count} new lessons, updated {updated_count} existing ones.")

if __name__ == "__main__":
    seed_lessons()
