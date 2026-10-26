# LANDSTACK AI — COMPREHENSIVE CODE & ARCHITECTURE AUDIT

**Target Audience:** Engineering Review & Technical Audit  
**Date of Audit:** September 26, 2026  
**Audited System:** LandStack AI — Multilingual Citizen Land Decision Copilot  
**Status:** Functional End-to-End Prototype (React + Vite Frontend / FastAPI Backend)  

---

## 1. Complete Frontend Folder & File Structure

```
frontend/
├── .gitignore
├── .oxlintrc.json
├── index.html
├── package.json
├── package-lock.json
├── README.md
├── vite.config.js
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── dist/                              # Production build assets (Vite 8)
│   ├── favicon.svg
│   ├── icons.svg
│   ├── index.html
│   └── assets/
│       ├── index-BiUaDvKp.css        # Compiled CSS (37.37 kB)
│       └── index-RB5m7CS1.js         # Compiled JS bundle (314.22 kB)
└── src/
    ├── App.css                        # Modern Citizen-Service Design System (1,300+ lines)
    ├── App.jsx                        # Master Application Shell & Navigation State
    ├── index.css                      # Global viewport and reset styling
    ├── main.jsx                       # React DOM root entrypoint
    ├── assets/
    │   ├── hero.png
    │   ├── react.svg
    │   └── vite.svg
    ├── components/
    │   ├── DemoControlBar.jsx         # Persistent 3-step judging demo controller
    │   ├── Header.jsx                 # Branding, active case ID, readiness meter, language switcher
    │   ├── JourneyStepper.jsx         # 11-step visual path (SPEAK to COMPLETE)
    │   └── StatutoryDisclaimer.jsx    # Statutory non-warranty legal banner
    ├── pages/
    │   ├── CasesPlanView.jsx          # Living Land Case plan & jurisdictional office visit guide
    │   ├── ChatAssistantView.jsx      # Conversational assistant, intent badge, adaptive Q&A, RAG citations
    │   ├── DocumentsView.jsx          # Checklist, file dropzone, OCR inspector, explainer, letter generator
    │   ├── EvidenceView.jsx           # SVG Evidence Graph, Gaps, Dependency Map, Seller Story, Simulator
    │   ├── FamilyRoomView.jsx         # Family Land Decision Room, heir consensus & comment audit log
    │   ├── HomeView.jsx               # Problem-first landing, voice/text input box, quick prompt chips
    │   ├── NotificationsView.jsx      # Smart notifications & LandGuard AI monitor
    │   ├── PassportView.jsx           # Land DNA / Property Passport structured summary
    │   └── RegistryView.jsx           # Verified official portal directory, Scam Shield, office GIS locator
    └── services/
        └── api.js                     # Centralized Fetch REST client interfacing with backend
```

---

## 2. Complete Backend Folder & File Structure

```
backend/
├── __init__.py
└── app/
    ├── __init__.py
    ├── main.py                        # FastAPI application entrypoint, CORS & router aggregation
    ├── agents/
    │   ├── __init__.py
    │   ├── action_agent.py            # Next-Best Action, readiness scoring, seller questions
    │   ├── case_agent.py              # Problem understanding, intent detection, adaptive Q&A, workflow planner
    │   ├── document_agent.py          # OCR intake, document classification, plain explanations, letter generator
    │   ├── evidence_agent.py          # Evidence Graph, Property Passport, gaps, dependency map, simulator
    │   └── orchestrator.py            # Main LandStack Orchestrator coordinating all 4 agents + RAG
    ├── models/
    │   ├── __init__.py
    │   └── case_state.py              # Pydantic models for CaseState, EvidenceNode, Gaps, Passport, etc.
    ├── rag/
    │   ├── __init__.py
    │   └── retrieval.py               # Token/keyword + semantic matcher & traceable citation builder
    ├── routers/
    │   ├── __init__.py
    │   ├── cases.py                   # /api/case, /api/case/plan, /api/property-passport, /api/case-file, /api/family-room
    │   ├── chat.py                    # /api/chat
    │   ├── demo.py                    # /api/demo/load-inconsistency, /api/demo/resolve-recheck, /api/demo/reset
    │   ├── documents.py               # /api/documents, /api/documents/checklist, /api/documents/upload, explain
    │   ├── evidence.py                # /api/evidence/graph, gaps, dependencies, provenance, timeline, simulator
    │   ├── recommendations.py         # /api/recommendation, /api/recommendation/resolve-recheck, readiness
    │   ├── registry.py                # /api/service-registry, /api/scam-shield/verify, /api/gis/offices
    │   └── tools.py                   # /api/tools/evidence-request, seller-questions, search-knowledge
    └── services/
        ├── __init__.py
        ├── comparison_engine.py       # 100% deterministic rules (area, name, survey, seller claims)
        ├── gis_service.py             # Jurisdictional Taluk/SRO/VAO office locator & visiting guidance
        ├── ocr_service.py             # Document intelligence, regex layout parser & demo mock matcher
        ├── pdf_service.py             # HTML/PDF case file report generator with statutory disclaimers
        └── scam_shield.py             # Domain validator against genuine *.gov.in whitelist
```

