"""
Order endpoints.

Firestore layout:
  /orders/{order_id}
    user_id: str
    items: [ { item_id, name, price, quantity, emoji } ]
    total_amount: number
    status: "placed" | "preparing" | "ready" | "completed" | "cancelled"
    room_number, hostel_block: str
    student_name, student_id: str
    counter: int
    meal_type: str
    payment_method: str
    token_id: str
    created_at, updated_at
"""

from flask import Blueprint, request, jsonify
from firebase_admin import firestore
from firebase_config import db
from utils.auth_middleware import token_required, admin_required

order_bp = Blueprint("orders", __name__, url_prefix="/api/orders")

VALID_STATUSES = ["placed", "preparing", "ready", "completed", "cancelled"]


class InsufficientInventory(Exception):
    pass


def canonical_material_id(material_id):
    value = str(material_id).strip().lower().replace(" ", "-")
    return {"breads": "bread", "tomatoes": "tomato", "tomatos": "tomato", "potatoes": "potato", "carrots": "carrot", "pastas": "pasta", "cheeses": "cheese", "rices": "rice", "onions": "onion", "paneers": "paneer", "flours": "flour", "oils": "oil"}.get(value, value)


@order_bp.route("", methods=["POST"])
@token_required
def place_order():
    """
    Body: { "items": [ { "item_id": "...", "quantity": 2 }, ... ], "payment_method": "UPI", ... }
    """
    data = request.get_json(force=True) or {}
    cart = data.get("items")
    if not cart or not isinstance(cart, list):
        return jsonify({"error": "items (non-empty list) is required"}), 400

    uid = request.user["uid"]

    # Rebuild the order server-side from authoritative menu data
    order_items = []
    total = 0
    material_requirements = {}
    dish_stock_requirements = {}
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
            "emoji": menu_item.get("emoji", "🍲"),
            "category": menu_item.get("category", ""),
        })
        inventory_mode = menu_item.get("inventory_mode")
        if inventory_mode == "dish_stock":
            dish_stock_requirements[item_id] = dish_stock_requirements.get(item_id, 0) + quantity
        else:
            ingredients = menu_item.get("ingredients", [])
            if inventory_mode == "ingredients" and not ingredients:
                return jsonify({"error": f"Recipe for {menu_item['name']} has no raw materials configured"}), 400
            for ingredient in ingredients:
                material_id = canonical_material_id(ingredient.get("material_id", ""))
                required_quantity = float(ingredient.get("quantity", 0))
                if material_id and required_quantity > 0:
                    material_requirements[material_id] = material_requirements.get(material_id, 0) + required_quantity * quantity

    # Pull student profile for room/block and student details
    profile_doc = db.collection("users").document(uid).get()
    profile = profile_doc.to_dict() if profile_doc.exists else {}

    student_name = profile.get("name") or data.get("student_name") or request.user.get("name") or "Chaitanya Deshpande"
    student_id = profile.get("student_id") or data.get("student_id") or "24BCE1234"
    meal_type = data.get("meal_type", "Night Mess")
    payment_method = data.get("payment_method", "UPI")

    ref = db.collection("orders").document()
    order_id = ref.id
    token_id = f"VIT-{order_id[:6].upper()}"

    # Assign counter (1, 2, or 3)
    counter = data.get("counter") or (sum(ord(c) for c in order_id) % 3 + 1)

    order = {
        "user_id": uid,
        "items": order_items,
        "total_amount": total,
        "status": "placed",
        "room_number": profile.get("room_number", "A-Block, Room 214"),
        "hostel_block": profile.get("hostel_block", "A-Block"),
        "student_name": student_name,
        "student_id": student_id,
        "counter": counter,
        "meal_type": meal_type,
        "payment_method": payment_method,
        "token_id": token_id,
        "created_at": firestore.SERVER_TIMESTAMP,
        "updated_at": firestore.SERVER_TIMESTAMP,
    }
    # Firestore transactions prevent two simultaneous checkouts from using the
    # same final units of an ingredient.
    transaction = db.transaction()

    @firestore.transactional
    def reserve_inventory_and_create_order(transaction):
        material_refs = []
        dish_refs = []
        for material_id, required_quantity in material_requirements.items():
            material_ref = db.collection("raw_materials").document(material_id)
            material_doc = material_ref.get(transaction=transaction)
            if not material_doc.exists:
                raise InsufficientInventory(f"Raw material '{material_id}' is not configured")
            material = material_doc.to_dict()
            available_quantity = float(material.get("quantity", 0))
            if available_quantity < required_quantity:
                raise InsufficientInventory(
                    f"Not enough {material.get('name', material_id)} available"
                )
            material_refs.append((material_ref, available_quantity - required_quantity))
        for item_id, required_quantity in dish_stock_requirements.items():
            dish_ref = db.collection("menu_items").document(item_id)
            dish_doc = dish_ref.get(transaction=transaction)
            dish = dish_doc.to_dict() if dish_doc.exists else None
            if not dish or float(dish.get("stock", 0)) < required_quantity:
                raise InsufficientInventory(f"Not enough servings of {dish.get('name', item_id) if dish else item_id} available")
            dish_refs.append((dish_ref, float(dish.get("stock", 0)) - required_quantity))
        for material_ref, remaining_quantity in material_refs:
            transaction.update(material_ref, {"quantity": remaining_quantity, "updated_at": firestore.SERVER_TIMESTAMP})
        for dish_ref, remaining_quantity in dish_refs:
            transaction.update(dish_ref, {"stock": remaining_quantity, "updated_at": firestore.SERVER_TIMESTAMP})
        transaction.set(ref, order)

    try:
        reserve_inventory_and_create_order(transaction)
    except InsufficientInventory as error:
        return jsonify({"error": str(error)}), 400

    return jsonify({
        "message": "Order placed successfully",
        "order_id": order_id,
        "total_amount": total,
        "token_id": token_id,
        "counter": counter,
        "status": "placed",
        "order": {
            "id": order_id,
            "token_id": token_id,
            "items": order_items,
            "total_amount": total,
            "status": "placed",
            "counter": counter,
            "meal_type": meal_type,
            "payment_method": payment_method,
            "student_name": student_name,
            "student_id": student_id,
        }
    }), 201


