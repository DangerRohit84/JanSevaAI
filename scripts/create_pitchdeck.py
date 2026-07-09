from fpdf import FPDF
import os

class PitchDeck(FPDF):
    def footer(self):
        self.set_y(-12)
        self.set_font('Helvetica', 'I', 7)
        self.set_text_color(180, 180, 180)
        self.cell(0, 10, f'Page {self.page_no()}/11  |  JanSevaAI  |  Build with AI: Code for Communities 2026', 0, 0, 'C')

def title_slide(pdf):
    pdf.set_fill_color(30, 58, 95)
    pdf.rect(0, 0, 297, 210, 'F')
    pdf.set_fill_color(13, 148, 136)
    pdf.rect(0, 175, 297, 35, 'F')
    D = pdf.set_draw_color
    ST = pdf.set_text_color
    SF = pdf.set_font
    C = pdf.cell
    D(13, 148, 136)
    pdf.set_line_width(2)
    pdf.rect(108, 28, 81, 25)
    ST(255, 255, 255)
    SF('Helvetica', 'B', 10)
    pdf.set_xy(108, 33)
    C(81, 15, 'JanSevaAI', 0, 0, 'C')
    ST(13, 148, 136)
    SF('Helvetica', 'B', 44)
    pdf.set_y(60)
    C(0, 25, 'JanSevaAI', 0, 1, 'C')
    ST(147, 197, 253)
    SF('Helvetica', '', 18)
    C(0, 15, 'Your Voice, Your Development', 0, 1, 'C')
    ST(255, 255, 255)
    SF('Helvetica', '', 14)
    C(0, 12, 'AI-Powered Citizens Priority Platform', 0, 1, 'C')
    ST(180, 200, 220)
    SF('Helvetica', '', 12)
    C(0, 10, 'Track 1: Peoples Priorities', 0, 1, 'C')
    ST(255, 255, 255)
    SF('Helvetica', 'B', 11)
    pdf.set_y(142)
    C(0, 8, 'Team: Desina Rohit, B Surendra, Chakradhar Chowdhry G', 0, 1, 'C')
    ST(180, 200, 220)
    SF('Helvetica', '', 10)
    C(0, 8, 'July 2026', 0, 1, 'C')

def content_slide(pdf, num, title, items, cols=1):
    pdf.set_fill_color(245, 247, 250)
    pdf.rect(0, 0, 297, 210, 'F')
    pdf.set_fill_color(30, 58, 95)
    pdf.rect(0, 0, 297, 42, 'F')
    ST = pdf.set_text_color
    SF = pdf.set_font
    C = pdf.cell

    ST(13, 148, 136)
    SF('Helvetica', 'B', 14)
    pdf.set_xy(15, 8)
    C(20, 10, f'0{num}')

    ST(255, 255, 255)
    SF('Helvetica', 'B', 22)
    pdf.set_x(40)
    C(240, 12, title, 0, 1)

    pdf.set_draw_color(13, 148, 136)
    pdf.set_line_width(1.5)
    pdf.line(40, 36, 260, 36)

    ST(60, 60, 60)
    SF('Helvetica', '', 11)
    pdf.set_xy(25, 55)
    for item in items:
        pdf.set_x(25)
        C(8, 8, '-')
        w = 245 if cols == 1 else 110
        C(w, 8, item, 0, 1)
        pdf.set_y(pdf.get_y() + 2)

    pdf.set_fill_color(13, 148, 136)
    pdf.rect(0, 196, 297, 14, 'F')

def two_col_slide(pdf, num, title, left_title, left_items, right_title, right_items):
    pdf.set_fill_color(245, 247, 250)
    pdf.rect(0, 0, 297, 210, 'F')
    pdf.set_fill_color(30, 58, 95)
    pdf.rect(0, 0, 297, 42, 'F')
    ST = pdf.set_text_color
    SF = pdf.set_font
    C = pdf.cell

    ST(13, 148, 136)
    SF('Helvetica', 'B', 14)
    pdf.set_xy(15, 8)
    C(20, 10, f'0{num}')
    ST(255, 255, 255)
    SF('Helvetica', 'B', 22)
    pdf.set_x(40)
    C(240, 12, title, 0, 1)
    pdf.set_draw_color(13, 148, 136)
    pdf.set_line_width(1.5)
    pdf.line(40, 36, 260, 36)

    ST(30, 58, 95)
    SF('Helvetica', 'B', 13)
    pdf.set_xy(25, 50)
    C(120, 10, left_title, 0, 1)
    pdf.set_xy(155, 50)
    C(120, 10, right_title, 0, 1)

    ST(60, 60, 60)
    SF('Helvetica', '', 10)
    pdf.set_x(25)
    for item in left_items:
        pdf.set_x(28)
        C(5, 7, '-')
        C(115, 7, item, 0, 1)
        pdf.set_y(pdf.get_y() + 1)
    pdf.set_x(155)
    for item in right_items:
        pdf.set_x(158)
        C(5, 7, '-')
        C(115, 7, item, 0, 1)
        pdf.set_y(pdf.get_y() + 1)

    pdf.set_fill_color(13, 148, 136)
    pdf.rect(0, 196, 297, 14, 'F')


