"""Badge System Services - Logic for awarding badges automatically and certificate generation."""
import cloudinary
import cloudinary.uploader
from django.conf import settings
from django.utils import timezone
from django.db.models import Count, Q, F
from PIL import Image, ImageDraw, ImageFont
import io
import os
from .models import AchievementBadge, StudentBadge


def check_and_award_badge(student, criteria_type, context_data=None):
    """
    Check if student meets badge criteria and award if qualified.
    
    Args:
        student: User object (student)
        criteria_type: str - Type of badge criteria (e.g., 'quiz_mastery', 'streak_master')
        context_data: dict - Additional data needed for checking
    
    Returns:
        dict: {'awarded': bool, 'badge_name': str, 'message': str, 'progress': int}
    """
    context_data = context_data or {}
    
    try:
        # Find badge with matching criteria
        badge = AchievementBadge.objects.get(criteria_type=criteria_type)
        
        # Get or create student badge progress tracker
        student_badge, created = StudentBadge.objects.get_or_create(
            student=student,
            badge=badge,
            defaults={'progress': 0}
        )
        
        # Check specific criteria type
        if criteria_type == 'first_quiz':
            return award_if_criteria_met(student_badge, badge, 1, context_data.get('quiz_completed', False))
        
        elif criteria_type == 'quiz_novice':
            # Complete 5 quizzes with 70%+
            from apps.quizzes.models import QuizAttempt
            quiz_count = QuizAttempt.objects.filter(
                student=student,
                score__gte=70
            ).count()
            return award_if_criteria_met(student_badge, badge, quiz_count, quiz_count >= badge.criteria_threshold)
        
        elif criteria_type == 'quiz_warrior':
            # Complete 20 quizzes with 85%+
            from apps.quizzes.models import QuizAttempt
            quiz_count = QuizAttempt.objects.filter(
                student=student,
                score__gte=85
            ).count()
            return award_if_criteria_met(student_badge, badge, quiz_count, quiz_count >= badge.criteria_threshold)
        
        elif criteria_type == 'streak_7days':
            # Check current streak (would need tracking in user profile)
            streak_days = context_data.get('current_streak', 0)
            return award_if_criteria_met(student_badge, badge, streak_days, streak_days >= badge.criteria_threshold)
        
        elif criteria_type == 'course_completion':
            # Complete first course
            from apps.progress.models import CourseProgress
            completed_count = CourseProgress.objects.filter(
                student=student,
                progress_percentage=100.0
            ).count()
            return award_if_criteria_met(student_badge, badge, completed_count, completed_count >= badge.criteria_threshold)
        
        elif criteria_type == 'quiz_master':
            # 50 quizzes with 90%+
            from apps.quizzes.models import QuizAttempt
            count = QuizAttempt.objects.filter(student=student, score__gte=90).count()
            return award_if_criteria_met(student_badge, badge, count, count >= badge.criteria_threshold)
            
        elif criteria_type == 'perfect_score':
            # 10 quizzes with 100%
            from apps.quizzes.models import QuizAttempt
            # To get 100%, score must be equal to total_questions.
            # However we store them differently sometimes, checking if ratio is 1.0.
            # Assuming QuizAttempt has score and total_questions.
            from django.db.models import F
            count = QuizAttempt.objects.filter(student=student, score=F('total_questions')).count()
            return award_if_criteria_met(student_badge, badge, count, count >= badge.criteria_threshold)
            
        elif criteria_type == 'speed_demon':
            # 5 perfect quizzes in record time (e.g. < 60s)
            from apps.quizzes.models import QuizAttempt
            from django.db.models import F
            count = QuizAttempt.objects.filter(
                student=student, 
                score=F('total_questions'),
                time_taken__lte=60
            ).count()
            return award_if_criteria_met(student_badge, badge, count, count >= badge.criteria_threshold)
            
        elif criteria_type == 'elite_scholar':
            # Earn 10 Rare or higher badges
            count = StudentBadge.objects.filter(
                student=student,
                is_claimed=True,
                badge__rarity__in=['RARE', 'EPIC', 'LEGENDARY', 'MYTHIC']
            ).count()
            return award_if_criteria_met(student_badge, badge, count, count >= badge.criteria_threshold)
        
        else:
            # Generic criteria checking
            current_progress = context_data.get('current_value', 0)
            return award_if_criteria_met(student_badge, badge, current_progress, current_progress >= badge.criteria_threshold)
            
    except AchievementBadge.DoesNotExist:
        return {
            'awarded': False,
            'message': f'No badge found for criteria: {criteria_type}',
            'progress': 0
        }


