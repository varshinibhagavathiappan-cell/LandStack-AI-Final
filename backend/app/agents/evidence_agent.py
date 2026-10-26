from typing import Dict, Any, List, Optional
import hashlib
from backend.app.services.comparison_engine import DeterministicComparisonEngine
from backend.app.models.case_state import (
    EvidenceNode, EvidenceEdge, EvidenceStatus, VerificationGap,
    MissingLink, VerificationDependency, PropertyPassport,
    SellerStoryComparison, ProvenanceRecord, TimelineEvent, DocumentItem
)

class EvidenceAgent:
    """
    Responsible for constructing the Evidence Graph, Land DNA (Property Passport),
    detecting Missing Links & Verification Gaps, building the Verification Dependency Map,
    evaluating Seller Story vs Evidence, and tracking Evidence Provenance.
    """

    @classmethod
    def analyze_evidence(cls, documents: List[DocumentItem], citizen_name: str = "") -> Dict[str, Any]:
        """
        Runs deterministic graph construction and consistency analysis across all uploaded evidence.
        """
        nodes: List[EvidenceNode] = []
        edges: List[EvidenceEdge] = []
        gaps: List[VerificationGap] = []
        missing_links: List[MissingLink] = []
        dependencies: List[VerificationDependency] = []
        timeline: List[TimelineEvent] = []
        provenance: List[ProvenanceRecord] = []

        # Index docs by doc_type. No uploaded evidence means no invented property/evidence state.
        docs_by_type = {d.doc_type: d for d in documents}
        if not documents:
            return {
                "evidence_nodes": [],
                "evidence_edges": [],
                "verification_gaps": [],
                "missing_links": [],
                "verification_dependencies": [],
                "property_passport": None,
                "timeline": [],
                "provenance_records": [],
                "is_reconciled": False
            }

        deed_doc = docs_by_type.get("TITLE_DEED")
        patta_doc = docs_by_type.get("EXISTING_PATTA") or docs_by_type.get("CHITTA")
        chitta_doc = docs_by_type.get("CHITTA")
        adangal_doc = docs_by_type.get("ADANGAL")
        heir_doc = docs_by_type.get("LEGAL_HEIR_CERTIFICATE")
        death_doc = docs_by_type.get("DEATH_CERTIFICATE")
        resurvey_doc = docs_by_type.get("FMB_SKETCH")

        # 1. Build Provenance Records
        for d in documents:
            provenance.append(ProvenanceRecord(
                document_id=d.id,
                document_name=d.title,
                source_type="CITIZEN_UPLOAD",
                uploaded_at=d.uploaded_at,
                extracted_via="AI-assisted extraction (Deterministic + OCR)",
                verification_hash=hashlib.sha256((d.title + d.uploaded_at).encode("utf-8")).hexdigest(),
                verification_state="CROSS_VERIFIED" if (deed_doc and patta_doc) else "REPUTABLE_SOURCE"
            ))

        # 2. Timeline construction
        if deed_doc:
            timeline.append(TimelineEvent(
                id="tl_1998_purchase",
                date=deed_doc.uploaded_at,
                title="Prior ownership / title document identified",
                description=f"Title deed evidence uploaded: {deed_doc.title}.",
                event_type="PURCHASE"
            ))
        if death_doc:
            timeline.append(TimelineEvent(
                id="tl_2024_demise",
                date=death_doc.uploaded_at,
                title="Death certificate evidence identified",
                description=f"Death certificate evidence uploaded: {death_doc.title}.",
                event_type="DEATH"
            ))
        if heir_doc:
            timeline.append(TimelineEvent(
                id="tl_2024_heir",
                date=heir_doc.uploaded_at,
                title="Legal heir evidence identified",
                description=f"Legal heir evidence uploaded: {heir_doc.title}.",
                event_type="CASE_OPENED"
            ))
        if resurvey_doc:
            timeline.append(TimelineEvent(
                id="tl_2026_resurvey",
                date=resurvey_doc.uploaded_at,
                title="FMB / re-measurement evidence identified",
                description=f"Survey evidence uploaded: {resurvey_doc.title}.",
                event_type="RESURVEY"
            ))

        # 3. Base Nodes in Evidence Graph
        person_status = EvidenceStatus.SUPPORTED if death_doc and heir_doc else EvidenceStatus.REQUIRES_REVIEW
        if death_doc or heir_doc:
            owner_label = None
            for source_doc in [deed_doc, patta_doc, death_doc, heir_doc]:
                if source_doc:
                    owner_label = source_doc.extracted_fields.get("recorded_owner")
                    if owner_label:
                        break
            owner_label = owner_label or "Person identified in uploaded evidence"
            nodes.append(EvidenceNode(
                id="node_person_owner",
                label=str(owner_label),
                type="PERSON",
                status=person_status,
                details={"relationship": "Prior Owner / Title Holder"}
            ))
        if citizen_name:
            nodes.append(EvidenceNode(
                id="node_person_applicant",
                label=f"{citizen_name} (Applicant)",
                type="PERSON",
                status=EvidenceStatus.REQUIRES_REVIEW,
                details={"role": "Applicant"}
            ))

        # Check for co-heirs
        if heir_doc:
            heirs = heir_doc.extracted_fields.get("heirs", [])
            heir_names = ", ".join(h.get("name", "") for h in heirs if h.get("name")) or "Heirs identified in uploaded certificate"
            nodes.append(EvidenceNode(
                id="node_person_coheirs",
                label=f"Co-heirs: {heir_names}",
                type="PERSON",
                status=EvidenceStatus.REQUIRES_REVIEW if not resurvey_doc else EvidenceStatus.SUPPORTED,
                details={"heirs": heirs, "status": "Review consent / release requirements based on the actual case"}
            ))
            if citizen_name and any(n.id == "node_person_applicant" for n in nodes):
                edges.append(EvidenceEdge(source="node_person_owner", target="node_person_applicant", relationship="SUCCEEDS", status=EvidenceStatus.REQUIRES_REVIEW))
            edges.append(EvidenceEdge(
                source="node_person_owner",
                target="node_person_coheirs",
                relationship="CO_HEIR_SUCCESSION",
                status=EvidenceStatus.REQUIRES_REVIEW
            ))

        # Documents Nodes
        if deed_doc:
            nodes.append(EvidenceNode(
                id="node_doc_deed",
                label=deed_doc.title,
                type="DOCUMENT",
                status=EvidenceStatus.SUPPORTED,
                details={"document_number": deed_doc.extracted_fields.get("document_number"), "area_acres": deed_doc.extracted_fields.get("area_acres"), "sro": deed_doc.extracted_fields.get("sub_registrar_office") or deed_doc.extracted_fields.get("district") }
            ))
            edges.append(EvidenceEdge(
                source="node_person_owner",
                target="node_doc_deed",
                relationship="OWNERSHIP_DEED",
                status=EvidenceStatus.SUPPORTED
            ))

        # Additional Tamil Nadu revenue documents are first-class graph evidence.
        if chitta_doc:
            nodes.append(EvidenceNode(
                id="node_doc_chitta", label=chitta_doc.title, type="DOCUMENT",
                status=EvidenceStatus.SUPPORTED,
                details={"survey_number": chitta_doc.extracted_fields.get("survey_number"), "area_acres": chitta_doc.extracted_fields.get("area_acres"), "recorded_owner": chitta_doc.extracted_fields.get("recorded_owner")}
            ))
            if deed_doc:
                edges.append(EvidenceEdge(source="node_doc_deed", target="node_doc_chitta", relationship="SUPPORTED_BY_REVENUE_RECORD", status=EvidenceStatus.SUPPORTED))

        if adangal_doc:
            adangal_status = EvidenceStatus.SUPPORTED if adangal_doc.extracted_fields.get("missing_fields") == [] else EvidenceStatus.REQUIRES_REVIEW
            nodes.append(EvidenceNode(
                id="node_doc_adangal", label=adangal_doc.title, type="SUPPORTING_EVIDENCE",
                status=adangal_status,
                details={"survey_number": adangal_doc.extracted_fields.get("survey_number"), "crop": adangal_doc.extracted_fields.get("crop"), "record_year": adangal_doc.extracted_fields.get("record_year"), "missing_fields": adangal_doc.extracted_fields.get("missing_fields", [])}
            ))
            if chitta_doc:
                edges.append(EvidenceEdge(source="node_doc_chitta", target="node_doc_adangal", relationship="CULTIVATION_RECORD", status=adangal_status))
            elif deed_doc:
                edges.append(EvidenceEdge(source="node_doc_deed", target="node_doc_adangal", relationship="SUPPORTING_REVENUE_EVIDENCE", status=adangal_status))

        # Property & Survey Number Nodes — derive from uploaded evidence.
        survey_number = None
        for source_doc in [deed_doc, patta_doc, resurvey_doc]:
            if source_doc:
                survey_number = source_doc.extracted_fields.get("survey_number")
                if survey_number:
                    break
        if survey_number:
            nodes.append(EvidenceNode(
                id="node_survey_no",
                label=f"Survey No: {survey_number}",
                type="SURVEY_NUMBER",
                status=EvidenceStatus.SUPPORTED,
                details={}
            ))
            if adangal_doc:
                adangal_status = EvidenceStatus.SUPPORTED if adangal_doc.extracted_fields.get("missing_fields") == [] else EvidenceStatus.REQUIRES_REVIEW
                edges.append(EvidenceEdge(source="node_doc_adangal", target="node_survey_no", relationship="REFERENCES_SURVEY", status=adangal_status))

        # Deterministic Consistency Check: Area Comparison
        area_gap_resolved = False
        if resurvey_doc:
            area_gap_resolved = True

        if deed_doc and patta_doc:
            deed_raw = deed_doc.extracted_fields.get("area_acres")
            patta_raw = patta_doc.extracted_fields.get("area_acres")
            deed_area = float(deed_raw) if deed_raw is not None else None
            patta_area = float(patta_raw) if patta_raw is not None else None
            comp_res = DeterministicComparisonEngine.compare_areas(deed_area, patta_area) if deed_area is not None and patta_area is not None else {"requires_review": False}

            patta_node_status = EvidenceStatus.POTENTIAL_CONFLICT if not area_gap_resolved else EvidenceStatus.SUPPORTED
            nodes.append(EvidenceNode(
                id="node_doc_patta",
                label=patta_doc.title,
                type="DOCUMENT",
                status=patta_node_status,
                details={"patta_no": patta_doc.extracted_fields.get("patta_number"), "recorded_area": f"{patta_area:.2f} Acres"}
            ))
            edges.append(EvidenceEdge(
                source="node_doc_deed",
                target="node_doc_patta",
                relationship="DISCREPANCY_WITH" if not area_gap_resolved else "RECONCILED_WITH",
                status=patta_node_status
            ))

            if not area_gap_resolved and comp_res["requires_review"]:
                # Area mismatch detected!
                gaps.append(VerificationGap(
                    id="gap_area_mismatch",
                    gap_type="AREA_MISMATCH",
                    severity="HIGH",
                    title=f"Area Inconsistency (Deed: {deed_area:.2f} Acres vs Patta: {patta_area:.2f} Acres)",
                    description=f"POTENTIAL INCONSISTENCY: The land area differs between the available documents ({deed_area - patta_area:+.2f} Acres). Additional verification required.",
                    affected_nodes=["node_doc_deed", "node_doc_patta", "node_property"],
                    suggested_action="Upload latest FMB re-survey report or apply for Taluk Surveyor field demarcation.",
                    status="OPEN"
                ))

                missing_links.append(MissingLink(
                    id="link_fmb_resurvey",
                    title="Missing Field Measurement (FMB) Rectification Report",
                    description="A gap exists between registered conveyance extent and digitized revenue database. Official FMB sketch is required to establish ground boundary.",
                    missing_item="Official FMB Sketch / Surveyor Inspection Extract",
                    impact_level="CRITICAL",
                    resolution_path="Obtain the applicable survey/measurement evidence from the responsible authority for the actual land location."
                ))
            else:
                # Resolved!
                gaps.append(VerificationGap(
                    id="gap_area_mismatch",
                    gap_type="AREA_MISMATCH",
                    severity="LOW",
                    title="Area comparison rechecked using uploaded survey evidence",
                    description=f"The uploaded survey evidence was considered during re-check. Review the extracted fields before relying on the result: {resurvey_doc.title}.",
                    affected_nodes=["node_doc_deed", "node_doc_patta", "node_property"],
                    suggested_action="Review the re-check result and use the applicable official service only after required verification is complete.",
                    status="RESOLVED"
                ))

        # Check for Co-Heir NOC
        if heir_doc:
            if not area_gap_resolved:
                missing_links.append(MissingLink(
                    id="link_coheir_noc",
                    title="Co-Heir Consent Affidavits / Release Deed",
                    description="The uploaded Legal Heir Certificate identifies additional heirs. If exclusive mutation is requested, review the applicable consent or release requirements.",
                    missing_item="Consent / release evidence from the co-heirs identified in the uploaded Legal Heir Certificate",
                    impact_level="SIGNIFICANT",
                    resolution_path="Obtain the applicable consent/release evidence or use the appropriate joint-ownership route."
                ))

        # Property node
        prop_status = EvidenceStatus.POTENTIAL_CONFLICT if (not area_gap_resolved and patta_doc) else EvidenceStatus.SUPPORTED
        nodes.append(EvidenceNode(
            id="node_property",
            label="Land Parcel identified from uploaded evidence",
            type="PROPERTY",
            status=prop_status,
            details={"extent": (f"{deed_doc.extracted_fields.get("area_acres")} Acres" if deed_doc and deed_doc.extracted_fields.get("area_acres") else (f"{patta_doc.extracted_fields.get("area_acres")} Acres" if patta_doc else "Not extracted"))}
        ))
        edges.append(EvidenceEdge(
            source="node_survey_no",
            target="node_property",
            relationship="LOCATES",
            status=prop_status
        ))

        # Resurvey node if available
        if resurvey_doc:
            nodes.append(EvidenceNode(
                id="node_doc_resurvey",
                label=resurvey_doc.title,
                type="SUPPORTING_EVIDENCE",
                status=EvidenceStatus.SUPPORTED,
                details={"findings": resurvey_doc.extracted_fields.get("reconciled_area_acres") or resurvey_doc.extracted_fields.get("ground_area_acres") or "Measurement evidence supplied", "status": resurvey_doc.extracted_fields.get("inspection_status", "REVIEWED")}
            ))
            edges.append(EvidenceEdge(
                source="node_doc_resurvey",
                target="node_property",
                relationship="RECTIFIES_AREA",
                status=EvidenceStatus.SUPPORTED
            ))

        # 4. Build Verification Dependency Map from actual gaps.
        if gaps:
            dependencies = []
            for idx, gap in enumerate(gaps, 1):
                dependencies.append(VerificationDependency(
                    id=f"dep_{idx}",
                    source_verification=gap.gap_type,
                    dependent_step="NEXT_CASE_ACTION",
                    prerequisite_status="RESOLVED" if gap.status == "RESOLVED" else "UNRESOLVED",
                    status_label="Prerequisite fulfilled" if gap.status == "RESOLVED" else "Additional evidence required",
                    description=gap.description
                ))
        elif documents:
            dependencies = [VerificationDependency(
                id="dep_evidence_review", source_verification="EVIDENCE_COLLECTION", dependent_step="NEXT_CASE_ACTION",
                prerequisite_status="RESOLVED", status_label="Prerequisite fulfilled",
                description="Available uploaded evidence has been indexed. Additional verification may still be required depending on the request."
            )]
        else:
            dependencies = []

        # 5. Build Property Passport (Land DNA) only from actual evidence.
        primary_doc = deed_doc or patta_doc or resurvey_doc or heir_doc or death_doc
        def field(name, default=None):
            return primary_doc.extracted_fields.get(name, default) if primary_doc else default
        area = None
        for d in [resurvey_doc, patta_doc, deed_doc]:
            if d and d.extracted_fields.get("area_acres") is not None:
                area = d.extracted_fields.get("area_acres"); break
        if resurvey_doc and resurvey_doc.extracted_fields.get("reconciled_area_acres") is not None:
            area = resurvey_doc.extracted_fields.get("reconciled_area_acres")
        open_gaps = sum(1 for g in gaps if g.status == "OPEN")
        # Real-case score is a transparent evidence coverage indicator, not a legal/quality score.
        evidence_score = min(100, len(documents) * 10 + (20 if survey_number else 0) + (15 if deed_doc and patta_doc else 0) + (10 if resurvey_doc else 0))
        evidence_score = max(0, evidence_score - open_gaps * 10)
        sufficient_identity = bool(survey_number or field("recorded_owner") or area)
        if not documents or not sufficient_identity:
            passport = None
        else:
            status = "UNDER_VERIFICATION"
            if resurvey_doc and not open_gaps:
                status = "RECONCILED"
            elif open_gaps:
                status = "POTENTIAL_INCONSISTENCY"
            passport = PropertyPassport(
                property_id=f"PROP-{survey_number}" if survey_number else "",
                survey_number=survey_number or "", subdivision_number=None,
                district=field("district", ""), taluk=field("taluk", ""), village=field("village", ""),
                recorded_owner=field("recorded_owner", ""), extent_acres=float(area or 0),
                extent_hectares=round(float(area) * 0.404686, 3) if area else 0,
                classification=field("classification", ""), guideline_value_approx=field("guideline_value"),
                dispute_flag=status, evidence_score=evidence_score,
                registered_deeds=[deed_doc.title] if deed_doc else [],
                revenue_patta_no=patta_doc.extracted_fields.get("patta_number") if patta_doc else None,
                last_verified=primary_doc.uploaded_at if primary_doc else "",
                disclaimer="AI-assisted structured summary — not a legal certificate."
            )

        return {
            "evidence_nodes": nodes,
            "evidence_edges": edges,
            "verification_gaps": gaps,
            "missing_links": missing_links,
            "verification_dependencies": dependencies,
            "property_passport": passport,
            "timeline": timeline,
            "provenance_records": provenance,
            "is_reconciled": area_gap_resolved
        }

    @classmethod
    def evaluate_seller_story(cls, seller_claim: Dict[str, Any], verified_evidence: Dict[str, Any]) -> SellerStoryComparison:
        """Evaluates seller claims against documentary evidence."""
        comp = DeterministicComparisonEngine.compare_seller_story(seller_claim, verified_evidence)
        disc_text = "; ".join([d["discrepancy"] for d in comp["discrepancies"]]) if comp["discrepancies"] else "None"

        return SellerStoryComparison(
            seller_claimed_area=str(seller_claim.get("area_acres")) if seller_claim.get("area_acres") is not None else None,
            seller_claimed_owner=seller_claim.get("seller_name"),
            seller_claimed_encumbrance="Stated Nil Encumbrance",
            document_verified_area=str(verified_evidence.get("area_acres")) if verified_evidence.get("area_acres") is not None else None,
            document_verified_owner=verified_evidence.get("recorded_owner"),
            document_verified_encumbrance=verified_evidence.get("encumbrance_status"),
            discrepancy_summary=disc_text,
            status_label=comp["status_label"],
            verification_advice="Request official FMB sketch and physical total-station survey before entering sale agreement."
        )

    @classmethod
    def simulate_evidence_impact(cls, hypothetical_doc: str, case_state=None) -> Dict[str, Any]:
        """Hypothetical-only impact preview derived from the current real case, never seeded values."""
        current_docs = len(getattr(case_state, "uploaded_documents", []) or []) if case_state else 0
        current_gaps = len([g for g in (getattr(case_state, "verification_gaps", []) or []) if g.status == "OPEN"]) if case_state else 0
        return {
            "hypothetical_document": hypothetical_doc,
            "current_document_count": current_docs,
            "current_open_gap_count": current_gaps,
            "projected_impact": "A hypothetical preview only. No case state is changed until the real document is uploaded.",
            "dependency_unlocked": "Potentially resolves a dependency only if the uploaded document contains the required evidence.",
            "projected_status": "REQUIRES ACTUAL UPLOAD AND RECHECK",
            "recommendation": "Upload the real document; LandStack will re-run deterministic analysis from its actual content."
        }


evidence_agent = EvidenceAgent()
