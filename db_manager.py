import sqlite3
import os
from datetime import datetime, date, timedelta
from typing import Dict, Any, List, Optional

DB_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "talkease.db")

def get_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initializes SQLite database tables for chats, lessons, quizzes, and user activity."""
    with get_connection() as conn:
        cursor = conn.cursor()
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS chats (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT,
                user_input TEXT,
                ai_response TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS lessons (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                topic TEXT,
                language TEXT,
                lesson TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS quizzes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                topic TEXT,
                language TEXT,
                score INTEGER,
                total INTEGER,
                percentage REAL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_activity (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                activity_type TEXT,
                activity_date DATE DEFAULT (DATE('now'))
            )
        """)

        # Add initial starter data if completely empty so the user sees a welcoming initial state
        cursor.execute("SELECT COUNT(*) FROM chats")
        if cursor.fetchone()[0] == 0:
            cursor.execute("""
                INSERT INTO chats (session_id, user_input, ai_response) 
                VALUES ('initial_session', 'Hello', 'Hello! Welcome to TalkEase! I am ready to help you learn languages.')
            """)

        cursor.execute("SELECT COUNT(*) FROM lessons")
        if cursor.fetchone()[0] == 0:
            cursor.execute("""
                INSERT INTO lessons (topic, language, lesson) 
                VALUES ('Greetings', 'Spanish', '1️⃣ **Introduction**: Greetings are the first step in learning Spanish.\n2️⃣ **Key Words**: Hola (Hello), Buenos días (Good morning).\n3️⃣ **Explanation**: Use Hola in casual and formal settings.\n4️⃣ **Examples**: Hola, ¿cómo estás? (Hello, how are you?)\n5️⃣ **Engagement**: Practice saying Hola to a friend!')
            """)

        cursor.execute("SELECT COUNT(*) FROM user_activity")
        if cursor.fetchone()[0] == 0:
            cursor.execute("INSERT INTO user_activity (activity_type, activity_date) VALUES ('login', DATE('now'))")

        conn.commit()

def record_activity(activity_type: str):
    """Log an activity to compute user streaks."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO user_activity (activity_type, activity_date) VALUES (?, DATE('now'))",
            (activity_type,)
        )
        conn.commit()

def store_chat(session_id: str, user_input: str, ai_response: str):
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO chats (session_id, user_input, ai_response) VALUES (?, ?, ?)",
            (session_id, user_input, ai_response)
        )
        conn.commit()
    record_activity("chat")

def store_lesson(topic: str, language: str, lesson: str):
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO lessons (topic, language, lesson) VALUES (?, ?, ?)",
            (topic, language, lesson)
        )
        conn.commit()
    record_activity("lesson")

def get_latest_lesson() -> tuple[Optional[str], Optional[str]]:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT topic, language FROM lessons ORDER BY id DESC LIMIT 1")
        row = cursor.fetchone()
        if row:
            return row["topic"], row["language"]
        return "Greetings", "Spanish"

def record_quiz_result(topic: str, language: str, score: int, total: int):
    percentage = (score / total * 100.0) if total > 0 else 0.0
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO quizzes (topic, language, score, total, percentage) VALUES (?, ?, ?, ?, ?)",
            (topic, language, score, total, percentage)
        )
        conn.commit()
    record_activity("quiz")

def calculate_streak() -> int:
    """Calculates consecutive active days up to today or yesterday."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT DISTINCT activity_date FROM user_activity ORDER BY activity_date DESC")
        dates_raw = [r["activity_date"] for r in cursor.fetchall()]

    if not dates_raw:
        return 1

    active_dates = set()
    for d_str in dates_raw:
        try:
            active_dates.add(datetime.strptime(d_str, "%Y-%m-%d").date())
        except Exception:
            pass

    today = date.today()
    current_check = today if today in active_dates else today - timedelta(days=1)
    
    streak = 0
    while current_check in active_dates:
        streak += 1
        current_check -= timedelta(days=1)

    return max(streak, 1)

