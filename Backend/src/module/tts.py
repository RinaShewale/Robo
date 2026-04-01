# src/module/tts.py
import os
import json
import requests
from flask import Blueprint, request, jsonify
from src.database import get_conn

tts_bp = Blueprint("tts", __name__)

# ===== MISTRAL AI CLIENT =====
mistral_api_key = os.environ.get("MISTRAL_API_KEY")
if not mistral_api_key:
    print("[WARNING] MISTRAL_API_KEY not set in .env file")
else:
    print("[✓] Mistral API Key loaded successfully")

# ===== TTS PROMPT BUILDER =====
def build_prompt(user_input, mode="friendly", personality="podcast", emotion="neutral", action="improve"):
    """
    Build an advanced TTS prompt with customizable parameters.
    
    Args:
        user_input (str): The original text from user
        mode (str): formal, friendly, story, funny
        personality (str): podcast, teacher, robot, narrator
        emotion (str): happy, sad, angry, calm, excited
        action (str): improve, expand, summarize
    
    Returns:
        str: Formatted prompt for TTS processing
    """
    prompt_text = f"""
You are an advanced AI Text-to-Speech assistant.

Your job is to:
1. Improve and rewrite the given text
2. Apply the selected personality style
3. Inject the correct emotion
4. Make the text natural, expressive, and perfect for speaking aloud
5. Ensure proper pauses, punctuation, and rhythm for TTS output

-----------------------------------

USER INPUT:
"{user_input}"

-----------------------------------

INSTRUCTIONS:

🔹 Mode: {mode}
- formal → professional and polished
- friendly → casual and warm
- story → descriptive and engaging
- funny → humorous tone

🔹 Personality: {personality}
- podcast → like a podcast host (engaging, conversational)
- teacher → clear, explanatory, structured
- robot → precise, slightly mechanical but clean
- narrator → cinematic and storytelling

🔹 Emotion: {emotion}
- happy → energetic and positive
- sad → soft and slow
- angry → strong and intense
- calm → smooth and relaxed
- excited → high energy and expressive

🔹 Action: {action}
- improve → rewrite better
- expand → make it longer with more detail
- summarize → make it short and crisp

-----------------------------------

OUTPUT RULES:

- Do NOT explain anything
- ONLY return the final improved text
- Keep it natural and human-like
- Add commas and pauses for better speech
- Avoid robotic repetition
- Make it engaging for listeners
"""
    return prompt_text

# ===== ENHANCE TEXT WITH MISTRAL AI =====
def enhance_text_with_mistral(user_input, mode="friendly", personality="podcast", emotion="neutral", action="improve"):
    """
    Use Mistral AI API to enhance and transform text for TTS
    
    Args:
        user_input (str): Original text
        mode, personality, emotion, action: Enhancement parameters
    
    Returns:
        str: Enhanced text from Mistral AI
    """
    if not mistral_api_key:
        return f"[ERROR] Mistral API key not configured. Enhanced text: {user_input}"
    
    try:
        prompt = build_prompt(user_input, mode, personality, emotion, action)
        
        # Call Mistral AI via HTTP
        headers = {
            "Authorization": f"Bearer {mistral_api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "mistral-small-latest",
            "messages": [
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.7,
            "max_tokens": 1000
        }
        
        response = requests.post(
            "https://api.mistral.ai/v1/chat/completions",
            headers=headers,
            json=payload,
            timeout=30
        )
        
        if response.status_code != 200:
            return f"[API Error] Status {response.status_code}: {response.text}"
        
        # Extract enhanced text from response
        data = response.json()
        enhanced_text = data["choices"][0]["message"]["content"].strip()
        return enhanced_text
        
    except requests.exceptions.Timeout:
        return "[ERROR] Mistral API request timed out"
    except Exception as e:
        print(f"[ERROR] Mistral API Error: {str(e)}")
        return f"Enhancement failed: {str(e)}"

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
        return jsonify({"message": "Text saved successfully", "id": saved_id}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

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

@tts_bp.route("/build_prompt", methods=["POST"])
def get_build_prompt():
    """
    Enhance text using Mistral AI with customized parameters.
    
    Expected JSON:
    {
        "text": "user text here",
        "mode": "friendly",
        "personality": "podcast",
        "emotion": "excited",
        "action": "improve"
    }
    
    Returns enhanced text from Mistral AI
    """
    data = request.get_json()
    user_text = data.get("text")
    mode = data.get("mode", "friendly")
    personality = data.get("personality", "podcast")
    emotion = data.get("emotion", "neutral")
    action = data.get("action", "improve")
    
    if not user_text:
        return jsonify({"error": "No text provided"}), 400
    
    try:
        # Call Mistral AI to enhance the text
        enhanced_text = enhance_text_with_mistral(user_text, mode, personality, emotion, action)
        
        return jsonify({
            "success": True,
            "prompt": enhanced_text,  # Returns enhanced text, not template
            "parameters": {
                "text": user_text,
                "mode": mode,
                "personality": personality,
                "emotion": emotion,
                "action": action
            }
        }), 200
    except Exception as e:
        print(f"[ERROR] Build prompt error: {str(e)}")
        return jsonify({"error": str(e)}), 500