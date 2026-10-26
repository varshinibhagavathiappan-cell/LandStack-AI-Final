import re
from typing import Dict, Any, List, Tuple

class DeterministicComparisonEngine:
    @staticmethod
    def normalize_name(name: str) -> str:
        """Normalizes Indian names for initial differences and spacing."""
        if not name:
            return ""
        name = name.lower().strip()
        # Remove dots and extra whitespace
        name = re.sub(r'[\.\,\s]+', ' ', name).strip()
        tokens = set(name.split())
        return " ".join(sorted(tokens))

    @staticmethod
    def compare_names(name1: str, name2: str) -> Dict[str, Any]:
        """Deterministic comparison of names."""
        norm1 = DeterministicComparisonEngine.normalize_name(name1)
        norm2 = DeterministicComparisonEngine.normalize_name(name2)

        if norm1 == norm2:
            return {"match": True, "confidence": 1.0, "reason": "Exact normalized name match"}

        # Token overlap check (e.g., K Ramanathan vs Ramanathan)
        tokens1 = set(norm1.split())
        tokens2 = set(norm2.split())
        overlap = tokens1.intersection(tokens2)

        if len(overlap) > 0:
            return {"match": True, "confidence": 0.85, "reason": "Partial token overlap with initials"}

        return {"match": False, "confidence": 0.2, "reason": "Name mismatch between records"}

    @staticmethod
    def compare_survey_numbers(s1: str, s2: str) -> Dict[str, Any]:
        """Deterministic comparison of survey and sub-division numbers."""
        if not s1 or not s2:
            return {"match": False, "confidence": 0.0, "reason": "Missing survey number"}

        clean1 = re.sub(r'[^0-9a-zA-Z\/]', '', s1).upper()
        clean2 = re.sub(r'[^0-9a-zA-Z\/]', '', s2).upper()

        if clean1 == clean2:
            return {"match": True, "confidence": 1.0, "reason": "Exact survey number match"}

        # Compare base survey number before '/'
        base1 = clean1.split('/')[0] if '/' in clean1 else clean1
        base2 = clean2.split('/')[0] if '/' in clean2 else clean2

        if base1 == base2:
            return {"match": False, "subdivision_discrepancy": True, "confidence": 0.6,
                    "reason": f"Same main survey ({base1}) but differing sub-division ({clean1} vs {clean2})"}

        return {"match": False, "confidence": 0.0, "reason": "Survey numbers differ entirely"}

    @staticmethod
    def compare_areas(deed_area: float, patta_area: float, tolerance_acres: float = 0.02) -> Dict[str, Any]:
        """
        Deterministic comparison of land extent in acres.
        Safety guard: Strictly outputs 'POTENTIAL INCONSISTENCY', never 'Fraud'.
        """
        diff = round(patta_area - deed_area, 3)
        abs_diff = abs(diff)

        if abs_diff <= tolerance_acres:
            return {
                "status": "CONSISTENT",
                "diff_acres": 0.0,
                "message": "Land area matches between registered deed and revenue patta.",
                "requires_review": False
            }
        elif diff < 0:
            return {
                "status": "POTENTIAL_INCONSISTENCY",
                "diff_acres": diff,
                "shortage_acres": abs_diff,
                "percentage_diff": round((abs_diff / deed_area) * 100, 1),
                "message": f"POTENTIAL INCONSISTENCY: Revenue record (Patta) reflects {patta_area:.2f} acres, which is {abs_diff:.2f} acres less than the Title Deed ({deed_area:.2f} acres). Additional verification required.",
                "requires_review": True,
                "severity": "HIGH"
            }
        else:
            return {
                "status": "POTENTIAL_INCONSISTENCY",
                "diff_acres": diff,
                "excess_acres": diff,
                "percentage_diff": round((diff / deed_area) * 100, 1),
                "message": f"POTENTIAL INCONSISTENCY: Revenue record (Patta) reflects {patta_area:.2f} acres, which is {diff:.2f} acres more than the Title Deed ({deed_area:.2f} acres). Additional boundary review required.",
                "requires_review": True,
                "severity": "MEDIUM"
            }

    @staticmethod
    def compare_seller_story(seller_claim: Dict[str, Any], verified_evidence: Dict[str, Any]) -> Dict[str, Any]:
        """
        Compares statements made by a seller with documentary evidence.
        Never labels seller fraudulent; frames neutrally as verification gaps.
        """
        discrepancies = []
        status = "CONSISTENT"

        # 1. Area check
        seller_area = seller_claim.get("area_acres")
        doc_area = verified_evidence.get("area_acres")
        if seller_area and doc_area:
            diff = round(float(seller_area) - float(doc_area), 3)
            if abs(diff) > 0.02:
                discrepancies.append({
                    "aspect": "Land Extent",
                    "seller_stated": f"{seller_area} Acres",
                    "document_verified": f"{doc_area} Acres",
                    "discrepancy": f"{diff:+.2f} Acres difference",
                    "recommendation": "Request official FMB sketch and physical total-station survey before entering sale agreement."
                })
                status = "Potential mismatch requiring verification"

        # 2. Owner check
        seller_name = seller_claim.get("seller_name")
        doc_owner = verified_evidence.get("recorded_owner")
        if seller_name and doc_owner:
            name_res = DeterministicComparisonEngine.compare_names(seller_name, doc_owner)
            if not name_res["match"]:
                discrepancies.append({
                    "aspect": "Title Holder Identity",
                    "seller_stated": seller_name,
                    "document_verified": doc_owner,
                    "discrepancy": "Seller name is not the sole title holder in the current revenue Patta.",
                    "recommendation": "Obtain parent chain of title or legal heir succession documents linking seller to recorded owner."
                })
                status = "Potential mismatch requiring verification"

        # 3. Encumbrance check
        seller_encumbrance = seller_claim.get("is_free_from_encumbrance", True)
        has_charges = verified_evidence.get("has_mortgage_or_attachment", False)
        if seller_encumbrance and has_charges:
            discrepancies.append({
                "aspect": "Encumbrance Status",
                "seller_stated": "Stated as clear title / zero debt",
                "document_verified": "Encumbrance Certificate reveals open transaction / charge entry",
                "discrepancy": "Sub-Registrar record indicates registered charge requiring formal receipt of discharge.",
                "recommendation": "Ask seller for formal Bank Discharge Receipt and Form 15 certified copy."
            })
            status = "Potential mismatch requiring verification"

        return {
            "status_label": status,
            "discrepancies": discrepancies,
            "has_mismatches": len(discrepancies) > 0,
            "neutral_disclaimer": "AI-assisted comparison based strictly on submitted materials. This is an advisory gap analysis, not a judicial finding."
        }
