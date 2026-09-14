"""Replace the disposable RTDB menu and inventory with development defaults.

Run from Backend/:  ../.venv/bin/python Seed_menu.py
The script deliberately refuses to run unless FIREBASE_USE_REALTIME_DB=true,
so it cannot accidentally erase the old Firestore menu.
"""

from firebase_admin import firestore

from firebase_config import db


if type(db).__name__ != "RealtimeDatabase":
    raise SystemExit(
        "Set FIREBASE_USE_REALTIME_DB=true in .env before seeding Realtime Database"
    )

menu_items = [
    {
        "name": "Masala Dosa",
        "description": "Crispy rice crepe with spiced potato filling, sambar & chutneys",
        "price": 60,
        "category": "South Indian",
        "status": "available",
        "is_available": True,
        "emoji": "🫓",
        "prepTime": 5,
        "image_url": "",
    },
    {
        "name": "Paneer Butter Masala",
        "description": "Cottage cheese in rich tomato-cream gravy with buttered naan",
        "price": 120,
        "category": "Main Course",
        "status": "available",
        "is_available": True,
        "emoji": "🧆",
        "prepTime": 8,
        "image_url": "",
    },
    {
        "name": "Chicken Biryani",
        "description": "Fragrant basmati rice cooked with tender chicken & whole spices",
        "price": 150,
        "category": "Main Course",
        "status": "limited",
        "is_available": True,
        "emoji": "🍛",
        "prepTime": 3,
        "image_url": "",
    },
    {
        "name": "Veg Fried Rice",
        "description": "Stir-fried rice with fresh vegetables, soy sauce & egg",
        "price": 80,
        "category": "Chinese",
        "status": "available",
        "is_available": True,
        "emoji": "🍚",
        "prepTime": 6,
        "image_url": "",
    },
    {
        "name": "Butter Naan",
        "description": "Soft leavened flatbread baked in tandoor, brushed with butter",
        "price": 30,
        "category": "Bread",
        "status": "available",
        "is_available": True,
        "emoji": "🫔",
        "prepTime": 4,
        "image_url": "",
    },
    {
        "name": "Pav Bhaji",
        "description": "Spiced vegetable mash served with buttered pav and raw onions",
        "price": 70,
        "category": "Street Food",
        "status": "available",
        "is_available": True,
        "emoji": "🥘",
        "prepTime": 5,
        "image_url": "",
    },
    {
        "name": "Egg Curry",
        "description": "Boiled eggs in spicy onion-tomato masala, served with rice",
        "price": 90,
        "category": "Main Course",
        "status": "limited",
        "is_available": True,
        "emoji": "🥚",
        "prepTime": 6,
        "image_url": "",
    },
    {
        "name": "Manchurian (Veg)",
        "description": "Crispy veggie balls in tangy Indo-Chinese manchurian sauce",
        "price": 85,
        "category": "Chinese",
        "status": "unavailable",
        "is_available": False,
        "emoji": "🔴",
        "prepTime": 7,
        "image_url": "",
    },
    {
        "name": "Cold Coffee",
        "description": "Blended coffee with milk, ice cream and chocolate syrup",
        "price": 50,
        "category": "Beverages",
        "status": "available",
        "is_available": True,
        "emoji": "☕",
        "prepTime": 3,
        "image_url": "",
    },
    {
        "name": "Gulab Jamun",
        "description": "Soft milk-solid dumplings soaked in rose-cardamom sugar syrup",
        "price": 40,
        "category": "Dessert",
        "status": "available",
        "is_available": True,
        "emoji": "🍮",
        "prepTime": 2,
        "image_url": "",
    },
    {
        "name": "Chole Bhature",
        "description": "Spiced chickpea curry served with fluffy deep-fried bhature",
        "price": 90,
        "category": "North Indian",
        "status": "available",
        "is_available": True,
        "emoji": "🫘",
        "prepTime": 5,
        "image_url": "",
    },
    {
        "name": "Mango Lassi",
        "description": "Thick chilled yogurt drink blended with Alphonso mango pulp",
        "price": 45,
        "category": "Beverages",
        "status": "limited",
        "is_available": True,
        "emoji": "🥭",
        "prepTime": 2,
        "image_url": "",
    },
]

raw_materials = [
    {"id": "bread", "name": "Bread", "quantity": 100, "unit": "slices"},
    {"id": "tomato", "name": "Tomato", "quantity": 100, "unit": "pieces"},
    {"id": "potato", "name": "Potato", "quantity": 30, "unit": "kg"},
    {"id": "pasta", "name": "Pasta", "quantity": 15, "unit": "kg"},
    {"id": "carrot", "name": "Carrot", "quantity": 15, "unit": "kg"},
    {"id": "cheese", "name": "Cheese", "quantity": 10, "unit": "kg"},
    {"id": "rice", "name": "Rice", "quantity": 50, "unit": "kg"},
    {"id": "onion", "name": "Onion", "quantity": 25, "unit": "kg"},
    {"id": "paneer", "name": "Paneer", "quantity": 12, "unit": "kg"},
    {"id": "lentils", "name": "Lentils", "quantity": 25, "unit": "kg"},
    {"id": "flour", "name": "Flour", "quantity": 40, "unit": "kg"},
    {"id": "oil", "name": "Oil", "quantity": 20, "unit": "litres"},
]

# Replace only disposable RTDB menu and material records to prevent duplicates.
old_docs = list(db.collection("menu_items").stream())
for doc in old_docs:
    db.collection("menu_items").document(doc.id).delete()
old_materials = list(db.collection("raw_materials").stream())
for doc in old_materials:
    db.collection("raw_materials").document(doc.id).delete()
print(f"Cleared {len(old_docs)} menu items and {len(old_materials)} raw materials.")

for item in menu_items:
    item["created_at"] = firestore.SERVER_TIMESTAMP
    item["updated_at"] = firestore.SERVER_TIMESTAMP
    ref = db.collection("menu_items").document()
    ref.set(item)
    print(f"Added: {item['name']} ({ref.id})")

for material in raw_materials:
    material_id = material.pop("id")
    material["updated_at"] = firestore.SERVER_TIMESTAMP
    db.collection("raw_materials").document(material_id).set(material)

print(
    f"\nDone — seeded {len(menu_items)} menu items and "
    f"{len(raw_materials)} raw materials into Realtime Database."
)
