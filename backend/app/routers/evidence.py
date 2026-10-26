from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from backend.app.agents.orchestrator import orchestrator
from backend.app.agents.evidence_agent import evidence_agent
from backend.app.services.comparison_engine import DeterministicComparisonEngine

router = APIRouter(prefix="/api/evidence", tags=["Evidence & Graph"])

class ImpactSimRequest(BaseModel):
    document_name: str

class SellerClaimRequest(BaseModel):
    seller_name: Optional[str] = None
    area_acres: Optional[float] = None
    encumbrance_status: Optional[str] = None

@router.get("/graph")
def get_evidence_graph() -> Dict[str, Any]:
    """Returns interactive evidence graph nodes, edges, and statuses."""
    return {
        "nodes": [n.model_dump() for n in orchestrator.active_case.evidence_nodes],
        "edges": [e.model_dump() for e in orchestrator.active_case.evidence_edges],
        "summary": {
            "total_nodes": len(orchestrator.active_case.evidence_nodes),
            "conflicts_count": sum(1 for n in orchestrator.active_case.evidence_nodes if n.status == "POTENTIAL CONFLICT"),
            "supported_count": sum(1 for n in orchestrator.active_case.evidence_nodes if n.status == "SUPPORTED")
        }
    }

@router.get("/missing-links")
def get_missing_links() -> List[Dict[str, Any]]:
    """Returns detected missing links in title chain or documentation."""
    return [m.model_dump() for m in orchestrator.active_case.missing_links]

@router.get("/verification-gaps")
def get_verification_gaps() -> List[Dict[str, Any]]:
    """Returns verification gaps such as area mismatch or heir NOC."""
    return [g.model_dump() for g in orchestrator.active_case.verification_gaps]

@router.get("/dependencies")
def get_verification_dependencies() -> List[Dict[str, Any]]:
    """Returns Verification Dependency Map."""
    return [d.model_dump() for d in orchestrator.active_case.verification_dependencies]

@router.get("/provenance")
def get_provenance() -> List[Dict[str, Any]]:
    """Returns evidence provenance and verification hashes."""
    return [p.model_dump() for p in orchestrator.active_case.provenance_records]

@router.get("/timeline")
def get_timeline() -> List[Dict[str, Any]]:
    """Returns ownership and heir timeline events."""
    return [t.model_dump() for t in orchestrator.active_case.timeline]

@router.post("/simulate-impact")
def simulate_evidence_impact(req: ImpactSimRequest) -> Dict[str, Any]:
    """Simulates how providing a specific missing document changes verification readiness."""
    return evidence_agent.simulate_evidence_impact(req.document_name, orchestrator.active_case)

@router.get("/seller-story")
def get_seller_story() -> Dict[str, Any]:
    """Returns Seller Story vs Evidence comparison."""
    if orchestrator.active_case.seller_story:
        return orchestrator.active_case.seller_story.model_dump()

    return {
        "status_label": "NO REAL SELLER EVIDENCE",
        "discrepancy_summary": "Seller-story comparison will appear only after the citizen provides a seller claim and relevant documentary evidence.",
        "verification_advice": "Provide the actual seller statement and uploaded evidence before comparing them.",
        "seller_claimed_area": None,
        "seller_claimed_owner": None,
        "document_verified_area": None,
        "document_verified_owner": None
    }

@router.get("/document-comparison")
def compare_uploaded_documents() -> Dict[str, Any]:
    docs = orchestrator.active_case.uploaded_documents
    fields = ["recorded_owner", "survey_number", "subdivision_number", "area_acres", "district", "taluk", "patta_number", "document_number"]
    rows = []
    for d in docs:
        row = {"document": d.title, "doc_type": d.doc_type}
        row.update({k: d.extracted_fields.get(k) for k in fields if d.extracted_fields.get(k) not in (None, "")})
        rows.append(row)
    comparisons = []
    def values(field):
        return [(r["document"], r.get(field)) for r in rows if r.get(field) not in (None, "")]
    for field in fields:
        vals = values(field)
        unique = {str(v).strip().lower() for _, v in vals}
        if len(unique) > 1:
            comparisons.append({"field": field, "status": "POTENTIAL_INCONSISTENCY", "values": vals, "message": f"Potential inconsistency detected for {field.replace('_',' ')}."})
        elif len(unique) == 1 and len(vals) > 1:
            comparisons.append({"field": field, "status": "CONSISTENT", "values": vals, "message": f"{field.replace('_',' ').title()} matches across uploaded records."})
    return {"document_count": len(docs), "rows": rows, "comparisons": comparisons, "disclaimer": "AI-assisted comparison based strictly on uploaded materials; not a legal finding."}
