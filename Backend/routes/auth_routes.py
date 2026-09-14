"""
Auth endpoints.

Sign-up creates the user in Firebase Auth (Admin SDK) and a matching
profile doc in Firestore under /users/{uid}.

Login can't be done with the Admin SDK (it never sees passwords), so
we call Firebase's public Identity Toolkit REST API with the Web API
Key, exactly like the Firebase JS SDK does under the hood. This means
your backend can also serve as a login endpoint for non-web clients.
"""

import os
import requests
from flask import Blueprint, request, jsonify
from firebase_config import firebase_auth, db
from utils.auth_middleware import token_required, admin_required

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

FIREBASE_WEB_API_KEY = os.getenv("FIREBASE_WEB_API_KEY")


@auth_bp.route("/signup", methods=["POST"])
def signup():
    data = request.get_json(force=True) or {}
    email = data.get("email")
    password = data.get("password")
    name = data.get("name")
    room_number = data.get("room_number")
    hostel_block = data.get("hostel_block")

    if not email or not password or not name:
        return jsonify({"error": "email, password and name are required"}), 400

    try:
        user_record = firebase_auth.create_user(
            email=email,
            password=password,
            display_name=name,
        )
    except Exception as e:
        return jsonify({"error": "Could not create user", "detail": str(e)}), 400

    # Create the student profile document in Firestore
    db.collection("users").document(user_record.uid).set({
        "name": name,
        "email": email,
        "room_number": room_number,
        "hostel_block": hostel_block,
        "role": "student",
        "created_at": firestore_server_timestamp(),
    })

    return jsonify({"message": "User created", "uid": user_record.uid}), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    """
    Proxies to Firebase's Identity Toolkit REST API to exchange
    email/password for an ID token + refresh token.
    """
    if not FIREBASE_WEB_API_KEY:
        return jsonify({"error": "Server missing FIREBASE_WEB_API_KEY"}), 500

    data = request.get_json(force=True) or {}
    email = data.get("email")
    password = data.get("password")
    if not email or not password:
        return jsonify({"error": "email and password are required"}), 400

    url = (
        "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword"
        f"?key={FIREBASE_WEB_API_KEY}"
    )
    resp = requests.post(url, json={
        "email": email,
        "password": password,
        "returnSecureToken": True,
    })

    if resp.status_code != 200:
        return jsonify({"error": "Login failed", "detail": resp.json()}), 401

    payload = resp.json()
    return jsonify({
        "id_token": payload["idToken"],
        "refresh_token": payload["refreshToken"],
        "expires_in": payload["expiresIn"],
        "uid": payload["localId"],
    }), 200


@auth_bp.route("/me", methods=["GET"])
@token_required
def me():
    uid = request.user["uid"]
    doc = db.collection("users").document(uid).get()
    if not doc.exists:
        return jsonify({"error": "Profile not found"}), 404
    return jsonify(doc.to_dict()), 200


@auth_bp.route("/make-admin", methods=["POST"])
@admin_required
def make_admin():
    """
    Lets an existing admin promote another user (e.g. new mess staff)
    to admin by setting a custom claim. Requires caller to already be admin.
    """
    data = request.get_json(force=True) or {}
    target_uid = data.get("uid")
    if not target_uid:
        return jsonify({"error": "uid is required"}), 400

    firebase_auth.set_custom_user_claims(target_uid, {"admin": True})
    db.collection("users").document(target_uid).update({"role": "admin"})
    return jsonify({"message": f"{target_uid} is now an admin"}), 200


def firestore_server_timestamp():
    from firebase_admin import firestore
    return firestore.SERVER_TIMESTAMP
