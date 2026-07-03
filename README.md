# LOTUS App Builder

Last updated: 2026-07-03

LOTUS is currently being hardened around one dependable local frontend-builder path:

- `Qwen Coder` via Ollama for live HTML generation
- local preview rendered in an iframe
- project backup/export from the browser
- separate public landing deploy and separate builder deploy

This repo is not in a “finished product” state yet. It is in a “ship a dependable frontend milestone, then keep tuning” state.

## Current Deploys

- Public landing: [https://lotus-landing-three.vercel.app](https://lotus-landing-three.vercel.app)
- Builder-only deploy: [https://lotus-builder-studio.vercel.app](https://lotus-builder-studio.vercel.app)

The public site’s `App Builder` action routes users directly to the builder deploy.

## What Works Today

- landing page routes into the builder instead of an empty placeholder
- builder chat streams local model output into a live preview
- preview accepts generated HTML with inline SVG visuals
- builder suggests next steps instead of ending on a dead `Result` state
- preview can be rebuilt and exported as `.html`
- local project backup exports a dated `.json`
- local model flow is simplified to one active builder model: `qwen2.5-coder:1.5b`

## Local Runtime Setup

Recommended local model:

```bash
ollama pull qwen2.5-coder:1.5b
```

Start Ollama, then run the app:

```bash
npm install
npm run dev
```

Build checks:

```bash
npm run build
npm run test:run
```

## Product Direction Right Now

For this milestone, LOTUS is intentionally biased toward:

- one dependable local model instead of multiple slow ones
- frontend generation, preview, and export
- clean continuation prompts in the chat loop

Deferred until a later pass:

- API-key model providers
- broader model picker expansion
- production-grade image generation pipeline separate from inline SVG/HTML visuals
- full deploy/export orchestration beyond frontend HTML output

## Known Pain Points

- the builder still mixes a lot of capability into one large `src/App.tsx`
- Supabase-backed flows are still present beside the local-first builder shell, which increases surface area
- HTML generation is solid enough for frontend iteration, but not yet a guarantee of production-ready app structure every run
- “images” currently means inline SVG/data-URL/canvas-capable visuals inside generated HTML, not a dedicated image model pipeline
- export today is dependable for HTML and project backup, not a full polished multi-target app export system

## Recommended Handoffs

- `Claude`: schema shaping, UX copy refinement, and decomposing the large builder component into smaller surfaces
- `Kimi`: fast iteration on prompt packs, continuation messaging, and alternative UI variations
- `Codex`: regression testing, deploy wiring, export hardening, and local runtime integration

## Repo Focus Areas

- `src/App.tsx`: builder shell, routing split, local preview flow
- `src/lib/ai/localModels.ts`: local runtime discovery and chat streaming
- `src/lib/builder/localHtmlPreview.ts`: prompt and HTML sanitization
- `src/state/builderStore.ts`: local-first provider/store behavior
- `vercel.json`: builder/public rewrites and local runtime CSP allowances

## Next Milestone

Stabilize the chat loop and preview export path further, then re-deploy both surfaces as a dated checkpoint.