@order_bp.route("/pending_count", methods=["GET"])
@token_required
def get_pending_count():
    try:
        placed_query = db.collection("orders").where("status", "==", "placed").stream()
        preparing_query = db.collection("orders").where("status", "==", "preparing").stream()
        count = sum(1 for _ in placed_query) + sum(1 for _ in preparing_query)
        return jsonify({"queueCount": count}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@order_bp.route("/my", methods=["GET"])
@token_required
def my_orders():
    uid = request.user["uid"]
    try:
        query = (
            db.collection("orders")
            .where("user_id", "==", uid)
            .order_by("created_at", direction=firestore.Query.DESCENDING)
        )
        orders = [{"id": doc.id, **doc.to_dict()} for doc in query.stream()]
    except Exception:
        # Fallback if composite index in Firestore is not built
        query = db.collection("orders").where("user_id", "==", uid)
        orders = [{"id": doc.id, **doc.to_dict()} for doc in query.stream()]
        orders.sort(key=lambda x: str(x.get("created_at", "")), reverse=True)

    return jsonify(orders), 200


@order_bp.route("/<order_id>", methods=["GET"])
@token_required
def get_order(order_id):
    doc = db.collection("orders").document(order_id).get()
    if not doc.exists:
        return jsonify({"error": "Order not found"}), 404

    order = doc.to_dict()
    if order["user_id"] != request.user["uid"] and not request.user.get("is_admin"):
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
    if order["user_id"] != request.user["uid"] and not request.user.get("is_admin"):
        return jsonify({"error": "Not authorized"}), 403
    if order["status"] in ("ready", "completed", "cancelled"):
        return jsonify({"error": f"Cannot cancel an order that is {order['status']}"}), 400

    ref.update({"status": "cancelled", "updated_at": firestore.SERVER_TIMESTAMP})
    return jsonify({"message": "Order cancelled", "id": order_id, "status": "cancelled"}), 200


# ---------- Mess staff / admin endpoints ----------

@order_bp.route("", methods=["GET"])
@admin_required
def list_all_orders():
    """Mess staff dashboard: all orders, optional ?status=placed"""
    status = request.args.get("status")
    if status and status not in VALID_STATUSES:
        return jsonify({"error": f"status must be one of {VALID_STATUSES}"}), 400

    try:
        query = db.collection("orders")
        if status:
            query = query.where("status", "==", status)
        query = query.order_by("created_at", direction=firestore.Query.DESCENDING)
        orders = [{"id": doc.id, **doc.to_dict()} for doc in query.stream()]
    except Exception:
        query = db.collection("orders")
        if status:
            query = query.where("status", "==", status)
        orders = [{"id": doc.id, **doc.to_dict()} for doc in query.stream()]
        orders.sort(key=lambda x: str(x.get("created_at", "")), reverse=True)

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
