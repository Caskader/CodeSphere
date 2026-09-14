"""Announcement CRUD for the admin dashboard."""

from flask import Blueprint, jsonify, request
from firebase_admin import firestore

from firebase_config import db
from utils.auth_middleware import admin_required


announcement_bp = Blueprint("announcements", __name__, url_prefix="/api/announcements")

DEFAULT_ANNOUNCEMENTS = {
    "ANN001": {"title": "Diwali Special Menu — Oct 28", "content": "Celebrate Diwali with our special festive menu featuring traditional sweets and snacks. Mithai box included with all meals at no extra cost.", "category": "Menu", "published": True, "pinned": True},
    "ANN002": {"title": "Mess Closed — Nov 3 (Sunday)", "content": "The mess will remain closed on November 3rd due to annual maintenance. Please make alternate arrangements for all three meals.", "category": "Operations", "published": True, "pinned": False},
    "ANN003": {"title": "New Payment System Launched", "content": "We have switched to a new UPI-based payment system. All tokens must now be purchased through the student portal before 6 PM for dinner.", "category": "Payments", "published": False, "pinned": False},
    "ANN004": {"title": "Feedback Survey — Nov Week", "content": "Help us improve! Fill out the monthly feedback survey available on the student portal. Top suggestions will be implemented next month.", "category": "General", "published": True, "pinned": False},
}


def _announcement(document):
    return {"id": document.id, **document.to_dict()}


def _ensure_default_announcements():
    existing_ids = {document.id for document in db.collection("announcements").stream()}
    for announcement_id, announcement in DEFAULT_ANNOUNCEMENTS.items():
        if announcement_id not in existing_ids:
            db.collection("announcements").document(announcement_id).set({
                **announcement,
                "timestamp": firestore.SERVER_TIMESTAMP,
            })


@announcement_bp.route("", methods=["GET"])
def list_announcements():
    _ensure_default_announcements()
    announcements = [
        _announcement(document)
        for document in db.collection("announcements").where("published", "==", True).stream()
    ]
    announcements.sort(key=lambda item: str(item.get("timestamp", "")), reverse=True)
    return jsonify(announcements), 200


@announcement_bp.route("/admin", methods=["GET"])
@admin_required
def list_all_announcements():
    _ensure_default_announcements()
    announcements = [_announcement(document) for document in db.collection("announcements").stream()]
    announcements.sort(key=lambda item: str(item.get("timestamp", "")), reverse=True)
    return jsonify(announcements), 200


@announcement_bp.route("", methods=["POST"])
@admin_required
def create_announcement():
    data = request.get_json(force=True) or {}
    title = str(data.get("title", "")).strip()
    content = str(data.get("content", "")).strip()
    if not title or not content:
        return jsonify({"error": "title and content are required"}), 400

    announcement = {
        "title": title,
        "content": content,
        "category": str(data.get("category", "General")).strip() or "General",
        "published": bool(data.get("published", False)),
        "pinned": bool(data.get("pinned", False)),
        "timestamp": firestore.SERVER_TIMESTAMP,
    }
    reference = db.collection("announcements").document()
    reference.set(announcement)
    saved = reference.get().to_dict() or announcement
    return jsonify({"id": reference.id, **saved}), 201


@announcement_bp.route("/<announcement_id>", methods=["PATCH"])
@admin_required
def update_announcement(announcement_id):
    reference = db.collection("announcements").document(announcement_id)
    if not reference.get().exists:
        return jsonify({"error": "Announcement not found"}), 404
    data = request.get_json(force=True) or {}
    updates = {}
    for field in ("title", "content", "category"):
        if field in data:
            value = str(data[field]).strip()
            if field in ("title", "content") and not value:
                return jsonify({"error": f"{field} cannot be empty"}), 400
            updates[field] = value
    for field in ("published", "pinned"):
        if field in data:
            updates[field] = bool(data[field])
    if updates:
        reference.update(updates)
    return jsonify({"id": announcement_id, **(reference.get().to_dict() or {})}), 200


@announcement_bp.route("/<announcement_id>", methods=["DELETE"])
@admin_required
def delete_announcement(announcement_id):
    reference = db.collection("announcements").document(announcement_id)
    if not reference.get().exists:
        return jsonify({"error": "Announcement not found"}), 404
    reference.delete()
    return jsonify({"message": "Announcement deleted", "id": announcement_id}), 200
