import os
import requests
from dotenv import load_dotenv
import db_manager

load_dotenv()

API_URL = os.getenv("HUGGINGFACE_API_URL", "https://router.huggingface.co/hf-inference/models/mistralai/Mixtral-8x7B-Instruct-v0.1")
HF_KEY = os.getenv("HUGGINGFACE_API_KEY", "")

chat_sessions = {}

def get_simulated_tutor_reply(prompt: str) -> str:
    """Provides a natural multilingual language tutor response when offline or key is missing."""
    p_lower = prompt.lower().strip()
    
    if "how many languages" in p_lower or "what languages" in p_lower:
        return "I speak and teach English, Spanish, French, German, Italian, Japanese, Korean, Mandarin Chinese, Hindi, Russian, and Arabic! Which one would you like to practice today?"
    
    if any(greet in p_lower for greet in ["hello", "hi", "hey"]):
        return "¡Hola! Bonjour! Hello! I'm TalkEase, your personal language tutor. What topic or language would you like to explore today?"
        
    if "spanish" in p_lower:
        if "thank" in p_lower:
            return "In Spanish, 'Thank you' is 'Gracias', and you can reply with 'De nada' (You're welcome)!"
        return "¡Excelente! Spanish is a wonderful language. Let's start with a phrase: '¿Cómo estás?' means 'How are you?'. Try replying with 'Estoy bien' (I'm well)!"

    if "french" in p_lower:
        return "Très bien! French is known as the language of diplomacy and romance. Try saying: 'Enchanté(e)' which means 'Pleased to meet you'."

    if "german" in p_lower:
        return "Wunderbar! German has rich compound words. A good greeting to know is 'Guten Tag' (Good day) or 'Wie geht es dir?' (How are you?)."

    if "how are you" in p_lower:
        return "I'm doing fantastic and excited to help you learn! How is your language practice going today?"

    if "help" in p_lower:
        return "You can ask me to translate phrases, explain grammar, teach you greetings, or prepare lessons and quizzes for you!"

    return f"Great question about '{prompt}'! In language learning, practicing consistent dialogue is the key to fluency. Would you like me to translate this or generate a custom lesson?"

async def chat(prompt: str, session_id: str = "default_session") -> str:
    if session_id not in chat_sessions:
        chat_sessions[session_id] = []
        
    chat_sessions[session_id].append(f"User: {prompt}")
    conversation_history = "\n".join(chat_sessions[session_id][-5:])
    
    bot_response = None
    
    # Try Hugging Face API if key is provided and not placeholder
    if HF_KEY and HF_KEY != "YOUR HF KEY":
        formatted_prompt = (
            f"You are TalkEase, a friendly language tutor who speaks and teaches multiple languages fluently. "
            f"When teaching, switch to the target language and give short, friendly examples. "
            f"Respond concisely and stay on topic: \n{conversation_history} [/INST]"
        )
        payload = {
            "inputs": formatted_prompt,
            "parameters": {"max_length": 100, "temperature": 0.7, "top_p": 0.8}
        }
        headers = {"Authorization": f"Bearer {HF_KEY}"}
        
        try:
            response = requests.post(API_URL, headers=headers, json=payload, timeout=12)
            if response.status_code == 200:
                result = response.json()
                raw_text = result[0]["generated_text"] if isinstance(result, list) else ""
                if prompt in raw_text:
                    raw_text = raw_text.split(prompt, 1)[-1].strip()
                bot_response = raw_text.strip().split("\n")[-1]
                bot_response = bot_response.replace("[INST]", "").replace("[/INST]", "").replace("User:", "").replace("Bot:", "").strip()
        except Exception:
            bot_response = None

    # Fallback to smart simulated reply
    if not bot_response:
        bot_response = get_simulated_tutor_reply(prompt)

    chat_sessions[session_id].append(f"Bot: {bot_response}")
    
    # Store message in DB to increment user chat metrics
    db_manager.store_chat(session_id, prompt, bot_response)

    return bot_response
