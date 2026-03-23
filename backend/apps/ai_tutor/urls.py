from django.urls import path
from .views import AskQbitView, GenerateQuizView, GenerateFlashcardsView, GenerateStudyPlanView

urlpatterns = [
    path('ask/', AskQbitView.as_view(), name='ask-qbit'),
    path('generate-quiz/', GenerateQuizView.as_view(), name='generate-quiz-ai'),
    path('generate-flashcards/', GenerateFlashcardsView.as_view(), name='generate-flashcards-ai'),
    path('generate-plan/', GenerateStudyPlanView.as_view(), name='generate-study-plan-ai'),
]
