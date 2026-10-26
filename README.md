# LandStack AI — Citizen Land Decision Copilot

> **"LandStack AI is a multilingual, problem-first Land Decision Copilot that helps citizens who may not even know which land service they need—understands their problem through conversation, creates a personalized workflow, explains and analyzes their documents, connects evidence, finds verification gaps, guides the next action, and tracks the case through completion."**

---

## 🏛️ Statutory Notice & Trust Architecture
- **AI-Assisted Citizen Advisory**: LandStack AI is an advisory and document intelligence copilot. It **never claims legal title guarantee, fraud proven, or replaces authoritative government records**.
- **Neutral Gap Framing**: Identifies discrepancies as *"POTENTIAL INCONSISTENCY"* requiring verification.
- **Traceable Government Sources**: Official service navigation strictly points to verified `.gov.in` portals (e.g., `eservices.tn.gov.in`, `tnreginet.gov.in`). **No invented government URLs**.

---

## 🚀 11-Step Connected Citizen Journey
```
SPEAK → UNDERSTAND → IDENTIFY → PLAN → COLLECT → EXPLAIN → ANALYZE → VERIFY → ACT → TRACK → COMPLETE
```
All capabilities operate on **ONE connected Living Land Case**, rather than disconnected utilities.

---

## 🤖 Agentic AI & RAG Architecture

```
                       LANDSTACK ORCHESTRATOR
                                 |
         +-----------------------+-----------------------+
         |                       |                       |
    CASE AGENT            DOCUMENT AGENT          EVIDENCE AGENT          ACTION AGENT
  - Problem Understanding   - OCR Processing        - Evidence Graph        - Next-Best Action
  - Intent-to-Service       - Doc Classification    - Land DNA / Passport   - Conflict Re-check
  - Adaptive Questions      - Plain Explanations    - Missing Link Detector - Readiness Score
  - Case Planner            - Field Extraction      - Dependency Map        - Service Navigation
  - State Navigation        - Letter Generator      - Seller Story vs Docs  - Case File PDF
         |                       |                       |                       |
         +-----------------------+-----------------------+-----------------------+
                                 |
                     RAG TRUSTED KNOWLEDGE LAYER
               (Procedures, Terminology, Requirements, FAQs)
```

### Deterministic vs LLM Rule
- **Deterministic Rules**: Used for Area Comparison, Survey Number Matching, Name Comparison, Graph Relationships, Dependency Calculations, Readiness Score, and PDF Generation.
- **LLM Reasoning**: Used for Natural Language Understanding, Adaptive Questions, Plain Language Explanation, Multilingual Speech, and Citations Synthesis.
- **RAG Layer**: Authoritative source for Tamil Nadu and national revenue procedures, standard land terms (Patta, Chitta, FMB, TSLR, EC), and verified `.gov.in` URLs.

---

## 📂 Project Structure

```
landstack-ai/
│
├── frontend/                     # React 19 + Vite 8 Responsive Citizen Interface
│   ├── src/
│   │   ├── components/           # Header, DemoControlBar, JourneyStepper, StatutoryDisclaimer
│   │   ├── pages/                # Home, ChatAssistant, CasesPlan, Documents, Passport, Evidence, FamilyRoom, Registry, Notifications
│   │   ├── services/             # api.js (Centralized REST Client)
│   │   ├── App.jsx               # Unified Root Application
│   │   ├── App.css               # Modern Citizen-Service Design System
│   │   └── main.jsx
│   └── package.json
│
├── backend/                      # Python FastAPI Enterprise Backend
│   ├── app/
│   │   ├── agents/               # Orchestrator, CaseAgent, DocumentAgent, EvidenceAgent, ActionAgent
│   │   ├── rag/                  # retrieval.py (Trusted Knowledge Retrieval Engine)
│   │   ├── models/               # case_state.py (Pydantic Living Land Case Data Models)
│   │   ├── services/             # ocr_service, comparison_engine, pdf_service, gis_service, scam_shield
│   │   ├── routers/              # chat, cases, documents, evidence, recommendations, registry, tools, demo
│   │   └── main.py               # FastAPI App Entrypoint
│   └── __init__.py
│
├── knowledge_base/               # Trusted Knowledge Layer (Traceable Citations)
│   ├── registry/                 # verified_services.json (Verified .gov.in URLs)
│   └── sources/                  # procedures.json, terminology.json, document_requirements.json, citizen_faqs.json
│
├── demo_data/                    # Standard Demo Documents (Sale Deed, Patta, Legal Heir, FMB Report)
├── .env.example                  # Environment Configuration
└── README.md
```

---

## ⚡ Quick Start & Run Instructions

### 1. Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 2. Backend Setup & Launch
```bash
# In project root: c:\Users\varsh\Downloads\LandStack-AI
pip install fastapi uvicorn python-multipart reportlab requests

# Run FastAPI backend server (port 8000)
uvicorn backend.app.main:app --reload --port 8000
```
- API Health: `http://127.0.0.1:8000/`
- Interactive Swagger API Docs: `http://127.0.0.1:8000/docs`

