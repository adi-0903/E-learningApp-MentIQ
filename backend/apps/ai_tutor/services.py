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

    def get_chat_response(self, query, context="", image=None, role='student', cognitive_state=None):
        """
        Generates a response from Qbit via Groq. Personality is role-dependent.
        
        Now enhanced with cognitive_state parameter for emotion-aware responses.
        When cognitive_state is provided, the system prompt is dynamically adjusted
        based on the student's detected emotional state.
        """
        if role == 'teacher':
            system_instruction = """
You are Qbit, the expert Teaching Assistant and Curriculum Consultant for the MentIQ platform.
Your Mission: Support instructors in delivering high-quality education. Help them design lessons, create assessments, draft communications, and manage teaching workloads.

Personality:
- Name: Qbit
- Role: Teaching Assistant / Co-Instructor
- Tone: Professional, Efficient, Insightful, and Collaborative.
- Style: Use Markdown. Provide structured lesson plans and strategies when asked.
"""
            user_text = f"Teacher Context:\n{context}\n\nInstructor Inquiry: {query or 'How can I improve my curriculum today?'}"
        else:
            system_instruction = """
You are Qbit, the intelligent AI Tutor for the MentIQ e-learning platform.
Your Mission: Empower students to master subjects and act as a personal learning coach.

Personality:
- Name: Qbit
- Role: Student Mentor / AI Tutor
- Tone: Friendly, Patient, Encouraging, and slightly Witty.
- Style: Use Markdown. Break down complex concepts into simple terms.
- Boundaries: You are a general-purpose AI assistant. While you have context about their courses, you can freely answer ANY type of question, whether it's related to general knowledge, coding, life advice, career guidance, or casual conversation.
"""
            # ─── Cognitive AI Adaptation ─────────────────────────
            if cognitive_state:
                system_instruction += self._build_cognitive_instructions(cognitive_state)

            user_text = f"Learning Context:\n{context}\n\nStudent Question: {query or 'Please help me study.'}"

        # Note: Groq currently doesn't support vision/image input
        if image:
            user_text += "\n\n(An image was attached, but I cannot view images currently. Please describe it if you need help with it.)"

        messages = [
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": user_text}
        ]

        return self._call_ai(messages)

    def _build_cognitive_instructions(self, cognitive_state):
        """
        Build additional system prompt instructions based on the student's
        cognitive/emotional state. This enables invisible, adaptive tutoring.
        """
        frustration = cognitive_state.get('frustration_score', 0)
        engagement = cognitive_state.get('engagement_score', 0.5)
        confidence = cognitive_state.get('confidence_score', 0.5)
        mood = cognitive_state.get('current_mood', 'neutral')
        load = cognitive_state.get('cognitive_load', 'medium')

        instructions = "\n\n--- COGNITIVE ADAPTATION (Internal — do NOT mention to the student) ---\n"
        instructions += f"Student's current detected state: Mood={mood}, Frustration={frustration:.1f}, Engagement={engagement:.1f}, Confidence={confidence:.1f}, Cognitive Load={load}\n"

        # High frustration — be extra supportive
        if frustration > 0.7:
            instructions += """
CRITICAL ADAPTATION: Student is highly frustrated.
- Use an extra warm, encouraging, and patient tone
- Break your explanation into very small, digestible steps
- Start with what they already know and build from there
- Use analogies and real-world examples
- Offer alternative explanations if the first doesn't click
- Add brief encouragements like "You're on the right track" or "This is a tricky one, let's work through it together"
- Keep paragraphs SHORT (2-3 sentences max)
"""
        elif frustration > 0.4:
            instructions += """
ADAPTATION: Student shows moderate frustration.
- Be extra patient and clear in explanations
- Use more examples than usual
- Break complex ideas into numbered steps
- Add encouraging phrases naturally
"""

        # Low engagement — make it interesting
        if engagement < 0.3:
            instructions += """
ADAPTATION: Student engagement is low.
- Make your response more dynamic and interesting
- Use emoji sparingly to add visual interest
- Include a fun fact or surprising connection
- Ask engaging follow-up questions
- Keep responses concise — don't overwhelm
"""

        # High confidence — challenge them
        if confidence > 0.8 and engagement > 0.5:
            instructions += """
ADAPTATION: Student is confident and engaged.
- You can use more advanced terminology
- Challenge them with deeper questions
- Connect concepts to broader themes
- Suggest related advanced topics they might enjoy
- Be more concise — they can handle dense information
"""

        # Cognitive overload
        if load == 'overloaded':
            instructions += """
CRITICAL ADAPTATION: Student is cognitively overloaded.
- Give the SIMPLEST possible explanation first
- Use bullet points, not paragraphs
- Cover only ONE concept at a time
- Suggest they take a break if the question is complex
- Use "First... Then... Finally..." structure
"""

        # Bored
        if mood == 'bored':
            instructions += """
ADAPTATION: Student appears bored.
- Make the topic exciting with real-world applications
- Use storytelling or narratives when possible
- Include interesting "Did you know?" facts
- Keep response energetic and dynamic
"""

        instructions += "--- END COGNITIVE ADAPTATION ---\n"
        return instructions

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
