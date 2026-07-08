# JanSevaAI

AI-powered platform for MPs to prioritize citizen development requests.

## Quick Start

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your GCP credentials
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Docker

```bash
docker-compose up --build
```

## Environment Variables

See `.env.example` for required variables.

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/submit/` | POST | Submit text feedback |
| `/api/v1/submit/voice` | POST | Submit voice recording |
| `/api/v1/submit/photo` | POST | Submit photo |
| `/api/v1/submit/` | GET | List submissions |
| `/api/v1/analysis/themes` | GET | Get extracted themes |
| `/api/v1/analysis/hotspots` | GET | Get demand hotspots |
| `/api/v1/analysis/ranking` | GET | Get priority ranking |
| `/api/v1/analysis/evidence/{category}` | GET | Get evidence summary |
| `/api/v1/analysis/dashboard` | GET | Get dashboard stats |
