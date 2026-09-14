"""
Decorators to protect routes using Firebase ID tokens.

The client (mobile/web app) signs the student in with Firebase Auth,
gets an ID token, and sends it as:  Authorization: Bearer <id_token>

`token_required`  -> just verifies the token, attaches request.user
`admin_required`  -> verifies token AND checks the user has an 'admin'
                      custom claim (mess staff / manager)
"""

from functools import wraps
from flask import request, jsonify
from firebase_config import firebase_auth, db


def _extract_token():
    header = request.headers.get("Authorization", "")
    if header.startswith("Bearer "):
        return header.split("Bearer ", 1)[1].strip()
    return None


def token_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        token = _extract_token()
        if not token:
            return jsonify({"error": "Missing Authorization Bearer token"}), 401
        try:
            decoded = firebase_auth.verify_id_token(token)
        except Exception as e:
            return jsonify({"error": "Invalid or expired token", "detail": str(e)}), 401

        request.user = {
            "uid": decoded["uid"],
            "email": decoded.get("email"),
            "is_admin": decoded.get("admin", False),
        }
        return f(*args, **kwargs)
    return wrapper


def admin_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        token = _extract_token()
        if not token:
            return jsonify({"error": "Missing Authorization Bearer token"}), 401
        try:
            decoded = firebase_auth.verify_id_token(token)
        except Exception as e:
            return jsonify({"error": "Invalid or expired token", "detail": str(e)}), 401

        if not decoded.get("admin", False):
            return jsonify({"error": "Admin privileges required"}), 403

        request.user = {
            "uid": decoded["uid"],
            "email": decoded.get("email"),
            "is_admin": True,
        }
        return f(*args, **kwargs)
    return wrapper
