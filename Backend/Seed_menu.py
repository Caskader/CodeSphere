"""
One-off script to bulk-seed menu_items into Firestore.
Run from the Backend/ folder:  python Seed_menu.py
"""

import firebase_admin
from firebase_admin import credentials, firestore
import os

if not firebase_admin._apps:
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred)
db = firestore.client()

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

# Delete old items first to prevent duplicates
old_docs = list(db.collection("menu_items").stream())
for doc in old_docs:
    db.collection("menu_items").document(doc.id).delete()
print(f"Cleared {len(old_docs)} old menu items.")

for item in menu_items:
    item["created_at"] = firestore.SERVER_TIMESTAMP
    item["updated_at"] = firestore.SERVER_TIMESTAMP
    ref = db.collection("menu_items").document()
    ref.set(item)
    print(f"Added: {item['name']} ({ref.id})")

print(f"\nDone — seeded {len(menu_items)} items into Firestore.")