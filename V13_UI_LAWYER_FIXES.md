# V13 UI / Lawyer Fixes

Targeted fixes only; core AI, document, evidence, map/nearby logic are preserved.

- Full static UI language-switch layer for English / Tamil / Kannada.
- Case language is synchronized with the backend without resetting the case.
- New Case forces a fresh component tree and uses no-store case fetches.
- Demo controls are shown only when the active case is explicitly demo mode.
- Women Support has an explicit Home shortcut and remains part of the existing AI case.
- Tamil Nadu lawyer: K. Karuppaiah — user-provided business-card record, not official verification.
- Karnataka lawyer: Rashmi Deshpande — public professional profile from K Law, not a LandStack referral or endorsement.
- Directory lawyer records are never merged into nearby real-data results.
- MapLibre popup labels follow the selected UI language.

Validation performed here:
- Python backend compile check: PASS.
- New-case API: PASS; returns empty non-demo case with zero uploaded documents/evidence nodes.
- Case-language API: PASS.
- Frontend dependency installation/build was not run in this environment because npm registry access was unavailable here; run `npm install` and `npm run build` locally after extraction.
