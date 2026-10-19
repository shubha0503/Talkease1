import os
import json
import httpx
from dotenv import load_dotenv
import db_manager

load_dotenv()

API_URL = os.getenv("HUGGINGFACE_API_URL", "https://router.huggingface.co/hf-inference/models/mistralai/Mixtral-8x7B-Instruct-v0.1")
HF_KEY = os.getenv("HUGGINGFACE_API_KEY", "")

async def fetch_latest_lesson():
    """Fetch the latest lesson topic and language from local DB."""
    return db_manager.get_latest_lesson()

def generate_fallback_quiz(topic: str, language: str) -> dict:
    """Provides a tailored, high-quality quiz structure matching the frontend quiz.js format."""
    topic_clean = topic.strip().capitalize() if topic else "Greetings"
    lang_clean = language.strip().capitalize() if language else "Spanish"

    # Spanish-tailored questions if Spanish, else generic language learning templates
    if "spanish" in lang_clean.lower():
        questions = [
            {
                "type": "multiple_choice",
                "question": f"How do you say 'Hello' in {lang_clean}?",
                "options": ["Hola", "Adiós", "Gracias", "Por favor"],
                "correct_answer": "Hola"
            },
            {
                "type": "multiple_choice",
                "question": f"What is the {lang_clean} phrase for 'Good morning' related to {topic_clean}?",
                "options": ["Buenos días", "Buenas noches", "Hasta luego", "Mucho gusto"],
                "correct_answer": "Buenos días"
            },
            {
                "type": "text_input",
                "question": f"Translate 'Thank you' to {lang_clean}:",
                "correct_answer": "gracias"
            },
            {
                "type": "multiple_choice",
                "question": f"How do you ask 'How are you?' in {lang_clean}?",
                "options": ["¿Cómo estás?", "¿Dónde está?", "¿Qué hora es?", "¿Quién eres?"],
                "correct_answer": "¿Cómo estás?"
            },
            {
                "type": "text_input",
                "question": f"Type the word for 'Goodbye' in {lang_clean}:",
                "correct_answer": "adiós"
            }
        ]
    elif "french" in lang_clean.lower():
        questions = [
            {
                "type": "multiple_choice",
                "question": f"How do you say 'Hello' in {lang_clean}?",
                "options": ["Bonjour", "Au revoir", "Merci", "S'il vous plaît"],
                "correct_answer": "Bonjour"
            },
            {
                "type": "multiple_choice",
                "question": f"Which phrase means 'How are you?' in {lang_clean}?",
                "options": ["Comment ça va ?", "Bonsoir", "Où est la gare ?", "De rien"],
                "correct_answer": "Comment ça va ?"
            },
            {
                "type": "text_input",
                "question": f"Translate 'Thank you' to {lang_clean}:",
                "correct_answer": "merci"
            },
            {
                "type": "multiple_choice",
                "question": f"What is the {lang_clean} word for 'Goodbye'?",
                "options": ["Au revoir", "Bonjour", "Bienvenue", "Enchanté"],
                "correct_answer": "Au revoir"
            },
            {
                "type": "text_input",
                "question": f"Type the {lang_clean} word for 'Yes':",
                "correct_answer": "oui"
            }
        ]
    else:
        questions = [
            {
                "type": "multiple_choice",
                "question": f"When practicing '{topic_clean}' in {lang_clean}, what is the best opening greeting?",
                "options": ["Formal greeting", "Slang expression", "Silence", "A random number"],
                "correct_answer": "Formal greeting"
            },
            {
                "type": "multiple_choice",
                "question": f"In {lang_clean}, context and politeness are key when discussing '{topic_clean}'.",
                "options": ["True", "False"],
                "correct_answer": "True"
            },
            {
                "type": "text_input",
                "question": f"What is the universal word for 'OK' often recognized in {lang_clean}?",
                "correct_answer": "ok"
            },
            {
                "type": "multiple_choice",
                "question": f"Which skill is most helpful to remember new {lang_clean} vocabulary for '{topic_clean}'?",
                "options": ["Daily repetition", "Never speaking", "Skipping lessons", "Translating once"],
                "correct_answer": "Daily repetition"
            }
        ]

    return {
        "topic": topic_clean,
        "language": lang_clean,
        "questions": questions
    }

async def generate_quiz() -> dict:
    """Generate a quiz based on the latest learned lesson."""
    lesson_topic, lesson_language = await fetch_latest_lesson()
    
    if not lesson_topic or not lesson_language:
        lesson_topic, lesson_language = "Greetings", "Spanish"

    # If Hugging Face API key is configured and valid
    if HF_KEY and HF_KEY != "YOUR HF KEY":
        prompt = f"""
        Create a language quiz for the topic: "{lesson_topic}" in "{lesson_language}".
        Generate exactly 4 questions in strictly valid JSON format matching this schema:
        {{
            "topic": "{lesson_topic}",
            "language": "{lesson_language}",
            "questions": [
                {{
                    "type": "multiple_choice",
                    "question": "Question text here?",
                    "options": ["Option A", "Option B", "Option C", "Option D"],
                    "correct_answer": "Option A"
                }},
                {{
                    "type": "text_input",
                    "question": "Question text here?",
                    "correct_answer": "answer"
                }}
            ]
        }}
        Output only JSON, with no markdown code blocks or preamble.
        """

        headers = {"Authorization": f"Bearer {HF_KEY}"}
        async with httpx.AsyncClient(timeout=15) as client:
            try:
                response = await client.post(
                    API_URL,
                    json={"inputs": prompt, "parameters": {"max_length": 500, "temperature": 0.5}},
                    headers=headers
                )
                if response.status_code == 200:
                    res_json = response.json()
                    text = res_json[0]["generated_text"] if isinstance(res_json, list) else str(res_json)
                    # Extract json block if present
                    start = text.find("{")
                    end = text.rfind("}") + 1
                    if start != -1 and end != -1:
                        parsed = json.loads(text[start:end])
                        if "questions" in parsed and len(parsed["questions"]) > 0:
                            parsed["topic"] = lesson_topic
                            parsed["language"] = lesson_language
                            return parsed
            except Exception:
                pass  # Fallback smoothly to template quiz

    return generate_fallback_quiz(lesson_topic, lesson_language)
