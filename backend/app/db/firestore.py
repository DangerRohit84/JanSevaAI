import os
import json
import logging
from typing import Optional
from app.config import settings

logger = logging.getLogger(__name__)

_db = None
_real_mode = False
_in_memory_db = {}


def get_firestore():
    global _db, _real_mode
    if _db is not None:
        return _db if _real_mode else None

    credentials_path = settings.GOOGLE_APPLICATION_CREDENTIALS
    project_id = settings.GCP_PROJECT_ID

    if credentials_path and os.path.exists(credentials_path) and project_id:
        try:
            from google.cloud import firestore
            client = firestore.Client.from_service_account_json(credentials_path, project=project_id)
            client.collection("_test").limit(1).get()
            _db = client
            _real_mode = True
            logger.info("Firestore: Real mode (Google Cloud Firestore)")
            return _db
        except Exception as e:
            logger.warning(f"Firestore init failed: {e}, falling back to in-memory")

    logger.info("Firestore: In-memory mock mode")
    _db = "mock"
    _real_mode = False
    return None


class MockDocument:
    def __init__(self, doc_id, data, collection_name=None):
        self._id = doc_id
        self._data = data
        self.id = doc_id
        self._collection_name = collection_name

    def to_dict(self):
        return dict(self._data) if self._data else {}

    @property
    def exists(self):
        return self._data is not None

    def set(self, data):
        if isinstance(data, dict):
            self._data = data
        else:
            self._data = data
        if self._collection_name:
            if self._collection_name not in _in_memory_db:
                _in_memory_db[self._collection_name] = {}
            _in_memory_db[self._collection_name][self._id] = self._data

    def get(self):
        return self


class MockCollection:
    def __init__(self, name):
        self._name = name
        if name not in _in_memory_db:
            _in_memory_db[name] = {}

    def document(self, doc_id):
        data = _in_memory_db[self._name].get(doc_id)
        return MockDocument(doc_id, data, collection_name=self._name)

    def add(self, data):
        import uuid
        doc_id = f"sub-{uuid.uuid4().hex[:5]}"
        _in_memory_db[self._name][doc_id] = data
        return (None, MockDocument(doc_id, data))

    def stream(self):
        for doc_id, data in _in_memory_db[self._name].items():
            yield MockDocument(doc_id, data)

    def where(self, field, op, value):
        return MockQuery(self, field, op, value)

    def limit(self, n):
        return MockQuery(self).limit(n)

    def order_by(self, field, direction="DESCENDING"):
        return MockQuery(self).order_by(field, direction)

    def get(self):
        return [MockDocument(did, data) for did, data in _in_memory_db[self._name].items()]

    def set(self, data):
        if hasattr(data, 'id'):
            _in_memory_db[self._name][data.id] = data.to_dict()
        elif isinstance(data, dict) and "id" in data:
            _in_memory_db[self._name][data["id"]] = data
        else:
            pass


class MockQuery:
    def __init__(self, collection=None, field=None, op=None, value=None):
        self._collection = collection
        self._filters = []
        self._limit_val = None
        self._order_field = None
        self._order_dir = "DESCENDING"

        if collection and field:
            self._filters.append((field, op, value))

    def where(self, field, op, value):
        new = MockQuery()
        new._collection = self._collection
        new._filters = list(self._filters) + [(field, op, value)]
        new._limit_val = self._limit_val
        return new

    def limit(self, n):
        self._limit_val = n
        return self

    def order_by(self, field, direction="DESCENDING"):
        self._order_field = field
        self._order_dir = direction
        return self

    def stream(self):
        if not self._collection:
            return []

        results = []
        for doc_id, data in _in_memory_db.get(self._collection._name, {}).items():
            match = True
            for field, op, value in self._filters:
                actual = data.get(field)
                if op == "==" and actual != value:
                    match = False
                    break
                elif op == "!=" and actual == value:
                    match = False
                    break
                elif op == ">=" and (actual is None or actual < value):
                    match = False
                    break
                elif op == "<=" and (actual is None or actual > value):
                    match = False
                    break
            if match:
                results.append(MockDocument(doc_id, data))

        if self._order_field:
            reverse = self._order_dir == "DESCENDING"
            results.sort(key=lambda d: d.to_dict().get(self._order_field, ""), reverse=reverse)

        if self._limit_val:
            results = results[:self._limit_val]

        return results

    def get(self):
        return self.stream()


def get_collection(name: str):
    if not _db:
        get_firestore()
    if _real_mode and _db:
        return _db.collection(name)
    return MockCollection(name)


def seed_submissions(submissions: list):
    global _in_memory_db
    if "submissions" not in _in_memory_db:
        _in_memory_db["submissions"] = {}

    for i, sub in enumerate(submissions):
        doc_id = sub.get("id", f"sub-{i+1:05d}")
        _in_memory_db["submissions"][doc_id] = sub

    logger.info(f"Loaded {len(submissions)} submissions into {'Firestore' if _real_mode else 'in-memory'}")


def load_seed_data():
    seed_path = os.path.join(
        os.path.dirname(__file__), "..", "..", "..", "data", "seed", "sample_submissions.json"
    )
    if os.path.exists(seed_path):
        with open(seed_path, "r", encoding="utf-8") as f:
            submissions = json.load(f)
        seed_submissions(submissions)
        logger.info(f"Loaded {len(submissions)} seed submissions")
    else:
        logger.warning(f"Seed data not found at {seed_path}")


if not _real_mode and not _in_memory_db:
    load_seed_data()
