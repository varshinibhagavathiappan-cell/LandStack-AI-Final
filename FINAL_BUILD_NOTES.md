# LandStack AI — Final Build Foundation

This version uses the V8 Guided Land Journey as its baseline and adds the production-oriented integration foundation.

## Added
- Gemini REST integration kept server-side (`GEMINI_API_KEY`).
- AI replies are grounded in current case context + RAG results and explicitly prohibited from inventing land/legal facts.
- English + Tamil + Kannada language selector; browser speech recognition uses en-IN / ta-IN / kn-IN.
- Google Maps browser component when `VITE_GOOGLE_MAPS_API_KEY` is configured, with OpenStreetMap fallback.
- Google Geocoding and Google Places backend adapters when `GOOGLE_MAPS_API_KEY` is configured, with transparent OSM fallback.
- Land Intelligence API that builds an evidence-first investigation summary and official-source registry.
- Separate server and frontend environment templates.
- `.gitignore` protects real secrets, databases and generated files.
- Demo data remains isolated behind explicit Demo Mode routes.

## Real-data boundary
Location and place APIs do not prove ownership, cadastral boundaries, deaths, encumbrances or court outcomes. LandStack only labels a fact as verified when an authoritative connected source actually returns matching evidence. Otherwise it reports that verification is required or the source is unavailable.

## Required local configuration
Backend `.env`:
- GEMINI_API_KEY
- GOOGLE_MAPS_API_KEY (optional if using OSM fallback)

Frontend `.env`:
- VITE_API_BASE_URL
- VITE_GOOGLE_MAPS_API_KEY

Never commit real keys to GitHub.
