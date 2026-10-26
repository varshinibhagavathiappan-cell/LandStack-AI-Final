# Firebase email-verification setup for LandStack AI

This project uses Firebase Authentication's Identity Toolkit REST API from the React/Vite frontend, so no additional npm package is required for the login flow.

## Firebase Console
1. Open Firebase Console and select `landstack-ai-8fd6a`.
2. Authentication -> Sign-in method: enable Email/Password.
3. Authentication -> Settings -> Authorized domains: ensure `localhost` is present for local development. Add your production domain before deployment.
4. Authentication -> Templates: review the Email address verification template and sender settings.

## Frontend environment
Keep your existing environment variables. Add this line to `frontend/.env` (do not replace the file):
```
VITE_FIREBASE_API_KEY=PASTE_THE_API_KEY_FROM_FIREBASE_WEB_APP_CONFIG_HERE
```
The web API key is client configuration, not a service-account secret. Never place service-account JSON/private keys in the frontend. Restrict the key where applicable and use Firebase security settings.

Restart the Vite dev server after editing `frontend/.env`.

## Current behavior
- Home, Map, and Registry remain publicly accessible.
- Selecting protected tabs opens the sign-in screen.
- Registration sends a real Firebase email-verification message.
- Sign-in checks Firebase's `emailVerified` field before allowing the protected UI.
- Password reset and verification-email resend are included.

## Important production security note
This change gates protected features in the frontend. That is not a substitute for backend authorization: FastAPI endpoints must independently verify Firebase ID tokens and enforce authorization before this is production-ready. Do not expose private data or rely on frontend gating alone. Backend token verification has not been enabled in this patch because no service-account/ADC configuration was included in the uploaded ZIP; configure and test it before deploying with sensitive data.