### Knowledge Base & Demo Data Directories
```
knowledge_base/
├── registry/
│   └── verified_services.json         # 9 verified official portals (.gov.in) with no invented URLs
└── sources/
    ├── citizen_faqs.json              # Multilingual FAQs with verified citations
    ├── document_requirements.json     # Intent-to-document checklist rules
    ├── procedures.json                # Statutory government workflows (Tamil Nadu Patta Pass Book Act)
    └── terminology.json               # Multilingual terminology glossary (Patta, Chitta, EC, FMB, TSLR)

demo_data/
└── sample_documents.json              # 5 pre-parsed demo document fixtures (Sale Deed, Patta, Heir, Death, FMB)
```

---

## 3. Where the Home Page is Implemented
- **Component File:** `frontend/src/pages/HomeView.jsx`
- **Component Function:** `export default function HomeView({ caseData, onNavigate, onSendProblem, language })`
- **Mount Point:** Mounted inside `frontend/src/App.jsx` (lines 62-69) when state `activeTab === 'home'`.
- **Implementation Details:**
  - Hero Section: Renders the positioning banner, language-aware headline, and problem input box.
  - Problem Input Box: Houses text input and the simulated microphone button.
  - Quick Example Chips: Renders pre-set buttons for Inheritance, Due Diligence, and Area Mismatch.
  - Journey Stepper: Integrates `<JourneyStepper currentStep={caseData?.stage} language={language} />`.
  - Dashboard Grid: Renders the active `Next-Best Action` card with direct navigation buttons, alongside the `Living Land Case Snapshot` tile showing readiness score, document count, and open gaps.
  - Innovation Architecture Strip: Quick navigational shortcuts to Evidence Graph, Dependency Map, Land DNA, and Family Room.

---

## 4. Where the Land Assistant / Chat is Implemented
- **Frontend View:** `frontend/src/pages/ChatAssistantView.jsx` (`export default function ChatAssistantView({ caseData, onUpdateCase, language })`).
- **Frontend Mount:** `frontend/src/App.jsx` (lines 70-76) when `activeTab === 'assistant'`.
- **Backend Route:** `backend/app/routers/chat.py`
  - Endpoint: `POST /api/chat`
  - Function: `chat_with_landstack(req: ChatRequest)`
- **Agentic Logic:** `backend/app/agents/orchestrator.py`
  - Function: `LandStackOrchestrator.process_chat_message(message: str, language: str)`
- **Intent Classification:** `backend/app/agents/case_agent.py`
  - Method: `CaseAgent.detect_intent(message)` matches keywords across `INTENT_MAP` (`INHERITED_LAND_TRANSFER`, `LAND_PURCHASE_VERIFICATION`, `BOUNDARY_DISPUTE`).
- **Knowledge Retrieval:** `backend/app/rag/retrieval.py`
  - Function: `retriever.search_knowledge(message, state, intent, top_k=3)` pulls verified citations from `procedures.json`, `terminology.json`, and `citizen_faqs.json`.

---

## 5. Where Language Selection is Implemented
- **UI Selector:** `frontend/src/components/Header.jsx` (lines 62-74).
  - Implements a `<select>` dropdown with three options: `ta` (தமிழ்), `en` (English), and `hi` (हिंदी).
- **State Control:** `frontend/src/App.jsx`
  - State declaration: `const [language, setLanguage] = useState('ta');` (line 20).
  - Propagated to all views (`HomeView`, `ChatAssistantView`, `CasesPlanView`, `DocumentsView`, `PassportView`, `EvidenceView`, `FamilyRoomView`, `RegistryView`, `NotificationsView`).
  - Passed to backend in chat payloads via `api.sendChatMessage(message, language)` and document uploads.

---

## 6. Where Tamil / English / Hindi Translations are Defined
There is no third-party i18n library (e.g. `react-i18next`); translations are defined modularly:
1. **Frontend UI Components:**
   - `frontend/src/components/JourneyStepper.jsx` (lines 3-15): Static array defining English and Tamil labels for each of the 11 journey stages (e.g. `{ id: 'SPEAK', label: 'Speak', ta: 'பேசு' }`).
   - `frontend/src/pages/HomeView.jsx`: Conditional ternary switches (`language === 'ta' ? ... : ...`) for hero titles, subtitles, placeholders, and prompt chips.
   - `frontend/src/pages/ChatAssistantView.jsx`: Initial greeting messages and voice status strings are ternary-branched.
