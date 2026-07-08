import json
import random
from datetime import datetime, timedelta

CATEGORIES = [
    "infrastructure", "education", "health", "water",
    "sanitation", "transport", "agriculture", "electricity"
]

THEMES = {
    "infrastructure": ["road", "bridge", "building", "street_light", "drainage"],
    "education": ["school", "college", "library", "computer_lab", "playground"],
    "health": ["hospital", "pharmacy", "ambulance", "doctor", "medicine"],
    "water": ["water_supply", "well", "pipeline", "boring", "water_treatment"],
    "sanitation": ["toilet", "garbage", "sewage", "cleaning", "waste_management"],
    "transport": ["bus", "auto_rickshaw", "parking", "traffic_signal", "road_quality"],
    "agriculture": ["irrigation", "subsidy", "crop_insurance", "storage", "market"],
    "electricity": ["power_supply", "transformer", "solar", "street_light", "billing"],
}

URGENCIES = ["low", "medium", "high", "critical"]

WARD_NAMES = [
    "Ward 1 - Gandhinagar", "Ward 2 - Nehru Nagar", "Ward 3 - Rajiv Colony",
    "Ward 4 - Ambedkar Nagar", "Ward 5 - Shanti Nagar", "Ward 6 - Gandhi Maidan",
    "Ward 7 - Civil Lines", "Ward 8 - Station Road", "Ward 9 - Market Area",
    "Ward 10 - Industrial Area",
]

STATES = ["Uttar Pradesh", "Bihar", "Maharashtra", "Rajasthan", "Madhya Pradesh"]
DISTRICTS = ["Lucknow", "Patna", "Mumbai", "Jaipur", "Bhopal"]

SAMPLE_TEXTS = {
    "infrastructure": [
        "सड़क टूट गई है, गड्ढे में पानी भरा है",
        "Road is completely broken, vehicles cannot pass",
        "Street lights are not working for last 2 months",
        "Drainage system is blocked, water logging during rain",
        "Bridge is in very bad condition, needs immediate repair",
    ],
    "education": [
        "School mein chairs aur desks nahi hain",
        "Children have to walk 5km to reach nearest school",
        "No computer lab in the school, students can't learn",
        "School building roof is leaking during monsoon",
        "Need a library for students to prepare for exams",
    ],
    "health": [
        "PHC mein dawai nahi milti, 10km door jana padta hai",
        "No doctor available at the health center",
        "Ambulance takes 2 hours to reach the village",
        "Mother and child health center needs more staff",
        "Medicines for diabetes and BP are not available",
    ],
    "water": [
        "Paani ki supply 2 din se band hai",
        "Hand pump is broken, villagers fetching water from far",
        "Water is contaminated, people are getting sick",
        "Need new boring for drinking water",
        "Water treatment plant is not functional",
    ],
    "sanitation": [
        "Garbage is not collected for weeks, bad smell",
        "No public toilets in the market area",
        "Sewage water is flowing on the road",
        "Need more dustbins in the colony",
        "Waste management system needs improvement",
    ],
    "transport": [
        "Bus service is very irregular, only 2 buses per day",
        "Auto rickshaws charge too much fare",
        "No parking space near the hospital",
        "Traffic signal at main crossing is not working",
        "Road quality is very poor, accidents are increasing",
    ],
    "agriculture": [
        "Irrigation water is not reaching the fields",
        "Farmers need subsidy for seeds and fertilizers",
        "No cold storage for storing crops",
        "Crop insurance claims are not processed",
        "Need better market access for selling produce",
    ],
    "electricity": [
        "Power cuts are very frequent, 8-10 hours daily",
        "Transformer got burned, no electricity for 3 days",
        "Need solar panels for the village",
        "Street lights not working on main road",
        "Electricity bill is too high, meters are faulty",
    ],
}


def generate_submission(index):
    category = random.choice(CATEGORIES)
    theme = random.choice(THEMES[category])
    urgency = random.choice(URGENCIES)
    language = random.choice(["hi", "en", "bn", "ta", "te", "mr"])
    ward = random.choice(WARD_NAMES)
    state = random.choice(STATES)
    district = random.choice(DISTRICTS)

    base_date = datetime(2026, 6, 22)
    days_ago = random.randint(0, 15)
    created_at = base_date + timedelta(days=days_ago, hours=random.randint(6, 22))

    lat_base = 26.8467
    lon_base = 80.9462

    return {
        "id": f"sub-{index:05d}",
        "citizen_name": f"Citizen {index}",
        "language": language,
        "input_type": random.choice(["text", "voice", "photo"]),
        "text_content": random.choice(SAMPLE_TEXTS[category]),
        "latitude": lat_base + random.uniform(-0.05, 0.05),
        "longitude": lon_base + random.uniform(-0.05, 0.05),
        "ward": ward,
        "district": district,
        "state": state,
        "status": "analyzed",
        "analysis": {
            "category": category,
            "themes": [theme],
            "urgency": urgency,
            "key_phrases": [theme, category],
            "sentiment": round(random.uniform(-0.8, 0.2), 2),
            "summary": f"Citizen reported {theme} issue in {ward}",
        },
        "created_at": created_at.isoformat(),
    }


def main():
    submissions = [generate_submission(i) for i in range(1, 501)]

    with open("data/seed/sample_submissions.json", "w", encoding="utf-8") as f:
        json.dump(submissions, f, ensure_ascii=False, indent=2)

    print(f"Generated {len(submissions)} sample submissions")


if __name__ == "__main__":
    main()