def get_progress_data() -> Dict[str, Any]:
    """Computes real-time progress metrics, unlocked badges, and dynamic leaderboard."""
    init_db()
    with get_connection() as conn:
        cursor = conn.cursor()
        
        # Chats count
        cursor.execute("SELECT COUNT(*) FROM chats")
        chat_count = cursor.fetchone()[0]
        
        # Unique chat sessions
        cursor.execute("SELECT COUNT(DISTINCT session_id) FROM chats")
        session_count = cursor.fetchone()[0]
        
        # Lessons count
        cursor.execute("SELECT COUNT(*) FROM lessons")
        lessons_count = cursor.fetchone()[0]
        
        # Quizzes count & average score
        cursor.execute("SELECT COUNT(*), AVG(percentage), MAX(percentage) FROM quizzes")
        quiz_row = cursor.fetchone()
        quizzes_count = quiz_row[0] or 0
        quiz_avg = round(quiz_row[1] or 0, 1)
        quiz_max = round(quiz_row[2] or 0, 1)

    streak = calculate_streak()
    
    # Calculate points: 15 pts per chat, 50 pts per lesson, 100 pts per quiz completed + score bonuses
    user_points = (chat_count * 15) + (lessons_count * 50) + (quizzes_count * 100) + int(quiz_avg * 2)

    # Badges evaluation
    badges = [
        {
            "id": "streak_3",
            "name": "3-Day Streak",
            "icon": "fa-fire",
            "active": streak >= 3,
            "description": "Maintain a 3-day study streak"
        },
        {
            "id": "chats_10",
            "name": "10 Chats",
            "icon": "fa-comment",
            "active": chat_count >= 10,
            "description": "Have 10 conversations with the AI tutor"
        },
        {
            "id": "lessons_5",
            "name": "5 Lessons",
            "icon": "fa-book-open",
            "active": lessons_count >= 5,
            "description": "Generate and complete 5 custom lessons"
        },
        {
            "id": "streak_7",
            "name": "7-Day Streak",
            "icon": "fa-fire-alt",
            "active": streak >= 7,
            "description": "Practice language for 7 consecutive days"
        },
        {
            "id": "chats_25",
            "name": "25 Chats",
            "icon": "fa-comments",
            "active": chat_count >= 25,
            "description": "Reach 25 conversational exchanges"
        },
        {
            "id": "lessons_10",
            "name": "10 Lessons",
            "icon": "fa-graduation-cap",
            "active": lessons_count >= 10,
            "description": "Complete 10 comprehensive lessons"
        },
        {
            "id": "quiz_ace",
            "name": "Quiz Ace",
            "icon": "fa-award",
            "active": quiz_max >= 100.0,
            "description": "Score 100% on any quiz"
        }
    ]

    # Dynamic Leaderboard: Insert user and rank dynamically based on points
    competitors = [
        {"name": "Sarah J.", "points": 950, "avatar": "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/user-avatar.jpg-ZLgxbA78cQsPQYH1AACzexODM64bHY.jpeg"},
        {"name": "Alex M.", "points": 780, "avatar": "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/user-avatar.jpg-ZLgxbA78cQsPQYH1AACzexODM64bHY.jpeg"},
        {"name": "Jamie T.", "points": 650, "avatar": "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/user-avatar.jpg-ZLgxbA78cQsPQYH1AACzexODM64bHY.jpeg"},
        {"name": "Taylor R.", "points": 600, "avatar": "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/user-avatar.jpg-ZLgxbA78cQsPQYH1AACzexODM64bHY.jpeg"},
    ]
    
    # Add the current user
    all_users = competitors + [{
        "name": "You",
        "points": user_points,
        "is_user": True,
        "avatar": "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/user-avatar.jpg-ZLgxbA78cQsPQYH1AACzexODM64bHY.jpeg"
    }]
    all_users.sort(key=lambda x: x["points"], reverse=True)

    leaderboard = []
    max_pts = max(all_users[0]["points"], 1000)
    for rank, entry in enumerate(all_users, 1):
        tier = "gold" if rank == 1 else "silver" if rank == 2 else "bronze" if rank == 3 else ""
        percentage = min(100, int((entry["points"] / max_pts) * 100))
        leaderboard.append({
            "rank": rank,
            "name": entry["name"],
            "points": entry["points"],
            "is_user": entry.get("is_user", False),
            "tier": tier,
            "progress_pct": percentage,
            "avatar": entry["avatar"]
        })

    return {
        "chat_sessions": max(session_count, 1),
        "chat_messages": chat_count,
        "lessons_completed": lessons_count,
        "quizzes_completed": quizzes_count,
        "streak_days": streak,
        "user_points": user_points,
        "badges": badges,
        "leaderboard": leaderboard
    }

# Initialize on import
init_db()
