import os
import json
import base64
import io
import httpx
from PIL import Image

# Groq free models (fast, reliable, always available)
GROQ_MODELS = [
    "llama-3.1-8b-instant",
    "gemma2-9b-it",
    "llama-3.3-70b-versatile",
]


class QbitService:
    def __init__(self):
        self.api_key = os.environ.get("GROQ_API_KEY")
        self.base_url = "https://api.groq.com/openai/v1/chat/completions"
        self.models = GROQ_MODELS

    def _call_ai(self, messages, max_tokens=2048):
        """
        Calls Groq API with automatic model fallback.
        Uses httpx to bypass network SSL issues.
        """
        if not self.api_key or "your_" in self.api_key:
            return "My neural link is currently offline. Please configure a valid GROQ_API_KEY in the backend .env file."

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        last_error = "All models failed."

        try:
            with httpx.Client(verify=False, timeout=30) as client:
                for model in self.models:
                    payload = {
                        "model": model,
                        "messages": messages,
                        "temperature": 0.7,
                        "max_tokens": max_tokens,
                    }

                    try:
                        response = client.post(
                            self.base_url,
                            headers=headers,
                            json=payload,
                        )

                        if response.status_code == 200:
                            data = response.json()
                            content = data.get('choices', [{}])[0].get('message', {}).get('content', '')
                            if content:
                                return content
                            last_error = f"Model {model} returned empty response."
                            continue

                        if response.status_code == 429:
                            last_error = f"Model {model}: Rate limited"
                            continue

                        last_error = f"Model {model}: HTTP {response.status_code}"
                        continue

                    except httpx.TimeoutException:
                        last_error = f"Model {model} timed out."
                        continue
                    except Exception as e:
                        last_error = str(e)
                        continue
        except Exception as e:
            last_error = str(e)

        return f"QBit is temporarily overloaded. Please try again in a moment. (Debug: {last_error})"

    def get_chat_response(self, query, context="", image=None):
        """
        Generates a response from Qbit via Groq. Text-only (Groq doesn't support image input yet).
        """
        system_instruction = """
You are Qbit, the intelligent AI Study Companion for the MentIQ e-learning platform.
Your Mission: Empower students to master their subjects through clear explanations, encouraging feedback, and "out-of-the-box" thinking.

Personality:
- Name: Qbit
- Tone: Friendly, Professional, Encouraging, and slightly Witty.
- Style: Use Markdown for clarity (bold key terms, use bullet points).
- Boundaries: Only answer educational/study-related questions. If asked about non-educational topics, politely steer back to learning.

Context provided below is the specific lesson, course material, or student profile. Use it to ground your answer.
"""
        user_text = f"Context Info:\n{context}\n\nStudent Question: {query or 'Please help me study.'}"

        # Note: Groq currently doesn't support vision/image input
        # If image is provided, mention it in the text
        if image:
            user_text += "\n\n(The student also attached an image, but I cannot view images currently. Please ask them to describe what's in the image.)"

        messages = [
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": user_text}
        ]

        return self._call_ai(messages)

    def generate_quiz(self, content, num_questions=5):
        prompt = f"""
Generate {num_questions} multiple-choice quiz questions based on the following content.
Return ONLY a raw JSON array of objects. Do not include markdown formatting (like ```json).

Format:
[
    {{
        "question": "Question text here?",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correct_answer": "The exact text of the correct option",
        "explanation": "Brief explanation"
    }}
]

Content:
{content[:8000]}
"""
        messages = [{"role": "user", "content": prompt}]
        res = self._call_ai(messages)
        if res:
            return res.replace("```json", "").replace("```", "").strip()
        return "[]"

    def generate_flashcards(self, topic, num_cards=10):
        prompt = f"""
Create {num_cards} study flashcards for the topic: "{topic}".
Return ONLY a raw JSON array of objects. No markdown.

Format:
[
    {{
        "front": "Term or Question",
        "back": "Definition or Answer"
    }}
]
"""
        messages = [{"role": "user", "content": prompt}]
        res = self._call_ai(messages)
        if res:
            return res.replace("```json", "").replace("```", "").strip()
        return "[]"

    def generate_study_plan(self, courses, exam_date, availability_hours_per_day):
        from datetime import datetime, date
        
        # Calculate days remaining
        try:
            exam = datetime.strptime(exam_date, "%Y-%m-%d").date()
            today = date.today()
            days_left = (exam - today).days
            if days_left < 1:
                days_left = 14  # fallback
        except:
            days_left = 14
        
        subject_list = ", ".join(courses)
        
        prompt = f"""You are an expert academic planner. Create a DETAILED, day-by-day study plan.

**Subject(s):** {subject_list}
**Exam Date:** {exam_date}
**Days Remaining:** {days_left} days (starting from today)
**Daily Study Hours:** {availability_hours_per_day} hours

## REQUIREMENTS — Follow these strictly:

1. **Day-by-Day Breakdown**: Create a plan for EACH day from Day 1 to Day {days_left}. Group into weeks if more than 14 days.
2. **Time Slots**: For each day, break the {availability_hours_per_day} hours into specific time blocks (e.g., "Hour 1: ...", "Hour 2: ...").
3. **Specific Topics**: Don't just say "Study Unit 1". List the EXACT subtopics, chapters, or concepts to cover in each slot.
4. **Revision Days**: Dedicate the last 20% of days to revision and practice tests.
5. **Weekly Goals**: Summarize what should be completed by end of each week.
6. **Difficulty Progression**: Start with fundamentals, then move to complex topics.
7. **Active Learning**: Include practice problems, self-quizzes, and concept mapping — not just reading.
8. **Breaks**: Include short breaks between sessions.

## OUTPUT FORMAT (Markdown):

# 📚 Study Plan: [Subject]
**Exam:** [date] | **Days Left:** {days_left} | **Daily Hours:** {availability_hours_per_day}h

---

## Week 1: Foundation & Core Concepts

### 📅 Day 1 — [Date]
| Time | Activity | Details |
|------|----------|---------|
| Hour 1 | Topic A | Specific subtopics, chapters |
| Hour 2 | Practice | Problems/exercises |
| Break | 10 min | Rest |

... continue for each day ...

## 🔁 Revision Phase (Last few days)
### Day X — Full Revision
- Review weak areas
- Practice test
- Formula/concept sheet review

---
**💡 Tips:** [2-3 study tips specific to this subject]

Now generate the complete plan. Be thorough and specific."""
        messages = [{"role": "user", "content": prompt}]
        return self._call_ai(messages, max_tokens=4096)
