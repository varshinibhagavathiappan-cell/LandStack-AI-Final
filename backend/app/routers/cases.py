from fastapi import APIRouter, Response
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from datetime import datetime
from backend.app.agents.orchestrator import orchestrator
from backend.app.services.pdf_service import pdf_service
from backend.app.models.case_state import FamilyComment, FamilyMember

router = APIRouter(prefix="/api", tags=["Case Management"])

class StepUpdateRequest(BaseModel):
    step_number: int
    status: str

class CommentRequest(BaseModel):
    author: str
    text: str


class FamilyMemberRequest(BaseModel):
    name: str
    relationship: str = "Family member"

class NewCaseRequest(BaseModel):
    language: str = "ta"


class LocationUpdateRequest(BaseModel):
    latitude: float
    longitude: float
    accuracy: Optional[float] = None
    source: str = "browser_geolocation"

@router.post("/case/location")
def set_current_location(req: LocationUpdateRequest) -> Dict[str, Any]:
    from backend.app.services.location_service import location_service
    loc = location_service.reverse_geocode(req.latitude, req.longitude)
    if req.accuracy is not None:
        loc["accuracy"] = req.accuracy
    loc["timestamp"] = datetime.now().isoformat(timespec="seconds")
    loc["source"] = req.source
    orchestrator.active_case.user_current_location = loc
    orchestrator.active_case.updated_at = datetime.now().strftime("%Y-%m-%d %H:%M")
    return {"location": loc, "case": orchestrator.active_case.model_dump()}


class LandLocationRequest(BaseModel):
    query: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

@router.post("/case/land-location")
def set_land_location(req: LandLocationRequest) -> Dict[str, Any]:
    from backend.app.services.location_service import location_service
    if req.latitude is not None and req.longitude is not None:
        loc = location_service.reverse_geocode(req.latitude, req.longitude)
        if not loc.get("verified"):
            return {"verified": False, "message": "The selected land location could not be resolved."}
        loc["source"] = "citizen-selected map location"
        orchestrator.active_case.land_location = loc
        orchestrator.active_case.location_verified = True
    elif req.query and req.query.strip():
        candidates = location_service.geocode(req.query.strip(), state=orchestrator.active_case.state or None)
        if len(candidates) != 1:
            return {"verified": False, "ambiguous": len(candidates) > 1, "candidates": candidates, "message": "Please choose a specific land location."}
        loc = candidates[0]
        orchestrator.active_case.land_location = loc
        orchestrator.active_case.location_verified = True
    else:
        return {"verified": False, "message": "Provide a land location or map coordinates."}
    loc = orchestrator.active_case.land_location
    orchestrator.active_case.state = loc.get("state", orchestrator.active_case.state) if loc.get("state") in {"Tamil Nadu", "Karnataka"} else orchestrator.active_case.state
    orchestrator.active_case.district = loc.get("district", orchestrator.active_case.district)
    orchestrator.active_case.taluk = loc.get("taluk", orchestrator.active_case.taluk)
    orchestrator.active_case.village = loc.get("village", orchestrator.active_case.village)
    orchestrator.active_case.location_source = loc.get("source", "citizen-provided land location")
    if orchestrator.active_case.detected_intent:
        orchestrator.active_case.checklist = __import__('backend.app.agents.case_agent', fromlist=['case_agent']).case_agent.generate_checklist(orchestrator.active_case.detected_intent, orchestrator.active_case.state, orchestrator.active_case.land_type)
    return {"verified": True, "location": loc, "case": orchestrator.active_case.model_dump()}

@router.get("/case")
def get_case() -> Dict[str, Any]:
    """Returns the single connected living land case state."""
    return orchestrator.active_case.model_dump()

@router.post("/case/reset")
def reset_case() -> Dict[str, Any]:
    """Resets to the synthetic judging demo."""
    orchestrator.active_case = orchestrator.initialize_demo_case()
    return orchestrator.active_case.model_dump()