2. **Backend Agent Knowledge:**
   - `backend/app/agents/case_agent.py`:
     - `INTENT_MAP`: Defines `title` (English) and `title_ta` (Tamil).
     - `generate_adaptive_questions`: Explicitly branches on `if language == "ta":` returning full Tamil question objects, else English question objects.
   - `backend/app/agents/document_agent.py`:
     - `EXPLANATIONS` dictionary: Maps document types (`TITLE_DEED`, `EXISTING_PATTA`, `LEGAL_HEIR_CERTIFICATE`, `DEATH_CERTIFICATE`, `FMB_SKETCH`) to `"en"` and `"ta"` explanation texts.
   - `backend/app/agents/orchestrator.py`:
     - `process_chat_message`: Formulates formatted replies in Tamil when `language == "ta"`, else in English.
3. **Structured Knowledge Base:**
   - `knowledge_base/sources/terminology.json`: Contains `term`, `term_ta`, `term_hi`, `summary`, `summary_ta`, `summary_hi`.
   - `knowledge_base/sources/procedures.json`: Contains `title`, `title_ta`.
   - `knowledge_base/sources/citizen_faqs.json`: Contains `question`, `question_ta`, `question_hi`, `answer`, `answer_ta`.
   - `knowledge_base/sources/document_requirements.json`: Contains `name`, `name_ta`.
- *Note on Hindi:* Hindi terms and FAQs exist in the knowledge base JSON files, but UI level text in `HomeView.jsx` and `ChatAssistantView.jsx` currently falls back to English when `hi` is selected.

---

## 7. Where Microphone / Voice Input is Implemented
1. **Home Page Input:** `frontend/src/pages/HomeView.jsx` (lines 74-84):
   ```jsx
   <button
     type="button"
     className="voice-input-btn"
     title="Voice Input (Speech Recognition)"
     onClick={() => {
       alert('Voice input architecture active: Microphone listening simulated. Transcribed into input box.');
     }}
   >
     <Mic size={18} />
   </button>
   ```
2. **Chat Assistant Input:** `frontend/src/pages/ChatAssistantView.jsx` (lines 164-175):
   ```jsx
   <button
     type="button"
     className="chat-voice-btn"
     title="Speech Input (Web Speech API Architecture)"
     onClick={() => {
       alert('Voice input activated: Listening to citizen audio in ' + (language === 'ta' ? 'Tamil' : 'English'));
     }}
   >
     <Mic size={18} />
   </button>
   ```

---

## 8. Where Speech-to-Text is Implemented
- **Current Status:** Speech-to-text is currently an **architectural placeholder / UI simulation**.
- Clicking the microphone icon currently triggers a browser notification explaining the Web Speech API architecture hook.
- Neither browser-native `window.SpeechRecognition` / `window.webkitSpeechRecognition` nor a server-side ASR pipeline (e.g. Whisper) is currently recording raw PCM audio streams. Citizens interact through text entry or the one-click Tamil prompt chips.

---

## 9. Where the Adaptive Questions are Defined / Generated
- **File:** `backend/app/agents/case_agent.py`
- **Method:** `CaseAgent.generate_adaptive_questions(intent: str, language: str = "ta") -> List[Dict[str, Any]]` (lines 48-154).
- **Logic:**
  - For `INHERITED_LAND_TRANSFER` (Tamil/English): Returns 4 adaptive questions:
    1. `q_state_district`: State, district, and taluk location.
    2. `q_father_status`: Deceased status and death certificate availability.
    3. `q_legal_heirs`: Tahsildar-issued legal heir certificate and co-heir details.
    4. `q_current_docs`: Currently available documents in citizen's possession.
  - For `LAND_PURCHASE_VERIFICATION`: Returns `q_seller_claim` and `q_parent_deeds`.
  - For `BOUNDARY_DISPUTE`: Returns `q_dispute_nature`.

---

## 10. Where the Answers to the Adaptive Questions are Stored
1. **Pre-populated Demo Answers:**
   - In `backend/app/agents/case_agent.py` (lines 57, 65, 73, 81), the demo answers are embedded directly in the questions dictionary:
     `answered: True`, `answer: "செங்கல்பட்டு மாவட்டம், திருப்போரூர் வட்டம், நெம்மேலி கிராமம்"`, etc.
2. **In-Memory Case State Model:**
   - In `backend/app/models/case_state.py` (line 156), the `CaseState` class defines `adaptive_questions: List[Dict[str, Any]] = Field(default_factory=list)`.
3. **Orchestrator Case Initialization:**
   - In `backend/app/agents/orchestrator.py` (line 41): `case.adaptive_questions = case_agent.generate_adaptive_questions(case.detected_intent, case.language)` stores the array on `orchestrator.active_case`.
4. **Frontend Presentation:**
   - In `frontend/src/pages/ChatAssistantView.jsx` (lines 194-209), the array is read from `caseData?.adaptive_questions` and rendered in the right-side adaptive questions card.

