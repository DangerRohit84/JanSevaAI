from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum
from datetime import datetime


class InputType(str, Enum):
    VOICE = "voice"
    TEXT = "text"
    PHOTO = "photo"
    WHATSAPP = "whatsapp"


class SubmissionCreate(BaseModel):
    citizen_name: Optional[str] = None
    phone: Optional[str] = None
    language: str = "hi"
    input_type: InputType
    text_content: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None
    ward: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None


class SubmissionResponse(BaseModel):
    id: str
    citizen_name: Optional[str] = None
    language: str
    input_type: InputType
    text_content: Optional[str] = None
    photo_url: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None
    ward: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    status: str = "pending"
    created_at: datetime = Field(default_factory=datetime.utcnow)


class SubmissionList(BaseModel):
    submissions: List[SubmissionResponse]
    total: int
    page: int = 1
    page_size: int = 20
