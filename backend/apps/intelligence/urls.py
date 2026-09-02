from django.urls import path
from . import views

app_name = 'intelligence'

urlpatterns = [
    path('', views.IntelligenceOverviewView.as_view(), name='overview'),
]
