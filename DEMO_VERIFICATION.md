# LOTUS Verification Checklist

Last updated: 2026-07-03

This checklist reflects the current local-first builder milestone.

## Code-Level Verification

- `npm run build`
- `npm run test:run`
- landing route sends `App Builder` traffic to the dedicated builder deploy
- builder uses local runtime discovery from `src/lib/ai/localModels.ts`
- active local builder path is reduced to `Qwen Coder`
- preview sanitization strips markdown fences before rendering
- preview HTML can be exported from the builder UI
- project backup exports a dated JSON file
- chat result state is replaced with continued build guidance and next-step suggestions

## Browser Verification

Run against local dev or live builder deploy.

1. Open the public landing page.
2. Open the menu.
3. Click `App Builder`.
4. Confirm the browser lands on the builder deploy, not a blank page.
5. Submit a prompt such as `Build a luxury skincare app landing flow with a product hero and testimonials.`
6. Confirm the builder switches to Preview and streams a live state.
7. Confirm the preview finishes with rendered HTML.
8. Inspect the iframe body and confirm HTML is present.
9. Confirm generated visuals can include inline SVG.
10. Confirm the assistant shows next-step suggestions instead of stopping at `Result`.
11. Confirm `Keep Building in Preview` works.
12. Confirm the chat bar is still usable while on the Preview screen.
13. Confirm `Export HTML` downloads a dated file.
14. Confirm `Rebuild` reruns the last prompt.

## Reality Check

What is verified today:

- dependable frontend HTML generation
- dependable live preview rendering
- dependable landing-to-builder routing
- dependable continuation loop after generation

What is not yet fully verified as production-complete:

- dedicated image-model generation pipeline
- native/mobile export targets beyond HTML
- stable multi-model comparison flow
- fully decomposed builder architecture
