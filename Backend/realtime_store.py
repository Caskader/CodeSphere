"""Small Firestore-shaped adapter backed by Firebase Realtime Database.

Only the operations used by the hot menu/order/inventory routes are exposed.
This keeps the HTTP API stable while allowing the backing store to be changed
with FIREBASE_USE_REALTIME_DB=true.
"""
import copy
import datetime as _datetime
import uuid

from firebase_admin import db as realtime_db


def _clean(value):
    if isinstance(value, dict):
        return {key: _clean(item) for key, item in value.items()}
    if isinstance(value, list):
        return [_clean(item) for item in value]
    if isinstance(value, (_datetime.datetime, _datetime.date)):
        return value.isoformat()
    # Firestore sentinels and other SDK values are not JSON serializable. The
    # exact timestamp is not important for RTDB ordering, so use UTC now.
    if not isinstance(value, (str, int, float, bool)) and value is not None:
        return _datetime.datetime.now(_datetime.timezone.utc).isoformat()
    return value


class RealtimeSnapshot:
    def __init__(self, doc_id, value):
        self.id = doc_id
        self._value = value
        self.exists = value is not None

    def to_dict(self):
        return copy.deepcopy(self._value or {})


class RealtimeDocument:
    def __init__(self, path, doc_id):
        self.path = f"{path.rstrip('/')}/{doc_id}"
        self.id = doc_id

    def get(self, transaction=None):
        return RealtimeSnapshot(self.id, realtime_db.reference(self.path).get())

    def set(self, value, merge=False):
        ref = realtime_db.reference(self.path)
        if merge:
            current = ref.get() or {}
            current.update(_clean(value))
            ref.set(current)
        else:
            ref.set(_clean(value))

    def update(self, value):
        realtime_db.reference(self.path).update(_clean(value))

    def delete(self):
        realtime_db.reference(self.path).delete()

    def collection(self, name):
        return RealtimeCollection(f"{self.path}/{name}")


class RealtimeQuery:
    def __init__(self, collection, filters=None, ordering=None):
        self.collection = collection
        self.filters = filters or []
        self.ordering = ordering

    def where(self, field, op, value):
        return RealtimeQuery(self.collection, self.filters + [(field, op, value)], self.ordering)

    def order_by(self, field, direction=None):
        return RealtimeQuery(self.collection, self.filters, (field, direction))

    def stream(self):
        raw = realtime_db.reference(self.collection.path).get() or {}
        records = []
        for doc_id, value in raw.items() if isinstance(raw, dict) else []:
            if not isinstance(value, dict):
                continue
            if all(op == "==" and value.get(field) == expected for field, op, expected in self.filters):
                records.append(RealtimeSnapshot(doc_id, value))
        if self.ordering:
            field, direction = self.ordering
            records.sort(key=lambda snapshot: str(snapshot.to_dict().get(field, "")), reverse=str(direction).lower().endswith("descending"))
        return records


class RealtimeCollection:
    def __init__(self, path):
        self.path = path.strip("/")

    def document(self, doc_id=None):
        return RealtimeDocument(self.path, doc_id or uuid.uuid4().hex)

    def stream(self):
        return RealtimeQuery(self).stream()

    def where(self, field, op, value):
        return RealtimeQuery(self, [(field, op, value)])

    def order_by(self, field, direction=None):
        return RealtimeQuery(self, ordering=(field, direction))


class RealtimeTransaction:
    """Best-effort transaction facade for the existing route callbacks."""
    def get(self, document):
        return document.get(transaction=self)

    def update(self, document, value):
        document.update(value)

    def set(self, document, value):
        document.set(value)


class RealtimeDatabase:
    def collection(self, name):
        return RealtimeCollection(name)

    def transaction(self):
        return RealtimeTransaction()


def realtime_transactional(function):
    """Compatibility decorator for the inventory reservation callback."""
    def wrapped(transaction, *args, **kwargs):
        return function(transaction, *args, **kwargs)
    return wrapped