def award_if_criteria_met(student_badge, badge, current_progress, criteria_met):
    """
    Award badge if criteria is met and not already awarded.
    """
    # Update progress
    student_badge.progress = current_progress
    student_badge.save()
    
    if criteria_met and not student_badge.is_claimed:
        # Award the badge!
        student_badge.is_claimed = True
        student_badge.awarded_at = timezone.now()
        student_badge.save()
        
        # Increment total awarded count
        badge.total_awarded += 1
        badge.save()
        
        # Generate certificate in background (optional)
        # Note: This import is placed here as per user instruction to resolve merge conflict.
        # In a typical Python project, imports are at the top of the file.
        from .services import generate_certificate 
        try:
            cert_data = generate_certificate(student_badge)
        except Exception:
            pass  # Continue even if certificate generation fails
        
        return {
            'awarded': True,
            'badge_name': badge.name,
            'badge_id': str(badge.id),
            'rarity': badge.rarity,
            'message': f'🏆 Congratulations! You earned the {badge.name} badge!',
            'progress': current_progress,
            'threshold': badge.criteria_threshold,
            'certificate_url': getattr(student_badge, 'certificate_url', None)
        }
    elif criteria_met and student_badge.is_claimed:
        return {
            'awarded': False,
            'message': 'You already have this badge!',
            'progress': current_progress,
            'already_earned': True
        }
    else:
        return {
            'awarded': False,
            'message': f'Progress: {current_progress}/{badge.criteria_threshold}. Keep going!',
            'progress': current_progress,
            'threshold': badge.criteria_threshold
        }


def get_initial_badges():
    """
    Create initial set of badges for the platform.
    Run this once during setup or when adding new badges.
    """
    badges_data = [
        # Quiz Badges
        {
            'name': 'First Quiz',
            'description': 'Complete your very first quiz',
            'rarity': 'COMMON',
            'criteria_type': 'first_quiz',
            'criteria_threshold': 1,
            'icon_url': 'https://mentiq.com/badges/first_quiz.png',
            'tradeable': False,
            'drop_rate': 1.0
        },
        {
            'name': 'Quiz Novice',
            'description': 'Complete 5 quizzes with 70% or higher',
            'rarity': 'COMMON',
            'criteria_type': 'quiz_novice',
            'criteria_threshold': 5,
            'icon_url': 'https://mentiq.com/badges/quiz_novice.png',
            'tradeable': False,
            'drop_rate': 0.6
        },
        {
            'name': 'Quiz Warrior',
            'description': 'Complete 20 quizzes with 85% or higher',
            'rarity': 'RARE',
            'criteria_type': 'quiz_warrior',
            'criteria_threshold': 20,
            'icon_url': 'https://mentiq.com/badges/quiz_warrior.png',
            'tradeable': False,
            'drop_rate': 0.3
        },
        
        # Streak Badges
        {
            'name': '7-Day Streak',
            'description': 'Log in and study for 7 consecutive days',
            'rarity': 'COMMON',
            'criteria_type': 'streak_7days',
            'criteria_threshold': 7,
            'icon_url': 'https://mentiq.com/badges/streak_7.png',
            'tradeable': False,
            'drop_rate': 0.5
        },
        {
            'name': '30-Day Warrior',
            'description': 'Maintain a 30-day study streak',
            'rarity': 'RARE',
            'criteria_type': 'streak_30days',
            'criteria_threshold': 30,
            'icon_url': 'https://mentiq.com/badges/streak_30.png',
            'tradeable': False,
            'drop_rate': 0.25
        },
        
        # Course Completion Badges
        {
            'name': 'Course Finisher',
            'description': 'Complete your first course',
            'rarity': 'RARE',
            'criteria_type': 'course_completion',
            'criteria_threshold': 1,
            'icon_url': 'https://mentiq.com/badges/course_finisher.png',
            'tradeable': False,
            'drop_rate': 0.4
        },
    ]
    
    created_badges = []
    for badge_data in badges_data:
        badge, created = AchievementBadge.objects.get_or_create(
            name=badge_data['name'],
            defaults=badge_data
        )
        if created:
            created_badges.append(badge)
    
    return created_badges

