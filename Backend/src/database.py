# src/database.py
from dotenv import load_dotenv
import os
import psycopg2

load_dotenv()

def get_conn():
    """Return a new connection to the PostgreSQL database"""
    return psycopg2.connect(
        host=os.environ["DB_HOST"],
        port=os.environ.get("DB_PORT", 5432),
        database=os.environ["DB_NAME"],
        user=os.environ["DB_USER"],
        password=os.environ["DB_PASSWORD"],
        sslmode="require"  # recommended for Render
    )