### 3. Frontend Setup & Launch
```bash
# In frontend directory: c:\Users\varsh\Downloads\LandStack-AI\frontend
npm install
npm run dev
```
- Frontend Citizen UI: `http://localhost:5173/`

---

## 🏆 Complete 40-Feature Implementation Matrix

| # | Finalized Feature | Implemented Module / Component | Status |
|---|---|---|---|
| 1 | Talk to LandStack | `ChatAssistantView.jsx` (Voice & Text Input) | ✅ Active |
| 2 | Multilingual Journey | Tamil (தமிழ்), English, Hindi (Switchable) | ✅ Active |
| 3 | Conversational Understanding | `CaseAgent` (Natural problem ingestion) | ✅ Active |
| 4 | Intent-to-Service Engine | `CaseAgent.detect_intent` | ✅ Active |
| 5 | Adaptive Case Planner | `CasesPlanView.jsx` (Dynamic workflow steps) | ✅ Active |
| 6 | Personalized Document Checklist | `DocumentsView.jsx` (Available/Missing/Review) | ✅ Active |
| 7 | Document Explainer | `DocumentAgent.EXPLANATIONS` (Patta, Chitta, EC, FMB) | ✅ Active |
| 8 | Official Service Navigator | `RegistryView.jsx` (Strictly verified `.gov.in` URLs) | ✅ Active |
| 9 | Office & Visit Guidance | `LandGISService` (Taluk, SRO, VAO hours & guidelines) | ✅ Active |
| 10 | Appointment / Service Navigation | Configured e-Sevai / SRO appointment routes | ✅ Active |
| 11 | Camera/PDF Document Upload | `DocumentsView.jsx` (Dropzone & file handler) | ✅ Active |
| 12 | Document Intelligence / OCR | `ocr_service.py` (Structured regex/layout parsing) | ✅ Active |
| 13 | Document Consistency Check | `DeterministicComparisonEngine` (Area, Survey No, Dates) | ✅ Active |
| 14 | Land Investigation Mode | `EvidenceView.jsx` (Deep discrepancy investigation) | ✅ Active |
| 15 | Land DNA / Property Passport | `PassportView.jsx` (Structured property profile) | ✅ Active |
| 16 | Evidence Graph | `EvidenceView.jsx` (Interactive SVG node-link graph) | ✅ Active |
| 17 | Missing Link Detector | `EvidenceAgent` (Flags missing links in title chain) | ✅ Active |
| 18 | Verification Gap Engine | `EvidenceAgent` (Neutral area & NOC gap flags) | ✅ Active |
| 19 | Verification Dependency Map | `EvidenceView.jsx` (Prerequisite lock/unlock rules) | ✅ Active |
| 20 | Next-Best Action | `ActionAgent` (Step-by-step guidance & official routes) | ✅ Active |
| 21 | Conflict → Resolution → Re-check | `EvidenceView.jsx` (Interactive FMB re-check flow) | ✅ Active |
| 22 | Seller Story vs Evidence | `EvidenceView.jsx` (Neutral statement comparison) | ✅ Active |
| 23 | Evidence Impact Simulator | `EvidenceView.jsx` (Score jump & unlock projection) | ✅ Active |
| 24 | Change Impact Analyzer | `EvidenceAgent` (Tracks differences across revisions) | ✅ Active |
| 25 | Evidence Provenance | `EvidenceView.jsx` (Ingestion source & SHA256 hashes) | ✅ Active |
| 26 | Family Land Decision Room | `FamilyRoomView.jsx` (Role-aware heir consensus) | ✅ Active |
| 27 | LandGuard AI | `NotificationsView.jsx` (Case revision event log) | ✅ Active |
| 28 | Living Land Case Tracking | `case_state.py` (Persistent lifecycle progression) | ✅ Active |
| 29 | Smart Notifications | `NotificationsView.jsx` (Citizen reminders & alerts) | ✅ Active |
| 30 | State-Aware Land Navigator | `KnowledgeRetriever` (Tamil Nadu prioritized, extensible) | ✅ Active |
| 31 | Evidence Request Generator | `DocumentsView.jsx` (Formal legal request letters) | ✅ Active |
| 32 | Seller Question Generator | `RegistryView.jsx` (Smart pre-purchase buyer checklist) | ✅ Active |
| 33 | Automatic Land Case File | `pdf_service.py` (Printable AI Case File HTML/PDF) | ✅ Active |
| 34 | Before You Buy Workflow | `CaseAgent` & `SellerStory` mode | ✅ Active |
| 35 | Ownership & Heir Timeline | `EvidenceView.jsx` (Chronological title succession) | ✅ Active |
| 36 | Normal Land Search architecture | `RegistryView.jsx` & Survey No lookup | ✅ Active |
| 37 | Land / Office Map architecture | `gis_service.py` (Taluk, SRO, VAO GPS abstractions) | ✅ Active |
| 38 | Scam Shield / Official Link Shield | `scam_shield.py` (Authenticates `.gov.in` domains) | ✅ Active |
| 39 | Application Readiness / Tracking | Dynamic 0-100% readiness meter in Header & Plan | ✅ Active |
| 40 | Professional Escalation Guidance | `ActionAgent` (Guides when to engage Taluk Surveyor) | ✅ Active |

