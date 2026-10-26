from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum

class CaseStage(str, Enum):
    NEW = "NEW"
    UNDERSTANDING = "UNDERSTANDING"
    INFORMATION_REQUIRED = "INFORMATION_REQUIRED"
    PLANNING = "PLANNING"
    DOCUMENTS_REQUIRED = "DOCUMENTS_REQUIRED"
    DOCUMENT_ANALYSIS = "DOCUMENT_ANALYSIS"
    EVIDENCE_COLLECTION = "EVIDENCE_COLLECTION"
    EVIDENCE_ANALYSIS = "EVIDENCE_ANALYSIS"
    VERIFICATION_REQUIRED = "VERIFICATION_REQUIRED"
    VERIFICATION = "VERIFICATION"
    ACTION_REQUIRED = "ACTION_REQUIRED"
    TRACKING = "TRACKING"
    RECHECK = "RECHECK"
    COMPLETED = "COMPLETED"

class EvidenceStatus(str, Enum):
    SUPPORTED = "SUPPORTED"
    MISSING = "MISSING"
    POTENTIAL_CONFLICT = "POTENTIAL CONFLICT"
    REQUIRES_REVIEW = "REQUIRES REVIEW"

class DocumentChecklistStatus(str, Enum):
    AVAILABLE = "AVAILABLE"
    MISSING = "MISSING"
    REQUIRES_REVIEW = "REQUIRES REVIEW"

class EvidenceNode(BaseModel):
    id: str
    label: str
    type: str  # PERSON, DOCUMENT, OWNER, SURVEY_NUMBER, PROPERTY, TRANSACTION, SUPPORTING_EVIDENCE
    status: EvidenceStatus
    details: Dict[str, Any] = Field(default_factory=dict)

class EvidenceEdge(BaseModel):
    source: str
    target: str
    relationship: str  # OWNS, CONTAINS, EXTRACTED_FROM, SUCCEEDS, DISCREPANCY_WITH, SUPPORTS
    status: EvidenceStatus = EvidenceStatus.SUPPORTED

class VerificationGap(BaseModel):
    id: str
    gap_type: str  # AREA_MISMATCH, MISSING_HEIR_NOC, MISSING_PARENT_DEED, NAME_SPELLING_VARIATION
    severity: str  # HIGH, MEDIUM, LOW
    title: str
    description: str
    affected_nodes: List[str] = Field(default_factory=list)
    suggested_action: str
    status: str = "OPEN"  # OPEN, RESOLVED, WAITING_VERIFICATION

class MissingLink(BaseModel):
    id: str
    title: str
    description: str
    missing_item: str
    impact_level: str  # CRITICAL, SIGNIFICANT, ADVISORY
    resolution_path: str

class VerificationDependency(BaseModel):
    id: str
    source_verification: str
    dependent_step: str
    prerequisite_status: str  # UNRESOLVED, RESOLVED
    status_label: str  # "Waiting for verification", "Prerequisite fulfilled", "Additional evidence required"
    description: str

class NextBestAction(BaseModel):
    id: str
    title: str
    summary: str
    action_type: str  # UPLOAD_DOCUMENT, APPLY_OFFICIAL_SERVICE, VISIT_OFFICE, FAMILY_CONSULTATION, SURVEY_PETITION
    step_by_step: List[str] = Field(default_factory=list)
    prerequisite: Optional[str] = None
    official_service_url: Optional[str] = None
    target_office: Optional[str] = None
    urgency: str = "HIGH"

class PropertyPassport(BaseModel):
    property_id: str
    survey_number: str
    subdivision_number: Optional[str] = None
    district: str
    taluk: str
    village: str
    recorded_owner: str
    extent_acres: float
    extent_hectares: Optional[float] = None
    classification: str
    guideline_value_approx: Optional[str] = None
    dispute_flag: str = "POTENTIAL_INCONSISTENCY"  # CLEAN, POTENTIAL_INCONSISTENCY, UNDER_VERIFICATION
    evidence_score: int = 0  # 0 to 100; never fabricated in real cases
    registered_deeds: List[str] = Field(default_factory=list)
    revenue_patta_no: Optional[str] = None
    last_verified: str = ""
    disclaimer: str = "AI-assisted structured summary — not a legal certificate."

class SellerStoryComparison(BaseModel):
    seller_claimed_area: Optional[str] = None
    seller_claimed_owner: Optional[str] = None
    seller_claimed_encumbrance: Optional[str] = None
    seller_claimed_boundaries: Optional[str] = None
    document_verified_area: Optional[str] = None
    document_verified_owner: Optional[str] = None
    document_verified_encumbrance: Optional[str] = None
    discrepancy_summary: Optional[str] = None
    status_label: str = "Potential mismatch requiring verification"  # NEVER "fraud"
    verification_advice: str = ""

