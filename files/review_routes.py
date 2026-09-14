"""
Review endpoints — students rate a menu item after an order.

Firestore layout:
  /menu_items/{item_id}/reviews/{review_id}
    user_id, rating (1-5), comment, created_at
"""

from flask import Blueprint, request, jsonify
from firebase_admin import firestore
from firebase_config import firestore_db as db
from utils.auth_middleware import token_required

review_bp = Blueprint("reviews", __name__, url_prefix="/api/menu/<item_id>/reviews")


@review_bp.route("", methods=["GET"])
def get_reviews(item_id):
    reviews_ref = db.collection("menu_items").document(item_id).collection("reviews")
    reviews = [{"id": doc.id, **doc.to_dict()} for doc in reviews_ref.stream()]
    return jsonify(reviews), 200


@review_bp.route("", methods=["POST"])
@token_required
def add_review(item_id):
    data = request.get_json(force=True) or {}
    rating = data.get("rating")
    comment = data.get("comment", "")

    if not isinstance(rating, (int, float)) or not (1 <= rating <= 5):
        return jsonify({"error": "rating must be a number between 1 and 5"}), 400

    item_ref = db.collection("menu_items").document(item_id)
    if not item_ref.get().exists:
        return jsonify({"error": "Menu item not found"}), 404

    review_ref = item_ref.collection("reviews").document()
    review_ref.set({
        "user_id": request.user["uid"],
        "rating": rating,
        "comment": comment,
        "created_at": firestore.SERVER_TIMESTAMP,
    })

    # Recompute and cache the average rating on the menu item itself
    all_reviews = list(item_ref.collection("reviews").stream())
    avg = sum(r.to_dict()["rating"] for r in all_reviews) / len(all_reviews)
    item_ref.update({"average_rating": round(avg, 2), "review_count": len(all_reviews)})

    return jsonify({"message": "Review added", "id": review_ref.id}), 201
