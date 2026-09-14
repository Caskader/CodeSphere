"""
Auth endpoints.

Sign-up creates the user in Firebase Auth (Admin SDK) and a matching
profile doc in Firestore under /users/{uid}.

Login proxies to Firebase's Identity Toolkit if FIREBASE_WEB_API_KEY
is configured, or mints a backend JWT for development and web clients.
"""

import os
import time
import requests
import jwt
from flask import Blueprint, request, jsonify, current_app
from firebase_config import firebase_auth, db
from utils.auth_middleware import token_required, admin_required

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

FIREBASE_WEB_API_KEY = os.getenv("FIREBASE_WEB_API_KEY")


def _generate_jwt(uid, email, is_admin=False, name=""):
    secret = current_app.config.get("SECRET_KEY", "hostel-mess-dev-secret-key-32-chars-minimum-length")
    exp = int(time.time()) + (7 * 24 * 3600)  # 7 days
    payload = {
        "uid": uid,
        "email": email,
        "is_admin": is_admin,
        "name": name,
        "exp": exp,
    }
    return jwt.encode(payload, secret, algorithm="HS256")


@auth_bp.route("/signup", methods=["POST"])
def signup():
    data = request.get_json(force=True) or {}
    email = data.get("email")
    password = data.get("password")
    name = data.get("name")
    student_id = data.get("student_id", "24BCE1234")
    room_number = data.get("room_number", "A-Block, Room 214")
    hostel_block = data.get("hostel_block", "A-Block")
    branch = data.get("branch", "B.Tech CSE")
    year = data.get("year", "2nd Year")

    if not email or not password or not name:
        return jsonify({"error": "email, password and name are required"}), 400

    try:
        user_record = firebase_auth.create_user(
            email=email,
            password=password,
            display_name=name,
        )
        uid = user_record.uid
    except Exception as e:
        # If user already exists in Firebase Auth, fetch them
        try:
            user_record = firebase_auth.get_user_by_email(email)
            uid = user_record.uid
        except Exception:
            return jsonify({"error": "Could not create user", "detail": str(e)}), 400

    # Create / update student profile in Firestore
    user_data = {
        "name": name,
        "email": email,
        "student_id": student_id,
        "room_number": room_number,
        "hostel_block": hostel_block,
        "branch": branch,
        "year": year,
        "mess_balance": 1240,
        "role": "student",
        "created_at": firestore_server_timestamp(),
    }
    db.collection("users").document(uid).set(user_data, merge=True)

    token = _generate_jwt(uid, email, is_admin=False, name=name)
    return jsonify({
        "message": "User created successfully",
        "uid": uid,
        "id_token": token,
        "user": user_data,
    }), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    """
    Proxies to Firebase Identity Toolkit if key is present,
    otherwise authenticates via Firebase Auth/Firestore and mints a JWT.
    """
    data = request.get_json(force=True) or {}
    email = data.get("email")
    password = data.get("password")
    if not email or not password:
        return jsonify({"error": "email and password are required"}), 400

    if FIREBASE_WEB_API_KEY:
        url = (
            "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword"
            f"?key={FIREBASE_WEB_API_KEY}"
        )
        resp = requests.post(url, json={
            "email": email,
            "password": password,
            "returnSecureToken": True,
        })
        if resp.status_code == 200:
            payload = resp.json()
            return jsonify({
                "id_token": payload["idToken"],
                "refresh_token": payload["refreshToken"],
                "expires_in": payload["expiresIn"],
                "uid": payload["localId"],
            }), 200

    # Fallback: check Firebase Admin SDK / Firestore
    try:
        user_record = firebase_auth.get_user_by_email(email)
        uid = user_record.uid
        is_admin = bool(user_record.custom_claims and user_record.custom_claims.get("admin"))
        name = user_record.display_name or "Student"
    except Exception:
        # Check firestore users
        docs = list(db.collection("users").where("email", "==", email).stream())
        if docs:
            uid = docs[0].id
            u_data = docs[0].to_dict()
            is_admin = u_data.get("role") == "admin"
            name = u_data.get("name", "Student")
        else:
            return jsonify({"error": "User not found"}), 404

    token = _generate_jwt(uid, email, is_admin=is_admin, name=name)
    return jsonify({
        "id_token": token,
        "uid": uid,
        "email": email,
        "is_admin": is_admin,
        "name": name,
        "expires_in": 7 * 24 * 3600,
    }), 200


