"""
Menu endpoints.

Firestore layout:
  /menu_items/{item_id}
    name: str
    description: str
    price: number
    category: str        e.g. "Breakfast" | "Lunch" | "Dinner" | "Snacks"
    is_available: bool
    image_url: str
    created_at, updated_at
"""

from flask import Blueprint, request, jsonify
from firebase_admin import firestore
from firebase_config import db
from utils.auth_middleware import token_required, admin_required

menu_bp = Blueprint("menu", __name__, url_prefix="/api/menu")


@menu_bp.route("", methods=["GET"])
def get_menu():
    """Public: list menu items. Optional ?category=Lunch&available_only=true"""
    category = request.args.get("category")
    available_only = request.args.get("available_only", "false").lower() == "true"

    query = db.collection("menu_items")
    if category and category.lower() != "all":
        query = query.where("category", "==", category)
    if available_only:
        query = query.where("is_available", "==", True)

    items = [{"id": doc.id, **doc.to_dict()} for doc in query.stream()]
    return jsonify(items), 200


@menu_bp.route("/<item_id>", methods=["GET"])
def get_menu_item(item_id):
    doc = db.collection("menu_items").document(item_id).get()
    if not doc.exists:
        return jsonify({"error": "Item not found"}), 404
    return jsonify({"id": doc.id, **doc.to_dict()}), 200


@menu_bp.route("", methods=["POST"])
@admin_required
def add_menu_item():
    data = request.get_json(force=True) or {}
    required = ["name", "price", "category"]
    missing = [f for f in required if f not in data]
    if missing:
        return jsonify({"error": f"Missing fields: {missing}"}), 400

    item = {
        "name": data["name"],
        "description": data.get("description", ""),
        "price": data["price"],
        "category": data["category"],
        "is_available": data.get("is_available", True),
        "image_url": data.get("image_url", ""),
        # Admin-dashboard inventory fields. They are optional so existing
        # student-facing menu clients remain compatible.
        "stock": data.get("stock", 0),
        "max_stock": data.get("maxStock", data.get("max_stock", 0)),
        "availability": data.get("availability", "available"),
        "unit": data.get("unit", "servings"),
        "wastage": data.get("wastage", 0),
        "created_at": firestore.SERVER_TIMESTAMP,
        "updated_at": firestore.SERVER_TIMESTAMP,
    }
    ref = db.collection("menu_items").document()
    ref.set(item)
    return jsonify({"message": "Item added", "id": ref.id}), 201


@menu_bp.route("/<item_id>", methods=["PUT"])
@admin_required
def update_menu_item(item_id):
    ref = db.collection("menu_items").document(item_id)
    if not ref.get().exists:
        return jsonify({"error": "Item not found"}), 404

    data = request.get_json(force=True) or {}
    data["updated_at"] = firestore.SERVER_TIMESTAMP
    ref.update(data)
    return jsonify({"message": "Item updated"}), 200


@menu_bp.route("/<item_id>/availability", methods=["PATCH"])
@admin_required
def toggle_availability(item_id):
    """Quick toggle for mess staff: mark an item sold out / back in stock."""
    data = request.get_json(force=True) or {}
    if "is_available" not in data:
        return jsonify({"error": "is_available (bool) is required"}), 400

    ref = db.collection("menu_items").document(item_id)
    if not ref.get().exists:
        return jsonify({"error": "Item not found"}), 404

    ref.update({
        "is_available": bool(data["is_available"]),
        "updated_at": firestore.SERVER_TIMESTAMP,
    })
    return jsonify({"message": "Availability updated"}), 200


@menu_bp.route("/<item_id>", methods=["DELETE"])
@admin_required
def delete_menu_item(item_id):
    ref = db.collection("menu_items").document(item_id)
    if not ref.get().exists:
        return jsonify({"error": "Item not found"}), 404
    ref.delete()
    return jsonify({"message": "Item deleted"}), 200
