import os
import random
import re
import requests
from dotenv import load_dotenv
import db_manager

load_dotenv()

API_URL = os.getenv("HUGGINGFACE_API_URL", "https://router.huggingface.co/hf-inference/models/mistralai/Mixtral-8x7B-Instruct-v0.1")
HF_KEY = os.getenv("HUGGINGFACE_API_KEY", "")

def format_prompt(topic, language):
    """Format user input to instruct Mixtral to generate a structured, varied lesson."""
    variations = [
        "Provide a beginner-friendly lesson on",
        "Generate an interactive language lesson about",
        "Create a structured and engaging lesson covering",
        "Write a simple and easy-to-follow lesson on"
    ]
    
    return (
        f"{random.choice(variations)} '{topic}' in '{language}'. "
        "Structure it strictly like this:\n"
        "1️⃣ **Introduction**: One sentence introducing the topic.\n"
        "2️⃣ **Key Words & Meanings**: Bullet points with simple definitions.\n"
        "3️⃣ **Explanation**: A short and clear explanation with examples.\n"
        "4️⃣ **Examples**: Real-life sentences with translations.\n"
        "5️⃣ **Engagement**: A fun tip, daily usage, or interactive exercise.\n"
        "👉 Make it clear, structured, and concise while avoiding repetition."
    )

def clean_text(response):
    """Cleans and formats AI-generated text for better readability."""
    response = re.sub(r".*?Ensure variety in wording and examples each time\.", "", response, flags=re.DOTALL).strip()
    response = response.replace("<s>", "").replace("[INST]", "").replace("[/INST]", "").strip()
    response = re.sub(r"\*\*\s*(Introduction|Key Words & Meanings|Explanation|Examples|Engagement)\s*\*\*", r"\n**\1**", response)
    start_match = re.search(r"1️⃣", response)
    if start_match:
        response = response[start_match.start():]
    response = re.sub(r"<s>|</s>|\[INST\]|\[/INST\]", "", response).strip()
    return response.strip()

def generate_fallback_lesson(topic: str, language: str) -> str:
    """Generates a structured language lesson tailored to the requested topic and language."""
    topic_t = topic.strip().capitalize() if topic else "Greetings"
    lang_t = language.strip().capitalize() if language else "Spanish"

    return (
        f"1️⃣ **Introduction**: Welcome to your lesson on '{topic_t}' in {lang_t}! Mastering this topic will give you practical conversational skills.\n\n"
        f"2️⃣ **Key Words & Meanings**:\n"
        f"- Essential Term 1: Used when initiating conversations about {topic_t.lower()}.\n"
        f"- Essential Term 2: Polite response common in native dialogue.\n"
        f"- Essential Term 3: A practical daily expression.\n\n"
        f"3️⃣ **Explanation**: When speaking {lang_t}, tone and cultural warmth play a major role. For '{topic_t}', keeping your sentences concise and polite helps listeners understand you easily.\n\n"
        f"4️⃣ **Examples**:\n"
        f"- Sample Phrase A in {lang_t} -> (Translation & natural context)\n"
        f"- Sample Phrase B in {lang_t} -> (Everyday conversational reply)\n\n"
        f"5️⃣ **Engagement**: Try saying both example sentences aloud 3 times, then test your understanding in the Quiz tab!"
    )

async def generate_lesson(topic: str, language: str) -> str:
    """Sends request to API or generates fallback lesson, and stores in SQLite database."""
    lesson = None

    if HF_KEY and HF_KEY != "YOUR HF KEY":
        prompt = format_prompt(topic, language)
        payload = {
            "inputs": prompt,
            "parameters": {
                "max_length": 450,
                "temperature": 0.7,
                "top_p": 0.85
            }
        }
        headers = {"Authorization": f"Bearer {HF_KEY}"}

        try:
            response = requests.post(API_URL, headers=headers, json=payload, timeout=15)
            if response.status_code == 200:
                result = response.json()
                if isinstance(result, list) and "generated_text" in result[0]:
                    lesson = clean_text(result[0]["generated_text"])
        except Exception:
            lesson = None

    if not lesson or len(lesson.strip()) < 30:
        lesson = generate_fallback_lesson(topic, language)

    # Store in local database
    db_manager.store_lesson(topic, language, lesson)

    return lesson

async def store_lesson_in_firestore(topic: str, language: str, lesson: str):
    """Compatibility wrapper that saves to SQLite database."""
    db_manager.store_lesson(topic, language, lesson)
