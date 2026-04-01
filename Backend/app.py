import os, sys
from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS

# Add src to path for modules
sys.path.append(os.path.join(os.path.dirname(__file__), "src"))

# ===== Import blueprints =====
from module.auth import auth_bp
from module.tts import tts_bp
from module.message import messages_bp

# ===== Database =====
from src.database import get_conn

# ===== Auto-create tables on startup =====
def init_db():
    try:
        conn = get_conn()
        with conn.cursor() as cursor:
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS public.users (
                id SERIAL PRIMARY KEY,
                username TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """)

            cursor.execute("""
            CREATE TABLE IF NOT EXISTS public.tts_logs (
                id SERIAL PRIMARY KEY,
                user_text TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """)

            conn.commit()
        print("[DB] Tables ensured ✅")
    except Exception as e:
        print("[DB] Error:", e)
    finally:
        conn.close()

init_db()

# ===== Flask app setup =====
app = Flask(
    __name__,
    static_folder=os.path.join(os.path.dirname(os.path.dirname(__file__)), "Frontend")
)

# ✅ Controlled CORS
CORS(app, resources={r"/*": {"origins": "*"}})

# ===== SECURITY HEADERS (VERY IMPORTANT 🔥) =====
@app.after_request
def add_security_headers(response):
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response

# ===== Register blueprints =====
app.register_blueprint(auth_bp, url_prefix="/auth")
app.register_blueprint(tts_bp, url_prefix="/tts")
app.register_blueprint(messages_bp, url_prefix="/messages")

# ===== Serve frontend SPA (FIXED ROUTE) =====
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_frontend(path):
    try:
        full_path = os.path.join(app.static_folder, path)
        if path and os.path.exists(full_path):
            return send_from_directory(app.static_folder, path)
        return send_from_directory(app.static_folder, "index.html")
    except Exception:
        return jsonify({"error": "Frontend load error"}), 500

# ===== Run Flask app =====
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    debug_mode = os.environ.get("FLASK_ENV", "development") == "development"
    app.run(debug=debug_mode, host="0.0.0.0", port=port)