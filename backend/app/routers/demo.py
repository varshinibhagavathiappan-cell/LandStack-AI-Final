from fastapi import APIRouter
from typing import Dict, Any
from backend.app.agents.orchestrator import orchestrator

router = APIRouter(prefix="/api/demo", tags=["Demo Mode Automation"])

@router.get("/status")
def get_demo_status() -> Dict[str, Any]:
    """Returns current demo state summary."""
    case = orchestrator.active_case
    has_resurvey = any(d.doc_type == "FMB_SKETCH" for d in case.uploaded_documents)
    has_docs = len(case.uploaded_documents) > 0

    mode = "INITIAL_UNDERSTANDING"
    if has_resurvey:
        mode = "RECONCILED_SUCCESS"
    elif has_docs:
        mode = "INCONSISTENCY_DEMO"

    return {
        "mode": mode,
        "case_id": case.case_id,
        "readiness_score": case.readiness_score,
        "uploaded_docs_count": len(case.uploaded_documents),
        "open_gaps_count": sum(1 for g in case.verification_gaps if g.status == "OPEN"),
        "is_demo_mode": True,
        "primary_scenario": "Tamil Father Land Patta Transfer with 0.40-Acre Area Mismatch and FMB Rectification"
    }

@router.post("/load-inconsistency")
def load_inconsistency_state() -> Dict[str, Any]:
    """
    Loads Primary Demo State:
    4 documents uploaded (Sale Deed 2.50 acres, Patta 2.10 acres, Legal Heir, Death Certificate).
    Triggers: POTENTIAL INCONSISTENCY (-0.40 acre), Evidence Graph conflict, Verification Dependency lock.
    """
    case = orchestrator.load_demo_with_inconsistency()
    return {
        "message": "Demo state loaded with intentional area mismatch (2.50 acres vs 2.10 acres).",
        "case": case.model_dump()
    }

@router.post("/resolve-recheck")
def resolve_demo_recheck() -> Dict[str, Any]:
    """
    Loads Resolution State:
    Document E (Taluk Surveyor FMB Re-measurement Report) ingested.
    0.40-acre discrepancy reconciled as UDR computerization entry error.
    Readiness is recalculated from the synthetic demo evidence. Next action becomes the verified Patta service route.
    """
    case = orchestrator.resolve_inconsistency_recheck()
    return {
        "message": "FMB re-measurement ingested. Area reconciled to 2.50 acres. Next-best action unlocked.",
        "case": case.model_dump()
    }

@router.post("/reset")
def reset_demo() -> Dict[str, Any]:
    """Resets demo to pristine initial state."""
    orchestrator.active_case = orchestrator.initialize_demo_case()
    return {"message": "Demo reset to initial conversational state.", "case": orchestrator.active_case.model_dump()}
