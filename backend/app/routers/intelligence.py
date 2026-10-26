from fastapi import APIRouter
from pydantic import BaseModel
from typing import Any, Dict, Optional
from backend.app.agents.orchestrator import orchestrator
from backend.app.services.land_intelligence import land_intelligence

router = APIRouter(prefix="/api/intelligence", tags=["Land Intelligence"])

class InvestigationRequest(BaseModel):
    case_id: Optional[str] = None

@router.get("/sources")
def sources() -> Dict[str, Any]:
    return land_intelligence.source_registry(orchestrator.active_case.state)

@router.post("/investigate")
def investigate(_: InvestigationRequest) -> Dict[str, Any]:
    result = land_intelligence.build_investigation(orchestrator.active_case.model_dump())
    orchestrator.active_case.notes.append("Land Intelligence investigation prepared from current case context; unavailable authoritative records are not fabricated.")
    return result

@router.get("/ai-status")
def ai_status() -> Dict[str, Any]:
    from backend.app.services.gemini_service import gemini_service
    return {"configured": gemini_service.configured, "model": gemini_service.model, "provider": "Gemini"}
