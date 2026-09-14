# Hostel Mess Backend (Flask + Firebase)

A Zomato-style backend for ordering food from your hostel mess — students
browse the menu and place orders, mess staff manage the menu and update
order status. Auth and data storage run on Firebase (Auth + Firestore).

## 1. Firebase setup

1. Go to the [Firebase Console](https://console.firebase.google.com/) → create a project.
2. **Build → Authentication → Sign-in method** → enable **Email/Password**.
3. **Build → Firestore Database** → create database (start in production mode).
4. **Project settings → Service accounts → Generate new private key** →
   save the JSON as `serviceAccountKey.json` in this folder (keep it secret,
   don't commit it).
5. **Project settings → General → Web API Key** → copy it into `.env` as
   `FIREBASE_WEB_API_KEY` (used only to proxy email/password login).

## 2. Install & run

```bash
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env            # then fill in the values
python app.py                   # runs on http://localhost:5000
```

### Moving all app data to Realtime Database

Set `FIREBASE_DATABASE_URL` in `.env`, run the one-time migration while the
switch is off, then enable `FIREBASE_USE_REALTIME_DB=true` and restart Flask:

```bash
FIREBASE_USE_REALTIME_DB=false python migrate_hot_data_to_rtdb.py
FIREBASE_USE_REALTIME_DB=true python app.py
```

The migration recursively copies every Firestore collection and subcollection,
including `menu_items`, `orders`, `raw_materials`, `users`, and menu-item
reviews. After the switch, the API reads and writes these records in Realtime
Database. Firebase Authentication remains unchanged.

### Seed a new/disposable Realtime Database

To replace the RTDB menu and raw-material inventory with the bundled
development defaults (12 menu items and 12 materials), enable the RTDB switch
and run:

```bash
../.venv/bin/python Seed_menu.py
```

## 3. Make your first admin (mess staff)

There's a chicken-and-egg problem: `make-admin` requires an admin token.
Bootstrap the first one directly with the Admin SDK:

```python
# run once, e.g. in a Python shell: python -c "..."
import firebase_admin
from firebase_admin import credentials, auth
cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred)
auth.set_custom_user_claims("<uid_of_the_user_to_promote>", {"admin": True})
```
After this, that user's *next* login (fresh ID token) will carry `admin: true`.

## 4. API overview

All authenticated routes expect `Authorization: Bearer <id_token>`.

### Auth
| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/signup` | – | Create student account |
| POST | `/api/auth/login` | – | Email/password login → returns `id_token` |
| GET | `/api/auth/me` | student | Get own profile |
| POST | `/api/auth/make-admin` | admin | Promote another user to mess staff |
| POST | `/api/auth/admin/users` | admin | Create a student Auth account and profile |

### Menu
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/menu` | – | List items (`?category=`, `?available_only=true`) |
| GET | `/api/menu/<id>` | – | Get one item |
| POST | `/api/menu` | admin | Add item |
| PUT | `/api/menu/<id>` | admin | Edit item |
| PATCH | `/api/menu/<id>/availability` | admin | Toggle sold out / in stock |
| DELETE | `/api/menu/<id>` | admin | Remove item |

### Orders
| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/orders` | student | Place an order (`{items:[{item_id,quantity}]}`) |
| GET | `/api/orders/my` | student | Own order history |
| GET | `/api/orders/<id>` | owner/admin | Get one order |
| POST | `/api/orders/<id>/cancel` | owner/admin | Cancel before it's ready |
| GET | `/api/orders` | admin | All orders (`?status=placed`) |
| PATCH | `/api/orders/<id>/status` | admin | Move through `placed → preparing → ready → completed` |

### Reviews
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/menu/<item_id>/reviews` | – | List reviews for an item |
| POST | `/api/menu/<item_id>/reviews` | student | Add a 1–5 rating + comment |

### Announcements
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/announcements` | – | Published announcements for students |
| GET | `/api/announcements/admin` | admin | All announcements, including drafts |
| POST | `/api/announcements` | admin | Create an announcement in Realtime Database |
| PATCH | `/api/announcements/<id>` | admin | Edit or publish/unpublish an announcement |
| DELETE | `/api/announcements/<id>` | admin | Delete an announcement |

### Forecasting
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/predictions/monthly-demand` | admin | Five-dish preparation and raw-material forecast from `Data/final30.csv` |

## 5. Example: place an order

```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Authorization: Bearer <id_token>" \
  -H "Content-Type: application/json" \
  -d '{"items": [{"item_id": "abc123", "quantity": 2}]}'
```

Order totals are always recalculated server-side from the live menu price,
so a tampered client can't under-pay.

## 6. Recommended Firestore security rules

Since all writes go through this backend with the Admin SDK (which bypasses
rules), lock direct client access to read-only where relevant:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /menu_items/{itemId} {
      allow read: if true;
      allow write: if false; // only backend (Admin SDK) writes
      match /reviews/{reviewId} {
        allow read: if true;
        allow write: if false;
      }
    }
    match /orders/{orderId} {
      allow read, write: if false; // only backend
    }
    match /users/{userId} {
      allow read: if request.auth.uid == userId;
      allow write: if false;
    }
  }
}
```

## 7. Suggested next steps
- Add payment integration (Razorpay/Stripe) before marking an order `placed`.
- Push notifications (FCM) when order status changes.
- Daily/weekly menu scheduling instead of one static menu.
- Rate limiting on `/api/auth/login`.
