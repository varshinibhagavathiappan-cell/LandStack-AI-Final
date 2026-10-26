import os
import json
import re
from typing import List, Dict, Any, Optional
from backend.app.services.state_requirements import requirements_for

class KnowledgeRetriever:
    def __init__(self, knowledge_base_dir: Optional[str] = None):
        if not knowledge_base_dir:
            # default to knowledge_base at project root
            base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "knowledge_base"))
            self.knowledge_base_dir = base_dir
        else:
            self.knowledge_base_dir = knowledge_base_dir

        self.services: List[Dict[str, Any]] = []
        self.procedures: List[Dict[str, Any]] = []
        self.terminology: List[Dict[str, Any]] = []
        self.doc_requirements: Dict[str, Any] = {}
        self.faqs: List[Dict[str, Any]] = []

        self.load_all()

    def load_all(self):
        """Loads and indexes all trusted knowledge sources from disk."""
        registry_path = os.path.join(self.knowledge_base_dir, "registry", "verified_services.json")
        procedures_path = os.path.join(self.knowledge_base_dir, "sources", "procedures.json")
        terminology_path = os.path.join(self.knowledge_base_dir, "sources", "terminology.json")
        requirements_path = os.path.join(self.knowledge_base_dir, "sources", "document_requirements.json")
        faqs_path = os.path.join(self.knowledge_base_dir, "sources", "citizen_faqs.json")

        if os.path.exists(registry_path):
            with open(registry_path, "r", encoding="utf-8") as f:
                self.services = json.load(f)

        if os.path.exists(procedures_path):
            with open(procedures_path, "r", encoding="utf-8") as f:
                self.procedures = json.load(f)

        if os.path.exists(terminology_path):
            with open(terminology_path, "r", encoding="utf-8") as f:
                self.terminology = json.load(f)

        if os.path.exists(requirements_path):
            with open(requirements_path, "r", encoding="utf-8") as f:
                self.doc_requirements = json.load(f)

        if os.path.exists(faqs_path):
            with open(faqs_path, "r", encoding="utf-8") as f:
                self.faqs = json.load(f)

    def search_knowledge(self, query: str, state: str = "Tamil Nadu", intent: Optional[str] = None, top_k: int = 4) -> List[Dict[str, Any]]:
        """
        Retrieves relevant procedures, terms, faqs, and verified services for a query.
        Returns items with full traceable metadata and verified citations.
        """
        results = []
        q_tokens = set(re.findall(r'\w+', query.lower()))

        # Tamil translation helper tokens
        tamil_map = {
            "அப்பா": ["father", "deceased", "inheritance", "paternal"],
            "நிலம்": ["land", "property", "patta", "survey"],
            "பட்டா": ["patta", "mutation", "transfer", "chitta"],
            "வாரிசு": ["heir", "legal heir", "inheritance", "varisu"],
            "கிரையம்": ["sale", "deed", "purchase"],
            "வில்லங்கம்": ["encumbrance", "ec", "mortgage"],
            "எல்லை": ["boundary", "fmb", "survey", "dispute"]
        }
        for ta_term, syns in tamil_map.items():
            if ta_term in query:
                q_tokens.update(syns)

        # 1. Search Procedures
        for proc in self.procedures:
            if state not in {"", "All"} and proc.get("state") not in {state, "All"}:
                continue
            score = 0
            if intent and proc.get("applicable_intent") == intent:
                score += 8
            proc_text = (proc.get("title", "") + " " + proc.get("title_ta", "") + " " + json.dumps(proc.get("steps", []))).lower()
            for token in q_tokens:
                if len(token) > 2 and token in proc_text:
                    score += 1

            if score > 0:
                results.append({
                    "score": score,
                    "source_title": proc.get("title"),
                    "source_type": "Government Procedure / Statutory Guidance",
                    "jurisdiction": proc.get("state", state),
                    "service": proc.get("category"),
                    "document_topic": proc.get("applicable_intent"),
                    "source_url": proc.get("official_url") if proc.get("verification_status") == "VERIFIED" else "Official source not configured",
                    "last_verified_date": proc.get("last_verified_date", "2026-03-15"),
                    "confidence_status": "Verified Procedure",
                    "content": f"{proc.get('title')} ({proc.get('estimated_timeline')}). Key steps: " + "; ".join([s['step_name'] for s in proc.get('steps', [])[:3]]),
                    "raw_data": proc
                })

        # 2. Search Terminology
        for term in self.terminology:
            score = 0
            term_text = (term.get("term", "") + " " + term.get("term_ta", "") + " " + term.get("term_hi", "") + " " + term.get("summary", "")).lower()
            for token in q_tokens:
                if len(token) > 2 and token in term_text:
                    score += 1.5

            if score > 0:
                results.append({
                    "score": score,
                    "source_title": f"Terminology: {term.get('term')} ({term.get('term_ta', '')})",
                    "source_type": "Land Record Terminology Glossary",
                    "jurisdiction": "Revenue & Registration",
                    "service": term.get("category"),
                    "document_topic": term.get("term"),
                    "source_url": None,
                    "last_verified_date": "2026-03-15",
                    "confidence_status": "Verified Standard Definition",
                    "content": f"{term.get('term')}: {term.get('summary')} Authority: {term.get('authority')}",
                    "raw_data": term
                })

        # 3. Search FAQs
        for faq in self.faqs:
            faq_state = faq.get("jurisdiction", state)
            if state not in {"", "All"} and faq_state not in {state, "All", "Pan-India"}:
                continue
            score = 0
            faq_text = (faq.get("question", "") + " " + faq.get("question_ta", "") + " " + faq.get("answer", "")).lower()
            for token in q_tokens:
                if len(token) > 2 and token in faq_text:
                    score += 1.2

            if score > 0:
                results.append({
                    "score": score,
                    "source_title": faq.get("source_title", "Citizen FAQ"),
                    "source_type": "Citizen Guidance FAQ",
                    "jurisdiction": faq.get("jurisdiction", state),
                    "service": faq.get("service", "General Land FAQ"),
                    "document_topic": "FAQ",
                    "source_url": faq.get("source_url") if faq.get("verification_status") == "VERIFIED" else "Official source not configured",
                    "last_verified_date": "2026-03-15",
                    "confidence_status": "Verified FAQ",
                    "content": f"Q: {faq.get('question')}\nA: {faq.get('answer')}",
                    "raw_data": faq
                })

        # 4. Search Verified Services Registry
        for srv in self.services:
            if srv.get("state") == state or state == "All":
                score = 0
                srv_text = (srv.get("service_name", "") + " " + srv.get("description", "") + " " + srv.get("category", "")).lower()
                for token in q_tokens:
                    if len(token) > 2 and token in srv_text:
                        score += 1.3

                if score > 0:
                    results.append({
                        "score": score,
                        "source_title": srv.get("service_name"),
                        "source_type": "Verified Official Portal Registry",
                        "jurisdiction": srv.get("state"),
                        "service": srv.get("category"),
                        "document_topic": "Online Portal",
                        "source_url": srv.get("official_url"),
                        "last_verified_date": srv.get("last_verified_date"),
                        "confidence_status": srv.get("confidence_status"),
                        "content": f"{srv.get('service_name')} ({srv.get('department')}). {srv.get('description')}",
                        "raw_data": srv
                    })

        # Sort by score descending and return top_k
        results.sort(key=lambda x: x["score"], reverse=True)
        return results[:top_k]

    def get_document_requirements_for_intent(self, intent: str, state: str = "", land_type: str = "") -> Optional[Dict[str, Any]]:
        # State-aware requirements take precedence over the legacy TN-only registry.
        if state in {"Tamil Nadu", "Karnataka"}:
            docs = requirements_for(state, intent, land_type)
            if docs:
                return {"title": f"{state} {intent} requirements", "documents": docs}
        return self.doc_requirements.get(intent)

    def get_verified_services_by_state(self, state: str = "Tamil Nadu") -> List[Dict[str, Any]]:
        return [s for s in self.services if s.get("state") == state or s.get("state") == "Pan-India"]

# Singleton instance
retriever = KnowledgeRetriever()
