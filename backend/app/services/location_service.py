"""OpenStreetMap-first geographic services for LandStack AI.

Primary providers:
- Nominatim for user-triggered search/reverse geocoding.
- Overpass for real nearby POIs.
- Optional Google Places/geocoding remains only as a fallback when explicitly configured.
No place, address, ownership record, or legal fact is fabricated.
"""
from __future__ import annotations

import json
import math
import os
import threading
import time
import urllib.parse
import urllib.request
from typing import Any, Dict, List, Optional

import requests

USER_AGENT = os.getenv("OSM_USER_AGENT", "LandStackAI/5.0 (citizen land decision copilot)")
NOMINATIM_BASE = os.getenv("NOMINATIM_BASE_URL", "https://nominatim.openstreetmap.org").rstrip("/")
OVERPASS_URLS = [
    u.strip().rstrip("/")
    for u in os.getenv(
        "OVERPASS_URLS",
        "https://overpass-api.de/api/interpreter,https://overpass.kumi.systems/api/interpreter",
    ).split(",")
    if u.strip()
]
_nominatim_lock = threading.Lock()
_last_nominatim_request = 0.0


def _throttle_nominatim() -> None:
    global _last_nominatim_request
    with _nominatim_lock:
        wait = 1.05 - (time.monotonic() - _last_nominatim_request)
        if wait > 0:
            time.sleep(wait)
        _last_nominatim_request = time.monotonic()


def _get_json(url: str, timeout: int = 12, params: Optional[Dict[str, Any]] = None) -> Any:
    headers = {
        "User-Agent": USER_AGENT,
        "Accept": "application/json",
        "Accept-Language": "en",
    }
    r = requests.get(url, params=params, headers=headers, timeout=timeout)
    r.raise_for_status()
    return r.json()


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return r * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _normalize_state(state: str) -> str:
    value = (state or "").strip()
    low = value.lower()
    if low == "karnataka":
        return "Karnataka"
    if "tamil" in low:
        return "Tamil Nadu"
    return value


