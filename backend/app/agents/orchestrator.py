from typing import Dict, Any, List, Optional
import re
from datetime import datetime
from backend.app.models.case_state import (
    CaseState, CaseStage, SmartNotification, LandGuardAlert,
    FamilyMember, FamilyComment, DocumentItem
)
from backend.app.agents.case_agent import case_agent
from backend.app.agents.document_agent import document_agent
from backend.app.agents.evidence_agent import evidence_agent
from backend.app.agents.action_agent import action_agent
from backend.app.rag.retrieval import retriever
from backend.app.services.location_service import location_service
from backend.app.services.gemini_service import gemini_service
from backend.app.services.groq_service import groq_service

class LandStackOrchestrator:
    """
    ONE MAIN LANDSTACK ORCHESTRATOR coordinating:
      - CASE AGENT
      - DOCUMENT AGENT
      - EVIDENCE AGENT
      - ACTION AGENT
    Underpinned by the RAG Trusted Knowledge Layer.
    """

    def __init__(self):
        self.active_case = self.initialize_new_case("en")

    def initialize_new_case(self, language: str = "ta") -> CaseState:
        """Creates an empty citizen case with no synthetic demo evidence."""
        now = datetime.now().strftime("%Y-%m-%d %H:%M")
        return CaseState(
            case_id=f"LS-CASE-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            citizen_name="",
            language=language if language in {"ta", "kn", "en"} else "en",
            state="",
            district="",
            taluk="",
            village="",
            land_type="",
            property_context="",
            user_current_location={},
            land_location={},
            location_source="",
            location_verified=False,
            created_at=now,
            updated_at=now,
            stage=CaseStage.UNDERSTANDING,
            problem_statement="",
            detected_intent="",
            intent_confidence=0.0,
            intent_title="",
            adaptive_questions=[],
            case_plan=[],
            checklist=[],
            uploaded_documents=[],
            evidence_nodes=[],
            evidence_edges=[],
            missing_links=[],
            verification_gaps=[],
            verification_dependencies=[],
            next_best_action=None,
            property_passport=None,
            seller_story=None,
            provenance_records=[],
            family_members=[],
            family_comments=[],
            landguard_alerts=[],
            timeline=[],
            notifications=[],
            readiness_score=0,
            notes=[],
            conversation_history=[],
            is_demo_mode=False
        )

    def initialize_demo_case(self) -> CaseState:
        """Initializes the standard demo case ready for judging walkthrough."""
        case = CaseState(
            case_id="TN-CASE-2026-0924",
            citizen_name="R. Murugan",
            language="ta",
            state="Tamil Nadu",
            district="Chengalpattu",
            taluk="Thiruporur",
            village="Nemmeli",
            created_at=datetime.now().strftime("%Y-%m-%d %H:%M"),
            updated_at=datetime.now().strftime("%Y-%m-%d %H:%M"),
            stage=CaseStage.UNDERSTANDING,
            problem_statement="எங்க அப்பா பேர்ல இருக்குற நிலத்தை என் பேருக்கு மாற்றணும்.",
            detected_intent="INHERITED_LAND_TRANSFER",
            intent_confidence=0.98,
            intent_title="Inherited Land Mutation & Patta Transfer",
            notes=["Citizen seeking patta transfer following father's decease."],
            is_demo_mode=True
        )

        # 1. Initialize adaptive questions
        case.adaptive_questions = case_agent.generate_adaptive_questions(case.detected_intent, case.language)

        # 2. Initialize case plan
        case.case_plan = case_agent.generate_case_plan(case.detected_intent)

        # 3. Initialize checklist
        case.checklist = case_agent.generate_checklist(case.detected_intent)

        # 4. Initialize Family Decision Room
        case.family_members = [
            FamilyMember(id="fam_1", name="R. Murugan", relationship="Self / Son", role="ADMIN", decision_approval=True),
            FamilyMember(id="fam_2", name="R. Lakshmi", relationship="Mother", role="FAMILY_MEMBER", decision_approval=True),
            FamilyMember(id="fam_3", name="R. Anandhi", relationship="Sister", role="FAMILY_MEMBER", decision_approval=None)
        ]
        case.family_comments = [
            FamilyComment(id="c_1", author="R. Murugan", text="Started LandStack verification case for appa's Nemmeli land.", timestamp="2026-09-24 11:00"),
            FamilyComment(id="c_2", author="R. Anandhi", text="I have signed the consent affidavit for single patta in brother's name.", timestamp="2026-09-25 15:30")
        ]

        # 5. Initialize LandGuard monitoring alerts
        case.landguard_alerts = [
            LandGuardAlert(id="lg_1", timestamp=datetime.now().strftime("%Y-%m-%d %H:%M"), event_type="CASE_OPENED", message="Living Land Case initialized. Monitoring document changes.", severity="INFO")
        ]

        # 6. Initialize initial notifications
        case.notifications = [
            SmartNotification(
                id="notif_1",
                title="Welcome to LandStack AI",
                message="Case TN-CASE-2026-0924 created. Review your personalized document checklist.",
                category="CASE_SETUP",
                action_route="/documents",
                timestamp=datetime.now().strftime("%Y-%m-%d %H:%M")
            )
        ]

        # 7. Next best action
        case.next_best_action = action_agent.determine_next_best_action(case)
        case.readiness_score = action_agent.calculate_readiness_score(case)

        return case

    def load_demo_with_inconsistency(self) -> CaseState:
        """
        Loads the primary demo state with the intentional demo mismatch:
        Sale deed: 2.50 acres vs Patta: 2.10 acres.
        Triggers: Potential Inconsistency, Evidence Graph conflict, Verification Dependency lock.
        """
        case = self.initialize_demo_case()
        case.stage = CaseStage.VERIFICATION
        self.active_case = case

        # Ingest Document A (Sale Deed)
        doc_a = document_agent.ingest_document("Ramanathan_Registered_Sale_Deed_1998.pdf", language=case.language, use_demo_samples=True)
        # Ingest Document B (Patta - 2.10 acres)
        doc_b = document_agent.ingest_document("TamilNilam_Computer_Patta_1842.pdf", language=case.language, use_demo_samples=True)
        # Ingest Document C (Legal Heir)
        doc_c = document_agent.ingest_document("Legal_Heir_Certificate_TN_2024.pdf", language=case.language, use_demo_samples=True)
        # Ingest Document D (Death Cert)
        doc_d = document_agent.ingest_document("Death_Certificate_K_Ramanathan.pdf", language=case.language, use_demo_samples=True)

        case.uploaded_documents = [doc_a, doc_b, doc_c, doc_d]
        case.checklist = document_agent.update_checklist_status(case.checklist, case.uploaded_documents)

        # Run Evidence Agent analysis
        analysis = evidence_agent.analyze_evidence(case.uploaded_documents, case.citizen_name)
        case.evidence_nodes = analysis["evidence_nodes"]
        case.evidence_edges = analysis["evidence_edges"]
        case.verification_gaps = analysis["verification_gaps"]
        case.missing_links = analysis["missing_links"]
        case.verification_dependencies = analysis["verification_dependencies"]
        case.property_passport = analysis["property_passport"]
        case.timeline = analysis["timeline"]
        case.provenance_records = analysis["provenance_records"]

        # Seller story comparison
        case.seller_story = evidence_agent.evaluate_seller_story(
            seller_claim={"area_acres": 2.50, "seller_name": "K. Ramanathan"},
            verified_evidence={"area_acres": 2.10, "recorded_owner": "K. Ramanathan"}
        )

        # Update Next-Best Action
        case.next_best_action = action_agent.determine_next_best_action(case)
        case.readiness_score = action_agent.calculate_readiness_score(case)

        # Add LandGuard Alert
        case.landguard_alerts.append(LandGuardAlert(
            id="lg_2",
            timestamp=datetime.now().strftime("%Y-%m-%d %H:%M"),
            event_type="AREA_FLAGGED",
            message="POTENTIAL INCONSISTENCY detected: 0.40 Acre difference between Sale Deed and Patta.",
            severity="WARNING"
        ))

        case.notifications.append(SmartNotification(
            id="notif_2",
            title="Potential Inconsistency Detected",
            message="Revenue record shows 2.10 acres vs deed of 2.50 acres. Next action updated.",
            category="VERIFICATION_ALERT",
            action_route="/evidence",
            timestamp=datetime.now().strftime("%Y-%m-%d %H:%M")
        ))

        return case

    def resolve_inconsistency_recheck(self) -> CaseState:
        """
        Executes Conflict → Resolution → Re-check:
        User uploads Document E (FMB Re-survey & Rectification Report).
        Deterministic engine reconciles the area difference to 2.50 acres.
        Case state updates to: RESOLVED / READY FOR PATTA TRANSFER.
        """
        case = self.active_case

        # Ingest Document E (FMB Re-survey)
        doc_e = document_agent.ingest_document("FMB_Field_Measurement_Rectification_Report.pdf", language=case.language, use_demo_samples=True)
        # Avoid duplicate
        case.uploaded_documents = [d for d in case.uploaded_documents if d.doc_type != "FMB_SKETCH"] + [doc_e]
        case.checklist = document_agent.update_checklist_status(case.checklist, case.uploaded_documents)

        # Re-run Evidence Agent deterministic analysis
        analysis = evidence_agent.analyze_evidence(case.uploaded_documents, case.citizen_name)
        case.evidence_nodes = analysis["evidence_nodes"]
        case.evidence_edges = analysis["evidence_edges"]
        case.verification_gaps = analysis["verification_gaps"]
        case.missing_links = [m for m in analysis["missing_links"] if m.id != "link_fmb_resurvey"]
        case.verification_dependencies = analysis["verification_dependencies"]
        case.property_passport = analysis["property_passport"]
        case.timeline = analysis["timeline"]
        case.provenance_records = analysis["provenance_records"]

        case.stage = CaseStage.ACTION_REQUIRED

        # Action Agent updates next best action
        case.next_best_action = action_agent.determine_next_best_action(case)
        case.readiness_score = action_agent.calculate_readiness_score(case)

        case.landguard_alerts.append(LandGuardAlert(
            id=f"lg_{datetime.now().strftime('%M%S')}",
            timestamp=datetime.now().strftime("%Y-%m-%d %H:%M"),
            event_type="VERIFICATION_RESOLVED",
            message="SUCCESS: Area inconsistency reconciled via Taluk Surveyor FMB Report. Ready for Patta Transfer.",
            severity="SUCCESS"
        ))

        case.notifications.append(SmartNotification(
            id=f"notif_{datetime.now().strftime('%M%S')}",
            title="Area Discrepancy Reconciled!",
            message=f"Demo case readiness score is now {case.readiness_score}%. Review the verified official Patta service before proceeding.",
            category="CASE_PROGRESS",
            action_route="/passport",
            timestamp=datetime.now().strftime("%Y-%m-%d %H:%M")
        ))

        return case

    def answer_adaptive_question(self, question_id: str, answer: str, language: str = "ta") -> Dict[str, Any]:
        answer = (answer or "").strip()
        if not answer:
            return {"error": "Please provide an answer.", "adaptive_questions": self.active_case.adaptive_questions}
        found = next((q for q in self.active_case.adaptive_questions if q.get("id") == question_id), None)
        if not found:
            return {"error": "Question not found.", "adaptive_questions": self.active_case.adaptive_questions}
        found["answered"] = True
        found["answer"] = answer
        detected_language = case_agent.detect_language(answer, language)
        self.active_case.language = detected_language
        field = found.get("field")
        if field == "citizen_name": self.active_case.citizen_name = answer
        elif field == "property_location":
            self._set_land_location_from_text(answer)
        elif field == "property_context":
            self.active_case.property_context = answer
            self.active_case.land_type = answer
        elif field == "available_documents": self.active_case.notes.append(f"Documents reported by citizen: {answer}")
        elif field in {"legal_heirs", "heirs"}: self._update_family_from_text(answer)
        else: self.active_case.notes.append(f"{field}: {answer}")
        if self.active_case.state and self.active_case.detected_intent:
            self.active_case.checklist = case_agent.generate_checklist(self.active_case.detected_intent, self.active_case.state, self.active_case.land_type)
        self.active_case.updated_at = datetime.now().strftime("%Y-%m-%d %H:%M")
        remaining = [q for q in self.active_case.adaptive_questions if not q.get("answered")]
        if not remaining:
            self.active_case.stage = CaseStage.DOCUMENTS_REQUIRED if self.active_case.checklist else CaseStage.ACTION_REQUIRED
        else:
            self.active_case.stage = CaseStage.INFORMATION_REQUIRED
        self.active_case.next_best_action = action_agent.determine_next_best_action(self.active_case)
        self.active_case.readiness_score = action_agent.calculate_readiness_score(self.active_case)
        return {"message": "Answer recorded.", "answered_question_id": question_id, "next_question": remaining[0] if remaining else None, "adaptive_questions": self.active_case.adaptive_questions, "case": self.active_case.model_dump()}

    def _set_land_location_from_text(self, text: str):
        results = location_service.geocode(text, state=self.active_case.state or None)
        if len(results) == 1:
            loc = results[0]
            self.active_case.land_location = loc
            self.active_case.location_source = "OpenStreetMap Nominatim geocoding of citizen-provided land location"
            self.active_case.location_verified = True
            self.active_case.state = loc.get("state") or self.active_case.state
            self.active_case.district = loc.get("district", "")
            self.active_case.taluk = loc.get("taluk", "")
            self.active_case.village = loc.get("village", "")
        elif len(results) > 1:
            # Keep the user's exact text and require clarification instead of silently choosing.
            self.active_case.land_location = {"query": text, "ambiguous": True, "candidates": results[:5]}
            self.active_case.location_verified = False
        else:
            self.active_case.land_location = {"query": text, "ambiguous": False, "unresolved": True}
            self.active_case.location_verified = False

    def _update_family_from_text(self, text: str):
        """Create family entries only from citizen-provided names; never seed names."""
        if not text:
            return
        # Explicit comma/and separated names are treated as reported family members.
        candidates = [x.strip() for x in re.split(r',|\band\b|\bமற்றும்\b|\bమరియు\b', text, flags=re.I) if x.strip()]
        if len(candidates) <= 1:
            return
        for idx, name in enumerate(candidates):
            clean = re.sub(r'^(mother|father|wife|husband|son|daughter|brother|sister|தாய்|தந்தை|மனைவி|கணவர்|மகன்|மகள்|சகோதரி|சகோதரர்|అమ్మ|నాన్న|భార్య|భర్త|కొడుకు|కూతురు)\s*[:\-]?\s*', '', name, flags=re.I).strip()
            if not clean or any(m.name.lower() == clean.lower() for m in self.active_case.family_members):
                continue
            self.active_case.family_members.append(FamilyMember(id=f"fam_{len(self.active_case.family_members)+1}", name=clean, relationship="Reported family member", role="FAMILY_MEMBER", decision_approval=None))

    def _record_conversation(self, role: str, text: str, language: str):
        self.active_case.conversation_history.append({
            "role": role,
            "text": text,
            "language": language,
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        })
        self.active_case.conversation_history = self.active_case.conversation_history[-30:]

    def process_chat_message(self, message: str, language: str = "en") -> Dict[str, Any]:
        message = (message or "").strip()
        if not message:
            return {"reply": "Please describe your land-related request.", "citations": []}
        requested_language = language if language in {"ta", "kn", "en"} else "en"
        detected_language = case_agent.detect_language(message, requested_language)

        # If a real case already exists, answer ordinary follow-up questions from current context
        # instead of restarting the case or inventing a new intent.
        strong_intent = case_agent.detect_intent(message)
        followup_words = ["what is this", "why", "where should", "which office", "what next", "explain", "என்ன இது", "ஏன்", "எங்கே செல்ல", "ಯಾವ ಕಚೇರಿ", "ಏನು ಇದು", "ಮುಂದೆ ಏನು"]
        is_followup = bool(self.active_case.problem_statement and any(w in message.lower() for w in followup_words))
        if is_followup and not any(v > 10 for v in strong_intent.get("scores", {}).values()):
            case = self.active_case
            gap_count = len([g for g in case.verification_gaps if g.status == "OPEN"])
            if detected_language == "ta":
                reply = f"இந்த கேஸ் {case.intent_title or 'நில உதவி'} தொடர்பானது. தற்போதைய இடம்: {case.land_location.get('display_name') or case.land_location.get('query') or 'இன்னும் சரிபார்க்கப்படவில்லை'}. பதிவேற்றிய ஆவணங்கள்: {len(case.uploaded_documents)}. திறந்த சரிபார்ப்பு இடைவெளிகள்: {gap_count}. {('அடுத்த கேள்வியை தொடரலாம்.' if any(not q.get('answered') for q in case.adaptive_questions) else 'அடுத்த செயலை பார்க்கலாம்.')}"
            else:
                reply = f"ಈ ಕೇಸ್ {case.intent_title or 'ಭೂ ಸಹಾಯ'} ಕುರಿತು ಇದೆ. ಪ್ರಸ್ತುತ ಜಮೀನು ಸ್ಥಳ: {case.land_location.get('display_name') or case.land_location.get('query') or 'ಇನ್ನೂ ಪರಿಶೀಲಿಸಲಾಗಿಲ್ಲ'}. ಅಪ್‌ಲೋಡ್ ಮಾಡಿದ ದಾಖಲೆಗಳು: {len(case.uploaded_documents)}. ತೆರೆಯಿರುವ ಪರಿಶೀಲನಾ ಅಂತರಗಳು: {gap_count}. {'ಮುಂದಿನ ಪ್ರಶ್ನೆಯನ್ನು ಮುಂದುವರಿಸಬಹುದು.' if any(not q.get('answered') for q in case.adaptive_questions) else 'ಮುಂದಿನ ಕ್ರಮವನ್ನು ನೋಡಬಹುದು.'}"
            citations = retriever.search_knowledge(message, state=case.state or "All", intent=case.detected_intent or None, top_k=4)
            ai = self._ai_reply(message, detected_language, citations)
            if ai:
                reply = ai
            self._record_conversation("user", message, detected_language)
            self._record_conversation("assistant", reply, detected_language)
            return {"reply": reply, "detected_intent": strong_intent, "detected_language": detected_language, "citations": citations, "ai_used": bool(ai), "case_id": case.case_id, "stage": case.stage, "adaptive_questions": case.adaptive_questions, "case": case.model_dump()}

        intent_info = strong_intent
        # Any real request after Demo Mode starts a clean real case.
        if self.active_case.is_demo_mode:
            self.active_case = self.initialize_new_case(detected_language)
        self.active_case.language = detected_language
        self.active_case.problem_statement = message
        self.active_case.detected_intent = intent_info["intent"]
        self.active_case.intent_title = intent_info.get("title_ta") if detected_language == "ta" else (intent_info.get("title_kn") if detected_language == "kn" else intent_info.get("title"))
        self.active_case.intent_confidence = intent_info.get("confidence", 0.0)
        self.active_case.stage = CaseStage.UNDERSTANDING

        # Explicit state names are valid user-provided state context; other location details are geocoded.
        low = message.lower()
        if "tamil nadu" in low or "tamilnadu" in low or "தமிழ்நாடு" in message:
            self.active_case.state = "Tamil Nadu"
        elif "karnataka" in low or "ಕರ್ನಾಟಕ" in message:
            self.active_case.state = "Karnataka"
        self._set_land_location_from_text(message)
        if self.active_case.state not in {"Tamil Nadu", "Karnataka"}:
            self.active_case.state = ""

        self.active_case.adaptive_questions = case_agent.generate_adaptive_questions(intent_info["intent"], detected_language, self.active_case.state, self.active_case.land_type)
        # Location-first: if land location is unresolved, put the location question first; name follows.
        if not self.active_case.location_verified:
            loc_q = next((q for q in self.active_case.adaptive_questions if q.get("field") == "property_location"), None)
            if loc_q:
                self.active_case.adaptive_questions = [loc_q] + [q for q in self.active_case.adaptive_questions if q.get("id") != loc_q.get("id")]
        self.active_case.case_plan = case_agent.generate_case_plan(intent_info["intent"])
        if self.active_case.state:
            self.active_case.checklist = case_agent.generate_checklist(intent_info["intent"], self.active_case.state, self.active_case.land_type)
        else:
            self.active_case.checklist = []
        self.active_case.next_best_action = action_agent.determine_next_best_action(self.active_case)
        self.active_case.readiness_score = action_agent.calculate_readiness_score(self.active_case)
        self.active_case.updated_at = datetime.now().strftime("%Y-%m-%d %H:%M")

        citations = retriever.search_knowledge(message, state=self.active_case.state or "All", intent=intent_info["intent"], top_k=4)
        if detected_language == "ta":
            title = intent_info.get("title_ta", intent_info["title"])
            if not self.active_case.land_location or not self.active_case.location_verified:
                reply = f"உங்கள் தேவையை புரிந்துகொண்டேன்: **{title}**. முதலில் நிலம் இருக்கும் இடத்தைத் துல்லியமாக உறுதி செய்ய வேண்டும். நீங்கள் மாவட்டம், வட்டம், கிராமம் அல்லது வரைபடத்தில் இடத்தை சொல்லுங்கள்."
            else:
                reply = f"உங்கள் தேவையை புரிந்துகொண்டேன்: **{title}**. நிலம்: **{self.active_case.land_location.get('display_name', 'பயனர் வழங்கிய இடம்')}**. முதலில் உங்கள் பெயரை சொல்லுங்கள்."
        else:
            title = intent_info.get("title_kn", intent_info["title"])
            if not self.active_case.land_location or not self.active_case.location_verified:
                reply = f"ನಿಮ್ಮ ಅಗತ್ಯವನ್ನು ಅರ್ಥಮಾಡಿಕೊಂಡಿದ್ದೇನೆ: **{title}**. ಮೊದಲು ಜಮೀನು ಇರುವ ಸ್ಥಳವನ್ನು ಖಚಿತಪಡಿಸಬೇಕು. ಜಿಲ್ಲೆ, ತಾಲೂಕು, ಗ್ರಾಮ ಅಥವಾ ನಕ್ಷೆಯ ಸ್ಥಳವನ್ನು ನೀಡಿ."
            else:
                reply = f"ನಿಮ್ಮ ಅಗತ್ಯವನ್ನು ಅರ್ಥಮಾಡಿಕೊಂಡಿದ್ದೇನೆ: **{title}**. ಜಮೀನು: **{self.active_case.land_location.get('display_name', 'ಬಳಕೆದಾರರು ನೀಡಿದ ಸ್ಥಳ')}**. ಮೊದಲು ನಿಮ್ಮ ಹೆಸರನ್ನು ತಿಳಿಸಿ."
        ai = self._ai_reply(message, detected_language, citations)
        if ai:
            reply = ai
        self._record_conversation("user", message, detected_language)
        self._record_conversation("assistant", reply, detected_language)
        return {"reply": reply, "detected_intent": intent_info, "detected_language": detected_language, "citations": citations, "ai_used": bool(ai), "case_id": self.active_case.case_id, "stage": self.active_case.stage, "adaptive_questions": self.active_case.adaptive_questions, "case": self.active_case.model_dump()}

    def _ai_reply(self, message: str, language: str, citations: List[Dict[str, Any]]) -> str:
        lang_name = {"ta": "Tamil", "kn": "Kannada", "en": "English"}.get(language, "English")
        case = self.active_case
        context = {
            "state": case.state,
            "district": case.district,
            "taluk": case.taluk,
            "village": case.village,
            "land_location": case.land_location,
            "current_location": case.user_current_location,
            "land_type": case.land_type,
            "property_context": case.property_context,
            "intent": case.detected_intent,
            "intent_title": case.intent_title,
            "stage": str(case.stage),
            "documents": [d.model_dump() for d in case.uploaded_documents],
            "gaps": [g.model_dump() for g in case.verification_gaps],
            "next_action": case.next_best_action.model_dump() if case.next_best_action else None,
            "conversation_history": case.conversation_history[-12:],
        }
        system = f"""You are LandStack AI, a citizen land decision copilot.
Answer only in {lang_name}. Continue the EXISTING case; never restart it.
Use the supplied case context and retrieved knowledge as factual support.
Never invent owners, survey numbers, deaths, court cases, encumbrances, banks, lawyers, government results, URLs, approvals, or legal conclusions.
Map data is geographic context, not cadastral or ownership proof.
Do not repeat a question already answered in the case context or conversation history.
Ask at most ONE next missing relevant question. If enough information exists, move to the next workflow step.
Be concise and practical. If information is unavailable, clearly say it needs verification from an official source."""
        user = f"CASE CONTEXT: {context}\nRETRIEVED KNOWLEDGE: {citations}\nCITIZEN MESSAGE: {message}"
        messages = [{"role": "system", "content": system}]
        for item in case.conversation_history[-12:]:
            role = item.get("role") if item.get("role") in {"user", "assistant"} else "user"
            text = str(item.get("text") or "").strip()
            if text:
                messages.append({"role": role, "content": text})
        messages.append({"role": "user", "content": user})

        # Groq is the primary AI provider for this build. Gemini remains a transparent fallback.
        result = groq_service.generate(messages)
        if result.get("ok"):
            return result["text"]
        result = gemini_service.generate(user)
        return result.get("text", "").strip() if result.get("ok") else ""



orchestrator = LandStackOrchestrator()