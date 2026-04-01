# src/module/tts.py
from flask import Blueprint, request, jsonify
from src.database import get_conn

tts_bp = Blueprint("tts", __name__)

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