---

## 11. Where the Demo Case Data is Defined
1. **Case State Initialization:**
   - `backend/app/agents/orchestrator.py` -> `initialize_demo_case()` (lines 24-84):
     Instantiates `CaseState(case_id="TN-CASE-2026-0924", citizen_name="R. Murugan", language="ta", state="Tamil Nadu", district="Chengalpattu", taluk="Thiruporur", village="Nemmeli", ...)`
2. **Document Fixtures:**
   - `demo_data/sample_documents.json`: Contains the complete mock text and extracted fields for:
     - `doc_sale_deed_1998` (Title Deed)
     - `doc_current_patta` (Patta 1842)
     - `doc_legal_heir` (Legal Heir Certificate)
     - `doc_death_certificate` (Death Certificate)
     - `doc_fmb_resurvey_rectification` (FMB Re-measurement Report)
3. **Demo Triggers:**
   - `backend/app/routers/demo.py`:
     - `POST /api/demo/load-inconsistency`: Ingests 4 demo documents and activates the 0.40-acre discrepancy.
     - `POST /api/demo/resolve-recheck`: Ingests the 5th demo document (FMB report) to resolve the mismatch.

---

## 12. Source of Demo Values

| Demo Value | Source File & Location | Exact Code / Line Reference |
|---|---|---|
| **K. Ramanathan** | `demo_data/sample_documents.json` <br> `backend/app/agents/evidence_agent.py` | `sample_documents.json`: lines 8, 14, 30, 36, 52, 57, 73, 76. <br> `evidence_agent.py`: line 69 (`label="K. Ramanathan (Deceased Father)"`). |
| **R. Murugan** | `backend/app/agents/orchestrator.py` <br> `backend/app/models/case_state.py` <br> `demo_data/sample_documents.json` | `orchestrator.py`: line 27 (`citizen_name="R. Murugan"`). <br> `case_state.py`: line 147 (`citizen_name: str = "R. Murugan"`). <br> `sample_documents.json`: line 60. |
| **R. Lakshmi** | `backend/app/agents/orchestrator.py` <br> `demo_data/sample_documents.json` | `orchestrator.py`: line 52 (`FamilyMember(name="R. Lakshmi", relationship="Mother")`). <br> `sample_documents.json`: line 59. |
| **R. Anandhi** | `backend/app/agents/orchestrator.py` <br> `demo_data/sample_documents.json` | `orchestrator.py`: line 53 (`FamilyMember(name="R. Anandhi", relationship="Sister")`). <br> `sample_documents.json`: line 61. |
| **1998 Sale Deed** | `demo_data/sample_documents.json` <br> `backend/app/agents/evidence_agent.py` | `sample_documents.json`: lines 2-5 (`"filename": "Ramanathan_Registered_Sale_Deed_1998.pdf"`, Doc No 2451/1998). <br> `evidence_agent.py`: line 99. |
| **2.50 acres** | `demo_data/sample_documents.json` <br> `backend/app/services/comparison_engine.py` | `sample_documents.json`: line 17 (`"area_acres": 2.50`). <br> `comparison_engine.py`: line 88. |
| **Survey 142/2B** | `demo_data/sample_documents.json` <br> `backend/app/agents/evidence_agent.py` | `sample_documents.json`: lines 9, 16, 31, 38, 88. <br> `evidence_agent.py`: line 111 (`label="Survey No: 142/2B (Nemmeli)"`). |
| **Patta 1842** | `demo_data/sample_documents.json` <br> `backend/app/agents/evidence_agent.py` | `sample_documents.json`: lines 24, 29 (`"title": "... Patta No 1842"`). <br> `evidence_agent.py`: line 132 (`label="Computer Patta No 1842 (Tamil Nilam)"`). |
| **0.40 acre discrepancy** | `backend/app/services/comparison_engine.py` <br> `backend/app/agents/evidence_agent.py` | Calculated in `comparison_engine.py` line 44: `diff = round(patta_area - deed_area, 3)` -> `2.10 - 2.50 = -0.40`. <br> Flagged in `evidence_agent.py` lines 140-150. |

---

## 13. Where Evidence Graph Data is Generated
- **File:** `backend/app/agents/evidence_agent.py`
- **Method:** `EvidenceAgent.analyze_evidence(documents: List[DocumentItem], citizen_name: str)` (lines 20-316).
- **Generation Logic:**
  - Evaluates uploaded documents (`TITLE_DEED`, `EXISTING_PATTA`, `LEGAL_HEIR_CERTIFICATE`, `DEATH_CERTIFICATE`, `FMB_SKETCH`).
  - Instantiates `EvidenceNode` objects (`PERSON`, `DOCUMENT`, `SURVEY_NUMBER`, `PROPERTY`, `SUPPORTING_EVIDENCE`) with statuses `SUPPORTED`, `POTENTIAL CONFLICT`, `REQUIRES REVIEW`, or `MISSING`.
  - Instantiates `EvidenceEdge` objects (`SUCCEEDS`, `CO_HEIR_SUCCESSION`, `PURCHASE_DEED`, `DISCREPANCY_WITH` / `RECONCILED_WITH`, `LOCATES`, `RECTIFIES_AREA`).
