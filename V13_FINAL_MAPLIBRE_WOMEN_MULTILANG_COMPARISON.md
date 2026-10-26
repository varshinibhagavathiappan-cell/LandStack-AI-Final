# LandStack AI V13 — MapLibre + Women's Support + Multilingual/Voice/Comparison

## Added in V13
- MapLibre GL JS v6 integration in the existing React/Vite map screen.
- OpenFreeMap Liberty style for map rendering; real nearby place data remains supplied by the existing OSM/Overpass backend.
- MapLibre land marker plus real returned bank/lawyer/government markers.
- MapLibre Vite worker configuration using the official v6 ESM worker pattern.
- Dedicated Women's Land Support screen that extends the existing Groq case rather than creating a second chatbot.
- Dedicated cross-document comparison endpoint and UI for extracted fields across uploaded records.
- Existing automatic state inference from selected land location is preserved: land location state drives the workflow, not phone location.
- Existing browser voice input is preserved for English/Tamil/Kannada and continues to feed the same AI chat flow.
- Existing English/Tamil/Kannada i18n infrastructure is preserved and the new Women's module/MapLibre UI includes localized labels.

## Preserved
- Existing Groq AI/orchestrator.
- New empty case logic.
- OCR/document classification and evidence graph.
- Real OSM/Nominatim/Overpass location services.
- Bank/lawyer/government-office search and user-provided lawyer directory.
- Registry, RAG, case plan, passport, family room, notifications, LandGuard and case-file routes.

## Important verification status
- Backend Python compile check: PASS.
- MapLibre package installation/build in the model environment: NOT COMPLETED because external npm registry access timed out. The project pins `maplibre-gl` to `^6.13.0`; run `npm install` on the user's machine before `npm run build`.
- Live Overpass/Nominatim: requires user-machine/network verification.
- Government portal availability: external and not guaranteed.
- OCR quality on arbitrary scans: input-quality dependent.
- Full end-to-end browser verification: REQUIRES MANUAL VERIFICATION.

No feature is claimed to be 100% guaranteed against external-service outages or incomplete third-party data.
