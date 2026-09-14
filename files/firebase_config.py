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
    firebase_admin.initialize_app(cred)

db = firestore.client()
firebase_auth = auth  # re-exported so routes can do `from firebase_config import firebase_auth`
