# LandStack AI — Correction Notes

This copy is a targeted correction of the existing prototype. The original ZIP should be kept as the rollback backup.

## Corrected
- Added a real New Case flow that starts with an empty case instead of cloning demo data.
- Added an adaptive-question answer endpoint and UI that waits for a real answer before marking a question answered.
- Removed seeded answers from adaptive questions.
- Added browser Web Speech API voice-input handling on Home and Assistant pages, with unsupported-browser messaging.
- Changed the application default language to English so Tamil is not forced automatically.
- Removed invented Property Passport fallback data for empty cases.
- Made empty Evidence state return empty graph/passport data rather than fabricated land details.
- Made Property Passport UI evidence-driven and safe when evidence is missing.
- Prevented Family Room from showing synthetic family members in a new case.
- Hid demo document simulators outside Demo Mode.
- Made Registry office/seller-question lookups use current case data instead of hard-coded parcel data.
- Removed the “zero hallucination guarantee” wording and non-official glossary URL presentation.
- Preserved the existing Demo Mode and synthetic judging scenario.
- Preserved React + Vite, FastAPI, RAG, and the four logical agents.

## Validation
- Python backend source compiles successfully.
- Direct backend checks passed for empty New Case, chat intent creation, unanswered adaptive questions, recording an answer, Demo Mode, and demo inconsistency loading.
- Frontend production build could not be completed in this environment because the supplied `node_modules` is missing native optional bindings for Vite/Rolldown/Oxlint. This is an environment/dependency issue, not a source-code build result. Run `npm install` in the frontend directory on the normal development machine before `npm run dev` or `npm run build`.

## Important
This correction does not claim that every one of the 40 product capabilities is fully production-integrated with external government systems. Live government integrations remain dependent on authorized APIs/verified services.
