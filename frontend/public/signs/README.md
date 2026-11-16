# Indian Sign Language Video Assets

Place your `.mp4` video clips in this directory (`frontend/public/signs/`).

## Naming Conventions
* **Word Signs:** Named in UPPERCASE matching the ISL gloss token (e.g. `PLEASE.mp4`, `ID_CARD.mp4`, `OFFICE.mp4`, `ADMISSION.mp4`, `BRING.mp4`, `FIRST.mp4`, `FLOOR.mp4`, `WHERE.mp4`, `HELLO.mp4`, `THANK_YOU.mp4`).
* **Fingerspelling Signs (Letters & Digits):** Named as single characters (e.g. `A.mp4` through `Z.mp4`, `0.mp4` through `9.mp4`).

## Fallback Behavior
The `SignPlayer` component automatically detects if an `.mp4` file is not yet present and seamlessly switches to the **Animated Gesture Simulator** displaying the sign name, gestural cues, and animated timing bar.
