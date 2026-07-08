import os
import json
import random
import logging

from app.config import settings

logger = logging.getLogger(__name__)

_client = None
_real_mode = False


def get_gemini_client():
    global _client, _real_mode

    api_key = settings.GEMINI_API_KEY

    logger.info(f"Gemini API key present: {bool(api_key)}")

    if not api_key or api_key == "demo-key" or api_key == "your-gemini-api-key":
        logger.info("Gemini: Mock mode (no valid API key)")
        _client = "mock"
        _real_mode = False
        return None

    if _client is not None and _client != "mock":
        logger.info("Gemini: Reusing existing client")
        return _client

    try:
        from google import genai
        logger.info(f"Gemini: Creating client with model {settings.GEMINI_MODEL}")
        _client = genai.Client(api_key=api_key)
        _real_mode = True
        logger.info("Gemini: Real mode activated!")
        return _client
    except Exception as e:
        logger.error(f"Gemini init failed: {e}")
        _client = "mock"
        _real_mode = False
        return None


EXTRACTION_PROMPT = """You are an AI assistant analyzing citizen development requests for Indian MPs.

Analyze the following citizen submission and return a JSON object with these fields:
- category: one of [water, electricity, transport, health, education, sanitation, agriculture, infrastructure, other]
- themes: list of 2-5 key themes found in the text
- urgency: one of [critical, high, medium, low] based on severity
- key_phrases: list of 3-5 important phrases from the text
- sentiment: float between -1.0 (very negative) and 1.0 (very positive)
- summary: 1-2 sentence summary in English
- suggested_department: which government department should handle this
- estimated_cost: rough estimate category (low/medium/high)

Citizen submission:
Language: {language}
Text: {text}

Return ONLY valid JSON, no other text."""


def extract_themes(text: str, language: str = "hi") -> dict:
    client = get_gemini_client()

    if _real_mode and client:
        try:
            response = client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=EXTRACTION_PROMPT.format(language=language, text=text),
            )
            raw = response.text.strip()
            if raw.startswith("```"):
                raw = raw.split("\n", 1)[1].rsplit("```", 1)[0].strip()
            result = json.loads(raw)
            result.setdefault("category", "other")
            result.setdefault("themes", [])
            result.setdefault("urgency", "medium")
            result.setdefault("key_phrases", [])
            result.setdefault("sentiment", 0.0)
            result.setdefault("summary", "")
            result.setdefault("suggested_department", "")
            result.setdefault("estimated_cost", "medium")
            return result
        except Exception as e:
            logger.error(f"Gemini extraction failed: {e}")

    return _mock_extract(text, language)


def _mock_extract(text: str, language: str) -> dict:
    text_lower = text.lower()

    category = "other"
    keywords = {
        "water": ["water", "paani", "pani", "borewell", "handpump", "tap", "supply", "jal"],
        "electricity": ["electricity", "power", "bijli", "light", "solar", "outage", "cut"],
        "transport": ["road", "bridge", "traffic", "bus", "highway", "pothole", "sadar"],
        "health": ["hospital", "doctor", "medicine", "health", "clinic", "ambulance"],
        "education": ["school", "college", "teacher", "education", "student", "library"],
        "sanitation": ["garbage", "toilet", "drain", "sewage", "waste", "dustbin", "swachh"],
        "agriculture": ["farm", "crop", "irrigation", "fertilizer", "harvest", "kheti"],
        "infrastructure": ["building", "bridge", "dam", "construction", "repair"],
    }

    for cat, words in keywords.items():
        if any(w in text_lower for w in words):
            category = cat
            break

    urgency = "medium"
    urgent_words = ["emergency", "urgent", "critical", "died", "death", "accident", "flood"]
    high_words = ["broken", "damaged", "severe", "stuck", "blocked", "complaint"]
    if any(w in text_lower for w in urgent_words):
        urgency = "critical"
    elif any(w in text_lower for w in high_words):
        urgency = "high"

    themes = []
    for cat, words in keywords.items():
        matches = [w for w in words if w in text_lower]
        if matches:
            themes.append(f"{cat}: {', '.join(matches[:3])}")
    if not themes:
        themes = ["general grievance"]

    sentiment = round(random.uniform(-0.8, 0.2), 2)
    if any(w in text_lower for w in ["thank", "good", "happy", "appreciate"]):
        sentiment = round(random.uniform(0.3, 0.8), 2)

    summaries = {
        "water": "Citizen reported water supply issues requiring immediate department attention.",
        "electricity": "Citizen reported electricity/power supply problems affecting daily life.",
        "transport": "Citizen raised transport/road infrastructure concerns needing repair.",
        "health": "Citizen highlighted healthcare access issues in the area.",
        "education": "Citizen raised education infrastructure or access concerns.",
        "sanitation": "Citizen reported sanitation and hygiene issues requiring action.",
        "agriculture": "Citizen raised agricultural support or irrigation issues.",
        "infrastructure": "Citizen reported infrastructure damage or construction needs.",
    }
    summary = summaries.get(category, "Citizen submitted a development request requiring review.")

    depts = {
        "water": "Jal Shakti Department",
        "electricity": "Power Department",
        "transport": "Public Works Department (PWD)",
        "health": "Health Department",
        "education": "Education Department",
        "sanitation": "Municipal Corporation",
        "agriculture": "Agriculture Department",
        "infrastructure": "Public Works Department (PWD)",
    }

    return {
        "category": category,
        "themes": themes[:5],
        "urgency": urgency,
        "key_phrases": [t.split(": ")[-1] for t in themes[:3]],
        "sentiment": sentiment,
        "summary": summary,
        "suggested_department": depts.get(category, "General Administration"),
        "estimated_cost": random.choice(["low", "medium", "high"]),
    }


