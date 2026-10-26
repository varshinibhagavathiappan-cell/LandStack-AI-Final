from fastapi import APIRouter
from typing import Dict, Any
from backend.app.agents.orchestrator import orchestrator

router = APIRouter(prefix="/api/recommendation", tags=["Recommendations & Next-Best Action"])

@router.get("")
def get_next_best_action() -> Dict[str, Any]:
    """Returns the primary recommended next action with step-by-step guidance."""
    if orchestrator.active_case.next_best_action:
        return orchestrator.active_case.next_best_action.model_dump()
    return {
        "title": "Upload Initial Land Records",
        "summary": "Begin by uploading available documents.",
        "urgency": "MEDIUM"
    }

@router.post("/resolve-recheck")
def resolve_inconsistency_recheck() -> Dict[str, Any]:
    """
    Executes the Innovation Feature: Conflict → Resolution → Re-check.
    Simulates user uploading FMB re-survey rectification report.
    Re-runs deterministic checks, resolves area mismatch, updates dependency map, and updates next-best action!
    """
    updated_case = orchestrator.resolve_inconsistency_recheck()
    return {
        "message": "Conflict resolved and evidence re-checked successfully.",
        "readiness_score": updated_case.readiness_score,
        "next_best_action": updated_case.next_best_action.model_dump() if updated_case.next_best_action else None,
        "verification_gaps": [g.model_dump() for g in updated_case.verification_gaps],
        "property_passport": updated_case.property_passport.model_dump() if updated_case.property_passport else None
    }

@router.get("/readiness")
def get_readiness() -> Dict[str, Any]:
    """Returns application readiness score and prerequisite checklist."""
    return {
        "readiness_score": orchestrator.active_case.readiness_score,
        "stage": orchestrator.active_case.stage,
        "total_documents": len(orchestrator.active_case.uploaded_documents),
        "open_gaps_count": sum(1 for g in orchestrator.active_case.verification_gaps if g.status == "OPEN"),
        "is_ready_for_official_application": orchestrator.active_case.readiness_score >= 80
    }