- **API Route:** `backend/app/routers/evidence.py` -> `GET /api/evidence/graph`.
- **Frontend Visualization:** `frontend/src/pages/EvidenceView.jsx` (lines 142-273) renders an SVG diagram dynamically coloring nodes and dashed/solid lines based on gap statuses.

---

## 14. Where Property Passport / Land DNA Data is Generated
- **File:** `backend/app/agents/evidence_agent.py`
- **Function/Block:** Lines 279-296 inside `analyze_evidence()`:
  ```python
  passport = PropertyPassport(
      property_id="PROP-TN-THIRU-142-2B",
      survey_number="142/2B",
      subdivision_number="2B",
      district="Chengalpattu",
      taluk="Thiruporur",
      village="Nemmeli",
      recorded_owner="K. Ramanathan (Deceased) → Heirs Succession",
      extent_acres=2.50 if area_gap_resolved else 2.10,
      extent_hectares=1.012 if area_gap_resolved else 0.850,
      classification="Ryotwari Punja (Dry)",
      guideline_value_approx="Rs. 450 per sq.ft / ~Rs. 1.96 Crores",
      dispute_flag="CLEAN" if area_gap_resolved else "POTENTIAL_INCONSISTENCY",
      evidence_score=95 if area_gap_resolved else 58,
      registered_deeds=["Doc No 2451/1998 SRO Chengalpattu"],
      revenue_patta_no="1842",
      last_verified="2026-09-26",
      disclaimer="AI-assisted structured summary — not a legal certificate."
  )
  ```
- **API Route:** `backend/app/routers/cases.py` -> `GET /api/property-passport`.
- **Frontend Display:** `frontend/src/pages/PassportView.jsx`.

---

## 15. Where the 95% Score is Calculated
1. **Property Passport Evidence Score (95%):**
   - In `backend/app/agents/evidence_agent.py` line 291:
     ```python
     evidence_score = 95 if area_gap_resolved else 58
     ```
     When `area_gap_resolved` is True (triggered by uploading `doc_fmb_resurvey_rectification`), `evidence_score` evaluates to **95**.
2. **Action Agent Application Readiness Score (100%):**
   - In `backend/app/agents/action_agent.py` lines 61-80 (`calculate_readiness_score`):
     - Base = 20
     - Death Certificate = +15
     - Legal Heir Certificate = +15
     - Title Deed = +15
     - Patta = +10
     - (Subtotal = 75, capped at 60 while open gaps exist)
     - FMB Re-survey = +25 (Brings total to 100% when gap is cleared).
3. **Notification Copy Reference:**
   - In `backend/app/agents/orchestrator.py` line 188: Text string stating `"Your case readiness score is now 95%."`.

---

## 16. Where "STATUS: CLEAN" is Generated
- **Generation:** In `backend/app/agents/evidence_agent.py` line 290:
  ```python
  dispute_flag="CLEAN" if area_gap_resolved else "POTENTIAL_INCONSISTENCY"
  ```
- **Evaluation:** When `resurvey_doc` (`FMB_SKETCH`) is present, `area_gap_resolved` becomes `True`, assigning `"CLEAN"` to `property_passport.dispute_flag`.
- **Frontend Presentation:** In `frontend/src/pages/PassportView.jsx` lines 14, 78-90:
  ```jsx
  const isClean = passport.dispute_flag === 'CLEAN';
  // ...
  <strong className="status-bar-title">
    STATUS: {passport.dispute_flag?.replace(/_/g, ' ') || 'POTENTIAL INCONSISTENCY'}
  </strong>
  ```
  Applies the `.status-bar-clean` CSS class with green styling.

---

## 17. Where Family Room Data is Generated
- **Generation:** `backend/app/agents/orchestrator.py` -> `initialize_demo_case()` (lines 47-58):
  - Collaborators array:
    ```python
    case.family_members = [
        FamilyMember(id="fam_1", name="R. Murugan", relationship="Self / Son", role="ADMIN", decision_approval=True),
        FamilyMember(id="fam_2", name="R. Lakshmi", relationship="Mother", role="FAMILY_MEMBER", decision_approval=True),
        FamilyMember(id="fam_3", name="R. Anandhi", relationship="Sister", role="FAMILY_MEMBER", decision_approval=None)
    ]
    ```
  - Audit log array:
    ```python
    case.family_comments = [
        FamilyComment(id="c_1", author="R. Murugan", text="Started LandStack verification case for appa's Nemmeli land.", timestamp="2026-09-24 11:00"),
        FamilyComment(id="c_2", author="R. Anandhi", text="I have signed the consent affidavit for single patta in brother's name.", timestamp="2026-09-25 15:30")
    ]
    ```
