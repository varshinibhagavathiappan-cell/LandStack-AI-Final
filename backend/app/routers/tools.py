from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from backend.app.agents.document_agent import document_agent
from backend.app.agents.action_agent import action_agent
from backend.app.rag.retrieval import retriever

router = APIRouter(prefix="/api/tools", tags=["Innovation Tools & Generators"])

class EvidenceRequestPayload(BaseModel):
    missing_doc_name: str
    recipient_type: str = "SELLER"  # SELLER or AUTHORITY
    citizen_name: str
    survey_no: str = ""
    district: str = ""

@router.post("/evidence-request")
def generate_evidence_request(payload: EvidenceRequestPayload) -> Dict[str, Any]:
    """Generates formal request letter to obtain missing records from seller or registry."""
    letter = document_agent.generate_evidence_request_letter(
        payload.missing_doc_name,
        payload.recipient_type,
        payload.citizen_name,
        payload.survey_no,
        payload.district
    )
    return {"letter_text": letter, "recipient_type": payload.recipient_type}

@router.get("/seller-questions")
def get_seller_questions(
    survey_no: str = Query(""),
    district: str = Query("")
) -> List[Dict[str, Any]]:
    """Generates smart vetting questions for a land buyer before purchase."""
    if not district and not survey_no:
        return []
    return action_agent.generate_seller_questions(survey_no, district)

@router.get("/search-knowledge")
def search_knowledge(
    q: str = Query(..., description="Query text"),
    state: str = Query("Tamil Nadu")
) -> List[Dict[str, Any]]:
    """RAG Trusted Knowledge Search."""
    return retriever.search_knowledge(q, state=state, top_k=5)
