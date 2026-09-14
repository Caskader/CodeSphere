"""Copy all Firestore data to Realtime Database, preserving document paths.

Run once from Backend/ after setting FIREBASE_DATABASE_URL:
    FIREBASE_USE_REALTIME_DB=false python migrate_hot_data_to_rtdb.py
Then start the API with FIREBASE_USE_REALTIME_DB=true.

The migration is recursive: top-level collections and every document
subcollection are copied.  This includes menu_items, orders, raw_materials,
users, and menu-item reviews without needing to maintain a collection list.
"""
import datetime
import os

from firebase_admin import db as realtime_db, firestore
from firebase_config import firebase_auth  # initializes the Admin app


def json_safe(value):
    if isinstance(value, dict):
        return {key: json_safe(item) for key, item in value.items()}
    if isinstance(value, list):
        return [json_safe(item) for item in value]
    if isinstance(value, (datetime.datetime, datetime.date)):
        return value.isoformat()
    return value


def migrate_collection(collection, destination, label):
    """Copy a Firestore collection and all of its nested subcollections."""
    count = 0
    for document in collection.stream():
        document_destination = destination.child(document.id)
        document_destination.set(json_safe(document.to_dict()))
        count += 1
        for subcollection in document.reference.collections():
            count += migrate_collection(
                subcollection,
                document_destination.child(subcollection.id),
                f"{label}/{document.id}/{subcollection.id}",
            )
    print(f"Migrated {count} records from {label}")
    return count


def main():
    if not os.getenv("FIREBASE_DATABASE_URL"):
        raise SystemExit("FIREBASE_DATABASE_URL is required")
    firestore_db = firestore.client()
    total = 0
    for collection in firestore_db.collections():
        total += migrate_collection(
            collection, realtime_db.reference(f"/{collection.id}"), collection.id
        )
    print(f"Full migration complete: {total} records copied")


if __name__ == "__main__":
    main()