class ProvenanceRecord(BaseModel):
    document_id: str
    document_name: str
    source_type: str  # CITIZEN_UPLOAD, VERIFIED_PORTAL, REVENUE_DEPARTMENT, SUB_REGISTRAR
    uploaded_at: str
    extracted_via: str = "AI-assisted extraction (Deterministic + OCR)"
    verification_hash: str
    verification_state: str  # UNCONFIRMED, REPUTABLE_SOURCE, CROSS_VERIFIED

class FamilyMember(BaseModel):
    id: str
    name: str
    relationship: str
    role: str  # "ADMIN", "LEGAL_REVIEWER", "FAMILY_MEMBER"
    decision_approval: Optional[bool] = None

class FamilyComment(BaseModel):
    id: str
    author: str
    text: str
    timestamp: str

class LandGuardAlert(BaseModel):
    id: str
    timestamp: str
    event_type: str  # DOCUMENT_CHANGE, CASE_STAGE_UPDATE, VERIFICATION_RESOLVED, AREA_FLAGGED
    message: str
    severity: str  # INFO, WARNING, SUCCESS

class SmartNotification(BaseModel):
    id: str
    title: str
    message: str
    category: str
    action_route: Optional[str] = None
    timestamp: str
    read: bool = False

class TimelineEvent(BaseModel):
    id: str
    date: str
    title: str
    description: str
    event_type: str  # PURCHASE, DEATH, PATTA_ISSUED, RESURVEY, CASE_OPENED

class DocumentItem(BaseModel):
    id: str
    doc_type: str
    filename: str
    title: str
    uploaded_at: str
    file_size_kb: int = 150
    status: DocumentChecklistStatus = DocumentChecklistStatus.AVAILABLE
    extracted_fields: Dict[str, Any] = Field(default_factory=dict)
    ocr_confidence: float = 0.94
    explanation: Optional[str] = None
    label: str = "AI-assisted extraction"
    storage_path: Optional[str] = None

class ChecklistItem(BaseModel):
    id: str
    doc_type: str
    name: str
    name_ta: Optional[str] = None
    required: bool
    status: DocumentChecklistStatus
    purpose: str
    issuing_authority: str
    alternative: Optional[str] = None
    matching_doc_id: Optional[str] = None

class CasePlanStep(BaseModel):
    step_number: int
    title: str
    status: str  # PENDING, IN_PROGRESS, COMPLETED
    description: str
    target_office: Optional[str] = None

class CaseState(BaseModel):
    case_id: str = ""
    citizen_name: str = ""
    language: str = "en"  # en, ta, kn
    state: str = ""
    district: str = ""
    taluk: str = ""
    village: str = ""
    land_type: str = ""
    property_context: str = ""
    user_current_location: Dict[str, Any] = Field(default_factory=dict)
    land_location: Dict[str, Any] = Field(default_factory=dict)
    location_source: str = ""
    location_verified: bool = False
    created_at: str = "2026-09-24 10:30"
    updated_at: str = "2026-09-26 18:00"
    stage: CaseStage = CaseStage.UNDERSTANDING
    problem_statement: str = ""
    detected_intent: str = ""
    intent_confidence: float = 0.0
    intent_title: str = ""
    adaptive_questions: List[Dict[str, Any]] = Field(default_factory=list)
    case_plan: List[CasePlanStep] = Field(default_factory=list)
    checklist: List[ChecklistItem] = Field(default_factory=list)
    uploaded_documents: List[DocumentItem] = Field(default_factory=list)
    evidence_nodes: List[EvidenceNode] = Field(default_factory=list)
    evidence_edges: List[EvidenceEdge] = Field(default_factory=list)
    missing_links: List[MissingLink] = Field(default_factory=list)
    verification_gaps: List[VerificationGap] = Field(default_factory=list)
    verification_dependencies: List[VerificationDependency] = Field(default_factory=list)
    next_best_action: Optional[NextBestAction] = None
    property_passport: Optional[PropertyPassport] = None
    seller_story: Optional[SellerStoryComparison] = None
    provenance_records: List[ProvenanceRecord] = Field(default_factory=list)
    family_members: List[FamilyMember] = Field(default_factory=list)
    family_comments: List[FamilyComment] = Field(default_factory=list)
    landguard_alerts: List[LandGuardAlert] = Field(default_factory=list)
    timeline: List[TimelineEvent] = Field(default_factory=list)
    notifications: List[SmartNotification] = Field(default_factory=list)
    readiness_score: int = 0
    notes: List[str] = Field(default_factory=list)
    conversation_history: List[Dict[str, Any]] = Field(default_factory=list)
    is_demo_mode: bool = False
