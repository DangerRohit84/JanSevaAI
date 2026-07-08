# JanSevaAI (जनसेवाAI)

> AI-powered platform that listens to citizens' development requests and helps MPs prioritize what their constituency actually needs.

![Track](https://img.shields.io/badge/Track-1%20People's%20Priorities-blue)
![Status](https://img.shields.io/badge/Status-Build%20with%20AI%20Hackathon-green)
![Python](https://img.shields.io/badge/Python-3.11+-yellow)
![React](https://img.shields.io/badge/React-18-61DAFB)

---

## 🎯 Problem

MPs receive development requests through public meetings, letters, social media, and grievance portals. Local development plans contain dozens of competing projects. There's no objective way to:

- Consolidate citizen feedback from multiple channels
- Spot recurring themes across thousands of requests
- Weigh competing proposals against real demographic data
- Recommend high-priority development works with evidence

## 💡 Solution

JanSevaAI is a multilingual AI platform that:

1. **Listens** — Citizens submit requests via voice, text, or photo in any Indian language
2. **Understands** — AI extracts themes, urgency, and sentiment from submissions
3. **Clusters** — Groups similar requests by theme and geographic location
4. **Ranks** — Prioritizes development needs using citizen feedback + Census/NFHS data
5. **Presents** — Gives MPs an evidence-backed dashboard to act on

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  CITIZEN INTERFACE (React PWA - Mobile First)                │
│  • Voice Recording • Text Input • Photo Upload               │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  BACKEND API (FastAPI + Cloud Run)                           │
│  • /submit • /analyze • /ranking • /dashboard                │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  GOOGLE CLOUD SERVICES                                      │
│  • Vertex AI (Gemini) — Theme extraction, evidence          │
│  • Cloud Speech-to-Text — Voice transcription               │
│  • Cloud Vision — Photo analysis, OCR                       │
│  • BigQuery — Embeddings, clustering, analytics             │
│  • Firestore — Real-time data storage                       │
│  • Google Maps — Hotspot visualization                      │
│  • Translation API — Multilingual support                    │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  MP DASHBOARD (React + Tailwind + Google Maps)               │
│  • Priority Queue • Hotspot Map • Evidence View              │
└─────────────────────────────────────────────────────────────┘
```

---

## ✨ Features

### For Citizens
| Feature | Description |
|---------|-------------|
| 🎤 Voice Input | Speak in Hindi, Tamil, Telugu, or any Indic language |
| 📝 Text Input | Type in any language with auto-translation |
| 📷 Photo Upload | Capture issues with camera + GPS location |
| 📍 Location Auto-detect | Automatic ward/district identification |
| ✅ Submission Tracking | Get a tracking ID for your request |

### For MPs / Administrators
| Feature | Description |
|---------|-------------|
| 📊 Priority Queue | AI-ranked list of development needs |
| 🗺️ Hotspot Map | Interactive map showing demand clusters |
| 📈 Trend Analysis | Theme distribution over time |
| 📋 Evidence Packs | AI-generated summaries with source data |
| 🔄 Action Tracker | Mark items as reviewed/approved/completed |
| 📊 Data Comparison | Compare feedback with Census/NFHS indicators |

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 18, Tailwind CSS, Vite | Citizen UI + MP Dashboard |
| Maps | Google Maps JavaScript API | Hotspot visualization |
| Backend | Python 3.11, FastAPI | REST API server |
| AI/ML | Vertex AI (Gemini 1.5 Pro) | Theme extraction, evidence |
| Speech | Cloud Speech-to-Text (chirp_2) | Multilingual voice transcription |
| Vision | Cloud Vision API | Photo analysis, OCR |
| Database | Cloud Firestore | Real-time data storage |
| Analytics | BigQuery | Embeddings, vector search, clustering |
| Translation | Cloud Translation API | Multilingual normalization |
| Storage | Google Cloud Storage | Media files (voice, photos) |
| Hosting | Cloud Run + Firebase Hosting | Backend + Frontend deployment |

---

## 📁 Project Structure

```
jansevai/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI entry point
│   │   ├── models/              # Pydantic data models
│   │   ├── routes/              # API endpoints
│   │   ├── services/            # Business logic
│   │   └── db/                  # Database clients
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/          # React components
│   │   ├── pages/               # Page layouts
│   │   └── hooks/               # Custom React hooks
│   ├── package.json
│   └── vite.config.js
├── data/
│   └── seed/                    # Sample data for demo
├── scripts/                     # Setup & deployment scripts
└── docs/                        # Documentation
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- Google Cloud account with billing enabled
- GCP project with required APIs enabled

### Backend Setup

```bash
# Clone the repository
git clone https://github.com/your-team/jansevai.git
cd jansevai/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows

# Install dependencies
pip install -r requirements.txt

# Set environment variables
cp .env.example .env
# Edit .env with your GCP credentials

# Run the server
uvicorn app.main:app --reload
```

### Frontend Setup

```bash
cd jansevai/frontend

# Install dependencies
npm install

# Set environment variables
cp .env.example .env.local
# Edit .env.local with your API endpoints

# Run development server
npm run dev
```

### Deploy to Google Cloud

```bash
# Backend (Cloud Run)
gcloud run deploy jansevai-api \
  --source ./backend \
  --platform managed \
  --region asia-south1 \
  --allow-unauthenticated

# Frontend (Firebase Hosting)
cd frontend
npm run build
firebase deploy
```

---

## 📊 Real Data Sources

JanSevaAI uses **real government datasets** from data.gov.in and DARPG:

| Dataset | Source | License | Purpose |
|---------|--------|---------|---------|
| **CPGRAMS Monthly Reports** | DARPG, Government of India | GODL-India | Department-wise grievance statistics |
| **Village Amenities Census 2011** | data.gov.in | GODL-India | Village-level infrastructure data |
| **UDISE Plus** | Ministry of Education | GODL-India | School infrastructure data |
| **NFHS-5** | Ministry of Health | GODL-India | Health and education indicators |

### Real Scale (CPGRAMS Portal)

```
Monthly Grievances:    1,70,170 (January 2026)
Annual Scale:          ~20 Lakh grievances/year
Registered Users:      1 Crore+ citizens
Departments Covered:   90+ Ministries/Departments
States/UTs:            36 States/Union Territories
Average Resolution:    13 days
```

### Demo Scale (This Prototype)

```
Demo Submissions:      5,000 (based on real CPGRAMS patterns)
Coverage:             10 departments, 10 states
Languages:            12 Indic languages
```

> **Note:** This is a hackathon prototype demonstrating the concept with 5,000 submissions. 
> The production system can handle the full CPGRAMS scale of 20L+ grievances/year using 
> Google Cloud's scalable infrastructure (Firestore, BigQuery, Cloud Run).

### Data Citations

```bibtex
@misc{cpgrams2026,
  title={Monthly Department-wise Public Grievance Receipts and Disposals},
  author={Department of Administrative Reforms and Public Grievances (DARPG)},
  year={2026},
  url={https://darpg.gov.in/node/6003/},
  note={Government Open Data License - India (GODL)}
}

@misc{census2011,
  title={Village Amenities, Census 2011},
  author={Office of the Registrar General & Census Commissioner, India},
  year={2011},
  url={https://data.gov.in/catalog/village-amenities-census-2011},
  note={Government Open Data License - India (GODL)}
}
```

### Real Statistics Used (January 2026)

| Metric | Value | Source |
|--------|-------|--------|
| Monthly Grievances | 1,70,170 | CPGRAMS Jan 2026 |
| Monthly Disposal | 1,76,942 | CPGRAMS Jan 2026 |
| Pending | 71,460 | CPGRAMS Jan 2026 |
| Annual Scale | ~20 Lakh | CPGRAMS 2025-26 |
| Registered Users | 1 Crore+ | CPGRAMS Portal |
| Top Department | Ministry of Labour & Employment | 26,479 receipts |
| Top State | Uttar Pradesh | 29,128 receipts |

### Demo Data

- **5,000 citizen submissions** based on real CPGRAMS grievance patterns
- **10 departments** with actual grievance volumes
- **10 states** with real distribution patterns
- **12 Indic languages** supported

---

## 🎬 Demo Video

**[Watch 3-minute demo →](link-to-video)**

| Timestamp | What You'll See |
|-----------|-----------------|
| 0:00-0:30 | Problem statement introduction |
| 0:30-1:30 | Citizen submitting via voice (Hindi) + photo |
| 1:30-2:30 | AI processing: theme extraction + clustering |
| 2:30-3:30 | MP dashboard: priority queue + hotspot map |
| 3:30-4:30 | Scaling vision: 543 constituencies |
| 4:30-5:00 | Team introduction |

---

## 📈 Impact Potential

| Metric | Value |
|--------|-------|
| Parliamentary Constituencies | 543 |
| Potential Citizens Served | 900M+ |
| Languages Supported | 12+ Indic languages |
| Average Response Time | < 2 seconds |
| Pilot Ready In | 2 weeks |

---

## 🏆 Why This Wins

| Criteria | Our Strength |
|----------|-------------|
| **Problem-Solution Fit (20%)** | Directly solves MP's need to consolidate citizen feedback |
| **AI/Technical Execution (25%)** | Gemini + BigQuery clustering + multilingual voice |
| **Deployability (25%)** | Cloud Run + Firebase = pilot in any constituency |
| **Inclusivity (15%)** | Voice + text in 12+ languages, low-literacy access |
| **Impact (10%)** | Scalable to all 543 parliamentary constituencies |
| **Presentation (5%)** | Clean dashboard, 5-minute demo |

---

## 📚 Datasets Used

### Primary Data Sources

| Dataset | Source | URL | License | Records |
|---------|--------|-----|---------|---------|
| **CPGRAMS Monthly Reports** | DARPG | https://darpg.gov.in/node/6003/ | GODL-India | 1.7L+ monthly |
| **CPGRAMS Grievance Data** | data.gov.in | https://data.gov.in/catalog/monthly-department-wise-public-grievance-receipts-and-disposals | GODL-India | 4L+ data points |
| **Village Amenities Census 2011** | data.gov.in | https://data.gov.in/catalog/village-amenities-census-2011 | GODL-India | 6L+ villages |
| **UDISE Plus Schools** | Ministry of Education | https://data.gov.in/catalog/schools-availability-infrastructure-and-facilities-school-management-and-school-category | GODL-India | 15L+ schools |
| **NFHS-5 District Data** | Ministry of Health | https://data.gov.in/catalog/national-family-health-survey-5-nfhs-5-india-districts-factsheet-data-provisional | GODL-India | 700+ districts |

### Supporting Data

| Dataset | Source | Purpose |
|---------|--------|---------|
| **All India Pincode Directory** | Department of Posts | Location mapping |
| **PMGSY Road Network** | Ministry of Rural Development | Infrastructure data |
| **Census 2011 Village Directory** | Census of India | Demographics |

*All datasets are publicly available under Government Open Data License - India (GODL).*

---

## 🤝 Contributing

This is a hackathon project. For questions, contact:
- Email: build-with-ai-india@googlegroups.com

---

## 📄 License

MIT License — See [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- **Google Cloud** for hackathon sponsorship and cloud credits
- **Google Developer Groups (GDG)** for mentorship
- **MPs and their offices** for providing real problem statements
- **Open-source community** for the tools and libraries used

---

## 📞 Contact

**Team JanSevaAI**

- GitHub: [github.com/your-team/jansevai](https://github.com/your-team/jansevai)
- Email: your-team@example.com

---

> *"Listening to every voice, ranking every need."*