pdf = PitchDeck(orientation='L', unit='mm', format='A4')
pdf.alias_nb_pages()

pdf.add_page()
title_slide(pdf)

pdf.add_page()
content_slide(pdf, 1, 'The Problem', [
    'Citizens lack effective channels to communicate development needs to their MPs',
    'MPs receive thousands of unstructured requests - manual sorting is impossible',
    'No AI-powered prioritization exists for constituency development planning',
    'Language barriers exclude millions who speak regional Indian languages',
    'No centralized dashboard exists for tracking citizen requests end-to-end',
])

pdf.add_page()
content_slide(pdf, 2, 'Our Solution', [
    'Citizens submit via Text, Voice (12 languages), or Photo - auto-location detected',
    'Gemini AI analyzes, categorizes, and assigns urgency scores automatically',
    'Priority ranking engine aggregates by volume, urgency, recency, and category',
    'MPs see AI-prioritized submissions filtered by their sector (health, education, etc.)',
    'MPs take action: review, mark in-progress, resolve, or reject with notes',
    'Hotspot map shows geographic concentration of issues across the constituency',
])

pdf.add_page()
content_slide(pdf, 3, 'System Architecture', [
    'Frontend: React 18 + Vite + Tailwind CSS - 133KB JS gzip production build',
    'Backend: Python FastAPI serving API + static frontend on single server',
    'Database: Google Cloud Firestore (5,000+ real CPGRAMS submissions)',
    'Analytics: Google Cloud BigQuery for trend analysis',
    'Deployment: Google Cloud Run with auto-scaling (free tier, $0 demo cost)',
    'Mapping: Vanilla Leaflet with grid-based DBSCAN clustering for hotspots',
])

pdf.add_page()
two_col_slide(pdf, 4, 'Google Cloud AI Services',
    'GEMINI AI', ['Text categorization by department', 'Urgency scoring (critical->low)', 'Theme extraction from descriptions', 'Evidence summary generation', 'Priority ranking algorithm'],
    'SPEECH & VISION', ['Speech-to-Text: 12 Indian languages', 'Voice recordings transcribed in real-time', 'Vision API: Photo content analysis', 'Object/landmark identification', 'Automatic language detection'])

pdf.add_page()
two_col_slide(pdf, 5, 'Citizen Experience',
    'SUBMISSION METHODS', ['Text input in any language', 'Voice recording with auto-transcribe', 'Photo upload with AI analysis', 'Auto-GPS location detection', 'Address auto-fill via reverse geocoding'],
    'INCLUSIVITY', ['12 Indian languages supported', 'Voice input for low-literacy users', 'Photo-based reporting (no typing)', 'Mandatory name + phone for accountability', 'Free to use, no login required'])

pdf.add_page()
two_col_slide(pdf, 6, 'MP Dashboard Features',
    'OVERVIEW & PRIORITIES', ['Real-time stats (total/pending/resolved)', 'AI priority rankings with progress bars', 'Category breakdown chart (8 categories)', 'Recent submissions feed'],
    'MANAGEMENT', ['Filter by status + priority + sector', 'Search by name, phone, location', 'Detail panel with action buttons', 'Export to CSV, AI evidence summaries'])

pdf.add_page()
content_slide(pdf, 7, 'Priority Scoring Engine', [
    'Formula: Volume(35%) + Recency(25%) + Urgency(25%) + Category Weight(15%)',
    'Volume: number of submissions per category per time period',
    'Recency: newer submissions weighted higher using exponential decay',
    'Urgency: critical(4) > high(3) > medium(2) > low(1)',
    'Category weight: infrastructure emergencies weighted higher than routine requests',
    'Result: MPs see what needs attention first, backed by AI analysis',
])

