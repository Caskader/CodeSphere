"""
One-off script to seed sample data into Firebase: users (Auth + Firestore
profile), menu items, and a couple of sample orders tying them together.

Run from the Backend/ folder (with serviceAccountKey.json present):
    python seed_data.py

Safe to re-run for menu items (they just get added again), but re-running
the user section will fail on duplicate emails unless you change them or
add the "skip if exists" handling included below.
"""

import firebase_admin
from firebase_admin import credentials, firestore, auth

cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred)
db = firestore.client()


# ---------------------------------------------------------------------
# 1. USERS
# ---------------------------------------------------------------------
def seed_users():
    users = [
        {
            "email": "admin@hostel.com",
            "password": "AdminPass123",
            "name": "Mess Manager",
            "room_number": "N/A",
            "hostel_block": "N/A",
            "role": "admin",   # gets the custom claim too
        },
        {
            "email": "student1@hostel.com",
            "password": "StudentPass123",
            "name": "Aditi Sharma",
            "room_number": "204",
            "hostel_block": "A",
            "role": "student",
        },
        {
            "email": "student2@hostel.com",
            "password": "StudentPass123",
            "name": "Rohan Verma",
            "room_number": "112",
            "hostel_block": "B",
            "role": "student",
        },
    ]

    created = {}  # email -> uid, so orders can reference them later

    for u in users:
        try:
            user_record = auth.create_user(
                email=u["email"],
                password=u["password"],
                display_name=u["name"],
            )
            uid = user_record.uid
            print(f"Created auth user: {u['email']} ({uid})")
        except auth.EmailAlreadyExistsError:
            # already exists from a previous run — just fetch it
            user_record = auth.get_user_by_email(u["email"])
            uid = user_record.uid
            print(f"User already existed: {u['email']} ({uid})")

        # Firestore profile doc
        db.collection("users").document(uid).set({
            "name": u["name"],
            "email": u["email"],
            "room_number": u["room_number"],
            "hostel_block": u["hostel_block"],
            "role": u["role"],
            "created_at": firestore.SERVER_TIMESTAMP,
        }, merge=True)

        # Custom claim for admins (only takes effect on their NEXT login)
        if u["role"] == "admin":
            auth.set_custom_user_claims(uid, {"admin": True})
            print(f"  -> granted admin claim to {u['email']}")

        created[u["email"]] = uid

    return created


# ---------------------------------------------------------------------
# 2. MENU ITEMS
# ---------------------------------------------------------------------
def seed_menu_items():
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

    created_ids = {}  # name -> doc id, so orders can reference them later

    for item in menu_items:
        item_with_meta = {
            **item,
            "created_at": firestore.SERVER_TIMESTAMP,
            "updated_at": firestore.SERVER_TIMESTAMP,
        }
        ref = db.collection("menu_items").document()
        ref.set(item_with_meta)
        created_ids[item["name"]] = ref.id
        print(f"Added menu item: {item['name']} ({ref.id})")

    return created_ids


# ---------------------------------------------------------------------
# 3. SAMPLE ORDERS (ties users + menu items together)
# ---------------------------------------------------------------------
def seed_orders(user_ids, menu_ids):
    student_uid = user_ids.get("student1@hostel.com")
    if not student_uid:
        print("Skipping orders — no student uid available")
        return

    order_items = [
        {"item_id": menu_ids["Veg Thali"], "name": "Veg Thali", "price": 60, "quantity": 1},
        {"item_id": menu_ids["Masala Dosa"], "name": "Masala Dosa", "price": 40, "quantity": 2},
    ]
    total = sum(i["price"] * i["quantity"] for i in order_items)

    order_ref = db.collection("orders").document()
    order_ref.set({
        "user_id": student_uid,
        "items": order_items,
        "total_amount": total,
        "status": "placed",
        "room_number": "204",
        "hostel_block": "A",
        "created_at": firestore.SERVER_TIMESTAMP,
        "updated_at": firestore.SERVER_TIMESTAMP,
    })
    print(f"Added sample order: {order_ref.id} (total ₹{total})")


# ---------------------------------------------------------------------
if __name__ == "__main__":
    print("Seeding users...")
    user_ids = seed_users()

    print("\nSeeding menu items...")
    menu_ids = seed_menu_items()

    print("\nSeeding sample orders...")
    seed_orders(user_ids, menu_ids)

    print("\nDone.")