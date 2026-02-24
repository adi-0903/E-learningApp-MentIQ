"""
Admin Panel Models — Platform-wide configuration managed by admins.
"""
import uuid
from django.db import models


class PremiumPlan(models.Model):
    """
    Premium subscription plans managed exclusively by admins.
    Three tiers: Basic, Pro, Enterprise — each fully configurable.
    """

    class TierChoices(models.TextChoices):
        PRO = 'pro', 'Pro'
        ENTERPRISE = 'enterprise', 'Enterprise'
        CUSTOM = 'custom', 'Custom'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tier = models.CharField(
        max_length=12,
        choices=TierChoices.choices,
        unique=True,
        help_text='Plan tier (pro / enterprise / custom)',
    )
    name = models.CharField(
        max_length=100,
        help_text='Display name, e.g. "MentiQ Basic"',
    )
    description = models.TextField(
        blank=True, default='',
        help_text='Short description of the plan',
    )
    quarterly_price = models.DecimalField(
        max_digits=10, decimal_places=2, default=0.00,
        help_text='Quarterly price in INR',
    )
    annual_price = models.DecimalField(
        max_digits=10, decimal_places=2, default=0.00,
        help_text='Annual price in INR (discounted)',
    )
    currency = models.CharField(max_length=3, default='INR')

    # Feature flags — what's included in this plan
    max_courses = models.IntegerField(
        default=5,
        help_text='Max courses a user can enroll in (-1 = unlimited)',
    )
    max_downloads = models.IntegerField(
        default=10,
        help_text='Max downloads per month (-1 = unlimited)',
    )
    ai_tutor_access = models.BooleanField(
        default=False,
        help_text='Access to AI tutor feature',
    )
    live_classes_access = models.BooleanField(
        default=False,
        help_text='Access to live classes',
    )
    certificate_access = models.BooleanField(
        default=False,
        help_text='Can get completion certificates',
    )
    priority_support = models.BooleanField(
        default=False,
        help_text='Priority support access',
    )
    analytics_access = models.BooleanField(
        default=False,
        help_text='Advanced analytics dashboard',
    )
    custom_features = models.JSONField(
        default=list, blank=True,
        help_text='Additional custom features as a list of strings',
    )

    # Status
    is_active = models.BooleanField(
        default=True,
        help_text='Whether this plan is currently available',
    )
    is_popular = models.BooleanField(
        default=False,
        help_text='Highlight as most popular plan',
    )
    badge_text = models.CharField(
        max_length=30, blank=True, default='',
        help_text='Badge text, e.g. "Most Popular", "Best Value"',
    )
    color = models.CharField(
        max_length=7, default='#7c3aed',
        help_text='Accent color hex for the plan card',
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'premium_plans'
        ordering = ['quarterly_price']

    def __str__(self):
        status = '✓' if self.is_active else '✗'
        return f"[{status}] {self.name} ({self.tier}) — ₹{self.quarterly_price}/qtr"


class SchoolSubscription(models.Model):
    """
    Singleton-ish model tracking the school's active subscription.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    plan = models.ForeignKey(PremiumPlan, on_delete=models.SET_NULL, null=True, related_name='subscriptions')
    billing_cycle = models.CharField(
        max_length=15, 
        choices=[('quarterly', 'Quarterly'), ('annual', 'Annual')],
        default='annual'
    )
    is_active = models.BooleanField(default=True)
    start_date = models.DateTimeField(auto_now_add=True)
    end_date = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'school_subscriptions'
        ordering = ['-created_at']

    def __str__(self):
        return f"Subscription: {self.plan.name if self.plan else 'None'} ({self.billing_cycle})"
