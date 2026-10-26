import re
from typing import Dict, Any, List
from backend.app.rag.retrieval import retriever
from backend.app.models.case_state import CasePlanStep, ChecklistItem, DocumentChecklistStatus

class CaseAgent:
    """Problem-first land case understanding, intent routing and adaptive planning."""

    INTENT_MAP = {
        "LAND_PURCHASE_VERIFICATION": {
            "title": "Before-You-Buy Land Due Diligence & Title Verification",
            "title_ta": "நிலம் வாங்குவதற்கு முன் மேற்கொள்ளும் சரிபார்ப்பு",
            "title_kn": "ಭೂಮಿ ಖರೀದಿಸುವ ಮೊದಲು ಪರಿಶೀಲನೆ",
            "keywords": ["buy land", "buying land", "purchase land", "land purchase", "plot purchase", "land vang", "land vaang", "vangunum", "vanganum", "நிலம் வாங்க", "லேண்ட் வாங்க", "భూమి కొనాలి", "భూమి కొనుగోలు", "కొనాలి", "seller", "விற்பவர்"],
            "official_service": "Search Encumbrance Certificate (EC) & Certified Copies",
            "jurisdiction": "Registration Department & Revenue Department"
        },
        "INHERITED_LAND_TRANSFER": {
            "title": "Inherited Land Mutation & Patta Transfer",
            "title_ta": "தந்தை/தாய் வழி நிலப் பட்டா மாறுதல்",
            "title_kn": "ಪಿತ್ರಾರ್ಜಿತ ಭೂಮಿಯ ಮಾಲೀಕತ್ವ / ವರ್ಗಾವಣೆ ಮಾರ್ಗದರ್ಶನ",
            "keywords": ["father's land", "father land", "mother's land", "inherit", "inheritance", "appa perla", "appa perla irukura", "en peru ku maatha", "en perukku maatha", "patta maatha", "தந்தை பெயரில்", "அப்பா பேர்ல", "வாரிசு", "என் பெயருக்கு மாற்ற", "பட்டா மாற்ற", "తండ్రి పేరు", "వారసత్వం", "పట్టా మార్చాలి"],
            "official_service": "Online Patta Transfer Application",
            "jurisdiction": "Revenue Department / Taluk Office"
        },
        "PATTA_TRANSFER": {
            "title": "Patta Transfer / Mutation Guidance",
            "title_ta": "பட்டா பெயர் மாற்ற வழிகாட்டுதல்",
            "title_kn": "ಪಹಣಿ / ದಾಖಲೆ ಹೆಸರು ಬದಲಾವಣೆ ಮಾರ್ಗದರ್ಶನ",
            "keywords": ["patta transfer", "mutation", "patta name change", "பட்டா பெயர் மாற்ற", "பட்டா மாற்றம்", "పట్టా మార్పు", "పేరు మార్చాలి"],
            "official_service": "Online Patta Transfer Application",
            "jurisdiction": "Revenue Department / Taluk Office"
        },
        "BOUNDARY_DISPUTE": {
            "title": "Boundary Demarcation & Area Discrepancy Resolution",
            "title_ta": "எல்லை அளவீடு மற்றும் பரப்பளவு வேறுபாடு தீர்வு",
            "title_kn": "ಗಡಿ ಮತ್ತು ವಿಸ್ತೀರ್ಣ ವ್ಯತ್ಯಾಸ ಪರಿಹಾರ",
            "keywords": ["boundary", "survey", "area mismatch", "area shortage", "neighbor dispute", "fmb", "எல்லை", "அளக்க", "குறைவு", "சர்வே", "సరిహద్దు", "సర్వే", "విస్తీర్ణం తేడా"],
            "official_service": "Land Records / Survey Services",
            "jurisdiction": "Taluk Office / Survey Section"
        },
        "DOCUMENT_EXPLANATION": {
            "title": "Land Document Explanation & Review",
            "title_ta": "நில ஆவண விளக்கம் மற்றும் ஆய்வு",
            "title_kn": "ಭೂಮಿ ದಾಖಲೆ ವಿವರಣೆ ಮತ್ತು ಪರಿಶೀಲನೆ",
            "keywords": ["explain document", "what is this document", "document meaning", "ஆவணம் என்ன", "இந்த பத்திரம்", "ஆவணத்தை விளக்க", "పత్రం ఏమిటి", "డాక్యుమెంట్ వివరించ"],
            "official_service": "Land Document Services",
            "jurisdiction": "Relevant Revenue / Registration Department"
        },
        "LAND_RECORD_SEARCH": {
            "title": "Land Record Search & Property Information",
            "title_ta": "நிலப் பதிவுகள் மற்றும் சொத்து தகவல் தேடல்",
            "title_kn": "ಭೂ ದಾಖಲೆ ಹುಡುಕಾಟ ಮತ್ತು ಆಸ್ತಿ ಮಾಹಿತಿ",
            "keywords": ["land record", "record search", "patta details", "survey number", "நில பதிவு", "சர்வே எண்", "பட்டா விவரம்", "భూమి రికార్డు", "సర్వే నంబర్", "పట్టా వివరాలు"],
            "official_service": "View Patta & FMB / Chitta Extract",
            "jurisdiction": "Revenue Department"
        },
    }

    @classmethod
    def detect_language(cls, message: str, fallback: str = "ta") -> str:
        text = message or ""
        if re.search(r"[\u0B80-\u0BFF]", text):
            return "ta"
        if re.search(r"[\u0C80-\u0CFF]", text):
            return "kn"
        lower = text.lower()
        if re.search(r"\b(enaku|enakku|oru|venum|vendum|vang|vaang|vanganum|vangunum|irukku|irukura|sollunga|epdi|enna|enoda|peru|maathanum|vaanganum|land|nilam|nilan)", lower):
            return "ta"
        if re.search(r"\b(nanage|nanage|nanage|bhoomi|bhumi|beku|bekagide|khareedi|jameenu|hege|hesaru|patta|dakhale|ellide)\b", lower):
            return "kn"
        return fallback if fallback in {"ta", "kn"} else "ta"

    @classmethod
    def detect_intent(cls, message: str) -> Dict[str, Any]:
        msg = (message or "").lower().strip()
        scores = {k: 0 for k in cls.INTENT_MAP}
        for intent_key, meta in cls.INTENT_MAP.items():
            for kw in meta["keywords"]:
                if kw.lower() in msg:
                    scores[intent_key] += 2
        purchase = ["buy land", "buying land", "purchase land", "land purchase", "land vang", "land vaang", "vangunum", "vanganum", "நிலம் வாங்க", "லேண்ட் வாங்க", "ಭೂಮಿ ಖರೀದಿ", "ಜಮೀನು ಖರೀದಿ", "jameenu", "bhoomi khareedi"]
        inheritance = ["father's land", "father land", "mother's land", "inherit", "appa perla", "appa perla irukura", "en peru ku maatha", "en perukku maatha", "தந்தை பெயரில்", "அப்பா பேர்ல", "வாரிசு", "ನನ್ನ ಹೆಸರಿಗೆ", "ತಂದೆಯ ಜಮೀನು", "ವಾರಸುದಾರ"]
        boundary = ["boundary", "area mismatch", "area shortage", "fmb", "எல்லை", "அளக்க", "குறைவு", "சர்வே", "ಗಡಿ", "ವಿಸ್ತೀರ್ಣ", "ಸರ್ವೇ"]
        if any(p in msg for p in purchase):
            scores["LAND_PURCHASE_VERIFICATION"] += 20
            scores["INHERITED_LAND_TRANSFER"] -= 15
            scores["PATTA_TRANSFER"] -= 5
        if any(p in msg for p in inheritance): scores["INHERITED_LAND_TRANSFER"] += 20
        if any(p in msg for p in ["how to transfer land", "land transfer", "transfer land", "நிலம் மாற்ற", "நிலத்தை மாற்ற", "ಭೂಮಿ ವರ್ಗಾವಣೆ", "ಹೆಸರು ಬದಲಾವಣೆ"]): scores["PATTA_TRANSFER"] += 10
        if any(p in msg for p in boundary): scores["BOUNDARY_DISPUTE"] += 15
        if any(p in msg for p in ["explain", "meaning", "என்ன இந்த", "ஆவணம்", "பத்திரம் என்ன", "ದಾಖಲೆ", "ಪತ್ರ ಏನು", "ವಿವರಿಸಿ"]): scores["DOCUMENT_EXPLANATION"] += 8
        best_intent = max(scores, key=scores.get)
        if scores[best_intent] <= 0: best_intent = "LAND_RECORD_SEARCH"
        meta = cls.INTENT_MAP[best_intent]
        return {
            "intent": best_intent, "title": meta["title"], "title_ta": meta["title_ta"], "title_kn": meta["title_kn"],
            "confidence": min(0.98, 0.78 + max(0, scores[best_intent]) * 0.02),
            "official_service": meta["official_service"], "jurisdiction": meta["jurisdiction"], "scores": scores
        }

    @classmethod
    def _q(cls, qid, en, ta, kn, help_en, field):
        return {"id": qid, "question": en, "question_ta": ta, "question_kn": kn, "help": help_en, "field": field, "answered": False, "answer": None}

    @classmethod
    def generate_adaptive_questions(cls, intent: str, language: str = "ta", state: str = "", land_type: str = "") -> List[Dict[str, Any]]:
        common = [cls._q("q_citizen_name", "What is your name?", "உங்கள் பெயர் என்ன?", "ನಿಮ್ಮ ಹೆಸರು ಏನು?", "Enter the name you want to use for this case.", "citizen_name")]
        if intent == "LAND_PURCHASE_VERIFICATION":
            qs = [
                cls._q("q_land_location", "Where is the land located (district/taluk/village or map point)?", "நிலம் எந்த மாவட்டம்/வட்டம்/கிராமத்தில் உள்ளது அல்லது வரைபடத்தில் எங்கு உள்ளது?", "ಜಮೀನು ಯಾವ ಜಿಲ್ಲೆ/ತಾಲೂಕು/ಗ್ರಾಮದಲ್ಲಿದೆ ಅಥವಾ ನಕ್ಷೆಯಲ್ಲಿ ಎಲ್ಲಿದೆ?", "Land location is separate from your current location.", "property_location"),
                cls._q("q_property_context", "Is this rural agricultural land, semi-urban land, or an urban property?", "இது கிராமப்புற விவசாய நிலமா, அரை நகர்ப்புற நிலமா அல்லது நகர்ப்புற சொத்தா?", "ಇದು ಗ್ರಾಮೀಣ ಕೃಷಿ ಜಮೀನುವೇ, ಅರೆ-ನಗರ ಜಮೀನುವೇ ಅಥವಾ ನಗರ ಆಸ್ತಿಯೇ?", "This changes the applicable record workflow.", "property_context"),
                cls._q("q_seller_claim", "What extent of land is the seller offering?", "விற்பவர் கூறும் நிலப் பரப்பளவு எவ்வளவு?", "ಮಾರಾಟಗಾರ ಹೇಳುವ ಜಮೀನಿನ ವಿಸ್ತೀರ್ಣ ಎಷ್ಟು?", "Give the area stated by the seller or draft agreement.", "seller_promised_area"),
                cls._q("q_available_docs", "What documents has the seller given you so far?", "விற்பவர் இதுவரை எந்த ஆவணங்களை கொடுத்துள்ளார்?", "ಮಾರಾಟಗಾರರು ಇದುವರೆಗೆ ಯಾವ ದಾಖಲೆಗಳನ್ನು ನೀಡಿದ್ದಾರೆ?", "List only documents actually available.", "available_documents")
            ]
        elif intent == "INHERITED_LAND_TRANSFER":
            qs = [
                cls._q("q_land_location", "Where is the inherited land located?", "வாரிசு நிலம் எங்கு உள்ளது?", "ಪಿತ್ರಾರ್ಜಿತ ಜಮೀನು ಎಲ್ಲಿದೆ?", "Give the land location you know.", "property_location"),
                cls._q("q_owner_status", "Whose name is currently on the land record? Is that person deceased?", "தற்போது நிலப் பதிவில் யார் பெயர் உள்ளது? அந்த நபர் காலமானவரா?", "ಪ್ರಸ್ತುತ ಭೂ ದಾಖಲೆಯಲ್ಲಿ ಯಾರ ಹೆಸರು ಇದೆ? ಆ ವ್ಯಕ್ತಿ ಮೃತಪಟ್ಟಿದ್ದಾರೆಯೇ?", "Do not assume death; provide what you know.", "owner_status"),
                cls._q("q_heirs", "Who are the surviving legal heirs, if known?", "உயிருடன் உள்ள சட்டப்பூர்வ வாரிசுகள் யார் என்று தெரிந்தால் சொல்லுங்கள்.", "ತಿಳಿದಿದ್ದರೆ ಜೀವಂತ ಕಾನೂನು ವಾರಸುದಾರರು ಯಾರು?", "Only enter people you actually know or can evidence.", "legal_heirs"),
                cls._q("q_documents", "What land documents do you currently have?", "தற்போது உங்களிடம் உள்ள நில ஆவணங்கள் என்ன?", "ಈಗ ನಿಮ್ಮ ಬಳಿ ಇರುವ ಭೂ ದಾಖಲೆಗಳು ಯಾವುವು?", "List only actual documents.", "available_documents")
            ]
        elif intent == "PATTA_TRANSFER":
            qs = [
                cls._q("q_land_location", "Where is the land located?", "நிலம் எங்கு உள்ளது?", "ಜಮೀನು ಎಲ್ಲಿದೆ?", "Give the land location.", "property_location"),
                cls._q("q_current_owner", "Whose name is currently on the relevant land record?", "தற்போதைய நிலப் பதிவில் யார் பெயர் உள்ளது?", "ಸಂಬಂಧಿತ ಭೂ ದಾಖಲೆಯಲ್ಲಿ ಪ್ರಸ್ತುತ ಯಾರ ಹೆಸರು ಇದೆ?", "Tell us the recorded name if known.", "current_owner"),
                cls._q("q_new_owner", "Whose name should the record be changed to?", "பதிவு யார் பெயருக்கு மாற்ற வேண்டும்?", "ದಾಖಲೆಯನ್ನು ಯಾರ ಹೆಸರಿಗೆ ಬದಲಾಯಿಸಬೇಕು?", "Tell us the intended new holder.", "new_owner"),
                cls._q("q_documents", "What documents do you already have?", "உங்களிடம் ஏற்கனவே என்ன ஆவணங்கள் உள்ளன?", "ನಿಮ್ಮ ಬಳಿ ಈಗಾಗಲೇ ಯಾವ ದಾಖಲೆಗಳಿವೆ?", "Mention only records actually available.", "available_documents")
            ]
        elif intent == "BOUNDARY_DISPUTE":
            qs = [
                cls._q("q_land_location", "Where is the property located?", "சொத்து எங்கு உள்ளது?", "ಆಸ್ತಿ ಎಲ್ಲಿದೆ?", "Give the location if known.", "property_location"),
                cls._q("q_issue", "What differs: boundary, survey number, or land extent?", "எதில் வேறுபாடு உள்ளது: எல்லை, சர்வே எண் அல்லது பரப்பளவு?", "ಏನು ಭಿನ್ನವಾಗಿದೆ: ಗಡಿ, ಸರ್ವೇ ಸಂಖ್ಯೆ ಅಥವಾ ವಿಸ್ತೀರ್ಣ?", "Describe the actual mismatch.", "discrepancy_details"),
                cls._q("q_documents", "Which records are available for comparison?", "ஒப்பிடுவதற்கு எந்த பதிவுகள் உள்ளன?", "ಹೋಲಿಕೆ ಮಾಡಲು ಯಾವ ದಾಖಲೆಗಳು ಲಭ್ಯವಿವೆ?", "List only actual records.", "available_documents")
            ]
        elif intent == "DOCUMENT_EXPLANATION":
            qs = [
                cls._q("q_document", "Which land document do you want explained?", "எந்த நில ஆவணத்தை விளக்க வேண்டும்?", "ಯಾವ ಭೂ ದಾಖಲೆ ವಿವರಿಸಬೇಕು?", "Upload it or give its name.", "document_name"),
                cls._q("q_goal", "What do you want to know about the document?", "அந்த ஆவணத்தைப் பற்றி என்ன தெரிந்துகொள்ள விரும்புகிறீர்கள்?", "ಆ ದಾಖಲೆಯ ಬಗ್ಗೆ ಏನು ತಿಳಿದುಕೊಳ್ಳಲು ಬಯಸುತ್ತೀರಿ?", "For example: purpose, owner, survey number or fields.", "document_goal")
            ]
        else:
            qs = [
                cls._q("q_land_location", "Where is the land located?", "நிலம் எங்கு உள்ளது?", "ಜಮೀನು ಎಲ್ಲಿದೆ?", "Give district/taluk/village or a map point if known.", "property_location"),
                cls._q("q_property_context", "What type of land/property is this?", "இது எந்த வகை நிலம்/சொத்து?", "ಇದು ಯಾವ ರೀತಿಯ ಜಮೀನು/ಆಸ್ತಿ?", "Example: rural agricultural, semi-urban, urban property.", "property_context"),
                cls._q("q_request_detail", "What exactly do you want to do with the land?", "நிலத்தை வைத்து நீங்கள் என்ன செய்ய விரும்புகிறீர்கள்?", "ಜಮೀನಿನ ಬಗ್ಗೆ ನೀವು ನಿಖರವಾಗಿ ಏನು ಮಾಡಲು ಬಯಸುತ್ತೀರಿ?", "Describe the goal in your own words.", "request_detail")
            ]
        return common + qs

    @classmethod
    def generate_case_plan(cls, intent: str) -> List[CasePlanStep]:
        if intent == "INHERITED_LAND_TRANSFER":
            return [
                CasePlanStep(step_number=1, title="Understand ownership & legal heirs", status="IN_PROGRESS", description="Confirm the current owner, death status and legal heirs before selecting the transfer route."),
                CasePlanStep(step_number=2, title="Collect and explain required records", status="PENDING", description="Gather deed, death certificate, legal-heir evidence, Patta and EC as applicable."),
                CasePlanStep(step_number=3, title="Analyze evidence & identify gaps", status="PENDING", description="Compare the uploaded records and identify missing links or potential inconsistencies."),
                CasePlanStep(step_number=4, title="Resolve verification gaps", status="PENDING", description="Obtain additional survey, consent or certified evidence where required."),
                CasePlanStep(step_number=5, title="Navigate to the official Patta service", status="PENDING", description="Use the verified official portal only after the case is ready.")]
        if intent == "LAND_PURCHASE_VERIFICATION":
            return [
                CasePlanStep(step_number=1, title="Understand the property and seller claim", status="IN_PROGRESS", description="Capture location, seller-stated extent and the purpose of purchase."),
                CasePlanStep(step_number=2, title="Collect title, revenue and EC evidence", status="PENDING", description="Gather the documents available from the seller and official sources."),
                CasePlanStep(step_number=3, title="Cross-check ownership, extent and boundaries", status="PENDING", description="Compare title deed, parent deeds, Patta, FMB and EC where available."),
                CasePlanStep(step_number=4, title="Resolve verification gaps", status="PENDING", description="Request missing evidence or professional verification where required."),
                CasePlanStep(step_number=5, title="Proceed to the next verified action", status="PENDING", description="Use official services or professional review as appropriate.")]
        if intent == "BOUNDARY_DISPUTE":
            return [
                CasePlanStep(step_number=1, title="Capture the boundary issue", status="IN_PROGRESS", description="Record the location and exact mismatch."),
                CasePlanStep(step_number=2, title="Collect deed, Patta and FMB", status="PENDING", description="Gather the records needed for deterministic comparison."),
                CasePlanStep(step_number=3, title="Compare extent and survey relationships", status="PENDING", description="Identify potential inconsistencies and missing links."),
                CasePlanStep(step_number=4, title="Guide official survey / rectification", status="PENDING", description="Route the citizen to the applicable survey authority if needed.")]
        return [
            CasePlanStep(step_number=1, title="Understand the request", status="IN_PROGRESS", description="Clarify what the citizen wants to accomplish."),
            CasePlanStep(step_number=2, title="Collect relevant evidence", status="PENDING", description="Gather documents and property details relevant to the request."),
            CasePlanStep(step_number=3, title="Analyze and identify gaps", status="PENDING", description="Explain evidence and identify what still needs verification."),
            CasePlanStep(step_number=4, title="Take the next verified action", status="PENDING", description="Navigate to the relevant official service or professional escalation.")]

    @classmethod
    def generate_checklist(cls, intent: str, state: str = "", land_type: str = "") -> List[ChecklistItem]:
        req_data = retriever.get_document_requirements_for_intent(intent, state=state, land_type=land_type)
        if not req_data:
            return []
        return [ChecklistItem(id=f"chk_{idx+1}_{doc['doc_type'].lower()}", doc_type=doc["doc_type"], name=doc["name"], name_ta=doc.get("name_ta"), required=doc["required"], status=DocumentChecklistStatus.MISSING, purpose=doc["purpose"], issuing_authority=doc["issuing_authority"], alternative=doc.get("alternative")) for idx, doc in enumerate(req_data.get("documents", []))]

case_agent = CaseAgent()