@router.post("/case/language")
def set_case_language(req: NewCaseRequest) -> Dict[str, Any]:
    """Synchronize the UI language with the connected case without resetting any case data."""
    lang = req.language if req.language in {"en", "ta", "kn"} else "en"
    orchestrator.active_case.language = lang
    orchestrator.active_case.updated_at = datetime.now().strftime("%Y-%m-%d %H:%M")
    return {"language": lang, "case": orchestrator.active_case.model_dump()}

@router.post("/case/new")
def create_new_case(req: NewCaseRequest) -> Dict[str, Any]:
    """Starts a genuinely empty citizen case; no demo data is copied."""
    orchestrator.active_case = orchestrator.initialize_new_case(req.language)
    case = orchestrator.active_case.model_dump()
    return {"message": "New empty case created successfully.", "new_case": True, "case": case, **case}

@router.get("/case/plan")
def get_case_plan() -> List[Dict[str, Any]]:
    """Returns the adaptive case workflow plan."""
    return [s.model_dump() for s in orchestrator.active_case.case_plan]

@router.post("/case/plan/update")
def update_case_step(req: StepUpdateRequest) -> Dict[str, Any]:
    """Updates a step status in the workflow plan."""
    for s in orchestrator.active_case.case_plan:
        if s.step_number == req.step_number:
            s.status = req.status
            break
    return {"message": "Step updated successfully", "plan": [s.model_dump() for s in orchestrator.active_case.case_plan]}

@router.get("/property-passport")
def get_property_passport() -> Dict[str, Any]:
    """Returns Land DNA / Property Passport structured summary."""
    if orchestrator.active_case.property_passport:
        return orchestrator.active_case.property_passport.model_dump()
    return {
        "status": "INSUFFICIENT EVIDENCE",
        "evidence_score": 0,
        "disclaimer": "AI-assisted structured summary — not a legal certificate."
    }

@router.get("/case-file")
def get_case_file_html():
    """Generates the downloadable/printable Land Case File."""
    html_content = pdf_service.generate_html_report(orchestrator.active_case.model_dump())
    return Response(content=html_content, media_type="text/html")

@router.get("/notifications")
def get_notifications() -> List[Dict[str, Any]]:
    """Returns smart notifications."""
    return [n.model_dump() for n in orchestrator.active_case.notifications]

@router.get("/family-room")
def get_family_room() -> Dict[str, Any]:
    """Returns family decision room collaborators, comments, and decision status."""
    return {
        "family_members": [m.model_dump() for m in orchestrator.active_case.family_members],
        "comments": [c.model_dump() for c in orchestrator.active_case.family_comments],
        "case_id": orchestrator.active_case.case_id,
        "role_notice": "Role-aware family collaboration room. Members can view evidence and register consent."
    }

@router.post("/family-room/member")
def add_family_member(req: FamilyMemberRequest) -> Dict[str, Any]:
    name = req.name.strip()
    if not name:
        return {"error": "Name is required."}
    member = FamilyMember(id=f"fam_{len(orchestrator.active_case.family_members)+1}", name=name, relationship=req.relationship.strip() or "Family member", role="FAMILY_MEMBER", decision_approval=None)
    orchestrator.active_case.family_members.append(member)
    return {"message": "Family member added", "member": member.model_dump(), "family_members": [m.model_dump() for m in orchestrator.active_case.family_members]}

@router.post("/family-room/comment")
def add_family_comment(req: CommentRequest) -> Dict[str, Any]:
    """Adds a family comment/note."""
    new_comment = FamilyComment(
        id=f"c_{datetime.now().strftime('%M%S')}",
        author=req.author,
        text=req.text,
        timestamp=datetime.now().strftime("%Y-%m-%d %H:%M")
    )
    orchestrator.active_case.family_comments.append(new_comment)
    return {"message": "Comment added", "comment": new_comment.model_dump()}

@router.get("/landguard")
def get_landguard_alerts() -> List[Dict[str, Any]]:
    """Returns LandGuard AI event monitoring history."""
    return [a.model_dump() for a in orchestrator.active_case.landguard_alerts]
