# LandStack AI V7 — Deployment

## Frontend (Vercel)
Set Environment Variable:
`VITE_API_BASE_URL=https://YOUR-BACKEND.onrender.com/api`
Then redeploy the Vercel project.

## Backend (Render)
Root directory: `backend`
Build command: `pip install -r requirements.txt`
Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

## Mobile flow
1. Open the Vercel HTTPS URL on phone.
2. Tap Get phone location and allow GPS.
3. Choose current location as land OR search another land location.
4. Select a specific map result.
5. Then enter the land problem.
6. Public incident/dispute scan is a discovery aid only; it cannot prove that no incident/case exists.
