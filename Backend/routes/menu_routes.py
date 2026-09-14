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

DEFAULT_RAW_MATERIALS = [
    ("bread", "Bread", 100, "slices"), ("tomato", "Tomato", 100, "pieces"),
    ("potato", "Potato", 30, "kg"), ("pasta", "Pasta", 15, "kg"),
    ("carrot", "Carrot", 15, "kg"), ("cheese", "Cheese", 10, "kg"),
    ("rice", "Rice", 50, "kg"), ("onion", "Onion", 25, "kg"),
    ("paneer", "Paneer", 12, "kg"), ("lentils", "Lentils", 25, "kg"),
    ("flour", "Flour", 40, "kg"), ("oil", "Oil", 20, "litres"),
]

DEFAULT_RECIPES = {
    "sandwich": [("bread", "Bread", 2), ("tomato", "Tomato", 1), ("cheese", "Cheese", 0.03)],
    "sandwhich": [("bread", "Bread", 2), ("tomato", "Tomato", 1), ("cheese", "Cheese", 0.03)],
    "pasta": [("pasta", "Pasta", 0.12), ("tomato", "Tomato", 2), ("cheese", "Cheese", 0.03)],
    "biryani": [("rice", "Rice", 0.2), ("onion", "Onion", 0.06), ("carrot", "Carrot", 0.05), ("oil", "Oil", 0.02)],
    "paneer butter masala": [("paneer", "Paneer", 0.15), ("tomato", "Tomato", 2), ("oil", "Oil", 0.02)],
    "dal makhani": [("lentils", "Lentils", 0.15), ("tomato", "Tomato", 1), ("oil", "Oil", 0.02)],
    "chole bhature": [("flour", "Flour", 0.18), ("lentils", "Lentils", 0.15), ("oil", "Oil", 0.03)],
    "veg fried rice": [("rice", "Rice", 0.18), ("carrot", "Carrot", 0.06), ("onion", "Onion", 0.05), ("oil", "Oil", 0.02)],
    "rajma chawal": [("rice", "Rice", 0.2), ("lentils", "Lentils", 0.16), ("onion", "Onion", 0.05)],
    "idli sambar": [("rice", "Rice", 0.16), ("lentils", "Lentils", 0.08)],
    "poha": [("rice", "Rice", 0.14), ("potato", "Potato", 0.08), ("onion", "Onion", 0.04)],
}


def inventory_available(item, materials):
    """Whether one serving can be prepared from the current raw inventory."""
    if item.get("inventory_mode") == "dish_stock":
        return float(item.get("stock", 0)) > 0
    ingredients = item.get("ingredients") or [
        {"material_id": material_id, "name": name, "quantity": quantity}
        for material_id, name, quantity in DEFAULT_RECIPES.get(str(item.get("name", "")).strip().lower(), [])
    ]
    if item.get("inventory_mode") == "ingredients" and not ingredients:
        return False
    for ingredient in ingredients:
        material = materials.get(canonical_material_id(ingredient.get("material_id", "")))
        if not material or float(material.get("quantity", 0)) < float(ingredient.get("quantity", 0)):
            return False
    return True


def canonical_material_id(name):
    material_id = "-".join("".join(ch if ch.isalnum() else " " for ch in name.lower()).split())
    aliases = {
        "breads": "bread", "tomatoes": "tomato", "tomatos": "tomato", "potatoes": "potato",
        "carrots": "carrot", "pastas": "pasta", "cheeses": "cheese", "rices": "rice",
        "onions": "onion", "paneers": "paneer", "flours": "flour", "oils": "oil",
    }
    return aliases.get(material_id, material_id)


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

    materials = {doc.id: doc.to_dict() for doc in db.collection("raw_materials").stream()}
    items = []
    for doc in query.stream():
        item = {"id": doc.id, **doc.to_dict()}
        item["inventory_available"] = inventory_available(item, materials)
        item["is_available"] = bool(item.get("is_available", True) and item["inventory_available"])
        items.append(item)
    return jsonify(items), 200


@menu_bp.route("/<item_id>", methods=["GET"])
def get_menu_item(item_id):
    doc = db.collection("menu_items").document(item_id).get()
    if not doc.exists:
        return jsonify({"error": "Item not found"}), 404
    item = {"id": doc.id, **doc.to_dict()}
    materials = {material.id: material.to_dict() for material in db.collection("raw_materials").stream()}
    item["inventory_available"] = inventory_available(item, materials)
    item["is_available"] = bool(item.get("is_available", True) and item["inventory_available"])
    return jsonify(item), 200