def generate_certificate(student_badge):
    """
    Generate a certificate for an earned badge using Cloudinary.
    
    Args:
        student_badge: StudentBadge instance
    
    Returns:
        dict: {'certificate_url': str, 'animated_url': str}
    """
    try:
        badge = student_badge.badge
        student = student_badge.student
        
        # Get certificate template or use default based on rarity
        if badge.certificate_template:
            template_path = badge.certificate_template.path
        else:
            # Use default templates based on rarity
            template_map = {
                'COMMON': 'certificates/templates/common_cert.png',
                'RARE': 'certificates/templates/rare_cert.png',
                'EPIC': 'certificates/templates/epic_cert.png',
                'LEGENDARY': 'certificates/templates/legendary_cert.png',
                'MYTHIC': 'certificates/templates/mythic_cert.png',
            }
            template_path = template_map.get(badge.rarity, template_map['COMMON'])
        
        # Check if template exists locally, otherwise use default
        if not os.path.exists(template_path):
            # Create a simple certificate on the fly
            certificate_image = create_simple_certificate(badge, student)
        else:
            # Load template and add text overlay
            certificate_image = add_text_to_certificate(template_path, badge, student)
        
        # Upload to Cloudinary
        certificate_buffer = io.BytesIO()
        certificate_image.save(certificate_buffer, format='PNG')
        certificate_buffer.seek(0)
        
        # Upload certificate
        cert_upload = cloudinary.uploader.upload(
            certificate_buffer,
            folder=f'certificates/{student.id}',
            public_id=f'{badge.id}_certificate',
            resource_type='image'
        )
        
        # Also upload badge icon if available
        animated_url = None
        if badge.animated_icon_url:
            try:
                animated_upload = cloudinary.uploader.upload(
                    badge.animated_icon_url,
                    folder=f'badges/animated',
                    public_id=f'{badge.id}_animated',
                    resource_type='auto'
                )
                animated_url = animated_upload['secure_url']
            except Exception:
                animated_url = badge.animated_icon_url
        
        # Update student badge with certificate URL
        student_badge.certificate_url = cert_upload['secure_url']
        student_badge.animated_icon_url = animated_url
        student_badge.save(update_fields=['certificate_url', 'animated_icon_url'])
        
        return {
            'certificate_url': cert_upload['secure_url'],
            'animated_url': animated_url
        }
        
    except Exception as e:
        # Fallback: just return badge URLs
        return {
            'certificate_url': badge.icon_url,
            'animated_url': badge.animated_icon_url,
            'error': str(e)
        }


def create_simple_certificate(badge, student):
    """
    Create a simple certificate image when no template is available.
    """
    # Create image (800x600)
    width, height = 800, 600
    
    # Background color based on rarity
    rarity_colors = {
        'COMMON': '#CD7F32',  # Bronze
        'RARE': '#C0C0C0',    # Silver
        'EPIC': '#FFD700',    # Gold
        'LEGENDARY': '#B9F2FF',  # Diamond
        'MYTHIC': '#E5EEC1',  # Platinum
    }
    
    bg_color = rarity_colors.get(badge.rarity, '#CD7F32')
    
    # Create image
    img = Image.new('RGB', (width, height), color=bg_color)
    draw = ImageDraw.Draw(img)
    
    # Add border
    border_color = '#FFFFFF' if badge.rarity in ['EPIC', 'LEGENDARY', 'MYTHIC'] else '#000000'
    draw.rectangle([10, 10, width-10, height-10], outline=border_color, width=5)
    
    # Try to load font (use default if not available)
    try:
        title_font = ImageFont.truetype("arial.ttf", 48)
        subtitle_font = ImageFont.truetype("arial.ttf", 32)
        text_font = ImageFont.truetype("arial.ttf", 28)
    except:
        title_font = ImageFont.load_default()
        subtitle_font = ImageFont.load_default()
        text_font = ImageFont.load_default()
    
    # Text color
    text_color = '#000000' if badge.rarity in ['COMMON', 'RARE'] else '#FFFFFF'
    
    # Draw title
    title = "Certificate of Achievement"
    draw.text((width//2, 80), title, fill=text_color, font=title_font, anchor="mm")
    
    # Draw badge name
    draw.text((width//2, 180), badge.name, fill=text_color, font=subtitle_font, anchor="mm")
    
    # Draw student name
    awarded_text = f"Awarded to {student.name}"
    draw.text((width//2, 280), awarded_text, fill=text_color, font=text_font, anchor="mm")
    
    # Draw description
    draw.text((width//2, 350), badge.description, fill=text_color, font=text_font, anchor="mm")
    
    # Draw date
    date_text = f"Date: {timezone.now().strftime('%B %d, %Y')}"
    draw.text((width//2, 450), date_text, fill=text_color, font=text_font, anchor="mm")
    
    # Draw rarity
    rarity_text = f"Rarity: {badge.get_rarity_display()}"
    draw.text((width//2, 500), rarity_text, fill=text_color, font=text_font, anchor="mm")
    
    return img


def add_text_to_certificate(template_path, badge, student):
    """
    Add text overlay to existing certificate template.
    """
    # Open template
    img = Image.open(template_path)
    draw = ImageDraw.Draw(img)
    
    width, height = img.size
    
    # Try to load font
    try:
        title_font = ImageFont.truetype("arial.ttf", 48)
        subtitle_font = ImageFont.truetype("arial.ttf", 32)
        text_font = ImageFont.truetype("arial.ttf", 28)
    except:
        title_font = ImageFont.load_default()
        subtitle_font = ImageFont.load_default()
        text_font = ImageFont.load_default()
    
    # Determine text color based on template background
    text_color = '#000000'
    
    # Draw badge name (centered)
    draw.text((width//2, height//2 - 60), badge.name, fill=text_color, font=subtitle_font, anchor="mm")
    
    # Draw student name
    draw.text((width//2, height//2 + 20), student.name, fill=text_color, font=text_font, anchor="mm")
    
    # Draw date
    draw.text((width//2, height//2 + 80), timezone.now().strftime('%B %d, %Y'), fill=text_color, font=text_font, anchor="mm")
    
    return img
