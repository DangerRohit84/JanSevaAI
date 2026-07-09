import os
import logging
from app.config import settings

logger = logging.getLogger(__name__)

_client = None
_real_mode = False


def get_bigquery_client():
    global _client, _real_mode
    if _client is not None:
        return _client

    project_id = settings.GCP_PROJECT_ID
    credentials_path = settings.GOOGLE_APPLICATION_CREDENTIALS

    if project_id:
        try:
            from google.cloud import bigquery

            # Try service account JSON first (local dev)
            if credentials_path and os.path.exists(credentials_path):
                _client = bigquery.Client.from_service_account_json(credentials_path)
            else:
                # ADC - works on Cloud Run with Compute Engine default SA
                _client = bigquery.Client(project=project_id)

            _real_mode = True
            logger.info("BigQuery: Real mode (Google Cloud BigQuery)")
            return _client
        except Exception as e:
            logger.warning(f"BigQuery init failed: {e}, falling back to mock")

    logger.info("BigQuery: Mock mode (no credentials)")
    _client = "mock"
    _real_mode = False
    return None


def ensure_dataset(dataset_id: str = "jansevai"):
    client = get_bigquery_client()
    if not _real_mode or not client:
        return

    try:
        from google.cloud import bigquery
        dataset_ref = bigquery.DatasetReference(client.project, dataset_id)
        try:
            client.get_dataset(dataset_ref)
        except Exception:
            dataset = bigquery.Dataset(dataset_ref)
            dataset.location = os.getenv("GCP_REGION", "asia-south1")
            client.create_dataset(dataset, exists_ok=True)
            logger.info(f"Created BigQuery dataset: {dataset_id}")
    except Exception as e:
        logger.error(f"Failed to ensure dataset: {e}")


def export_submission(submission: dict, dataset_id: str = "jansevai", table_id: str = "submissions"):
    client = get_bigquery_client()
    if not _real_mode or not client:
        return

    try:
        from google.cloud import bigquery

        table_ref = f"{client.project}.{dataset_id}.{table_id}"
        row = {
            "submission_id": submission.get("id", ""),
            "citizen_name": submission.get("citizen_name", ""),
            "phone": submission.get("phone", ""),
            "text_content": submission.get("text_content", ""),
            "category": submission.get("analysis", {}).get("category", "other"),
            "urgency": submission.get("analysis", {}).get("urgency", "medium"),
            "ward": submission.get("ward", ""),
            "district": submission.get("district", ""),
            "state": submission.get("state", ""),
            "language": submission.get("language", ""),
            "latitude": submission.get("latitude", 0.0),
            "longitude": submission.get("longitude", 0.0),
            "created_at": submission.get("created_at", ""),
            "status": submission.get("status", "pending"),
            "sentiment_score": submission.get("analysis", {}).get("sentiment", 0.0),
            "themes": str(submission.get("analysis", {}).get("themes", [])),
        }

        errors = client.insert_rows_json(table_ref, [row])
        if errors:
            logger.error(f"BigQuery insert errors: {errors}")
        else:
            logger.info(f"Exported submission {submission.get('id')} to BigQuery")

    except Exception as e:
        logger.error(f"BigQuery export failed: {e}")


def query_category_stats(dataset_id: str = "jansevai", table_id: str = "submissions"):
    client = get_bigquery_client()
    if not _real_mode or not client:
        return _mock_category_stats()

    try:
        query = f"""
            SELECT
                category,
                COUNT(*) as count,
                AVG(sentiment_score) as avg_sentiment,
                COUNTIF(urgency = 'critical') as critical_count,
                COUNTIF(urgency = 'high') as high_count
            FROM `{client.project}.{dataset_id}.{table_id}`
            GROUP BY category
            ORDER BY count DESC
        """
        results = client.query(query).result()
        return [dict(row) for row in results]
    except Exception as e:
        logger.error(f"BigQuery query failed: {e}")
        return _mock_category_stats()


def query_ward_heatmap(dataset_id: str = "jansevai", table_id: str = "submissions"):
    client = get_bigquery_client()
    if not _real_mode or not client:
        return _mock_ward_heatmap()

    try:
        query = f"""
            SELECT
                ward,
                district,
                COUNT(*) as request_count,
                AVG(latitude) as avg_lat,
                AVG(longitude) as avg_lng,
                ARRAY_AGG(category ORDER BY created_at DESC LIMIT 1)[OFFSET(0)] as top_category
            FROM `{client.project}.{dataset_id}.{table_id}`
            GROUP BY ward, district
            HAVING request_count >= 3
            ORDER BY request_count DESC
            LIMIT 50
        """
        results = client.query(query).result()
        return [dict(row) for row in results]
    except Exception as e:
        logger.error(f"BigQuery heatmap query failed: {e}")
        return _mock_ward_heatmap()


def query_trend(dataset_id: str = "jansevai", table_id: str = "submissions", days: int = 30):
    client = get_bigquery_client()
    if not _real_mode or not client:
        return _mock_trend()

    try:
        query = f"""
            SELECT
                DATE(created_at) as date,
                COUNT(*) as count,
                category
            FROM `{client.project}.{dataset_id}.{table_id}`
            WHERE created_at >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL {days} DAY)
            GROUP BY date, category
            ORDER BY date DESC
        """
        results = client.query(query).result()
        return [dict(row) for row in results]
    except Exception as e:
        logger.error(f"BigQuery trend query failed: {e}")
        return _mock_trend()


def _mock_category_stats():
    import random
    categories = ["water", "electricity", "transport", "health", "education", "sanitation", "agriculture", "infrastructure"]
    return [
        {
            "category": cat,
            "count": random.randint(20, 100),
            "avg_sentiment": round(random.uniform(-0.6, 0.1), 2),
            "critical_count": random.randint(1, 10),
            "high_count": random.randint(5, 20),
        }
        for cat in categories
    ]


def _mock_ward_heatmap():
    import random
    wards = [
        {"ward": "Ward 1 - Gandhinagar", "district": "Lucknow"},
        {"ward": "Ward 3 - Rajiv Colony", "district": "Patna"},
        {"ward": "Ward 4 - Ambedkar Nagar", "district": "Mumbai"},
        {"ward": "Ward 6 - Gandhi Maidan", "district": "Bhopal"},
        {"ward": "Ward 8 - Station Road", "district": "Jaipur"},
    ]
    return [
        {
            **w,
            "request_count": random.randint(10, 50),
            "avg_lat": round(random.uniform(23.0, 28.0), 4),
            "avg_lng": round(random.uniform(77.0, 85.0), 4),
            "top_category": random.choice(["water", "electricity", "transport"]),
        }
        for w in wards
    ]


def _mock_trend():
    import random
    from datetime import datetime, timedelta
    return [
        {
            "date": (datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d"),
            "count": random.randint(5, 30),
            "category": random.choice(["water", "electricity", "transport"]),
        }
        for i in range(30)
    ]