---

## 🎬 24-Hour Judging Demo Walkthrough

Use the persistent **DEMO CONTROLS** bar at the top of the application:

1. **Step 1: Problem Input**
   - Click `1. Problem Input` or submit Tamil voice prompt:
     `"எங்க அப்பா பேர்ல இருக்குற நிலத்தை என் பேருக்கு மாற்றணும்."`
   - **System response**: Detects `INHERITED_LAND_TRANSFER` (98% confidence).
   - Dynamically generates adaptive case questions, case plan, and document checklist.

2. **Step 2: Trigger Area Mismatch Demo**
   - Click `2. Inconsistency Demo (0.40 Acre Gap)`.
   - Ingests 4 demo documents:
     - Document A: Deceased Father's Registered Sale Deed (1998) → **2.50 Acres**
     - Document B: Current Tamil Nilam Computer Patta → **2.10 Acres**
     - Document C: Legal Heir Certificate (Wife, Son, Daughter)
     - Document D: Death Certificate
   - **System response**: Deterministic comparison engine flags **"POTENTIAL INCONSISTENCY"** (-0.40 Acres).
   - Evidence Graph highlights area discrepancy node in RED/AMBER.
   - Verification Dependency Map locks downstream steps: *"Waiting for verification"*.
   - Next-Best Action recommends: *"Reconcile 0.40-Acre Area Inconsistency via FMB Re-measurement"*.

3. **Step 3: Resolve & Re-check**
   - Click `3. Resolve & Re-check`.
   - Ingests Document E: **Taluk Surveyor FMB Re-measurement & Rectification Report**.
   - Identifies that 0.40-acre reduction was an arithmetical entry error during UDR computerization.
   - Ground area verified as 2.50 acres.
   - Status updates to **RESOLVED / READY**.
   - Case readiness score jumps to **100%**.
   - Dependency map unlocks to *"Application ready for submission"*.
   - Next-Best Action updates to: *"Submit Online Patta Transfer Application (Mutation)"*.

4. **Step 4: Automatic Land Case File**
   - Click `Case Dossier PDF`.
   - Opens the printable AI-assisted Land Case Dossier complete with Case Overview, Property Passport, Verification Audit, and Statutory Disclaimer.

## V4 Real-Data Update

The existing V3 codebase has been modified for the real LandStack workflow described in `REAL_DATA_IMPLEMENTATION_V4.md`.

Primary runtime languages: Tamil and Kannada.

Real location services:
- Browser geolocation for current user location.
- Separate land location context.
- OpenStreetMap Nominatim for geocoding/reverse geocoding.
- OpenStreetMap/Overpass for nearby map-listed support places.

State-aware knowledge:
- Tamil Nadu and Karnataka are separated.
- Karnataka rural/urban property contexts use different requirement candidates.
- RAG procedure/FAQ retrieval is state-filtered.

Important: public map data is not official land ownership data. No live government ownership/EC/mutation API is claimed unless an authorized integration is actually connected.

## LandStack AI V6 — Dual-State Location Workflow

This version keeps the existing React + Vite + FastAPI architecture and adds the requested location-first layer:
- live browser phone location (`watchPosition`)
- separate current-user location and land location
- interactive OpenStreetMap embed for the selected location
- land-location search with state resolution
- Tamil Nadu / Karnataka workflow switching from land location
- real map-listed nearby banks, lawyers and government places via OSM/Overpass
- official eCourts public-case navigation with explicit limitations
- state-context endpoint for state-aware services/RAG

### Important
Map data is geographic context, not proof of ownership/title. Nearby businesses are map-listed data and should be verified before relying on them. Public court searches do not prove that no dispute exists.

## V8 Guided Land Journey

The intended citizen flow is:

1. **Get current phone location** — browser asks for permission and the app shows the resolved current place.
2. **Choose the land location** — use current location, search another place, or choose a returned nearby mapped land-use area. Current location and land location remain separate.
3. **Automatic land public-information scan** — after a land location is selected, LandStack runs the public discovery scan for indexed incident/news references and provides the official eCourts search route. No result is treated as proof that no case/incident exists.
4. **Choose the goal** — buy land, inherited/family land, patta/name change, boundary/survey issue, or describe another problem.
5. **Adaptive questions** — the backend creates only the questions relevant to the selected goal, one unanswered question at a time.
6. **Document collection** — the user uploads real PDFs/images; OCR/document analysis updates the checklist, evidence graph, verification gaps and next-best action.
7. **Evidence analysis** — the user proceeds to evidence analysis after uploads and can download/view the AI-assisted case file.
8. **Next action** — the case plan, verification gaps, official service routes and professional escalation are shown from the actual case evidence.

The Vercel frontend still requires a deployed FastAPI backend. Set `VITE_API_BASE_URL` in the Vercel project to the deployed backend URL ending in `/api`.