@menu_bp.route("", methods=["POST"])
@admin_required
def add_menu_item():
    data = request.get_json(force=True) or {}
    required = ["name", "price", "category"]
    missing = [f for f in required if f not in data]
    if missing:
        return jsonify({"error": f"Missing fields: {missing}"}), 400

    inventory_mode = data.get("inventory_mode", "ingredients" if data.get("ingredients") else "dish_stock")
    ingredients = data.get("ingredients", [])
    if inventory_mode == "ingredients" and not ingredients:
        recipe = DEFAULT_RECIPES.get(str(data["name"]).strip().lower(), [])
        ingredients = [{"material_id": material_id, "name": name, "quantity": quantity} for material_id, name, quantity in recipe]

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
        "ingredients": ingredients,
        "inventory_mode": inventory_mode,
        "created_at": firestore.SERVER_TIMESTAMP,
        "updated_at": firestore.SERVER_TIMESTAMP,
    }
    ref = db.collection("menu_items").document()
    ref.set(item)
    return jsonify({"message": "Item added", "id": ref.id}), 201


@menu_bp.route("/inventory/defaults", methods=["POST"])
@admin_required
def load_inventory_defaults():
    """Seed raw materials and attach safe default recipes to known dishes."""
    for material_id, name, quantity, unit in DEFAULT_RAW_MATERIALS:
        ref = db.collection("raw_materials").document(material_id)
        if not ref.get().exists:
            ref.set({"name": name, "quantity": quantity, "unit": unit, "updated_at": firestore.SERVER_TIMESTAMP})

    updated_dishes = 0
    for doc in db.collection("menu_items").stream():
        item = doc.to_dict()
        normalized_name = str(item.get("name", "")).strip().lower()
        recipe = DEFAULT_RECIPES.get(normalized_name)
        if recipe and not item.get("ingredients"):
            doc.reference.update({
                "ingredients": [{"material_id": material_id, "name": name, "quantity": quantity} for material_id, name, quantity in recipe],
                "inventory_mode": "ingredients",
                "updated_at": firestore.SERVER_TIMESTAMP,
            })
            updated_dishes += 1
    return jsonify({"message": "Default inventory loaded", "updated_dishes": updated_dishes}), 200


@menu_bp.route("/inventory", methods=["GET"])
@admin_required
def get_raw_materials():
    materials = [{"id": doc.id, **doc.to_dict()} for doc in db.collection("raw_materials").stream()]
    materials.sort(key=lambda material: material.get("name", "").lower())
    return jsonify(materials), 200


@menu_bp.route("/inventory", methods=["POST"])
@admin_required
def add_raw_material():
    data = request.get_json(force=True) or {}
    name = str(data.get("name", "")).strip()
    if not name:
        return jsonify({"error": "name is required"}), 400
    quantity = float(data.get("quantity", 0))
    if quantity < 0:
        return jsonify({"error": "quantity cannot be negative"}), 400
    material_id = canonical_material_id(name)
    if not material_id:
        return jsonify({"error": "name must contain letters or numbers"}), 400
    ref = db.collection("raw_materials").document(material_id)
    ref.set({
        "name": name,
        "quantity": quantity,
        "unit": str(data.get("unit", "units")).strip() or "units",
        "updated_at": firestore.SERVER_TIMESTAMP,
    }, merge=True)
    return jsonify({"message": "Raw material saved", "id": material_id}), 201


@menu_bp.route("/inventory/<material_id>", methods=["PATCH"])
@admin_required
def update_raw_material(material_id):
    ref = db.collection("raw_materials").document(material_id)
    if not ref.get().exists:
        return jsonify({"error": "Raw material not found"}), 404
    data = request.get_json(force=True) or {}
    updates = {"updated_at": firestore.SERVER_TIMESTAMP}
    if "quantity" in data:
        quantity = float(data["quantity"])
        if quantity < 0:
            return jsonify({"error": "quantity cannot be negative"}), 400
        updates["quantity"] = quantity
    if "unit" in data:
        updates["unit"] = str(data["unit"]).strip() or "units"
    ref.update(updates)
    return jsonify({"message": "Raw material updated"}), 200


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
