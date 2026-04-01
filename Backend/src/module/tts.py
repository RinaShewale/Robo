# src/module/tts.py

import os
from flask import Blueprint, request, jsonify
from src.database import get_conn

# 🔥 LangChain + Gemini
from langchain_google_genai import ChatGoogleGenerativeAI

tts_bp = Blueprint("tts", __name__)

# ===== GEMINI CONFIG =====
GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY")

if not GOOGLE_API_KEY:
    print("[WARNING] GOOGLE_API_KEY not set")
else:
    print("[✓] Gemini API Key Loaded")

# Initialize Gemini
llm = ChatGoogleGenerativeAI(
    model="gemini-1.5-flash",
    google_api_key=GOOGLE_API_KEY,
    temperature=0.7
)

# ===== PROMPT BUILDER =====
def build_prompt(user_input, mode="friendly", personality="podcast", emotion="neutral", action="improve"):
    return f"""
You are an advanced AI Text-to-Speech assistant.

Your job is to:
1. Improve and rewrite the given text
2. Apply personality style
3. Add emotion
4. Make it perfect for speaking aloud

-----------------------------------

USER INPUT:
"{user_input}"

-----------------------------------

Mode: {mode}
Personality: {personality}
Emotion: {emotion}
Action: {action}

-----------------------------------

Rules:
- ONLY return improved text
- No explanation
- Add natural pauses (commas)
- Make it human-like
"""

# ===== GEMINI ENHANCE =====
def enhance_text(user_input, mode, personality, emotion, action):
    if not GOOGLE_API_KEY:
        return user_input  # fallback

    try:
        prompt = build_prompt(user_input, mode, personality, emotion, action)
        response = llm.invoke(prompt)
        return response.content.strip()

    except Exception as e:
        print("[ERROR Gemini]:", str(e))
        return user_input  # fallback


# ===== SAVE TEXT =====
@tts_bp.route("/save_text", methods=["POST"])
def save_text():
    data = request.get_json()
    user_text = data.get("text")

    if not user_text:
        return jsonify({"error": "No text provided"}), 400

    conn = get_conn()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "INSERT INTO public.tts_logs (user_text) VALUES (%s) RETURNING id;",
                (user_text,)
            )
            saved_id = cursor.fetchone()[0]
            conn.commit()

        return jsonify({"message": "Saved", "id": saved_id}), 201

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500

    finally:
        conn.close()


# ===== GET TEXTS =====
@tts_bp.route("/get_texts", methods=["GET"])
def get_texts():
    conn = get_conn()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT id, user_text, created_at FROM public.tts_logs ORDER BY id DESC;"
            )
            rows = cursor.fetchall()

        texts = [{"id": r[0], "text": r[1], "created_at": str(r[2])} for r in rows]
        return jsonify(texts), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        conn.close()


# ===== AI ENHANCE API =====
@tts_bp.route("/enhance", methods=["POST"])
def enhance_api():
    data = request.get_json()

    user_text = data.get("text")
    mode = data.get("mode", "friendly")
    personality = data.get("personality", "podcast")
    emotion = data.get("emotion", "neutral")
    action = data.get("action", "improve")

    if not user_text:
        return jsonify({"error": "No text provided"}), 400

    enhanced = enhance_text(user_text, mode, personality, emotion, action)

    return jsonify({
        "success": True,
        "original": user_text,
        "enhanced": enhanced,
        "settings": {
            "mode": mode,
            "personality": personality,
            "emotion": emotion,
            "action": action
        }
    }), 200