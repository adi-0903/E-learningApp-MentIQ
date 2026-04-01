from django.urls import path
from .views import (
    AskQbitView,
    GenerateQuizView,
    GenerateFlashcardsView,
    GenerateStudyPlanView,
    RecordInteractionView,
    GetCognitiveStateView,
    CognitiveHistoryView,
)

urlpatterns = [
    # Existing AI tutor endpoints
    path('ask/', AskQbitView.as_view(), name='ask-qbit'),
    path('generate-quiz/', GenerateQuizView.as_view(), name='generate-quiz-ai'),
    path('generate-flashcards/', GenerateFlashcardsView.as_view(), name='generate-flashcards-ai'),
    path('generate-plan/', GenerateStudyPlanView.as_view(), name='generate-study-plan-ai'),

    # Cognitive AI Companion endpoints
    path('interactions/', RecordInteractionView.as_view(), name='record-interactions'),
    path('cognitive-state/', GetCognitiveStateView.as_view(), name='get-cognitive-state'),
    path('cognitive-state/history/', CognitiveHistoryView.as_view(), name='cognitive-history'),
]