pdf.add_page()
content_slide(pdf, 8, 'Data Sources & Impact', [
    '5,000+ submissions generated from real CPGRAMS data via data.gov.in',
    '8 categories: Infrastructure, Education, Health, Water, Sanitation, Transport, Agriculture, Electricity',
    'Geographic distribution across Indian states (UP, Maharashtra, Karnataka, MP, Bihar, TN, Gujarat)',
    'Priority scoring drives action: critical issues surfaced within seconds of submission',
    'Sector-based MP routing ensures each official sees only relevant submissions',
    'All open-source components cited, data sources publicly attributed',
])

pdf.add_page()
content_slide(pdf, 9, 'Scalability & Deployment', [
    'Single-server FastAPI architecture serves 5000+ submissions instantly',
    'Firestore auto-scales to millions of documents without configuration',
    'Cloud Run auto-scales from 0 to N instances based on traffic',
    'Frontend production build: 133KB JS + 4.6KB CSS gzipped for fast loading',
    'All 5 Google Cloud services within free tier limits ($0 demo cost)',
    'Infinite scroll pagination (50 per page) for smooth browsing of all submissions',
])

pdf.add_page()
content_slide(pdf, 10, 'Demo Walkthrough', [
    '1. Landing: Live stats, category grid, recent issues feed, how-it-works section',
    '2. Citizen Form: Name/phone required, 12 languages, text/voice/photo, auto-GPS',
    '3. Thank You: Confirmation with tracking ID + Submit Another button',
    '4. MP Login: Register with sector (health, education, etc.), secure token auth',
    '5. MP Dashboard: Stats, AI rankings, filtered submissions, detail panel, actions',
    '6. Hotspot Map: Interactive Leaflet map with color-coded cluster markers',
    '7. Priorities Page (Public): Ranked categories with AI evidence summaries',
])

pdf.add_page()
pdf.set_fill_color(245, 247, 250)
pdf.rect(0, 0, 297, 210, 'F')
pdf.set_fill_color(30, 58, 95)
pdf.rect(0, 0, 297, 42, 'F')
pdf.set_text_color(13, 148, 136)
pdf.set_font('Helvetica', 'B', 14)
pdf.set_xy(15, 8)
pdf.cell(20, 10, '11')
pdf.set_text_color(255, 255, 255)
pdf.set_font('Helvetica', 'B', 22)
pdf.set_x(40)
pdf.cell(240, 12, 'Thank You', 0, 1)
pdf.set_draw_color(13, 148, 136)
pdf.set_line_width(1.5)
pdf.line(40, 36, 260, 36)
pdf.set_fill_color(13, 148, 136)
pdf.rect(0, 196, 297, 14, 'F')

pdf.set_text_color(30, 58, 95)
pdf.set_font('Helvetica', 'B', 26)
pdf.set_y(68)
pdf.cell(0, 20, 'JanSevaAI', 0, 1, 'C')
pdf.set_font('Helvetica', '', 14)
pdf.set_text_color(100, 100, 100)
pdf.cell(0, 10, 'Bridging Citizens and MPs with AI', 0, 1, 'C')
pdf.ln(8)
pdf.set_text_color(30, 58, 95)
pdf.set_font('Helvetica', 'B', 13)
pdf.cell(0, 10, 'Team: Desina Rohit, B Surendra, Chakradhar Chowdhry G', 0, 1, 'C')
pdf.set_font('Helvetica', '', 11)
pdf.set_text_color(100, 100, 100)
pdf.cell(0, 8, 'Google Cloud - Build with AI: Code for Communities 2026', 0, 1, 'C')
pdf.cell(0, 8, "Track 1: People's Priorities", 0, 1, 'C')
pdf.ln(8)
pdf.set_font('Helvetica', 'B', 11)
pdf.set_text_color(13, 148, 136)
pdf.cell(0, 8, 'GitHub: github.com/DangerRohit84/JanSevaAI', 0, 1, 'C')
pdf.cell(0, 8, 'Live Demo: jansevaai-89628856193.asia-south1.run.app', 0, 1, 'C')

out = 'D:/JanSevaAI/PitchDeck_JanSevaAI.pdf'
pdf.output(out)
print(f'Created: {out}')
print(f'Size: {os.path.getsize(out)/1024:.1f} KB')
print(f'Pages: {pdf.page_no()}')
