import json
import os
import sys
import logging

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.db.firestore import get_firestore, get_collection

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def seed():
    db = get_firestore()
    if not db:
        print("ERROR: Firestore not configured")
        return

    seed_path = os.path.join(os.path.dirname(__file__), "..", "data", "seed", "sample_submissions.json")
    with open(seed_path, "r", encoding="utf-8") as f:
        submissions = json.load(f)

    print(f"Loading {len(submissions)} submissions into Firestore...")

    col = get_collection("submissions")
    batch_size = 500
    loaded = 0

    for i in range(0, len(submissions), batch_size):
        batch = submissions[i : i + batch_size]
        for sub in batch:
            doc_id = sub.get("id", f"sub-{loaded+1:05d}")
            col.document(doc_id).set(sub)
            loaded += 1

        print(f"  Loaded {loaded}/{len(submissions)}")

    print(f"Done! {loaded} submissions loaded into Firestore.")


if __name__ == "__main__":
    seed()
