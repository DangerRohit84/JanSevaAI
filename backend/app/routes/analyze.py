from fastapi import APIRouter, HTTPException
from typing import List

from app.db.firestore import get_collection
from app.services.gemini import generate_evidence
from app.services.ranking import calculate_priority_score, get_urgency_weight, get_category_weight
from app.services.clustering import dbscan_cluster
from app.models.analysis import PriorityRanking, DashboardStats

router = APIRouter(prefix="/api/v1/analysis", tags=["analysis"])

CATEGORY_LIST = ["water", "electricity", "transport", "health", "education", "sanitation", "agriculture", "infrastructure", "other"]


@router.get("/themes", response_model=dict)
async def get_themes():
    docs = get_collection("submissions").where("status", "==", "analyzed").limit(2000).stream()

    themes = {}
    for doc in docs:
        data = doc.to_dict()
        analysis = data.get("analysis", {})
        category = analysis.get("category", "other")
        for theme in analysis.get("themes", []):
            key = f"{category}:{theme}"
            if key not in themes:
                themes[key] = {
                    "category": category,
                    "theme": theme,
                    "count": 0,
                    "submissions": [],
                }
            themes[key]["count"] += 1
            if len(themes[key]["submissions"]) < 50:
                themes[key]["submissions"].append(doc.id)

    sorted_themes = sorted(themes.values(), key=lambda x: x["count"], reverse=True)[:100]

    return {"themes": sorted_themes, "total": len(sorted_themes)}


@router.get("/hotspots", response_model=dict)
async def get_hotspots():
    docs = get_collection("submissions").limit(3000).stream()

    points = []
    for doc in docs:
        data = doc.to_dict()
        lat = data.get("latitude")
        lon = data.get("longitude")
        if lat and lon:
            points.append({
                "id": doc.id,
                "latitude": lat,
                "longitude": lon,
                "theme": data.get("analysis", {}).get("category", "other"),
                "ward": data.get("ward", ""),
                "district": data.get("district", ""),
            })

    clusters = dbscan_cluster(points, eps_meters=500, min_points=2)

    for cluster in clusters:
        cluster_ids = set(cluster.get("submission_ids", []))
        themes = [p["theme"] for p in points if p["id"] in cluster_ids]
        cluster["dominant_theme"] = max(set(themes), key=themes.count) if themes else "other"
        cluster["submission_ids"] = cluster["submission_ids"][:5]

    return {"hotspots": clusters[:50], "total": len(clusters)}


@router.get("/ranking", response_model=dict)
async def get_priority_ranking():
    docs = get_collection("submissions").where("status", "==", "analyzed").limit(3000).stream()

    category_stats = {}
    for doc in docs:
        data = doc.to_dict()
        analysis = data.get("analysis", {})
        category = analysis.get("category", "other")
        urgency = analysis.get("urgency", "medium")

        if category not in category_stats:
            category_stats[category] = {
                "category": category,
                "count": 0,
                "themes": {},
                "max_urgency": "low",
                "submissions": [],
            }

        category_stats[category]["count"] += 1
        if len(category_stats[category]["submissions"]) < 5:
            category_stats[category]["submissions"].append(doc.id)

        for theme in analysis.get("themes", []):
            category_stats[category]["themes"][theme] = (
                category_stats[category]["themes"].get(theme, 0) + 1
            )

        urgency_order = {"low": 0, "medium": 1, "high": 2, "critical": 3}
        if urgency_order.get(urgency, 0) > urgency_order.get(category_stats[category]["max_urgency"], 0):
            category_stats[category]["max_urgency"] = urgency

    rankings = []
    for cat, stats in category_stats.items():
        top_themes = sorted(stats["themes"].items(), key=lambda x: x[1], reverse=True)[:3]
        priority = calculate_priority_score(
            submission_count=stats["count"],
            recent_count_7d=stats["count"],
            recent_count_30d=stats["count"],
            urgency_weight=get_urgency_weight(stats["max_urgency"]),
            category_weight=get_category_weight(cat),
        )

        rankings.append({
            "category": cat,
            "submission_count": stats["count"],
            "priority_score": priority,
            "top_themes": [{"theme": t, "count": c} for t, c in top_themes],
            "max_urgency": stats["max_urgency"],
            "sample_submissions": stats["submissions"],
        })

    rankings.sort(key=lambda x: x["priority_score"], reverse=True)

    for i, r in enumerate(rankings):
        r["rank"] = i + 1

    return {"rankings": rankings, "total": len(rankings)}


@router.get("/evidence/{category}", response_model=dict)
async def get_evidence(category: str):
    docs = get_collection("submissions").where("status", "==", "analyzed").limit(2000).stream()

    category_submissions = []
    for doc in docs:
        data = doc.to_dict()
        analysis = data.get("analysis", {})
        if analysis.get("category") == category and len(category_submissions) < 200:
            category_submissions.append(data)

    if not category_submissions:
        raise HTTPException(status_code=404, detail="No submissions found for this category")

    themes = []
    locations = []
    key_phrases = []
    for sub in category_submissions:
        analysis = sub.get("analysis", {})
        themes.extend(analysis.get("themes", [])[:3])
        key_phrases.extend(analysis.get("key_phrases", [])[:3])
        if sub.get("district"):
            locations.append(sub["district"])

    location_str = ", ".join(list(set(locations))) if locations else "Unknown location"
    phrase_str = ", ".join(list(set(key_phrases))[:10]) if key_phrases else "N/A"

    evidence = generate_evidence(
        theme=category,
        count=len(category_submissions),
        location=location_str,
        key_phrases=phrase_str,
    )

    return {
        "category": category,
        "submission_count": len(category_submissions),
        "evidence": evidence,
    }


@router.get("/dashboard", response_model=dict)
async def get_dashboard():
    all_docs = list(get_collection("submissions").limit(5000).stream())

    total = len(all_docs)
    themes_count = {}
    ward_count = {}
    recent = []

    for doc in all_docs:
        data = doc.to_dict()
        analysis = data.get("analysis", {})

        category = analysis.get("category", "other")
        themes_count[category] = themes_count.get(category, 0) + 1

        ward = data.get("ward", "Unknown")
        ward_count[ward] = ward_count.get(ward, 0) + 1

        if len(recent) < 20:
            recent.append({
                "id": doc.id,
                "text": data.get("text_content", "")[:100],
                "category": category,
                "created_at": data.get("created_at"),
            })

    recent.sort(key=lambda x: x.get("created_at", ""), reverse=True)

    top_themes = sorted(
        [{"theme": k, "count": v} for k, v in themes_count.items()],
        key=lambda x: x["count"],
        reverse=True,
    )[:5]

    ward_dist = sorted(
        [{"ward": k, "count": v} for k, v in ward_count.items()],
        key=lambda x: x["count"],
        reverse=True,
    )[:10]

    return {
        "total_submissions": total,
        "top_themes": top_themes,
        "recent_submissions": recent[:10],
        "ward_distribution": ward_dist,
    }
