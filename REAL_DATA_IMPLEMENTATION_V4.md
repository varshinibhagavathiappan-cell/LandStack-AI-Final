# LandStack AI — Real-Data Implementation V4

This build modifies the existing V3 project; it does not replace it.

## Implemented
- Real-case isolation from demo data remains enforced.
- New real cases start empty with no seeded people, properties, documents, evidence, family graph or office data.
- Primary UI/voice languages are Tamil (`ta-IN`) and Kannada (`kn-IN`).
- Tanglish and common romanized Kannada detection are supported heuristically; script detection is used when native script is present.
- Browser geolocation is requested at startup when available.
- User current location and land location are stored separately.
- Land location can be entered as text or selected from current coordinates.
- OpenStreetMap Nominatim is used for geocoding/reverse geocoding when network access is available.
- OpenStreetMap/Overpass is used for nearby map-listed banks, lawyers and government places.
- Nearby map-listed results are explicitly labelled as map data and are not treated as proof of government jurisdiction, professional status, ownership or legal authority.
- Tamil Nadu and Karnataka have separate state-aware requirement engines.
- Karnataka rural and urban contexts are separated.
- Karnataka requirements include RTC/Pahani, mutation, registered ownership documents, EC and survey/Atlas/PT Sheet concepts where applicable; urban contexts can use Khata/e-Aasthi/property-tax concepts.
- RAG procedure/FAQ retrieval is filtered by state to prevent Tamil Nadu guidance from leaking into Karnataka cases.
- Official service registry is restricted to the two supported states in this build.
- Actual uploaded files are persisted under `backend/uploads/` in the running project.
- Evidence provenance now uses a deterministic SHA-256 digest of the document name + upload timestamp.
- Real evidence graphs and property passports are created only when actual uploaded evidence provides sufficient property identity information.
- Hardcoded demo office data is not used for real GIS/office results.
- Follow-up chat questions use current case context instead of automatically restarting intent detection.
- Case state now includes explicit information/document/verification/recheck stages.

## External data requirements
- Browser geolocation requires user permission and HTTPS/localhost browser support.
- Nominatim and Overpass require network access and must be used within their public-service policies/rate limits.
- Public map data is not official land ownership data.
- The project does not claim direct live government API access where an authorized API is not connected.
- Government service links in the registry are intended to be official sources; users should still verify current service availability before relying on them.
- Live land ownership/history/EC/mutation records are not fabricated. If no authorized live connection exists, the UI should direct the citizen to the applicable official portal.

## Demo isolation
The existing demo controls and synthetic judging walkthrough remain available only through explicit Demo Mode. They are not copied into a New Case or normal real workflow.

## Validation
- Python backend compile: PASS.
- Real-case empty-state test: PASS.
- Tamil Nadu purchase intent/state-aware checklist test: PASS.
- Karnataka purchase intent/state-aware checklist test: PASS.
- No-document real case produces no property passport: PASS.
- Frontend production build: NOT VERIFIED in this environment because npm package download was unavailable/offline. No `node_modules` directory is packaged.
