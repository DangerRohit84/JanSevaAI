from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import hashlib
import secrets
from datetime import datetime

from app.db.firestore import get_collection

router = APIRouter(prefix="/api/v1/mp", tags=["mp-auth"])

_tokens = {}


class MPRegister(BaseModel):
    name: str
    email: str
    password: str
    constituency: str
    sector: str  # "education", "health", "infrastructure", "water", "sanitation", "transport", "agriculture", "electricity", "all"
    party: Optional[str] = None
    phone: Optional[str] = None


class MPLogin(BaseModel):
    email: str
    password: str


class MPAction(BaseModel):
    submission_id: str
    action: str  # "review", "approved", "in_progress", "resolved", "rejected"
    notes: Optional[str] = None


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


@router.post("/register", response_model=dict)
def register(mp: MPRegister):
    existing = get_collection("mps").document(mp.email).get()
    if hasattr(existing, 'exists') and existing.exists:
        raise HTTPException(status_code=400, detail="Email already registered")

    mp_data = {
        "name": mp.name,
        "email": mp.email,
        "password": hash_password(mp.password),
        "constituency": mp.constituency,
        "sector": mp.sector,
        "party": mp.party,
        "phone": mp.phone,
        "role": "mp",
        "created_at": datetime.utcnow().isoformat(),
    }

    get_collection("mps").document(mp.email).set(mp_data)

    token = secrets.token_hex(32)
    _tokens[token] = {"email": mp.email, "role": "mp"}

    return {
        "message": "MP registered successfully",
        "token": token,
        "mp": {
            "name": mp.name,
            "email": mp.email,
            "constituency": mp.constituency,
            "sector": mp.sector,
        },
    }


@router.post("/login", response_model=dict)
def login(credentials: MPLogin):
    doc = get_collection("mps").document(credentials.email).get()
    if not hasattr(doc, 'exists') or not doc.exists:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    data = doc.to_dict()
    if data.get("password") != hash_password(credentials.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = secrets.token_hex(32)
    _tokens[token] = {"email": credentials.email, "role": "mp"}

    return {
        "message": "Login successful",
        "token": token,
        "mp": {
            "name": data.get("name"),
            "email": data.get("email"),
            "constituency": data.get("constituency"),
            "sector": data.get("sector"),
            "party": data.get("party"),
        },
    }


def get_mp_sector():
    return _mp_sectors.get("current", "all")

_mp_sectors = {"current": "all"}

@router.get("/dashboard", response_model=dict)
def mp_dashboard(sector: Optional[str] = None):
    docs = list(get_collection("submissions").limit(6000).stream())

    total = len(docs)
    pending = 0
    reviewed = 0
    resolved = 0

    sector_counts = {}
    for doc in docs:
        data = doc.to_dict()
        status = data.get("status", "pending")
        cat = data.get("analysis", {}).get("category", "other")
        sector_counts[cat] = sector_counts.get(cat, 0) + 1
        if status == "pending":
            pending += 1
        elif status in ("reviewed", "analyzed"):
            reviewed += 1
        elif status == "resolved":
            resolved += 1

    recent = []
    for doc in docs[:20]:
        data = doc.to_dict()
        recent.append({
            "id": doc.id,
            "citizen_name": data.get("citizen_name", "Anonymous"),
            "phone": data.get("phone", ""),
            "text": data.get("text_content", "")[:150],
            "category": data.get("analysis", {}).get("category", "other"),
            "urgency": data.get("analysis", {}).get("urgency", "medium"),
            "status": data.get("status", "pending"),
            "ward": data.get("ward", ""),
            "district": data.get("district", ""),
            "created_at": data.get("created_at"),
        })

    return {
        "stats": {
            "total": total,
            "pending": pending,
            "reviewed": reviewed,
            "resolved": resolved,
            "sector_counts": sector_counts,
        },
        "recent_submissions": recent,
    }


@router.post("/action", response_model=dict)
def take_action(action: MPAction):
    doc = get_collection("submissions").document(action.submission_id).get()
    if not hasattr(doc, 'exists') or not doc.exists:
        raise HTTPException(status_code=404, detail="Submission not found")

    valid_actions = ["reviewed", "in_progress", "resolved", "rejected"]
    if action.action not in valid_actions:
        raise HTTPException(status_code=400, detail=f"Invalid action. Use: {valid_actions}")

    update_data = {
        "status": action.action,
        "mp_notes": action.notes,
        "updated_at": datetime.utcnow().isoformat(),
    }

    get_collection("submissions").document(action.submission_id).set(
        {**doc.to_dict(), **update_data}
    )

    return {
        "message": f"Submission {action.action} successfully",
        "submission_id": action.submission_id,
        "new_status": action.action,
    }


@router.get("/submissions", response_model=dict)
def list_submissions(status: Optional[str] = None, category: Optional[str] = None, page: int = 1, page_size: int = 50):
    urgency_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}

    offset = (page - 1) * page_size

    if status:
        query = get_collection("submissions").where("status", "==", status)
    else:
        query = get_collection("submissions")

    all_docs = list(query.limit(offset + page_size).stream())
    docs = all_docs[offset:]

    submissions = []
    for doc in docs:
        data = doc.to_dict()
        data["id"] = doc.id
        urgency = data.get("analysis", {}).get("urgency", "medium")
        data["_urgency_rank"] = urgency_order.get(urgency, 2)
        submissions.append(data)

    if category and category != "all":
        submissions = [s for s in submissions if s.get("analysis", {}).get("category") == category]

    submissions.sort(key=lambda x: (x["_urgency_rank"], x.get("created_at", "")))

    for s in submissions:
        s.pop("_urgency_rank", None)

    total_query = get_collection("submissions")
    if status:
        total_query = total_query.where("status", "==", status)
    total_count = len(list(total_query.stream()))

    return {
        "submissions": submissions,
        "total": total_count,
        "page": page,
        "page_size": page_size,
        "has_more": offset + page_size < total_count,
    }