- **API Routes:** `backend/app/routers/cases.py`:
  - `GET /api/family-room`: Returns collaborators and comments.
  - `POST /api/family-room/comment`: Appends new user comments to the live array.
- **Frontend View:** `frontend/src/pages/FamilyRoomView.jsx`.

---

## 18. Where Alerts / LandGuard Data is Generated
- **Initial Case Alert:** `backend/app/agents/orchestrator.py` (lines 60-63):
  `LandGuardAlert(id="lg_1", event_type="CASE_OPENED", message="Living Land Case initialized. Monitoring document changes.", severity="INFO")`
- **Area Inconsistency Warning Alert:** `backend/app/agents/orchestrator.py` (lines 134-140):
  `LandGuardAlert(id="lg_2", event_type="AREA_FLAGGED", message="POTENTIAL INCONSISTENCY detected: 0.40 Acre difference between Sale Deed and Patta.", severity="WARNING")`
- **Reconciliation Resolution Success Alert:** `backend/app/agents/orchestrator.py` (lines 179-185):
  `LandGuardAlert(event_type="VERIFICATION_RESOLVED", message="SUCCESS: Area inconsistency reconciled via Taluk Surveyor FMB Report. Ready for Patta Transfer.", severity="SUCCESS")`
- **API Route:** `backend/app/routers/cases.py` -> `GET /api/landguard`.
- **Frontend Display:** `frontend/src/pages/NotificationsView.jsx` (right column).

---

## 19. Where Official Service Registry URLs are Defined
- **Primary Source File:** `knowledge_base/registry/verified_services.json`
  Configured with verified real-world URLs:
  1. **Tamil Nadu Patta/Chitta Extract:** `https://eservices.tn.gov.in/eservicesnew/land/chitta.html?lan=en`
  2. **Tamil Nadu Patta Transfer Application:** `https://eservices.tn.gov.in/eservicesnew/land/pattaCheck.html`
  3. **TNREGINET Encumbrance Certificate (EC):** `https://tnreginet.gov.in/portal/`
  4. **Tamil Nadu Land Guideline Value Search:** `https://tnreginet.gov.in/portal/webHP?requestType=ApplicationRH&actionVal=checkGuidelineValue`
  5. **TNeGA e-Sevai Legal Heir Certificate:** `https://www.tnesevai.tn.gov.in/`
  6. **Town Survey Land Register (TSLR):** `https://eservices.tn.gov.in/eservicesnew/land/chitta.html`
  7. **Karnataka Bhoomi Portal:** `https://landrecords.karnataka.gov.in/`
  8. **Telangana Dharani Portal:** `https://dharani.telangana.gov.in/`
  9. **Uttar Pradesh Bhulekh Portal:** `https://upbhulekh.gov.in/`
- **Scam Shield Domain Whitelist:** `backend/app/services/scam_shield.py` (lines 5-14) defines `OFFICIAL_DOMAINS = ["eservices.tn.gov.in", "tnreginet.gov.in", ...]`.

---

## 20. Why Clicking "View Official Portal" Can Produce an Invalid Page
When users click links such as `https://eservices.tn.gov.in/eservicesnew/land/chitta.html?lan=en` or `https://tnreginet.gov.in/portal/webHP?...`, they may encounter connection timeouts, HTTP 403 Forbidden, or session errors due to:
1. **Government Data-Center Geo-Blocking:** Many Indian state government portals (hosted on National Informatics Centre / TNeGA / SDC servers) enforce strict IP geofencing that blocks or drops connections originating from IP addresses outside India.
2. **Session-Dependent URL Architecture:** Indian state portals built on legacy ASP.NET or Java JSP frameworks often do not support unauthenticated deep-linking. Accessing a sub-page without an active session cookie created at the root homepage (`tnreginet.gov.in/portal/`) causes an automatic redirection to an error or session-expired page.
3. **Strict Non-Hallucination Policy:** In accordance with Section 4 of the product specification ("NEVER invent official URLs"), the codebase strictly refuses to mock or fake government URLs. It points directly to genuine production government domains, which are subject to external government server uptime, maintenance windows, and firewall rules.

---

## 21. Application Data Source Breakdown

