# LandStack AI V3 — Real-Flow Correction Notes

## What was corrected
- Fresh backend startup now begins with an empty New User Case, not the synthetic demo.
- Demo Mode remains available only through the explicit Demo Controls.
- Added Tamil, English and Telugu as supported UI/case languages.
- Added Tamil-script, Telugu-script, Tanglish and Romanized-Telugu language detection.
- Language detected from the user's request is passed back to the UI so the header/UI can switch.
- Adaptive questions now begin with the citizen's name and are generated from the detected request.
- The UI displays only answered questions plus the current question; future questions are not dumped as if they are active.
- Question answers are stored in case state and the next question remains locked until the previous answer is supplied.
- Added intents for land purchase, inheritance transfer, Patta transfer, boundary/area issues, document explanation and land-record search.
- Next-best actions are intent-specific instead of always referring to a deceased father's land.
- Document uploads no longer match synthetic sample files unless an explicit Demo Mode path calls `use_demo_samples=True`.
- PDF text extraction and OCR for PDF/image uploads are supported; OCR uses English + Tamil + Telugu models when available.
- Document explanations are generic and evidence-driven rather than hard-coded to the demo family.
- Property Passport is generated only from uploaded evidence and does not manufacture a CLEAN/95% status for a new case.
- Evidence Graph labels and comparisons derive from extracted fields where possible.
- Family Room starts empty for a new case; family members can be added explicitly or derived from a Legal Heir Certificate when names are extracted.
- Added a basic case/evidence-based family tree view.
- Official service links are sourced from the verified registry/procedure knowledge base rather than invented in UI code.
- Registry state follows the case state where supplied.
- Generic English questions no longer get misclassified as Tamil just because they contain words such as “land” or “document”.

## Important limitation
The frontend package dependencies could not be fully installed in the build environment because the environment could not download the Vite package. Backend source was compile-tested and the main case/intent/adaptive flows were exercised through the FastAPI API.

## Demo vs real user
Synthetic data remains intentionally available for the judging Demo Mode. It is not the starting state of a New User Case and should be visibly labelled as synthetic/demo data.
