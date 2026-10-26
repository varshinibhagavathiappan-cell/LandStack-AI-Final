import os
import re
import json
import io
from typing import Dict, Any, Optional
from datetime import datetime

class DocumentIntelligenceService:
    def __init__(self, demo_data_path: Optional[str] = None):
        self.demo_data_path = demo_data_path or os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "demo_data", "sample_documents.json"))
        self.sample_docs: Dict[str, Any] = {}
        self._load_samples()

    def _load_samples(self):
        if os.path.exists(self.demo_data_path):
            with open(self.demo_data_path, "r", encoding="utf-8") as f:
                self.sample_docs = json.load(f)

    def classify_document(self, filename: str, text_content: str) -> str:
        text = (filename + " " + text_content).lower()
        if "death" in text or "இறப்பு" in text:
            return "DEATH_CERTIFICATE"
        if "heir" in text or "varisu" in text or "வாரிசு" in text or "legal heir" in text:
            return "LEGAL_HEIR_CERTIFICATE"
        if "adangal" in text or "அடங்கல்" in text or "adangal extract" in text:
            return "ADANGAL"
        if "patta" in text or "பட்டா" in text:
            return "EXISTING_PATTA"
        if "chitta" in text or "சிட்டா" in text:
            return "CHITTA"
        if "fmb" in text or "புல வரைபடம்" in text or "re-measurement" in text or "rectification" in text:
            return "FMB_SKETCH"
        if "encumbrance" in text or re.search(r"\bec\b", text) or "வில்லங்கம்" in text:
            return "ENCUMBRANCE_CERTIFICATE"
        if "sale" in text or "settlement" in text or "கிரையம்" in text or "deed" in text:
            return "TITLE_DEED"
        return "GENERAL_LAND_RECORD"

    def extract_fields_from_text(self, text: str, doc_type: str) -> Dict[str, Any]:
        fields: Dict[str, Any] = {"document_type": doc_type, "extraction_timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"), "source_label": "AI-assisted OCR/text extraction"}
        survey_match = re.search(r'(?:survey(?:\s*(?:no|number))?|சர்வே(?:\s*எண்)?|s\.\s*no|sy\.\s*no)[\s\:\.\#-]*([0-9]{1,6}(?:\/[0-9a-zA-Z-]+)?)', text, re.IGNORECASE)
        if survey_match: fields["survey_number"] = survey_match.group(1).strip()
        sub_match = re.search(r'(?:sub[- ]?division|subdivision|hissa|ಹಿಸ್ಸಾ|உட்பிரிவு)[\s\:\.#-]*([0-9A-Za-z\/-]+)', text, re.IGNORECASE)
        if sub_match: fields["subdivision_number"] = sub_match.group(1).strip()
        patta_match = re.search(r'(?:patta(?:\s*(?:no|number))?|பட்டா(?:\s*எண்)?)[\s\:\.#-]*([0-9A-Za-z\/-]+)', text, re.IGNORECASE)
        if patta_match: fields["patta_number"] = patta_match.group(1).strip()
        crop_match = re.search(r'(?:crop|விளைச்சல்|பயிர்)[\s\:\.#-]*([A-Za-z][A-Za-z \-/]{2,50})', text, re.IGNORECASE)
        if crop_match: fields["crop"] = crop_match.group(1).strip()
        year_match = re.search(r'(?:year|season|ஆண்டு|பருவம்)[\s\:\.#-]*(20[0-9]{2})', text, re.IGNORECASE)
        if year_match: fields["record_year"] = year_match.group(1)
        acre_match = re.search(r'([0-9]+(?:\.[0-9]+)?)\s*(?:acres?|ஏக்கர்)', text, re.IGNORECASE)
        cent_match = re.search(r'([0-9]+(?:\.[0-9]+)?)\s*(?:cents?|சென்ட்)', text, re.IGNORECASE)
        hectare_match = re.search(r'([0-9]+(?:\.[0-9]+)?)\s*(?:hectares?|ஹெக்டேர்)', text, re.IGNORECASE)
        total_acres = 0.0
        if acre_match: total_acres += float(acre_match.group(1))
        if cent_match: total_acres += float(cent_match.group(1)) / 100.0
        if hectare_match and not acre_match: total_acres = round(float(hectare_match.group(1)) * 2.47105, 2)
        if total_acres > 0: fields["area_acres"] = round(total_acres, 2); fields["area_formatted"] = f"{fields['area_acres']} Acres"
        # Keep owner extraction conservative: only capture after explicit labels.
        owner_match = re.search(r'(?:owner|purchaser|pattadar|recorded owner|name|பெயர்|உரிமையாளர்|ಯಜಮಾನ|ಮಾಲೀಕರು)[\s\:\.\#-]*([^\n\r]{2,80})', text, re.IGNORECASE)
        if owner_match: fields["recorded_owner"] = owner_match.group(1).strip()
        dist_match = re.search(r'(?:district|மாவட்டம்|ಜಿಲ್ಲೆ)[\s\:\.\#-]*([^\n\r]{2,60})', text, re.IGNORECASE)
        if dist_match: fields["district"] = dist_match.group(1).strip()
        taluk_match = re.search(r'(?:taluk|வட்டம்|ತಾಲೂಕು)[\s\:\.\#-]*([^\n\r]{2,60})', text, re.IGNORECASE)
        if taluk_match: fields["taluk"] = taluk_match.group(1).strip()
        # Extract explicitly listed legal heirs from certificates when OCR text contains a numbered list.
        if doc_type == "LEGAL_HEIR_CERTIFICATE":
            heirs = []
            for m in re.finditer(r"(?:^|\n)\s*(?:[1-9]\.|[-•])\s*([A-Za-z][A-Za-z .]+?)\s*\(([^\)]+)\)", text):
                name = m.group(1).strip()
                rel = m.group(2).split(',')[0].strip()
                if name and len(name) > 2:
                    heirs.append({"name": name, "relation": rel})
            if heirs: fields["heirs"] = heirs

        # Deterministic completeness audit. This does NOT infer missing values; it only
        # reports fields that were not reliably extracted from the uploaded document.
        expected = {
            "TITLE_DEED": ["recorded_owner", "survey_number", "area_acres", "document_number"],
            "EXISTING_PATTA": ["recorded_owner", "survey_number", "area_acres", "patta_number", "district", "taluk"],
            "CHITTA": ["recorded_owner", "survey_number", "area_acres", "district", "taluk"],
            "ADANGAL": ["survey_number", "crop", "record_year", "district", "taluk"],
            "FMB_SKETCH": ["survey_number", "area_acres", "district", "taluk"],
            "ENCUMBRANCE_CERTIFICATE": ["survey_number", "district", "taluk"],
            "DEATH_CERTIFICATE": ["recorded_owner"],
            "LEGAL_HEIR_CERTIFICATE": ["heirs"],
            "GENERAL_LAND_RECORD": ["survey_number", "recorded_owner", "district", "taluk"],
        }.get(doc_type, ["survey_number", "recorded_owner", "district", "taluk"])
        missing = [f for f in expected if fields.get(f) in (None, "", [], {})]
        fields["completeness_status"] = "COMPLETE_FOR_EXTRACTED_CHECKS" if not missing else "MISSING_OR_UNREADABLE_FIELDS"
        fields["missing_fields"] = missing
        fields["present_fields"] = [f for f in expected if f not in missing]
        fields["analysis_note"] = "Missing means not reliably extracted from this upload; it does not prove the original document lacks the field."
        return fields

    def _extract_content(self, filename: str, file_bytes: Optional[bytes], text_content: Optional[str]) -> str:
        if text_content:
            return text_content
        if not file_bytes:
            return ""
        lower = filename.lower()
        if lower.endswith((".txt", ".csv", ".json")):
            return file_bytes.decode("utf-8", errors="ignore")
        try:
            if lower.endswith(".pdf"):
                from pypdf import PdfReader
                reader = PdfReader(io.BytesIO(file_bytes))
                text = "\n".join((page.extract_text() or "") for page in reader.pages)
                if text.strip(): return text
                # OCR scanned PDFs page-by-page when text layer is absent.
                try:
                    import pdf2image, pytesseract
                    images = pdf2image.convert_from_bytes(file_bytes, first_page=1, last_page=min(len(reader.pages), 5), dpi=180)
                    return "\n".join(pytesseract.image_to_string(img, lang="eng+tam+kan") for img in images)
                except Exception:
                    return ""
            if lower.endswith((".png", ".jpg", ".jpeg", ".webp")):
                from PIL import Image
                import pytesseract
                return pytesseract.image_to_string(Image.open(io.BytesIO(file_bytes)), lang="eng+tam+kan")
        except Exception:
            return ""
        return file_bytes.decode("utf-8", errors="ignore")

    def process_document(self, filename: str, file_bytes: Optional[bytes] = None, text_content: Optional[str] = None, use_demo_samples: bool = False) -> Dict[str, Any]:
        # Synthetic sample matching is ONLY permitted from explicit Demo Mode.
        if use_demo_samples:
            for _, demo_doc in self.sample_docs.items():
                if demo_doc.get("filename", "").lower() in filename.lower() or filename.lower() in demo_doc.get("filename", "").lower():
                    return {"document_type": demo_doc["document_type"], "title": demo_doc["title"], "extracted_fields": demo_doc["extracted_fields"], "raw_text": demo_doc["raw_text"], "confidence": 0.96, "status": "AVAILABLE", "label": "AI-assisted extraction (Demo Synthetic)"}
        content = self._extract_content(filename, file_bytes, text_content)
        doc_type = self.classify_document(filename, content)
        extracted = self.extract_fields_from_text(content, doc_type)
        return {"document_type": doc_type, "title": filename, "extracted_fields": extracted, "raw_text": content[:5000] if content else "", "confidence": 0.88 if content else 0.35, "status": "AVAILABLE", "label": "AI-assisted OCR/text extraction"}

ocr_service = DocumentIntelligenceService()
