"""Evidence-first land intelligence orchestration.
Never treats map data as ownership/cadastral proof and never fabricates unavailable records.
"""
from __future__ import annotations
from typing import Any, Dict, List
from backend.app.rag.retrieval import retriever

OFFICIAL_SOURCES = {
    "India": [
        {"name": "Department of Land Resources - DILRMP", "url": "https://dolr.gov.in/en/programmes-schemes/dilrmp-2/", "purpose": "Land records digitisation and integration context"},
        {"name": "Department of Land Resources - ULPIN", "url": "https://dolr.gov.in/en/ulpin/", "purpose": "Parcel identifier / cadastral context"},
        {"name": "Department of Land Resources - RCCMS", "url": "https://dolr.gov.in/en/rccms/", "purpose": "Revenue-court case integration context"},
    ],
    "Tamil Nadu": [
        {"name": "Tamil Nadu e-Sevai", "url": "https://www.tnesevai.tn.gov.in/", "purpose": "Official citizen services"},
        {"name": "Tamil Nadu Revenue / Patta Transfer", "url": "https://cla.tn.gov.in/patta_transfer.html", "purpose": "Patta transfer information"},
        {"name": "Tamil Nadu Land Administration", "url": "https://tamilnilam.tn.gov.in/", "purpose": "Official land services portal"},
        {"name": "Tamil Nadu Registration Department", "url": "https://registration.tn.gov.in/", "purpose": "Registration / EC services"},
    ],
    "Karnataka": [
        {"name": "Karnataka Bhoomi", "url": "https://landrecords.karnataka.gov.in/", "purpose": "RTC / land records services"},
        {"name": "Kaveri Online Services", "url": "https://kaveri.karnataka.gov.in/", "purpose": "Registration services"},
        {"name": "BBMP e-Aasthi", "url": "https://bbmpeaasthi.karnataka.gov.in/", "purpose": "Urban property records where applicable"},
    ],
}

class LandIntelligence:
    def source_registry(self, state: str = "") -> Dict[str, Any]:
        sources = list(OFFICIAL_SOURCES["India"])
        if state in OFFICIAL_SOURCES:
            sources += OFFICIAL_SOURCES[state]
        return {"state": state, "sources": sources, "note": "These are navigation/knowledge sources. A source is not treated as a verified parcel result unless the connected service actually returns matching evidence."}

    def build_investigation(self, case: Dict[str, Any]) -> Dict[str, Any]:
        state = case.get("state") or ""
        intent = case.get("detected_intent") or ""
        location = case.get("land_location") or {}
        docs = case.get("uploaded_documents") or []
        query_parts = [intent, case.get("problem_statement", ""), state, case.get("district", ""), case.get("taluk", ""), case.get("village", "")]
        query = " ".join(str(x) for x in query_parts if x)
        knowledge = retriever.search_knowledge(query or "land records verification", state=state or "All", intent=intent or None, top_k=6)
        findings: List[Dict[str, Any]] = []
        if location.get("latitude") is not None and location.get("longitude") is not None:
            findings.append({"type": "LOCATION", "status": "OBSERVED", "title": "Selected land location", "detail": "Coordinates identify a map location only; they do not prove cadastral parcel identity or ownership.", "source": location.get("source", "Location service")})
        if docs:
            findings.append({"type": "DOCUMENTS", "status": "USER_EVIDENCE", "title": "Uploaded evidence available", "detail": f"{len(docs)} citizen-provided document(s) are available for document-level analysis.", "source": "Citizen upload"})
        findings.append({"type": "PUBLIC_RECORDS", "status": "REQUIRES_CONNECTED_SOURCE", "title": "Official land/court records", "detail": "No live ownership, encumbrance, death, or court result is asserted unless a connected authoritative source returns a matching record.", "source": "Government portals / APIs"})
        return {"state": state, "location": location, "findings": findings, "knowledge": knowledge, "official_sources": self.source_registry(state)["sources"], "limitations": ["Google Maps/OpenStreetMap location is not cadastral proof.", "No matching public record is not proof that no event occurred.", "Death/inheritance facts require an authoritative matching record or user-provided evidence.", "Court/encumbrance results depend on the connected official source and identifiers available." ]}

land_intelligence = LandIntelligence()
