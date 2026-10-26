from typing import Dict, Any, List
from backend.app.models.case_state import NextBestAction, CaseState
from backend.app.rag.retrieval import retriever

class ActionAgent:
    @classmethod
    def _official_url_for_intent(cls, intent: str, state: str = ""):

        candidates = [p for p in retriever.procedures if p.get("applicable_intent") == intent and p.get("verification_status") == "VERIFIED" and (not state or p.get("state") in {state, "All"})]
        if candidates:
            return candidates[0].get("official_url")
        registry = {
            "PATTA_TRANSFER": "tn-patta-transfer-online",
            "LAND_PURCHASE_VERIFICATION": "tn-tnreginet-ec",
            "LAND_RECORD_SEARCH": "tn-patta-chitta-view"
        }
        wanted = registry.get(intent)
        for service in retriever.services:
            if wanted and service.get("id") == wanted and service.get("verification_status") == "VERIFIED":
                return service.get("official_url")
        return None

    @classmethod
    def determine_next_best_action(cls, case_state: CaseState) -> NextBestAction:
        intent = case_state.detected_intent
        has_area_gap = any(g.gap_type == "AREA_MISMATCH" and g.status == "OPEN" for g in case_state.verification_gaps)
        has_resurvey = any(d.doc_type == "FMB_SKETCH" for d in case_state.uploaded_documents)
        if has_area_gap and not has_resurvey:
            return NextBestAction(
                id="act_reconcile_area", title="Resolve the detected area discrepancy before proceeding",
                summary="The uploaded records show a potential extent mismatch. Add the relevant FMB/survey evidence for re-checking.",
                action_type="UPLOAD_DOCUMENT", step_by_step=["Review the documents that produced the mismatch.", "Upload the official FMB/survey evidence if available.", "LandStack will re-run deterministic comparison after the new evidence is added."],
                prerequisite="Relevant title/revenue records", official_service_url=cls._official_url_for_intent("BOUNDARY_DISPUTE"), target_office="Taluk Survey / Revenue Office", urgency="HIGH")

        if intent == "LAND_PURCHASE_VERIFICATION":
            docs = {d.doc_type for d in case_state.uploaded_documents}
            if not docs:
                state = case_state.state or "the selected state"
                return NextBestAction(id="act_purchase_collect", title="Collect the records relevant to this location", summary=f"Start with the documents applicable to {state}, the property context, and the actual purchase request. LandStack will not substitute another state's checklist.", action_type="UPLOAD_DOCUMENT", step_by_step=["Confirm the land location and property context.", "Request the applicable registered title/ownership evidence.", "Add revenue, registration, survey or municipal records only where relevant.", "Upload the actual documents for analysis."], official_service_url=cls._official_url_for_intent(intent, case_state.state), urgency="HIGH")
            return NextBestAction(id="act_purchase_review", title="Review the uploaded purchase evidence", summary="Compare only the actual uploaded evidence before taking the next step.", action_type="UPLOAD_DOCUMENT", step_by_step=["Review extracted fields from each uploaded document.", "Resolve missing links or potential inconsistencies.", "Use professional legal review where required."], official_service_url=cls._official_url_for_intent(intent, case_state.state), urgency="HIGH")

        if intent == "INHERITED_LAND_TRANSFER":
            return NextBestAction(id="act_inheritance_collect", title="Collect the succession and land records", summary="Add the records that establish the current owner, legal heirs and the property record before selecting the transfer route.", action_type="UPLOAD_DOCUMENT", step_by_step=["Upload the available deed and current Patta.", "Add the death and legal-heir evidence if applicable.", "Add EC/FMB or other supporting evidence when relevant."], official_service_url=cls._official_url_for_intent(intent, case_state.state), urgency="HIGH")

        if intent == "BOUNDARY_DISPUTE":
            return NextBestAction(id="act_boundary_collect", title="Collect the records needed for boundary comparison", summary="Upload the deed, Patta and FMB/survey records you have so LandStack can compare the available evidence.", action_type="UPLOAD_DOCUMENT", step_by_step=["Upload the registered deed or certified copy.", "Upload the current Patta.", "Upload the FMB/survey record if available."], official_service_url=cls._official_url_for_intent(intent, case_state.state), urgency="HIGH")

        if intent == "DOCUMENT_EXPLANATION":
            return NextBestAction(id="act_document_upload", title="Upload the document for explanation", summary="LandStack can extract text/fields from a supported PDF or image and explain the available information in plain language.", action_type="UPLOAD_DOCUMENT", step_by_step=["Upload the PDF or image.", "Review the extracted fields.", "Ask a follow-up question about any field that needs explanation."], urgency="MEDIUM")

        return NextBestAction(id="act_collect_context", title="Continue the case with your actual information", summary="Answer the adaptive questions and add only the documents relevant to your request.", action_type="UPLOAD_DOCUMENT", step_by_step=["Answer the next adaptive question.", "Upload relevant evidence when available.", "Review the generated next-best action."], urgency="MEDIUM")

    @classmethod
    def calculate_readiness_score(cls, case_state: CaseState) -> int:
        if not case_state.problem_statement:
            return 0
        score = 10
        if case_state.citizen_name: score += 10
        if case_state.district or case_state.taluk or case_state.village: score += 10
        answered = sum(1 for q in case_state.adaptive_questions if q.get("answered"))
        score += min(30, answered * 10)
        score += min(30, len(case_state.uploaded_documents) * 10)
        if case_state.verification_gaps and any(g.status == "OPEN" for g in case_state.verification_gaps):
            score = min(score, 70)
        return min(score, 100)

    @classmethod
    def generate_seller_questions(cls, survey_no: str, district: str) -> List[Dict[str, Any]]:
        context = f" for Survey No {survey_no}" if survey_no else ""
        return [
            {"category": "Title", "question": f"Can you provide the registered title deed and parent/link documents{context}?", "why_important": "They help trace the ownership history."},
            {"category": "Revenue", "question": "Does the current Patta match the seller's name, survey identity and extent?", "why_important": "A mismatch should be reviewed before proceeding."},
            {"category": "Encumbrance", "question": "Can you provide the relevant Encumbrance Certificate and explain any entries?", "why_important": "EC can reveal registered encumbrances, but it is not a complete litigation guarantee."},
            {"category": "Boundaries", "question": "Can the property boundaries and FMB/survey details be shown on site?", "why_important": "Physical and record evidence should be reconciled."}
        ]

action_agent = ActionAgent()
