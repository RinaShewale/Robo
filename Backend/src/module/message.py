# src/module/message.py
from flask import Blueprint, request, jsonify
from src.database import get_conn

messages_bp = Blueprint("messages", __name__)

# ===== SAVE MESSAGE =====
@messages_bp.route("/save_message", methods=["POST"])
def save_message():
    data = request.get_json()
    user_id = data.get("userId")
    message_text = data.get("message")

    if not user_id or not message_text:
        return jsonify({"error": "User ID and message are required"}), 400

    conn = get_conn()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "INSERT INTO public.messages (user_id, message_text) VALUES (%s, %s) RETURNING id;",
                (user_id, message_text)
            )
            msg_id = cursor.fetchone()[0]
            conn.commit()
        return jsonify({"message": "Message saved", "id": msg_id}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()


# ===== GET MESSAGES =====
@messages_bp.route("/get_messages/<int:user_id>", methods=["GET"])
def get_messages(user_id):
    conn = get_conn()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT id, message_text, created_at FROM public.messages WHERE user_id=%s ORDER BY created_at ASC;",
                (user_id,)
            )
            rows = cursor.fetchall()
        messages = [{"id": r[0], "message": r[1], "created_at": str(r[2])} for r in rows]
        return jsonify(messages), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()


# ===== DELETE SINGLE MESSAGE =====
@messages_bp.route("/delete_message/<int:message_id>", methods=["DELETE"])
def delete_message(message_id):
    conn = get_conn()
    try:
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM public.messages WHERE id=%s RETURNING id;", (message_id,))
            deleted = cursor.fetchone()
            conn.commit()

        if deleted:
            return jsonify({"success": True, "id": message_id}), 200
        else:
            return jsonify({"success": False, "error": "Message not found"}), 404
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        conn.close()


# ===== DELETE ALL MESSAGES FOR USER =====
@messages_bp.route("/delete_all/<int:user_id>", methods=["DELETE"])
def delete_all_messages(user_id):
    conn = get_conn()
    try:
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM public.messages WHERE user_id=%s;", (user_id,))
            conn.commit()
        return jsonify({"success": True}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        conn.close()