EVIDENCE_PROMPT = """You are an AI policy advisor for an Indian Member of Parliament.

Generate a policy evidence summary for the following development theme:
- Theme: {theme}
- Total citizen requests: {count}
- Location: {location}
- Key phrases from citizens: {key_phrases}

Provide a JSON response with:
- summary: 3-4 sentence policy summary
- key_findings: list of 3-5 key findings
- recommended_actions: list of 3-5 specific actionable recommendations
- estimated_beneficiaries: estimated number of people who would benefit
- priority_score: 1-10 priority rating
- similar_issues: list of related issues from other areas

Return ONLY valid JSON, no other text."""


def generate_evidence(theme, count, location, key_phrases, census_data=None):
    client = get_gemini_client()

    if _real_mode and client:
        try:
            response = client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=EVIDENCE_PROMPT.format(
                    theme=theme,
                    count=count,
                    location=location,
                    key_phrases=", ".join(key_phrases) if isinstance(key_phrases, list) else str(key_phrases),
                ),
            )
            raw = response.text.strip()
            if raw.startswith("```"):
                raw = raw.split("\n", 1)[1].rsplit("```", 1)[0].strip()
            result = json.loads(raw)
            result.setdefault("summary", "")
            result.setdefault("key_findings", [])
            result.setdefault("recommended_actions", [])
            result.setdefault("estimated_beneficiaries", count * 150)
            result.setdefault("priority_score", 5)
            result.setdefault("similar_issues", [])
            return result
        except Exception as e:
            logger.error(f"Gemini evidence generation failed: {e}")

    return _mock_evidence(theme, count, location, key_phrases)


def _mock_evidence(theme, count, location, key_phrases):
    beneficiaries = count * random.randint(100, 300)
    return {
        "summary": f"Citizens in {location} have raised {count} requests regarding {theme}. "
                   f"Analysis of citizen feedback reveals significant community concern requiring "
                   f"immediate administrative attention. The issues span multiple areas and affect "
                   f"a substantial portion of the local population.",
        "key_findings": [
            f"{count} citizens reported issues related to {theme}",
            f"Most requests originate from residential areas",
            f"Issues have been reported consistently over the past month",
            f"Community impact assessment indicates {beneficiaries} people affected",
        ],
        "recommended_actions": [
            f"Conduct field survey in {location} to assess ground reality",
            f"Allocate emergency funds for immediate {theme} improvements",
            f"Set up monitoring committee to track progress",
            f"Engage with local community leaders for feedback",
        ],
        "estimated_beneficiaries": beneficiaries,
        "priority_score": min(10, max(1, int(count / 10) + 5)),
        "similar_issues": [
            f"Similar {theme} complaints from neighboring wards",
            f"State-level {theme} infrastructure gaps",
        ],
    }


def classify_category(text: str) -> str:
    result = extract_themes(text)
    return result.get("category", "other")
