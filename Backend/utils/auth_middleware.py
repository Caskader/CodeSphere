"""
Decorators to protect routes using Firebase ID tokens or backend JWTs.

The client sends: Authorization: Bearer <id_token>
`token_required`  -> verifies token (Firebase ID token or backend dev token), attaches request.user
`admin_required`  -> verifies token AND checks user has admin claim/role
"""

from functools import wraps
from flask import request, jsonify, current_app
import jwt
from firebase_config import firebase_auth, db


def _extract_token():
    header = request.headers.get("Authorization", "")
    if header.startswith("Bearer "):
        return header.split("Bearer ", 1)[1].strip()
    return None


def _verify_token(token):
    # 1. Try verifying as Firebase ID token
    try:
        decoded = firebase_auth.verify_id_token(token)
        return {
            "uid": decoded["uid"],
            "email": decoded.get("email"),
            "is_admin": decoded.get("admin", False),
        }
    except Exception:
        pass

    # 2. Fallback: try decoding as backend-signed JWT
    try:
        secret = current_app.config.get("SECRET_KEY", "hostel-mess-dev-secret-key-32-chars-minimum-length")
        decoded = jwt.decode(token, secret, algorithms=["HS256"])
        return {
            "uid": decoded["uid"],
            "email": decoded.get("email"),
            "is_admin": decoded.get("is_admin", False),
        }
    except Exception as e:
        raise ValueError(f"Invalid or expired token: {e}")


def token_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        token = _extract_token()
        if not token:
            return jsonify({"error": "Missing Authorization Bearer token"}), 401
        try:
            request.user = _verify_token(token)
        except Exception as e:
            return jsonify({"error": "Invalid or expired token", "detail": str(e)}), 401

        return f(*args, **kwargs)
    return wrapper


def admin_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        token = _extract_token()
        if not token:
            return jsonify({"error": "Missing Authorization Bearer token"}), 401
        try:
            user = _verify_token(token)
        except Exception as e:
            return jsonify({"error": "Invalid or expired token", "detail": str(e)}), 401

        if not user.get("is_admin", False):
            return jsonify({"error": "Admin privileges required"}), 403

        request.user = user
        return f(*args, **kwargs)
    return wrapper
