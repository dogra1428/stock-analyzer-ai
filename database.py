import os
import sqlite3
import hashlib
import hmac
import base64
import json
import time
from typing import Optional, List, Dict, Any

DB_FILE = "apextrade.db"
JWT_SECRET = os.environ.get("JWT_SECRET", "apextrade-super-secret-key-1298471203")

# ==========================================
# Cryptography & Password Hashing
# ==========================================

def hash_password(password: str) -> str:
    """Hash password using PBKDF2-HMAC-SHA256."""
    salt = os.urandom(16)
    iterations = 100000
    derived_key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iterations)
    return f"{iterations}${salt.hex()}${derived_key.hex()}"

def verify_password(password: str, stored_hash: str) -> bool:
    """Verify standard PBKDF2-HMAC-SHA256 password hash."""
    try:
        iterations_str, salt_hex, key_hex = stored_hash.split("$")
        iterations = int(iterations_str)
        salt = bytes.fromhex(salt_hex)
        key = bytes.fromhex(key_hex)
        
        test_key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iterations)
        return hmac.compare_digest(key, test_key)
    except Exception:
        return False

# ==========================================
# JSON Web Token (JWT) Helper
# ==========================================

def base64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b'=').decode('utf-8')

def base64url_decode(data: str) -> bytes:
    padding = '=' * (4 - (len(data) % 4))
    return base64.urlsafe_b64decode(data + padding)

def create_jwt(payload: dict) -> str:
    """Generate a JWT token string using standard HS256 algorithm."""
    header = {"alg": "HS256", "typ": "JWT"}
    header_b64 = base64url_encode(json.dumps(header).encode("utf-8"))
    
    # Set standard expiration (e.g. 7 days)
    if "exp" not in payload:
        payload["exp"] = int(time.time()) + (7 * 24 * 60 * 60)
        
    payload_b64 = base64url_encode(json.dumps(payload).encode("utf-8"))
    
    signing_input = f"{header_b64}.{payload_b64}".encode("utf-8")
    signature = hmac.new(JWT_SECRET.encode("utf-8"), signing_input, hashlib.sha256).digest()
    signature_b64 = base64url_encode(signature)
    
    return f"{header_b64}.{payload_b64}.{signature_b64}"

def verify_jwt(token: str) -> Optional[dict]:
    """Verify the signature and expiration of a JWT token, return its payload."""
    try:
        parts = token.split('.')
        if len(parts) != 3:
            return None
            
        header_b64, payload_b64, signature_b64 = parts
        signing_input = f"{header_b64}.{payload_b64}".encode("utf-8")
        
        expected_signature = hmac.new(JWT_SECRET.encode("utf-8"), signing_input, hashlib.sha256).digest()
        expected_signature_b64 = base64url_encode(expected_signature)
        
        if not hmac.compare_digest(signature_b64, expected_signature_b64):
            return None
            
        payload = json.loads(base64url_decode(payload_b64).decode("utf-8"))
        if "exp" in payload and payload["exp"] < time.time():
            return None
            
        return payload
    except Exception:
        return None

# ==========================================
# Database Connection & Initialization
# ==========================================

def get_db_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Create tables if they do not exist."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        
        # 1. Users Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                openai_key TEXT
            )
        """)
        
        # 2. Watchlist Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS watchlist (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                ticker TEXT NOT NULL,
                shares REAL NOT NULL DEFAULT 0,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
                UNIQUE(user_id, ticker)
            )
        """)
        
        # 3. Transactions Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                date TEXT NOT NULL,
                ticker TEXT NOT NULL,
                type TEXT NOT NULL,
                shares REAL NOT NULL,
                price REAL NOT NULL,
                total REAL NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            )
        """)
        
        # 4. Alerts Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS alerts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                ticker TEXT NOT NULL,
                metric TEXT NOT NULL,
                condition TEXT NOT NULL,
                value REAL NOT NULL,
                muted INTEGER NOT NULL DEFAULT 0,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            )
        """)
        
        # 5. Triggered Alerts Log Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS triggered_alerts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                timestamp TEXT NOT NULL,
                ticker TEXT NOT NULL,
                condition TEXT NOT NULL,
                triggered_value REAL NOT NULL,
                details TEXT,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            )
        """)
        
        conn.commit()

# Run table creation
init_db()
