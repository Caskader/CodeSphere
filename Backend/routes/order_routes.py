"""
Order endpoints.

Firestore layout:
  /orders/{order_id}
    user_id: str
    items: [ { item_id, name, price, quantity } ]
    total_amount: number
    status: "placed" | "preparing" | "ready" | "completed" | "cancelled"
    room_number, hostel_block: str   (denormalized for mess staff convenience)
    created_at, updated_at

Prices are always re-read from /menu_items on the server, never trusted
from the client, so people can't tamper with totals.
"""

from flask import Blueprint, request, jsonify
from firebase_admin import firestore
from firebase_config import db
from utils.auth_middleware import token_required, admin_required

order_bp = Blueprint("orders", __name__, url_prefix="/api/orders")

VALID_STATUSES = ["placed", "preparing", "ready", "completed", "cancelled"]


@order_bp.route("", methods=["POST"])
@token_required
def place_order():
    """
    Body: { "items": [ { "item_id": "...", "quantity": 2 }, ... ] }
    """
    data = request.get_json(force=True) or {}
    cart = data.get("items")
    if not cart or not isinstance(cart, list):
        return jsonify({"error": "items (non-empty list) is required"}), 400

    uid = request.user["uid"]

    # Rebuild the order server-side from authoritative menu data
    order_items = []
    total = 0
    for entry in cart:
        item_id = entry.get("item_id")
        quantity = int(entry.get("quantity", 1))
        if quantity <= 0:
            return jsonify({"error": f"Invalid quantity for {item_id}"}), 400

        menu_doc = db.collection("menu_items").document(item_id).get()
        if not menu_doc.exists:
            return jsonify({"error": f"Menu item {item_id} not found"}), 404
        menu_item = menu_doc.to_dict()

        if not menu_item.get("is_available", False):
            return jsonify({"error": f"{menu_item['name']} is currently unavailable"}), 400

        line_total = menu_item["price"] * quantity
        total += line_total
        order_items.append({
            "item_id": item_id,
            "name": menu_item["name"],
            "price": menu_item["price"],
            "quantity": quantity,
        })

    # Pull student profile for room/block (helps mess staff with delivery)
    profile_doc = db.collection("users").document(uid).get()
    profile = profile_doc.to_dict() if profile_doc.exists else {}

    order = {
        "user_id": uid,
        "items": order_items,
        "total_amount": total,
        "status": "placed",
        "room_number": profile.get("room_number"),
        "hostel_block": profile.get("hostel_block"),
        "created_at": firestore.SERVER_TIMESTAMP,
        "updated_at": firestore.SERVER_TIMESTAMP,
    }
    ref = db.collection("orders").document()
    ref.set(order)

    return jsonify({"message": "Order placed", "order_id": ref.id, "total_amount": total}), 201


@order_bp.route("/my", methods=["GET"])
@token_required
def my_orders():
    uid = request.user["uid"]
    query = (
        db.collection("orders")
        .where("user_id", "==", uid)
        .order_by("created_at", direction=firestore.Query.DESCENDING)
    )
    orders = [{"id": doc.id, **doc.to_dict()} for doc in query.stream()]
    return jsonify(orders), 200


@order_bp.route("/<order_id>", methods=["GET"])
@token_required
def get_order(order_id):
    doc = db.collection("orders").document(order_id).get()
    if not doc.exists:
        return jsonify({"error": "Order not found"}), 404

    order = doc.to_dict()
    if order["user_id"] != request.user["uid"] and not request.user["is_admin"]:
        return jsonify({"error": "Not authorized to view this order"}), 403

    return jsonify({"id": doc.id, **order}), 200


@order_bp.route("/<order_id>/cancel", methods=["POST"])
@token_required
def cancel_order(order_id):
    ref = db.collection("orders").document(order_id)
    doc = ref.get()
    if not doc.exists:
        return jsonify({"error": "Order not found"}), 404

    order = doc.to_dict()
    if order["user_id"] != request.user["uid"] and not request.user["is_admin"]:
        return jsonify({"error": "Not authorized"}), 403
    if order["status"] in ("ready", "completed", "cancelled"):
        return jsonify({"error": f"Cannot cancel an order that is {order['status']}"}), 400

    ref.update({"status": "cancelled", "updated_at": firestore.SERVER_TIMESTAMP})
    return jsonify({"message": "Order cancelled"}), 200


# ---------- Mess staff / admin endpoints ----------

@order_bp.route("", methods=["GET"])
@admin_required
def list_all_orders():
    """Mess staff dashboard: all orders, optional ?status=placed"""
    status = request.args.get("status")
    query = db.collection("orders").order_by("created_at", direction=firestore.Query.DESCENDING)
    if status:
        if status not in VALID_STATUSES:
            return jsonify({"error": f"status must be one of {VALID_STATUSES}"}), 400
        query = query.where("status", "==", status)

    orders = [{"id": doc.id, **doc.to_dict()} for doc in query.stream()]
    return jsonify(orders), 200


@order_bp.route("/<order_id>/status", methods=["PATCH"])
@admin_required
def update_order_status(order_id):
    data = request.get_json(force=True) or {}
    new_status = data.get("status")
    if new_status not in VALID_STATUSES:
        return jsonify({"error": f"status must be one of {VALID_STATUSES}"}), 400

    ref = db.collection("orders").document(order_id)
    if not ref.get().exists:
        return jsonify({"error": "Order not found"}), 404

    ref.update({"status": new_status, "updated_at": firestore.SERVER_TIMESTAMP})
    return jsonify({"message": f"Order marked as {new_status}"}), 200
