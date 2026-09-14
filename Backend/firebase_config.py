"""
Initializes the Firebase Admin SDK (for Firestore + Auth token verification)
and exposes the Firestore client used across the app.
"""

import os
import firebase_admin
from firebase_admin import credentials, firestore, auth
from dotenv import load_dotenv

load_dotenv()

SERVICE_ACCOUNT_PATH = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH", "serviceAccountKey.json")

if not firebase_admin._apps:
    cred = credentials.Certificate(SERVICE_ACCOUNT_PATH)
    options = {}
    database_url = os.getenv("FIREBASE_DATABASE_URL")
    if database_url:
        options["databaseURL"] = database_url
    firebase_admin.initialize_app(cred, options)

firestore_db = firestore.client()
if os.getenv("FIREBASE_USE_REALTIME_DB", "false").lower() == "true":
    from realtime_store import RealtimeDatabase
    db = RealtimeDatabase()
else:
    db = firestore_db
firebase_auth = auth  # re-exported so routes can do `from firebase_config import firebase_auth`
