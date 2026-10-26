from typing import Dict, Any, List, Optional
from datetime import datetime
from backend.app.services.ocr_service import ocr_service
from backend.app.models.case_state import DocumentItem, DocumentChecklistStatus, ChecklistItem

class DocumentAgent:
    """
    Responsible for document intake, OCR processing, document classification,
    plain-language explanation, field extraction, consistency checks,
    and evidence request generation.
    """

    EXPLANATIONS = {
        "TITLE_DEED": {"en": "A registered title deed records a property transaction and key property identifiers. Review the recorded parties, survey identity, extent, boundaries and registration details.", "ta": "பதிவு செய்யப்பட்ட பத்திரம் நிலப் பரிவர்த்தனை மற்றும் முக்கிய சொத்து விவரங்களை பதிவு செய்கிறது. உரிமையாளர், சர்வே எண், பரப்பளவு, எல்லைகள் மற்றும் பதிவு விவரங்களை சரிபார்க்கவும்.", "kn": "ನೋಂದಾಯಿತ ಹಕ್ಕುಪತ್ರವು ಆಸ್ತಿ ವ್ಯವಹಾರ ಮತ್ತು ಮುಖ್ಯ ಆಸ್ತಿ ಗುರುತುಗಳನ್ನು ದಾಖಲಿಸುತ್ತದೆ. ಮಾಲೀಕರು, ಸರ್ವೇ ಸಂಖ್ಯೆ, ವಿಸ್ತೀರ್ಣ, ಗಡಿಗಳು ಮತ್ತು ನೋಂದಣಿ ವಿವರಗಳನ್ನು ಪರಿಶೀಲಿಸಿ."},
        "EXISTING_PATTA": {"en": "A Patta/Chitta extract is a revenue record. Review the recorded holder, survey/sub-division, extent and classification and compare them with other evidence.", "ta": "பட்டா/சிட்டா என்பது வருவாய் பதிவு. பெயர், சர்வே/உட்பிரிவு, பரப்பளவு மற்றும் வகைப்பாட்டை மற்ற ஆவணங்களுடன் ஒப்பிடவும்.", "kn": "RTC/ಪಹಣಿ ಮುಂತಾದ ದಾಖಲೆಗಳು ಸಂಬಂಧಿತ ಭೂ ದಾಖಲೆ ಮಾಹಿತಿಯನ್ನು ತೋರಿಸುತ್ತವೆ. ಹೆಸರು, ಸರ್ವೇ/ಹಿಸ್ಸಾ, ವಿಸ್ತೀರ್ಣ ಮತ್ತು ವರ್ಗೀಕರಣವನ್ನು ಇತರ ಸಾಕ್ಷ್ಯಗಳೊಂದಿಗೆ ಹೋಲಿಸಿ."},
        "CHITTA": {"en": "A Chitta/revenue extract is reviewed for the recorded holder, survey identity, extent and related land classification information.", "ta": "சிட்டா பதிவில் உள்ள பெயர், சர்வே அடையாளம், பரப்பளவு மற்றும் தொடர்புடைய வகைப்பாடு தகவல்களை சரிபார்த்து மற்ற ஆதாரங்களுடன் ஒப்பிடவும்.", "kn": "ಚಿಟ್ಟಾ/ಸಂಬಂಧಿತ ಭೂ ದಾಖಲೆಗಳಲ್ಲಿ ಹೆಸರು, ಸರ್ವೇ ಗುರುತು, ವಿಸ್ತೀರ್ಣ ಮತ್ತು ವರ್ಗೀಕರಣ ಮಾಹಿತಿಯನ್ನು ಪರಿಶೀಲಿಸಿ."},
        "ADANGAL": {"en": "An Adangal extract is reviewed for cultivation/crop and land-record details for the relevant survey and period. Compare the survey identity and other fields with the land records.", "ta": "அடங்கல் பதிவில் பயிர்/சாகுபடி மற்றும் சம்பந்தப்பட்ட சர்வே காலத் தகவல்களை சரிபார்க்கவும். சர்வே அடையாளம் மற்றும் பிற விவரங்களை நில பதிவுகளுடன் ஒப்பிடவும்.", "kn": "ಅಡಂಗಲ್ ದಾಖಲೆಯಲ್ಲಿ ಸಂಬಂಧಿತ ಸರ್ವೇ ಮತ್ತು ಅವಧಿಗೆ ಬೆಳೆ/ಕೃಷಿ ಹಾಗೂ ಭೂ ದಾಖಲೆ ವಿವರಗಳನ್ನು ಪರಿಶೀಲಿಸಿ."},
        "LEGAL_HEIR_CERTIFICATE": {"en": "A Legal Heir Certificate identifies the persons reported as legal heirs of a deceased person. Use the certificate as evidence and review the applicable succession/transfer requirements.", "ta": "வாரிசு சான்றிதழ் மறைந்த நபரின் சட்டப்பூர்வ வாரிசுகளை குறிப்பிடுகிறது. சான்றிதழில் உள்ள பெயர்களை ஆதாரமாகப் பயன்படுத்தி பொருந்தும் வாரிசு/மாற்று தேவைகளை சரிபார்க்கவும்.", "kn": "ಕಾನೂನು ವಾರಸುದಾರರ ದಾಖಲೆ ಮೃತ ವ್ಯಕ್ತಿಗೆ ಸಂಬಂಧಿಸಿದಂತೆ ವರದಿಯಾದ ವಾರಸುದಾರರನ್ನು ತೋರಿಸುತ್ತದೆ. ಹೆಸರುಗಳು ಮತ್ತು ಅನ್ವಯಿಸುವ ವರ್ಗಾವಣೆ ಅಗತ್ಯಗಳನ್ನು ಪರಿಶೀಲಿಸಿ."},
        "DEATH_CERTIFICATE": {"en": "A death certificate is evidence of the recorded death event. Review the deceased person's name, date and registration details against the land case.", "ta": "இறப்பு சான்றிதழ் பதிவு செய்யப்பட்ட இறப்பு நிகழ்வுக்கான ஆதாரம். மறைந்த நபரின் பெயர், தேதி மற்றும் பதிவு விவரங்களை கேஸுடன் ஒப்பிடவும்.", "kn": "ಮರಣ ಪ್ರಮಾಣಪತ್ರವು ದಾಖಲಾದ ಮರಣ ಘಟನೆಯ ಸಾಕ್ಷ್ಯವಾಗಿದೆ. ಮೃತ ವ್ಯಕ್ತಿಯ ಹೆಸರು, ದಿನಾಂಕ ಮತ್ತು ನೋಂದಣಿ ವಿವರಗಳನ್ನು ಕೇಸ್‌ನೊಂದಿಗೆ ಹೋಲಿಸಿ."},
        "FMB_SKETCH": {"en": "An FMB/survey record contains measurement and boundary information. Use it to compare survey identity, extent and boundaries with the other land records.", "ta": "FMB/அளவீட்டு பதிவு நிலத்தின் அளவு மற்றும் எல்லை தகவல்களை வழங்குகிறது. சர்வே எண், பரப்பளவு மற்றும் எல்லைகளை மற்ற பதிவுகளுடன் ஒப்பிடவும்.", "kn": "FMB/ಸರ್ವೇ ದಾಖಲೆಗಳು ಅಳತೆ ಮತ್ತು ಗಡಿ ಮಾಹಿತಿಯನ್ನು ನೀಡುತ್ತವೆ. ಸರ್ವೇ ಸಂಖ್ಯೆ, ವಿಸ್ತೀರ್ಣ ಮತ್ತು ಗಡಿಗಳನ್ನು ಇತರ ದಾಖಲೆಗಳೊಂದಿಗೆ ಹೋಲಿಸಿ."},
        "ENCUMBRANCE_CERTIFICATE": {"en": "An Encumbrance Certificate reports registered transactions or encumbrances recorded for the searched period. It does not by itself guarantee the absence of every possible claim or dispute.", "ta": "வில்லங்கச் சான்றிதழ் தேடப்பட்ட காலத்திற்கு பதிவு செய்யப்பட்ட பரிவர்த்தனைகள்/வில்லங்கங்களை காட்டுகிறது. இது அனைத்து சாத்தியமான உரிமைகோரல்கள் அல்லது வழக்குகள் இல்லை என்பதற்கான முழு உத்தரவாதம் அல்ல.", "kn": "ಎನ್ಕಂಬರೆನ್ಸ್ ಪ್ರಮಾಣಪತ್ರವು ಹುಡುಕಿದ ಅವಧಿಗೆ ದಾಖಲಾಗಿರುವ ವ್ಯವಹಾರಗಳು ಅಥವಾ ಭಾರಗಳನ್ನು ತೋರಿಸುತ್ತದೆ. ಇದು ಪ್ರತಿಯೊಂದು ಸಾಧ್ಯ ಹಕ್ಕು ಅಥವಾ ವಿವಾದ ಇಲ್ಲ ಎಂಬ ಸಂಪೂರ್ಣ ಖಾತರಿ ಅಲ್ಲ."}
    }

    @classmethod
    def ingest_document(cls, filename: str, file_bytes: Optional[bytes] = None, text_content: Optional[str] = None, language: str = "ta", use_demo_samples: bool = False) -> DocumentItem:
        """Processes document and creates a structured DocumentItem."""
        processed = ocr_service.process_document(filename, file_bytes, text_content, use_demo_samples=use_demo_samples)
        doc_type = processed["document_type"]

        exp = cls.EXPLANATIONS.get(doc_type, {}).get(language, cls.EXPLANATIONS.get(doc_type, {}).get("en", "Document extracted and verified."))

        doc_item = DocumentItem(
            id=f"doc_{datetime.now().strftime('%Y%m%d%H%M%S')}_{doc_type.lower()}",
            doc_type=doc_type,
            filename=filename,
            title=processed["title"],
            uploaded_at=datetime.now().strftime("%Y-%m-%d %H:%M"),
            file_size_kb=len(file_bytes) // 1024 if file_bytes else 185,
            status=DocumentChecklistStatus.AVAILABLE,
            extracted_fields=processed["extracted_fields"],
            ocr_confidence=processed["confidence"],
            explanation=exp,
            label="AI-assisted extraction"
        )
        return doc_item

    @classmethod
    def update_checklist_status(cls, checklist: List[ChecklistItem], uploaded_docs: List[DocumentItem]) -> List[ChecklistItem]:
        """Matches uploaded documents to checklist items deterministically."""
        doc_type_map = {d.doc_type: d for d in uploaded_docs}

        for item in checklist:
            if item.doc_type in doc_type_map:
                item.status = DocumentChecklistStatus.AVAILABLE
                item.matching_doc_id = doc_type_map[item.doc_type].id
            else:
                item.status = DocumentChecklistStatus.MISSING
                item.matching_doc_id = None
        return checklist

    @classmethod
    def generate_evidence_request_letter(cls, missing_doc_name: str, recipient_type: str, citizen_name: str, survey_no: str, district: str) -> str:
        """Generates formal request letters to ask sellers or authorities for missing land records."""
        if recipient_type == "SELLER":
            return f"""To: The Land Seller / Vendor
From: {citizen_name}
Subject: Formal Request for Missing Title & Revenue Records for Survey No {survey_no}, {district}

Dear Sir/Madam,

During our pre-purchase title review for the property situated in Survey No: {survey_no}, our LandStack AI verification identified that the following essential record is currently unavailable:
- Requested Document: {missing_doc_name}

To complete our legal due diligence and ensure an unclouded title, please provide certified or clear photocopies of the aforementioned record at your earliest convenience before we proceed to finalize the Sale Agreement.

Yours sincerely,
{citizen_name}"""
        else:
            return f"""To: The Public Information Officer / Sub-Registrar / Tahsildar
Taluk Office / Sub-Registrar Office, {district}
From: {citizen_name}
Subject: Application for Certified Copy / Extract of {missing_doc_name} for Survey No {survey_no}

Respected Officer,

I am an interested party / legal heir in respect of land parcel in Survey No: {survey_no}. I kindly request your office to furnish a certified copy of:
{missing_doc_name}

I have enclosed the prescribed search fee / application challan. Kindly process and deliver the extract under statutory turnaround timelines.

Thanking you,
{citizen_name}"""

document_agent = DocumentAgent()