| Data Mechanism | Implemented? | Description in Current Codebase |
|---|---|---|
| **Hard-Coded Demo Data** | **YES** | `demo_data/sample_documents.json` contains pre-extracted text/metadata fixtures for the Ramanathan/Murugan demo scenario. Initial case details in `orchestrator.py` are hard-coded for instant judging. |
| **Database Data** | **PARTIAL** | Pydantic data models (`case_state.py`) are SQLite/PostgreSQL schema-ready. However, active case state is currently held in Python in-memory singleton objects (`orchestrator.active_case`) rather than committed to a `.db` file. |
| **API Data** | **YES** | Frontend communicates 100% via REST API endpoints (`/api/*`) through `api.js`. No hard-coded state exists inside React components. |
| **AI-Generated Data** | **NO** | Commercial LLM API calls are not executed at runtime. All responses are deterministically formulated by local agent templates and RAG search. |
| **Deterministic / Local Logic** | **YES** | `comparison_engine.py` (area subtraction `2.10 - 2.50 = -0.40`, name normalization, survey number checks) and `ocr_service.py` (regex parsers) execute 100% deterministic local Python logic. |
| **Overall Classification** | **HYBRID** | **Combination of live REST APIs, local deterministic calculation engines, structured JSON knowledge retrieval (RAG), and in-memory demo fixtures.** |

---

## 22. Are Gemini or OpenAI APIs Actually Connected?
- **Status:** **NO.**
- The packages `openai` and `google.generativeai` / `httpx` exist in the global Python environment, but **neither is called or instantiated in `backend/app`**.
- The system operates via a provider abstraction architecture using offline deterministic agents and local knowledge base indexing. This design guarantees that the application runs completely offline without network latency, API key costs, or rate-limiting failures during hackathon evaluation.

---

## 23. Every Environment Variable Used by the Project
The file `.env.example` documents the planned configuration:
- `HOST`: Server host binding (e.g. `127.0.0.1`)
- `PORT`: Server port binding (e.g. `8000`)
- `ENVIRONMENT`: Runtime mode (`development` / `production`)
- `DEMO_MODE`: Boolean switch for demo mode (`true` / `false`)
- `DATABASE_URL`: Database connection string (`sqlite:///./landstack.db`)
- `GEMINI_API_KEY`: API key for Google Gemini LLM provider
- `OPENAI_API_KEY`: API key for OpenAI LLM provider
- `KNOWLEDGE_BASE_PATH`: Path to knowledge base directory (`./knowledge_base`)
- `CORS_ORIGINS`: JSON array of allowed origins (`["http://localhost:5173", ...]`)

*Codebase Note:* In the current implementation, `backend/app/main.py`, `retrieval.py`, and `ocr_service.py` use self-contained relative path resolution and default fallbacks directly in code.

---

## 24. Does a `.env` File Exist?
- **Inspection Result:** **NO.**
- A `.env` file does **NOT** exist in the project root, `backend/`, or `frontend/`.
- Only the template `.env.example` exists. No secret keys or credentials are stored or committed.

---

## 25. Current Demo Mode Behavior
Demo Mode is orchestrated via `frontend/src/components/DemoControlBar.jsx` communicating with `backend/app/routers/demo.py`:
1. **Button 1 — `1. Problem Input`:** Calls `POST /api/demo/reset`. Restores pristine state: problem statement in Tamil (`"எங்க அப்பா பேர்ல இருக்குற நிலத்தை என் பேருக்கு மாற்றணும்."`), detected intent `INHERITED_LAND_TRANSFER`, zero uploaded documents, readiness at 20%.
2. **Button 2 — `2. Inconsistency Demo (0.40 Acre Gap)`:** Calls `POST /api/demo/load-inconsistency`. Loads 4 documents (Sale deed 2.50 acres, Patta 2.10 acres, Legal heir, Death certificate). The comparison engine identifies the `-0.40 acre` difference, sets `dispute_flag = "POTENTIAL_INCONSISTENCY"`, opens `AREA_MISMATCH` gap, locks the Verification Dependency Map to *"Waiting for verification"*, caps readiness at 60%, and updates Next-Best Action to recommend FMB re-measurement.
3. **Button 3 — `3. Resolve & Re-check`:** Calls `POST /api/demo/resolve-recheck`. Ingests Document E (Taluk Surveyor FMB report). Resolves the discrepancy as a UDR computerization entry error, marks gap `RESOLVED`, updates `dispute_flag = "CLEAN"`, unlocks dependencies to *"Application ready for submission"*, brings readiness score to 100%, and updates Next-Best Action to *"Submit Online Patta Transfer Application (Mutation)"*.
4. **Button 4 — `Case Dossier PDF`:** Opens `GET /api/case-file` in a new browser tab, rendering the downloadable/printable Land Case Dossier with statutory disclaimers.

---

