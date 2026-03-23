from django.contrib import admin
from .models import PremiumPlan, SchoolSubscription

@admin.register(PremiumPlan)
class PremiumPlanAdmin(admin.ModelAdmin):
    list_display = ('name', 'tier', 'quarterly_price', 'annual_price', 'is_active', 'is_popular')
    list_filter = ('is_active', 'tier', 'is_popular')
    search_fields = ('name', 'tier', 'description')
    ordering = ('quarterly_price',)

    fieldsets = (
        ('Plan Details', {
            'fields': ('name', 'tier', 'description', 'currency')
        }),
        ('Pricing & Discounts', {
            'fields': ('quarterly_price', 'annual_price'),
            'description': 'Adjust the prices here whenever you want to offer discounts or change rates.'
        }),
        ('Feature Access', {
            'fields': (
                'ai_tutor_access', 'live_classes_access', 
                'certificate_access', 'priority_support', 'analytics_access',
                'max_courses', 'max_downloads', 'custom_features'
            )
        }),
        ('Display Settings', {
            'fields': ('is_active', 'is_popular', 'badge_text', 'color')
        }),
    )

@admin.register(SchoolSubscription)
class SchoolSubscriptionAdmin(admin.ModelAdmin):
    list_display = ('__str__', 'plan', 'billing_cycle', 'is_active', 'end_date')
    list_filter = ('is_active', 'billing_cycle', 'plan')
    date_hierarchy = 'created_at'
