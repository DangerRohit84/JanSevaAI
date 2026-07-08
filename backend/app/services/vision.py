import os
import logging
from app.config import settings

logger = logging.getLogger(__name__)

_client = None
_real_mode = False


def _get_vision_client():
    global _client, _real_mode
    if _client is not None:
        return _client

    credentials_path = settings.GOOGLE_APPLICATION_CREDENTIALS
    project_id = settings.GCP_PROJECT_ID

    if credentials_path and os.path.exists(credentials_path) and project_id:
        try:
            from google.cloud import vision
            _client = vision.ImageAnnotatorClient.from_service_account_json(credentials_path)
            _real_mode = True
            logger.info("Vision: Real mode (Google Cloud Vision)")
            return _client
        except Exception as e:
            logger.warning(f"Vision init failed: {e}, falling back to mock")

    logger.info("Vision: Mock mode (no credentials)")
    _client = "mock"
    _real_mode = False
    return None


def analyze_image(image_bytes: bytes) -> dict:
    client = _get_vision_client()

    if _real_mode and client:
        try:
            from google.cloud import vision

            image = vision.Image(content=image_bytes)

            labels_response = client.label_detection(image=image, max_results=10)
            labels = [
                {"description": l.description, "score": round(l.score, 2)}
                for l in labels_response.label_annotations
            ]

            ocr_response = client.text_detection(image=image)
            detected_text = ocr_response.text_annotations[0].description if ocr_response.text_annotations else ""

            safe_response = client.safe_search_detection(image=image)
            safe = safe_response.safe_search_annotation
            is_safe = (
                safe.violence != vision.Likelihood.LIKELY
                and safe.violence != vision.Likelihood.VERY_LIKELY
                and safe.adult != vision.Likelihood.LIKELY
            )

            label_names = [l["description"] for l in labels]

            return {
                "labels": label_names[:10],
                "label_scores": labels[:10],
                "detected_text": detected_text[:500],
                "is_safe": is_safe,
                "confidence": round(labels[0]["score"], 2) if labels else 0.0,
            }

        except Exception as e:
            logger.error(f"Vision analysis failed: {e}")
            return {
                "labels": [],
                "detected_text": "",
                "is_safe": True,
                "confidence": 0.0,
                "error": str(e),
            }

    return _mock_analyze()


def _mock_analyze() -> dict:
    import random
    mock_labels = [
        ["road", "infrastructure", "damage", "pothole", "urban"],
        ["building", "construction", "architecture", "city"],
        ["water", "river", "pollution", "environment"],
        ["electricity", "power lines", "utility", "urban"],
        ["garbage", "waste", "pollution", "sanitation"],
        ["school", "education", "building", "children"],
        ["hospital", "healthcare", "medical", "building"],
        ["farm", "agriculture", "crop", "rural"],
    ]
    chosen = random.choice(mock_labels)
    confidence = round(random.uniform(0.6, 0.9), 2)

    return {
        "labels": chosen,
        "label_scores": [{"description": l, "score": round(random.uniform(0.5, 0.9), 2)} for l in chosen],
        "detected_text": "",
        "is_safe": True,
        "confidence": confidence,
    }
