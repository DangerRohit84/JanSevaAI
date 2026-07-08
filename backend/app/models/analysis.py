from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class ThemeCategory(str):
    INFRASTRUCTURE = "infrastructure"
    EDUCATION = "education"
    HEALTH = "health"
    WATER = "water"
    SANITATION = "sanitation"
    TRANSPORT = "transport"
    AGRICULTURE = "agriculture"
    ELECTRICITY = "electricity"
    OTHER = "other"


class AnalysisResult(BaseModel):
    id: str
    submission_id: str
    category: str
    themes: List[str]
    sentiment: float = 0.0
    urgency: str = "medium"
    key_phrases: List[str] = []
    embedding: Optional[List[float]] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ClusterResult(BaseModel):
    id: str
    theme: str
    category: str
    submission_count: int
    priority_score: float
    centroid_lat: float
    centroid_lon: float
    bounding_box: Optional[List[dict]] = None
    top_submissions: List[str] = []
    evidence_summary: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class PriorityRanking(BaseModel):
    rank: int
    cluster_id: str
    theme: str
    category: str
    submission_count: int
    priority_score: float
    evidence_summary: str
    recommended_action: str
    estimated_beneficiaries: Optional[int] = None


class DashboardStats(BaseModel):
    total_submissions: int
    total_clusters: int
    top_themes: List[dict]
    recent_submissions: List[dict]
    ward_distribution: List[dict]
    priority_queue: List[PriorityRanking]


class EvidenceSummary(BaseModel):
    cluster_id: str
    theme: str
    summary: str
    key_findings: List[str]
    recommended_actions: List[str]
    data_sources: List[str]
    generated_at: datetime = Field(default_factory=datetime.utcnow)