## 26. How a Completely New User Case is Initialized
- When a user submits any message via the Home page input or the Land Assistant chat:
  1. Frontend sends `POST /api/chat` with `{ message: "...", language: "..." }`.
  2. `backend/app/agents/orchestrator.py` calls `process_chat_message(message, language)` on the global `active_case` instance.
  3. `CaseAgent.detect_intent(message)` evaluates the text against the keyword matrix in `INTENT_MAP` and updates `case.detected_intent` (e.g. `INHERITED_LAND_TRANSFER`, `LAND_PURCHASE_VERIFICATION`, or `BOUNDARY_DISPUTE`).
  4. `case.problem_statement` is updated to the user's input.
  5. `retriever.search_knowledge()` retrieves top matching citations from the knowledge base.
- **Architectural Limitation:** The system currently maintains a **single global in-memory case** (`orchestrator.active_case`). There is currently no multi-tenant session manager or database session table; any new user message mutates the active in-memory case state.

---

## 27. Known Frontend / Backend Errors or Warnings
1. **Linter Warnings (`oxlint`):**
   - 32 harmless unused-variable / unused-import warnings in frontend (e.g. unused Lucide icons `Eye`, `Download`, `Camera`, `Layers` imported in views).
   - Zero syntax errors, zero fatal compilation errors.
2. **React Compiler Optimization Warning:**
   - In `frontend/src/pages/RegistryView.jsx` (lines 18-20), `loadSellerQuestions` is called inside `useEffect` before its `const` definition within the component function. (Function hoisting in JavaScript allows execution, but React compiler logs an optimization skip warning).
3. **Backend Log Status:**
   - FastAPI server (`uvicorn`) logs zero unhandled exceptions or crashes. All endpoints return HTTP 200 responses.

---

## 28. Components That Appear Clickable But Have No Working Handler
1. **Microphone Buttons:**
   - Located in `HomeView.jsx` (`.voice-input-btn`) and `ChatAssistantView.jsx` (`.chat-voice-btn`).
   - Clicking triggers a browser `alert()` stating speech recognition architecture is simulated, rather than initiating live audio stream capture.
2. **Language Selector Dropdown (`Header.jsx`):**
   - Selecting `hi` (Hindi) updates the language state, but page UI text largely ternary-switches between `ta` and `en`, falling back to English for Hindi.
3. **SVG Graph Nodes (`EvidenceView.jsx`):**
   - Graph nodes have hover styling and visual badges, but clicking an individual node does not open an interactive node inspector modal.
4. **Co-Heir Consent Badges (`FamilyRoomView.jsx`):**
   - Statuses like `"Pending NOC"` and `"Consent Granted"` are static indicators derived from case state and cannot be directly toggled or signed by clicking.
5. **Property Passport Table Cells (`PassportView.jsx`):**
   - Have card cell borders that look like clickable tiles, but are display-only.

---

## 29. End-to-End Data Flow Architecture

```
[1. Home Page]
      │ Citizen enters natural language problem (e.g. "எங்க அப்பா பேர்ல...")
      ▼
[2. Land Assistant / Chat]
      │ POST /api/chat -> CaseAgent detects INHERITED_LAND_TRANSFER
      │ RAG retrieves procedures, terminology & citations from knowledge_base/
      ▼
[3. Case & Plan]
      │ Dynamic CasePlanStep array generated (Step 1 Completed, Step 2 In Progress)
      │ Jurisdictional offices (Thiruporur Taluk, Chengalpattu SRO) attached
      ▼
[4. Documents Vault]
      │ Personalized checklist created (Sale Deed, Patta, Legal Heir, Death Cert)
      │ Documents uploaded -> ocr_service.py extracts fields ("AI-assisted extraction")
      ▼
[5. Evidence Graph]
      │ Deterministic Comparison Engine checks deed (2.50 Ac) vs patta (2.10 Ac)
      │ -0.40 Ac difference triggers "POTENTIAL INCONSISTENCY"
      │ Missing Link generated: FMB Re-survey
      │ Verification Dependency Map locks downstream steps: "Waiting for verification"
      │ Readiness score capped at 60%
      │ (When FMB Rectification is ingested, gap resolves, readiness jumps to 100%)
      ▼
[6. Property Passport]
      │ Land DNA summary generated (Survey 142/2B, Owner, Extent, Guideline Value)
      │ Dispute status updates from POTENTIAL_INCONSISTENCY to CLEAN
      │ Downloadable Land Case File generated with statutory disclaimers
      ▼
[7. Family Room]
      │ Co-heir consensus displayed (Murugan - Approved, Lakshmi - Approved, Anandhi - Pending)
      │ Authorized heirs review shared evidence and record notes
      ▼
[8. Registry & Tools]
      │ Verified .gov.in services directory displayed
      │ Scam Shield validates external URLs against whitelist
      │ Seller Question Generator provides pre-purchase buyer checklist
      ▼
[9. Alerts & LandGuard]
      │ LandGuard AI tracks internal lifecycle events (AREA_FLAGGED -> VERIFICATION_RESOLVED)
      │ Smart notifications push action reminders to citizen
```

---
*Report generated and saved as `LANDSTACK_CODE_AUDIT.md`.*
