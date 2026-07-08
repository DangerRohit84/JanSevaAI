from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional
import uuid
from datetime import datetime

from app.db.firestore import get_collection
from app.services.gemini import extract_themes
from app.services.stt import transcribe_audio
from app.services.vision import analyze_image
from app.models.submission import SubmissionCreate, SubmissionResponse, InputType

router = APIRouter(prefix="/api/v1/submit", tags=["submission"])


@router.post("/", response_model=dict)
async def submit_text(submission: SubmissionCreate):
    doc_id = str(uuid.uuid4())

    analysis = None
    if submission.text_content:
        analysis = extract_themes(submission.text_content, submission.language)

    doc_data = {
        "id": doc_id,
        "citizen_name": submission.citizen_name,
        "phone": submission.phone,
        "language": submission.language,
        "input_type": submission.input_type.value,
        "text_content": submission.text_content,
        "latitude": submission.latitude,
        "longitude": submission.longitude,
        "address": submission.address,
        "ward": submission.ward,
        "district": submission.district,
        "state": submission.state,
        "status": "analyzed" if analysis else "pending",
        "created_at": datetime.utcnow().isoformat(),
    }

    if analysis:
        doc_data["analysis"] = analysis

    get_collection("submissions").document(doc_id).set(doc_data)

    return {
        "id": doc_id,
        "status": "analyzed" if analysis else "pending",
        "analysis": analysis,
        "message": "Submission received and analyzed successfully",
    }


@router.post("/voice", response_model=dict)
async def submit_voice(
    audio: UploadFile = File(...),
    language: str = Form("hi-IN"),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    ward: Optional[str] = Form(None),
    district: Optional[str] = Form(None),
    state: Optional[str] = Form(None),
):
    doc_id = str(uuid.uuid4())
    audio_bytes = await audio.read()

    stt_result = transcribe_audio(audio_bytes, language)
    transcript = stt_result.get("transcript", "")

    if not transcript:
        raise HTTPException(status_code=400, detail="Could not transcribe audio")

    analysis = extract_themes(transcript, language.split("-")[0])

    doc_data = {
        "id": doc_id,
        "language": language.split("-")[0],
        "input_type": "voice",
        "text_content": transcript,
        "stt_confidence": stt_result.get("confidence", 0),
        "latitude": latitude,
        "longitude": longitude,
        "ward": ward,
        "district": district,
        "state": state,
        "status": "analyzed",
        "analysis": analysis,
        "created_at": datetime.utcnow().isoformat(),
    }

    get_collection("submissions").document(doc_id).set(doc_data)

    return {
        "id": doc_id,
        "transcript": transcript,
        "confidence": stt_result.get("confidence", 0),
        "analysis": analysis,
        "message": "Voice submission processed successfully",
    }


@router.post("/photo", response_model=dict)
async def submit_photo(
    photo: UploadFile = File(...),
    text_content: Optional[str] = Form(None),
    language: str = Form("hi"),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    address: Optional[str] = Form(None),
    ward: Optional[str] = Form(None),
    district: Optional[str] = Form(None),
    state: Optional[str] = Form(None),
):
    doc_id = str(uuid.uuid4())
    photo_bytes = await photo.read()

    vision_result = analyze_image(photo_bytes)

    combined_text = text_content or " ".join(vision_result.get("labels", []))
    analysis = extract_themes(combined_text, language)

    doc_data = {
        "id": doc_id,
        "language": language,
        "input_type": "photo",
        "text_content": combined_text,
        "photo_labels": vision_result.get("labels", []),
        "photo_detected_text": vision_result.get("detected_text", ""),
        "latitude": latitude,
        "longitude": longitude,
        "address": address,
        "ward": ward,
        "district": district,
        "state": state,
        "status": "analyzed",
        "analysis": analysis,
        "created_at": datetime.utcnow().isoformat(),
    }

    get_collection("submissions").document(doc_id).set(doc_data)

    return {
        "id": doc_id,
        "photo_analysis": vision_result,
        "analysis": analysis,
        "message": "Photo submission processed successfully",
    }


@router.get("/", response_model=dict)
async def list_submissions(page: int = 1, page_size: int = 20):
    docs = (
        get_collection("submissions")
        .order_by("created_at", direction="DESCENDING")
        .limit(page_size)
        .stream()
    )

    submissions = []
    for doc in docs:
        data = doc.to_dict()
        data["id"] = doc.id
        submissions.append(data)

    return {
        "submissions": submissions,
        "total": len(submissions),
        "page": page,
        "page_size": page_size,
    }


@router.get("/{submission_id}", response_model=dict)
async def get_submission(submission_id: str):
    doc = get_collection("submissions").document(submission_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Submission not found")

    data = doc.to_dict()
    data["id"] = doc.id
    return data
