import os
from fastapi import FastAPI, WebSocket, HTTPException, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from dotenv import load_dotenv

import db_manager
from ChatBot import chat, chat_sessions
from Lesson_Generator import generate_lesson
from Quiz import generate_quiz

load_dotenv()

app = FastAPI(title="TalkEase API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Optional Firebase integration if environment variable points to a valid file
FIREBASE_PATH = os.getenv("FIREBASE_CREDENTIALS_PATH", "")
if FIREBASE_PATH and os.path.exists(FIREBASE_PATH):
    try:
        import firebase_admin
        from firebase_admin import credentials
        cred = credentials.Certificate(FIREBASE_PATH)
        firebase_admin.initialize_app(cred)
        print(f"Firebase initialized successfully with {FIREBASE_PATH}")
    except Exception as e:
        print(f"Firebase initialization skipped: {e}")

class LessonRequest(BaseModel):
    topic: str
    language: str

class QuizResultRequest(BaseModel):
    topic: str
    language: str
    score: int
    total: int

# Mount static folder
STATIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")
if os.path.exists(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

@app.get("/")
def serve_index():
    index_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return {"message": "Welcome to TalkEase API!"}

@app.get("/quiz")
def serve_quiz_page():
    quiz_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "quiz.html")
    if os.path.exists(quiz_file):
        return FileResponse(quiz_file)
    return FileResponse(os.path.join(os.path.dirname(os.path.abspath(__file__)), "index.html"))

@app.get("/chat/")
async def get_chat(prompt: str):
    response = await chat(prompt)
    return {"response": response}

@app.websocket("/ws/chat")
async def websocket_chat(websocket: WebSocket):
    await websocket.accept()
    session_id = str(id(websocket))
    chat_sessions[session_id] = []
    try:
        while True:
            prompt = await websocket.receive_text()
            response = await chat(prompt, session_id)
            await websocket.send_text(response)
    except WebSocketDisconnect:
        pass

@app.post("/generate_lesson/")
async def generator(request: LessonRequest):
    """API Endpoint to generate and store a lesson."""
    lesson = await generate_lesson(request.topic, request.language)
    if not lesson:
        raise HTTPException(status_code=500, detail="Failed to generate lesson")
    return {"topic": request.topic, "language": request.language, "lesson": lesson}

@app.get("/generate_quiz/")
async def quiz_endpoint():
    """Auto-fetch latest lesson topic and generate quiz formatted for quiz.js."""
    quiz = await generate_quiz()
    if "error" in quiz:
        raise HTTPException(status_code=500, detail=quiz["error"])
    return quiz

@app.get("/api/progress/")
def get_progress():
    """Endpoint returning live learning stats, streak, unlocked badges, and leaderboard."""
    return db_manager.get_progress_data()

@app.post("/api/progress/quiz_complete")
def record_quiz(result: QuizResultRequest):
    """Records a completed quiz and returns updated progress stats."""
    db_manager.record_quiz_result(result.topic, result.language, result.score, result.total)
    return db_manager.get_progress_data()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
