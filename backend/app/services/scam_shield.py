from typing import Dict, Any
from urllib.parse import urlparse

class ScamShieldService:
    OFFICIAL_DOMAINS = [
        "eservices.tn.gov.in",
        "tnreginet.gov.in",
        "tnesevai.tn.gov.in",
        "landrecords.karnataka.gov.in",
        "dharani.telangana.gov.in",
        "upbhulekh.gov.in",
        "bhulekh.ori.nic.in",
        "digitalindia.gov.in"
    ]

    @classmethod
    def verify_url(cls, url: str) -> Dict[str, Any]:
        """
        Validates if a given URL belongs to a verified official government domain.
        Prevents citizens from falling victim to clone phishing sites or fee gouging agents.
        """
        if not url:
            return {"status": "EMPTY", "is_official": False, "message": "No URL provided."}

        try:
            parsed = urlparse(url)
            domain = parsed.netloc.lower()
            # remove port if present
            domain = domain.split(":")[0]

            for official in cls.OFFICIAL_DOMAINS:
                if domain == official or domain.endswith("." + official):
                    return {
                        "status": "VERIFIED_OFFICIAL",
                        "is_official": True,
                        "domain": domain,
                        "shield_level": "SECURE_OFFICIAL_GOVERNMENT_PORTAL",
                        "message": f"This is an official government domain ({domain}). Safe to access.",
                        "badge": "OFFICIAL VERIFIED"
                    }

            # Check if it has gov.in or nic.in
            if domain.endswith(".gov.in") or domain.endswith(".nic.in"):
                return {
                    "status": "OFFICIAL_GOV_IN",
                    "is_official": True,
                    "domain": domain,
                    "shield_level": "GOVERNMENT_NETWORK",
                    "message": f"Recognized government network domain ({domain}).",
                    "badge": "GOVERNMENT NETWORK"
                }

            return {
                "status": "UNVERIFIED_THIRD_PARTY",
                "is_official": False,
                "domain": domain,
                "shield_level": "CAUTION_REQUIRED",
                "message": f"WARNING: '{domain}' is NOT a verified official government portal. It may be a private service agent or third-party fee site. Never enter OTPs or upload unredacted Aadhaar on unverified websites.",
                "badge": "UNVERIFIED THIRD-PARTY"
            }
        except Exception as e:
            return {"status": "INVALID", "is_official": False, "message": f"Invalid URL format: {str(e)}"}

scam_shield = ScamShieldService()
