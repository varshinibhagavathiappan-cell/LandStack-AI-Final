# LandStack AI V5 - Location + New Case Fix

Fixes in this version:
- New Case always returns to Home and shows an error if backend creation fails.
- Home now displays a real OpenStreetMap embedded map for the verified land location (or current location when land location is not yet set).
- Current user location and land location remain separate case fields.
- Land-location search shows multiple geocoding candidates and lets the user choose the actual place instead of silently guessing.
- Home now loads real nearby bank data from the existing OpenStreetMap/Overpass service.
- Location changes refresh the case state immediately.
- No bank, property, owner, office, or land record is fabricated.