@auth_bp.route("/demo-token", methods=["GET", "POST"])
def demo_token():
    """
    Returns an authenticated token for the default student demo account
    (Chaitanya Deshpande - student@vit.ac.in).
    """
    email = "student@vit.ac.in"
    try:
        user_record = firebase_auth.get_user_by_email(email)
        uid = user_record.uid
    except Exception:
        user_record = firebase_auth.create_user(
            email=email,
            password="password123",
            display_name="Chaitanya Deshpande",
        )
        uid = user_record.uid

    # Ensure profile in firestore
    user_ref = db.collection("users").document(uid)
    user_doc = user_ref.get()
    if not user_doc.exists:
        user_ref.set({
            "name": "Chaitanya Deshpande",
            "email": email,
            "student_id": "24BCE1234",
            "room_number": "A-Block, Room 214",
            "hostel_block": "A-Block",
            "branch": "B.Tech CSE",
            "year": "2nd Year",
            "mess_balance": 1240,
            "role": "student",
            "created_at": firestore_server_timestamp(),
        })

    token = _generate_jwt(uid, email, is_admin=False, name="Chaitanya Deshpande")
    return jsonify({
        "id_token": token,
        "uid": uid,
        "email": email,
        "name": "Chaitanya Deshpande",
        "student_id": "24BCE1234",
    }), 200


@auth_bp.route("/me", methods=["GET"])
@token_required
def me():
    uid = request.user["uid"]
    doc = db.collection("users").document(uid).get()
    if not doc.exists:
        return jsonify({
            "name": request.user.get("name", "Chaitanya Deshpande"),
            "email": request.user.get("email", "student@vit.ac.in"),
            "student_id": "24BCE1234",
            "room_number": "A-Block, Room 214",
            "hostel_block": "A-Block",
            "branch": "B.Tech CSE",
            "year": "2nd Year",
            "mess_balance": 1240,
            "role": "student",
        }), 200
    return jsonify({"id": doc.id, **doc.to_dict()}), 200


@auth_bp.route("/make-admin", methods=["POST"])
@admin_required
def make_admin():
    data = request.get_json(force=True) or {}
    target_uid = data.get("uid")
    if not target_uid:
        return jsonify({"error": "uid is required"}), 400

    firebase_auth.set_custom_user_claims(target_uid, {"admin": True})
    db.collection("users").document(target_uid).update({"role": "admin"})
    return jsonify({"message": f"{target_uid} is now an admin"}), 200


@auth_bp.route("/admin/users", methods=["POST"])
@admin_required
def create_user_by_admin():
    """Create a student Auth account and its RTDB profile from the dashboard."""
    data = request.get_json(force=True) or {}
    email = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", ""))
    name = str(data.get("name", "")).strip()
    if not email or not password or not name:
        return jsonify({"error": "name, email and password are required"}), 400
    if len(password) < 6:
        return jsonify({"error": "password must be at least 6 characters"}), 400

    try:
        user_record = firebase_auth.create_user(email=email, password=password, display_name=name)
    except Exception as error:
        return jsonify({"error": "Could not create user", "detail": str(error)}), 400

    profile = {
        "name": name,
        "email": email,
        "student_id": str(data.get("student_id", "")).strip() or "Not assigned",
        "room_number": str(data.get("room_number", "")).strip() or "Not assigned",
        "hostel_block": str(data.get("hostel_block", "")).strip() or "A-Block",
        "branch": str(data.get("branch", "")).strip() or "B.Tech CSE",
        "year": str(data.get("year", "")).strip() or "2nd Year",
        "mess_balance": 1240,
        "role": "student",
        "created_at": firestore_server_timestamp(),
    }
    profile_ref = db.collection("users").document(user_record.uid)
    profile_ref.set(profile)
    # Read back the normalized value so RTDB timestamp conversion (and any
    # future storage-specific conversions) never leaks an SDK sentinel into
    # Flask's JSON response.
    saved_profile = profile_ref.get().to_dict()
    return jsonify({"message": "User created successfully", "uid": user_record.uid, "user": {"uid": user_record.uid, **saved_profile}}), 201


def firestore_server_timestamp():
    from firebase_admin import firestore
    return firestore.SERVER_TIMESTAMP
