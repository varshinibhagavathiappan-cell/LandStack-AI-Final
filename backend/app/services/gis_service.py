from typing import Dict, Any, Optional
from backend.app.services.location_service import location_service

class LandGISService:
    """Real map-based support only. No seeded jurisdictional offices."""
    @staticmethod
    def get_jurisdictional_offices(state: str, district: str, taluk: str, village: str, latitude: Optional[float] = None, longitude: Optional[float] = None) -> Dict[str, Any]:
        if latitude is None or longitude is None:
            return {"verified": False, "message": "A verified/current location is required before nearby offices can be identified.", "state": state, "district": district, "taluk": taluk, "village": village, "results": []}
        result = location_service.nearby(latitude, longitude, "government")
        result["location"] = {"state": state, "district": district, "taluk": taluk, "village": village}
        result["note"] = "Map-listed government places are not automatically proof of jurisdiction. Confirm the responsible authority from the official state service."
        return result

gis_service = LandGISService()
