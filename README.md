# TalkEase - AI-Powered Language Learning Companion

TalkEase is an interactive language tutor web application built with FastAPI, SQLite, and vanilla HTML/CSS/JS.

## Features

- 💬 **AI Language Practice Chatbot**: Practice conversations in Spanish, French, German, Japanese, Hindi, English, and more with session history.
- 📖 **Custom Lesson Generator**: Generate structured lessons (Introduction, Key Words, Explanations, Examples, Engagement exercises).
- ❓ **Interactive Quizzes**: Auto-generated multiple-choice and fill-in-the-blank quizzes based on recent lessons.
- 🏆 **Live Progress & Gamification Tracking**:
  - Real-time tracking of Chat Sessions, Lessons Completed, and Quizzes.
  - Active Daily Learning Streaks.
  - Milestone Badges (unlocked automatically as you learn).
  - Dynamic Leaderboard (your position climbs as you accumulate points).

## Getting Started

### 1. Run the FastAPI Server
From the project folder, start the backend server:

```powershell
python main.py
```
Or with uvicorn:
```powershell
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### 2. Open the App in Your Browser
Open your browser and navigate to:
```
http://127.0.0.1:8000/
```

### 3. Optional: Configure API Keys (.env)
TalkEase includes smart built-in multilingual responses and lesson templates that work **out-of-the-box offline**.

If you'd like to use live cloud AI models:
1. Open `.env` (or copy `.env.example` to `.env`).
2. Add your free Hugging Face API key:
   ```env
   HUGGINGFACE_API_KEY=hf_your_key_here
   ```
3. (Optional) If you want to sync with Google Cloud Firestore, specify:
   ```env
   FIREBASE_CREDENTIALS_PATH=path/to/your/firebase-adminsdk.json
   ```