from fastapi import APIRouter, UploadFile, File, Form, HTTPException
import os
from pathlib import Path
import uuid
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from backend.app.agents.orchestrator import orchestrator
from backend.app.agents.document_agent import document_agent
from backend.app.agents.evidence_agent import evidence_agent
from backend.app.agents.action_agent import action_agent
from backend.app.models.case_state import FamilyMember

router = APIRouter(prefix="/api/documents", tags=["Documents"])

class TextDocUploadRequest(BaseModel):
    filename: str
    text_content: Optional[str] = ""
    language: Optional[str] = "ta"

@router.get("")
def list_documents() -> List[Dict[str, Any]]:
    """Returns all documents uploaded to the living land case."""
    return [d.model_dump() for d in orchestrator.active_case.uploaded_documents]

@router.get("/checklist")
def get_checklist() -> List[Dict[str, Any]]:
    """Returns the personalized document checklist with status."""
    return [c.model_dump() for c in orchestrator.active_case.checklist]

@router.post("/upload")
async def upload_document(
    file: Optional[UploadFile] = File(None),
    filename_override: Optional[str] = Form(None),
    language: Optional[str] = Form("ta")
) -> Dict[str, Any]:
    """
    Ingests PDF or image document with OCR extraction.
    Updates checklist, evidence graph, and consistency check.
    """
    file_bytes = None
    filename = "document.pdf"

    if file:
        filename = file.filename
        file_bytes = await file.read()
    elif filename_override:
        filename = filename_override

    doc_item = document_agent.ingest_document(filename, file_bytes=file_bytes, language=language or "ta")
    # Persist the actual citizen upload; demo samples are never written into real-case storage.
    if file_bytes:
        upload_dir = Path(__file__).resolve().parents[2] / "uploads"
        upload_dir.mkdir(parents=True, exist_ok=True)
        safe_name = f"{uuid.uuid4().hex}_{Path(filename).name}"
        stored = upload_dir / safe_name
        stored.write_bytes(file_bytes)
        doc_item.storage_path = str(stored.relative_to(Path(__file__).resolve().parents[2]))

    # Ingest into active case
    # Replace if same doc_type exists or append
    existing_types = [d.doc_type for d in orchestrator.active_case.uploaded_documents]
    if doc_item.doc_type in existing_types:
        orchestrator.active_case.uploaded_documents = [
            d for d in orchestrator.active_case.uploaded_documents if d.doc_type != doc_item.doc_type
        ] + [doc_item]
    else:
        orchestrator.active_case.uploaded_documents.append(doc_item)

    # Update checklist
    orchestrator.active_case.checklist = document_agent.update_checklist_status(
        orchestrator.active_case.checklist, orchestrator.active_case.uploaded_documents
    )

    # Trigger Evidence analysis
    analysis = evidence_agent.analyze_evidence(
        orchestrator.active_case.uploaded_documents, orchestrator.active_case.citizen_name
    )
    orchestrator.active_case.evidence_nodes = analysis["evidence_nodes"]
    orchestrator.active_case.evidence_edges = analysis["evidence_edges"]
    orchestrator.active_case.verification_gaps = analysis["verification_gaps"]
    orchestrator.active_case.missing_links = analysis["missing_links"]
    orchestrator.active_case.verification_dependencies = analysis["verification_dependencies"]
    orchestrator.active_case.property_passport = analysis["property_passport"]
    orchestrator.active_case.timeline = analysis["timeline"]
    orchestrator.active_case.provenance_records = analysis["provenance_records"]

    # Build the Family Room only from evidence actually present in the case.
    if doc_item.doc_type == "LEGAL_HEIR_CERTIFICATE":
        heirs = doc_item.extracted_fields.get("heirs", [])
        if heirs:
            orchestrator.active_case.family_members = []
            for idx, heir in enumerate(heirs):
                orchestrator.active_case.family_members.append({
                    "id": f"fam_{idx+1}", "name": heir.get("name", ""),
                    "relationship": heir.get("relation", "Reported in uploaded certificate"),
                    "role": "FAMILY_MEMBER", "decision_approval": None
                })

    # Action agent update
    orchestrator.active_case.next_best_action = action_agent.determine_next_best_action(orchestrator.active_case)
    orchestrator.active_case.readiness_score = action_agent.calculate_readiness_score(orchestrator.active_case)

    return {
        "message": "Document ingested and analyzed with AI-assisted extraction.",
        "document": doc_item.model_dump(),
        "extracted_fields": doc_item.extracted_fields,
        "readiness_score": orchestrator.active_case.readiness_score
    }

@router.post("/analyze")
def analyze_text_document(req: TextDocUploadRequest) -> Dict[str, Any]:
    """Directly uploads and analyzes text content."""
    doc_item = document_agent.ingest_document(req.filename, text_content=req.text_content, language=req.language or "ta")
    orchestrator.active_case.uploaded_documents.append(doc_item)
    orchestrator.active_case.checklist = document_agent.update_checklist_status(
        orchestrator.active_case.checklist, orchestrator.active_case.uploaded_documents
    )

    analysis = evidence_agent.analyze_evidence(
        orchestrator.active_case.uploaded_documents, orchestrator.active_case.citizen_name
    )
    orchestrator.active_case.evidence_nodes = analysis["evidence_nodes"]
    orchestrator.active_case.evidence_edges = analysis["evidence_edges"]
    orchestrator.active_case.verification_gaps = analysis["verification_gaps"]
    orchestrator.active_case.missing_links = analysis["missing_links"]
    orchestrator.active_case.verification_dependencies = analysis["verification_dependencies"]
    orchestrator.active_case.property_passport = analysis["property_passport"]

    return {
        "document": doc_item.model_dump(),
        "readiness_score": orchestrator.active_case.readiness_score
    }

@router.get("/{doc_id}/explain")
def explain_document(doc_id: str) -> Dict[str, Any]:
    """Explains unfamiliar land document in plain citizen language."""
    for d in orchestrator.active_case.uploaded_documents:
        if d.id == doc_id or doc_id in d.id:
            return {
                "title": d.title,
                "doc_type": d.doc_type,
                "explanation": d.explanation,
                "extracted_fields": d.extracted_fields,
                "disclaimer": "AI-assisted document explanation — not legal counsel."
            }
    raise HTTPException(status_code=404, detail="Document not found")
