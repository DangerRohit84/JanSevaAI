import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "JanSevaAI"
    VERSION: str = "1.0.0"
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"

    GCP_PROJECT_ID: str = os.getenv("GCP_PROJECT_ID", "")
    GCP_REGION: str = os.getenv("GCP_REGION", "asia-south1")
    GOOGLE_APPLICATION_CREDENTIALS: str = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

    FIRESTORE_COLLECTION_SUBMISSIONS: str = "submissions"
    FIRESTORE_COLLECTION_ANALYSIS: str = "analysis"
    FIRESTORE_COLLECTION_CLUSTERS: str = "clusters"

    BIGQUERY_DATASET: str = os.getenv("BIGQUERY_DATASET", "jansevai")
    BIGQUERY_TABLE_SUBMISSIONS: str = "submissions"
    BIGQUERY_TABLE_EMBEDDINGS: str = "embeddings"

    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")

    CORS_ORIGINS: list = ["http://localhost:5173", "http://localhost:3000"]

    @property
    def is_gcp_configured(self) -> bool:
        # On Cloud Run, ADC works without GOOGLE_APPLICATION_CREDENTIALS
        # Just need GCP_PROJECT_ID set
        return bool(
            self.GCP_PROJECT_ID
            and self.GCP_PROJECT_ID != "your-gcp-project-id"
        )

    @property
    def is_gemini_configured(self) -> bool:
        return bool(
            self.GEMINI_API_KEY
            and self.GEMINI_API_KEY != "your-gemini-api-key"
            and self.GEMINI_API_KEY != "demo-key"
        )

    class Config:
        env_file = ".env"
        extra = "allow"


settings = Settings()