class LocationService:
    def _google_geocode(self, lat: float, lon: float) -> Optional[Dict[str, Any]]:
        key = os.getenv("GOOGLE_MAPS_API_KEY", "").strip()
        if not key:
            return None
        try:
            r = requests.get(
                "https://maps.googleapis.com/maps/api/geocode/json",
                params={"latlng": f"{lat},{lon}", "key": key, "language": "en"},
                timeout=10,
            )
            data = r.json()
            if data.get("status") != "OK" or not data.get("results"):
                return None
            item = data["results"][0]
            address: Dict[str, str] = {}
            for c in item.get("address_components", []):
                for typ in c.get("types", []):
                    address[typ] = c.get("long_name", "")
            return {
                "verified": True,
                "source": "Google Geocoding API",
                "latitude": lat, "longitude": lon,
                "display_name": item.get("formatted_address", ""),
                "area": address.get("sublocality") or address.get("locality") or address.get("administrative_area_level_2", ""),
                "district": address.get("administrative_area_level_2", ""),
                "taluk": address.get("administrative_area_level_3", ""),
                "village": address.get("locality") or address.get("administrative_area_level_3", ""),
                "state": _normalize_state(address.get("administrative_area_level_1", "")),
                "postcode": address.get("postal_code", ""),
            }
        except Exception:
            return None

    def reverse_geocode(self, lat: float, lon: float) -> Dict[str, Any]:
        # OpenStreetMap is the primary provider for this build.
        try:
            _throttle_nominatim()
            data = _get_json(
                f"{NOMINATIM_BASE}/reverse",
                params={
                    "lat": lat, "lon": lon, "format": "jsonv2",
                    "addressdetails": 1, "zoom": 18,
                },
                timeout=15,
            )
            address = data.get("address", {})
            return {
                "verified": bool(data.get("display_name")),
                "source": "OpenStreetMap Nominatim",
                "latitude": lat, "longitude": lon,
                "display_name": data.get("display_name", ""),
                "area": address.get("suburb") or address.get("neighbourhood") or address.get("town") or address.get("city") or address.get("village", ""),
                "district": address.get("state_district") or address.get("district", ""),
                "taluk": address.get("county", ""),
                "village": address.get("village") or address.get("town") or "",
                "state": _normalize_state(address.get("state", "")),
                "postcode": address.get("postcode", ""),
            }
        except Exception as exc:
            # Optional Google fallback only if the developer configured it.
            google = self._google_geocode(lat, lon)
            if google:
                return google
            return {
                "verified": False, "source": "OpenStreetMap Nominatim",
                "error": str(exc), "latitude": lat, "longitude": lon,
            }

    def geocode(self, query: str, state: Optional[str] = None, country: str = "India") -> List[Dict[str, Any]]:
        if not query.strip():
            return []
        q = query.strip()
        if state in {"Tamil Nadu", "Karnataka"} and state.lower() not in q.lower():
            q += f", {state}"
        if country.lower() not in q.lower():
            q += f", {country}"
        try:
            _throttle_nominatim()
            data = _get_json(
                f"{NOMINATIM_BASE}/search",
                params={
                    "q": q, "format": "jsonv2", "addressdetails": 1,
                    "limit": 5, "countrycodes": "in",
                },
                timeout=15,
            )
            out = []
            for item in data:
                addr = item.get("address", {})
                out.append({
                    "display_name": item.get("display_name", ""),
                    "latitude": float(item["lat"]),
                    "longitude": float(item["lon"]),
                    "state": _normalize_state(addr.get("state", "")),
                    "district": addr.get("state_district") or addr.get("district", ""),
                    "taluk": addr.get("county", ""),
                    "village": addr.get("village") or addr.get("town") or "",
                    "type": item.get("type", ""),
                    "source": "OpenStreetMap Nominatim",
                })
            return out
        except Exception:
            return []

    @staticmethod
    def _osm_place(el: Dict[str, Any], category: str, lat: float, lon: float) -> Optional[Dict[str, Any]]:
        tags = el.get("tags", {})
        center = el.get("center", {}) or {}
        plat = el.get("lat", center.get("lat"))
        plon = el.get("lon", center.get("lon"))
        if plat is None or plon is None:
            return None
        plat, plon = float(plat), float(plon)
        name = (tags.get("name") or tags.get("brand") or tags.get("operator") or "").strip()
        if not name:
            # A real mapped object without a name is still real, but avoid presenting it as a named bank.
            name = "Unnamed map-listed place"
        address = ", ".join(
            x for x in [
                tags.get("addr:housenumber"), tags.get("addr:street"),
                tags.get("addr:suburb"), tags.get("addr:city") or tags.get("addr:town"),
                tags.get("addr:postcode"),
            ] if x
        )
        return {
            "id": f"{el.get('type','obj')}-{el.get('id')}",
            "name": name, "category": category,
            "latitude": plat, "longitude": plon,
            "distance_km": round(haversine_km(lat, lon, plat, plon), 2),
            "address": address,
            "phone": tags.get("phone") or tags.get("contact:phone"),
            "website": tags.get("website") or tags.get("contact:website"),
            "opening_hours": tags.get("opening_hours"),
            "source": "OpenStreetMap / Overpass",
            "maps_url": f"https://www.openstreetmap.org/?mlat={plat}&mlon={plon}#map=18/{plat}/{plon}",
            "verification_note": "Map-listed information; verify the institution directly before relying on it.",
        }

    def _overpass_query(self, query: str) -> List[Dict[str, Any]]:
        last_error = None
        for endpoint in OVERPASS_URLS:
            try:
                data = _get_json(endpoint, params={"data": query}, timeout=25)
                return data.get("elements", [])
            except Exception as exc:
                last_error = str(exc)
                continue
        raise RuntimeError(last_error or "No Overpass endpoint available")

    def nearby(self, lat: float, lon: float, category: str, radius_m: int = 10000) -> Dict[str, Any]:
        """Search real OSM POIs progressively and aggregate results until useful coverage is reached.

        Important: do not stop after the first tiny radius with one result. For city searches
        such as Bengaluru or Tiruchirappalli, users expect several real mapped institutions.
        Every returned result must still originate from OSM/Overpass (or an explicitly
        configured Google Places fallback) and is sorted by distance from the land location.
        """
        radii = [r for r in (1000, 3000, 5000, 10000, 25000, 40000) if r <= radius_m] or [radius_m]
        selectors = {
            "bank": [
                'nwr["amenity"="bank"]',
                'nwr["name"~"Indian Bank|Karur Vysya Bank|KVB|State Bank of India|SBI|Canara Bank|Bank of Baroda|Union Bank|Punjab National Bank|Indian Overseas Bank|IOB|Bank of India|Central Bank of India|HDFC Bank|ICICI Bank|Axis Bank|Kotak Mahindra Bank|Federal Bank|City Union Bank|Tamilnad Mercantile Bank|TMB|IDBI Bank|UCO Bank|South Indian Bank|Karnataka Bank|Bandhan Bank|IndusInd Bank|YES BANK|AU Small Finance Bank",i]'
            ],
            "lawyer": ['nwr["office"="lawyer"]', 'nwr["name"~"advocate|lawyer|legal|attorney",i]'],
        }
        attempts: List[Dict[str, Any]] = []
        errors: List[str] = []
        places_by_id: Dict[str, Dict[str, Any]] = {}
        target_count = 8 if category in {"bank", "lawyer"} else 6

        for r in radii:
            try:
                if category == "government":
                    query = f'[out:json][timeout:18];(nwr["office"~"government|administrative",i](around:{r},{lat},{lon});nwr["amenity"="townhall"](around:{r},{lat},{lon}););out center tags;'
                    elements = self._overpass_query(query)
                else:
                    combined = []
                    for selector in selectors.get(category, selectors["bank"]):
                        query = f'[out:json][timeout:18];{selector}(around:{r},{lat},{lon});out center tags;'
                        combined.extend(self._overpass_query(query))
                    elements = combined
                added = 0
                for el in elements:
                    place = self._osm_place(el, category, lat, lon)
                    if not place:
                        continue
                    if place["name"] == "Unnamed map-listed place":
                        continue
                    if place["id"] not in places_by_id:
                        places_by_id[place["id"]] = place
                        added += 1
                attempts.append({"radius_m": r, "new_count": added, "total_count": len(places_by_id)})
                if len(places_by_id) >= target_count:
                    break
            except Exception as exc:
                errors.append(f"{r}m: {str(exc)[:180]}")
                attempts.append({"radius_m": r, "new_count": 0, "total_count": len(places_by_id), "error": str(exc)[:180]})

        places = sorted(places_by_id.values(), key=lambda x: x["distance_km"])
        if places:
            return {
                "source": "OpenStreetMap / Overpass",
                "latitude": lat, "longitude": lon,
                "results": places[:10],
                "search_radius_m": max((p["distance_km"] for p in places), default=0) * 1000,
                "search_strategy": "progressive_aggregated_real_data",
                "attempts": attempts,
                "provider_note": "Real OpenStreetMap objects returned around the selected land coordinates and sorted by distance.",
            }

        # Optional Google fallback, never mixed into normal OSM results.
        google = self._google_places_nearby(lat, lon, category, radii[-1])
        if google and google.get("results"):
            google["search_strategy"] = "osm_failed_or_empty_then_google_fallback"
            google["attempts"] = attempts
            return google

        return {
            "source": "OpenStreetMap / Overpass",
            "latitude": lat, "longitude": lon, "results": [],
            "search_radius_m": radii[-1],
            "search_strategy": "progressive_aggregated_real_data",
            "attempts": attempts,
            "provider_note": "No matching real place was returned by the searched sources. No fallback place was fabricated.",
            "errors": errors,
        }

    def _google_places_nearby(self, lat: float, lon: float, category: str, radius_m: int) -> Optional[Dict[str, Any]]:
        key = os.getenv("GOOGLE_MAPS_API_KEY", "").strip()
        if not key:
            return None
        types = {"bank": ["bank"], "lawyer": ["lawyer"], "government": ["local_government_office", "government_office"]}.get(category, ["establishment"])
        try:
            r = requests.post(
                "https://places.googleapis.com/v1/places:searchNearby",
                headers={"X-Goog-Api-Key": key, "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.location,places.nationalPhoneNumber,places.websiteUri,places.googleMapsUri"},
                json={"includedTypes": types, "maxResultCount": 10, "locationRestriction": {"circle": {"center": {"latitude": lat, "longitude": lon}, "radius": float(radius_m)}}, "rankPreference": "DISTANCE"},
                timeout=15,
            )
            if not r.ok:
                return None
            places = []
            for p in r.json().get("places", []):
                loc = p.get("location", {})
                plat, plon = loc.get("latitude"), loc.get("longitude")
                if plat is None or plon is None:
                    continue
                places.append({
                    "name": (p.get("displayName") or {}).get("text", "Unnamed place"),
                    "category": category, "latitude": plat, "longitude": plon,
                    "distance_km": round(haversine_km(lat, lon, plat, plon), 2),
                    "address": p.get("formattedAddress", ""), "phone": p.get("nationalPhoneNumber"),
                    "website": p.get("websiteUri"), "maps_url": p.get("googleMapsUri"),
                    "source": "Google Places API",
                    "verification_note": "Public place listing; verify jurisdiction or professional credentials before relying on it.",
                })
            places.sort(key=lambda x: x["distance_km"])
            return {"source": "Google Places API", "latitude": lat, "longitude": lon, "results": places}
        except Exception:
            return None

    def nearby_land_areas(self, lat: float, lon: float, radius_m: int = 2500) -> Dict[str, Any]:
        query = f"[out:json][timeout:15];(way[landuse](around:{radius_m},{lat},{lon});relation[landuse](around:{radius_m},{lat},{lon}););out center tags;"
        try:
            data = self._overpass_query(f'[out:json][timeout:15];(way[landuse](around:{radius_m},{lat},{lon});relation[landuse](around:{radius_m},{lat},{lon}););out center tags;')
            areas = []
            for el in data:
                tags = el.get("tags", {})
                center = el.get("center", {}) or {}
                plat, plon = center.get("lat"), center.get("lon")
                if plat is None or plon is None:
                    continue
                areas.append({
                    "name": tags.get("name") or tags.get("landuse") or "Mapped land area",
                    "landuse": tags.get("landuse", "unknown"),
                    "latitude": float(plat), "longitude": float(plon),
                    "distance_km": round(haversine_km(lat, lon, float(plat), float(plon)), 2),
                    "source": "OpenStreetMap / Overpass",
                    "verification_note": "Map-mapped land-use area only; not a cadastral parcel, ownership record, or legal boundary.",
                })
            areas.sort(key=lambda x: x["distance_km"])
            return {"source": "OpenStreetMap / Overpass", "results": areas[:12], "note": "These are mapped land-use areas, not government land parcels."}
        except Exception as exc:
            return {"source": "OpenStreetMap / Overpass", "results": [], "error": str(exc)}

    def nearby_support(self, lat: float, lon: float) -> Dict[str, Any]:
        return {
            "bank": self.nearby(lat, lon, "bank", radius_m=40000),
            "lawyer": self.nearby(lat, lon, "lawyer", radius_m=40000),
            "government": self.nearby(lat, lon, "government", radius_m=40000),
        }


location_service = LocationService()
