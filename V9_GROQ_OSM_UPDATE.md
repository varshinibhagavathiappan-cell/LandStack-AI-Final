# LandStack AI — Groq + OpenStreetMap Update

## What changed

### AI
- Groq is now the primary AI provider.
- Backend uses the Groq OpenAI-compatible Chat Completions endpoint.
- Default model: `openai/gpt-oss-20b` (override with `GROQ_MODEL`).
- The API key is server-side only: `GROQ_API_KEY`.
- Existing Gemini integration remains as a fallback if Groq is unavailable.
- Existing case conversation history is still passed into the AI context so the assistant continues the same case instead of restarting.

### Location and maps
- OpenStreetMap Nominatim is now the primary reverse-geocoder and location search provider.
- Overpass is now the primary nearby-place provider.
- Multiple Overpass endpoints are tried if the first endpoint fails.
- Nearby search progressively expands: 1 km -> 3 km -> 5 km -> 10 km.
- Banks use real OSM `amenity=bank` objects.
- Legal professionals use real OSM `office=lawyer` objects.
- Government search uses real OSM government/administrative offices and town halls.
- Results are sorted by actual haversine distance from the selected land coordinates.
- No dummy/fabricated nearby businesses are generated.
- The map UI is now OpenStreetMap-first and does not require a Google Maps browser key.

## Environment setup

Create `backend/.env` or copy the root `.env.example` values into the environment used by the backend.

Required for Groq AI:

```env
GROQ_API_KEY=YOUR_GROQ_API_KEY
GROQ_MODEL=openai/gpt-oss-20b
GROQ_BASE_URL=https://api.groq.com/openai/v1
```

OpenStreetMap requires no API key in this prototype. The backend sends an identifying User-Agent and keeps Nominatim requests user-triggered/rate-limited.

Optional fallback:

```env
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
GOOGLE_MAPS_API_KEY=
```

Do not put `GROQ_API_KEY`, `GEMINI_API_KEY`, or server-side Google keys in frontend code.

## Run

From the project root:

```powershell
# Terminal 1
.\backend\venv\Scripts\Activate.ps1
python -m uvicorn backend.app.main:app --reload
```

```powershell
# Terminal 2
cd frontend
npm install
npm run dev
```

## Important real-data behavior

A real OSM source cannot guarantee a bank at every arbitrary coordinate. The app therefore searches progressively farther while staying geographically relevant. If no mapped bank is returned, it reports that honestly instead of inventing one.

## Validation status

- Backend Python compilation: PASS.
- Backend import: PASS.
- Groq integration: implemented; requires the user's own `GROQ_API_KEY` to exercise live inference.
- OSM/Nominatim/Overpass integration: implemented; live provider calls require network access from the machine running the backend.
- Frontend production build: NOT RUN in the build environment because `npm ci` timed out. Run `npm install` and `npm run build` on the local machine before final deployment.
