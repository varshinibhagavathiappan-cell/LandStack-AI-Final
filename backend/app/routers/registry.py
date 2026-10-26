from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from urllib.parse import quote_plus
from pathlib import Path
import urllib.request
import xml.etree.ElementTree as ET
from backend.app.rag.retrieval import retriever
from backend.app.services.scam_shield import scam_shield
from backend.app.services.location_service import location_service

router = APIRouter(prefix="/api", tags=["Official Registry & GIS"])

USER_LAWYERS_PATH = Path(__file__).resolve().parents[3] / "knowledge_base" / "registry" / "user_provided_lawyers.json"

def _load_user_provided_lawyers() -> List[Dict[str, Any]]:
    try:
        import json
        with open(USER_LAWYERS_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []

class UrlVerifyRequest(BaseModel):
    url: str

class CoordinatesRequest(BaseModel):
    latitude: float
    longitude: float

class GeocodeRequest(BaseModel):
    query: str
    state: Optional[str] = None

class IncidentScanRequest(BaseModel):
    latitude: float
    longitude: float
    address: str = ""

@router.get("/service-registry")
def get_service_registry(state: Optional[str] = "Tamil Nadu") -> List[Dict[str, Any]]:
    return retriever.get_verified_services_by_state(state or "Tamil Nadu")

@router.get("/lawyer-directory")
def get_lawyer_directory(state: Optional[str] = None, district: Optional[str] = None) -> Dict[str, Any]:
    """Return only explicitly user-provided lawyer directory entries.

    These entries are not merged into nearby OSM results because they do not have
    independently verified coordinates. Nearby results remain real map data only.
    """
    rows = _load_user_provided_lawyers()
    if state:
        rows = [r for r in rows if r.get("state", "").lower() == state.lower()]
    # Directory entries remain visible at state level even when the selected land
    # is in another district. They are NOT merged into nearby results and are
    # clearly labelled as directory/context records.
    enriched = []
    for row in rows:
        item = dict(row)
        if district and item.get("district"):
            item["district_relevance"] = "selected district" if item.get("district", "").lower() == district.lower() else "state directory — not a nearby result"
        else:
            item["district_relevance"] = "state directory"
        enriched.append(item)
    return {
        "source": "User-provided / public-profile directory",
        "verification_note": "Directory records are shown as contextual records only; they are not merged into nearby OSM results and do not constitute an official referral or endorsement.",
        "nearby_search_included": False,
        "results": enriched,
    }

@router.post("/scam-shield/verify")
def verify_url_scam_shield(req: UrlVerifyRequest) -> Dict[str, Any]:
    return scam_shield.verify_url(req.url)

@router.post("/location/reverse")
def reverse_location(req: CoordinatesRequest) -> Dict[str, Any]:
    return location_service.reverse_geocode(req.latitude, req.longitude)

@router.post("/location/geocode")
def geocode_location(req: GeocodeRequest) -> List[Dict[str, Any]]:
    return location_service.geocode(req.query, req.state)

@router.post("/nearby")
def nearby_support(req: CoordinatesRequest) -> Dict[str, Any]:
    return location_service.nearby_support(req.latitude, req.longitude)

@router.post("/nearby-land-areas")
def nearby_land_areas(req: CoordinatesRequest) -> Dict[str, Any]:
    return location_service.nearby_land_areas(req.latitude, req.longitude)

@router.post("/public-incident-scan")
def public_incident_scan(req: IncidentScanRequest) -> Dict[str, Any]:
    # Publicly indexed news only. This is a discovery aid, not a criminal-record or land-clearance check.
    base = req.address.strip() or f"{req.latitude:.5f}, {req.longitude:.5f}"
    queries = [
        f'"{base}" land crime',
        f'"{base}" murder',
        f'"{base}" dispute case',
        f'"{base}" encroachment',
    ]
    articles=[]
    for q in queries:
        url=f"https://news.google.com/rss/search?q={quote_plus(q)}&hl=en-IN&gl=IN&ceid=IN:en"
        try:
            req_http=urllib.request.Request(url, headers={"User-Agent":"LandStackAI/7.0"})
            with urllib.request.urlopen(req_http, timeout=8) as response:
                root=ET.fromstring(response.read())
            for item in root.findall('./channel/item')[:5]:
                title=(item.findtext('title') or '').strip()
                link=(item.findtext('link') or '').strip()
                pub=(item.findtext('pubDate') or '').strip()
                if title:
                    articles.append({"query":q,"title":title,"url":link,"published":pub,"source":"Google News public RSS"})
        except Exception:
            continue
    seen=set(); unique=[]
    for a in articles:
        key=(a['title'],a['url'])
        if key not in seen:
            seen.add(key); unique.append(a)
    return {
        "location":{"latitude":req.latitude,"longitude":req.longitude,"address":req.address},
        "results":unique[:15],
        "official_case_search":"https://services.ecourts.gov.in/ecourtindia_v6/",
        "limitation":"No result does not prove that no incident, FIR, case, dispute, or other event exists. News coverage is incomplete; eCourts searches also depend on the search criteria and public availability."
    }

@router.get("/gis/offices")
def get_jurisdictional_offices(
    state: str = Query(""), district: str = Query(""), taluk: str = Query(""), village: str = Query(""),
    latitude: Optional[float] = Query(None), longitude: Optional[float] = Query(None)
) -> Dict[str, Any]:
    # Real map-listed results only. If coordinates are absent, do not fabricate an office.
    if latitude is None or longitude is None:
        return {"verified": False, "message": "A verified/current location is required before nearby offices can be identified.", "state": state, "district": district, "taluk": taluk, "village": village, "results": []}
    data = location_service.nearby(latitude, longitude, "government")
    data["location"] = {"state": state, "district": district, "taluk": taluk, "village": village}
    data["note"] = "Map-listed government places are not automatically proof of jurisdiction. Confirm the responsible authority from the official state service before visiting."
    return data

@router.get("/public-case-check")
def public_case_check() -> Dict[str, Any]:
    return {
        "available": True,
        "source": "eCourts India Services",
        "official_url": "https://services.ecourts.gov.in/ecourtindia_v6/",
        "supported_searches": ["CNR", "party name", "case number", "filing number", "advocate name", "FIR number", "act", "case type"],
        "limitation": "LandStack does not claim that a property has no dispute merely because a public search returns no matching result. Captcha and search criteria remain with the official portal."
    }

@router.get("/state-context")
def state_context(state: str = Query("")) -> Dict[str, Any]:
    if state not in {"Tamil Nadu", "Karnataka"}:
        return {"state": "", "supported": False, "message": "Land location must resolve to Tamil Nadu or Karnataka before a state workflow is activated."}
    if state == "Tamil Nadu":
        return {"state": state, "workflow": "TAMIL_NADU", "record_families": ["Patta", "Chitta", "Adangal", "FMB", "EC / Registration records"], "service_knowledge": "Tamil Nadu state-aware RAG"}
    return {"state": state, "workflow": "KARNATAKA", "record_families": ["RTC / Pahani", "Mutation", "EC", "Survey / Atlas / PT Sheet", "Bhoomi / Kaveri", "e-Swathu / e-Aasthi / Khata where applicable"], "service_knowledge": "Karnataka state-aware RAG"}
