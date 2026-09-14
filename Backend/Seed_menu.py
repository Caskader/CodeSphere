"""
One-off script to bulk-seed menu_items into Firestore.
Run from the Backend/ folder:  python seed_menu.py
"""

import firebase_admin
from firebase_admin import credentials, firestore

cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

menu_items = [
    {"name": "Veg Thali", "description": "Rice, dal, 2 sabzi, roti, salad",
     "price": 60, "category": "Lunch", "is_available": True, "image_url": ""},
    {"name": "Masala Dosa", "description": "Crispy dosa with potato filling, sambar, chutney",
     "price": 40, "category": "Breakfast", "is_available": True, "image_url": ""},
    {"name": "Chicken Curry Rice", "description": "Chicken curry with steamed rice",
     "price": 80, "category": "Dinner", "is_available": True, "image_url": ""},
    {"name": "Veg Sandwich", "description": "Grilled sandwich with mixed veggies",
     "price": 30, "category": "Snacks", "is_available": True, "image_url": ""},
    {"name": "Poha", "description": "Flattened rice with peanuts, onions, spices",
     "price": 25, "category": "Breakfast", "is_available": True, "image_url": ""},
]

for item in menu_items:
    item["created_at"] = firestore.SERVER_TIMESTAMP
    item["updated_at"] = firestore.SERVER_TIMESTAMP
    ref = db.collection("menu_items").document()
    ref.set(item)
    print(f"Added: {item['name']} ({ref.id})")

print(f"\nDone — seeded {len(menu_items)} items.")