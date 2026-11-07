# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project purpose
People should know, and care about, how much their data matters today. Most services bury data handling in privacy policies too long to read. This open-source Chrome extension reads a policy for the user and flags clauses that put their data at risk, so they know what they are agreeing to before signing up. Keep UI copy and docs aligned with this mission: plain language, no legalese, no fear-mongering.

## Commands
- `npm run build`: typecheck (`tsc --noEmit`) then bundle to `dist/` (load `dist/` as an unpacked extension in chrome://extensions)
- `npm run dev`: rebuild on change
- `npm test`: run Vitest once. Single test: `npx vitest run -t "<test name>"`
- `npm run typecheck`

## Architecture
Phase 1 is popup-only (no background worker, no backend). Vite root is `src/popup`; static assets and `manifest.json` come from `public/`.

- `src/core/analyzer.ts`: pipeline. Chunk the policy text, send each chunk with the rubric to the LLM, parse the JSON reply, then **verify every finding's quote appears verbatim in the policy** (`verifyFindings`) and drop the rest. This anti-hallucination step is core; never bypass it. Then score.
- `src/core/providers/index.ts`: `LlmProvider` adapters (Anthropic, OpenAI) calling the APIs directly from the browser. **BYOK:** the user's own API key lives in `chrome.storage.local` only; there is no server of ours. Adding a provider means adding a branch in `createProvider`.
- `src/core/text.ts`: HTML→text (needs a DOM), chunking, quote normalization, multilingual policy-link detection (`findPolicyLink`).
- `rubric/core.json`: the rubric, kept as data so the community can edit it without touching code. Each rule has `id`, `severity` (1-3), `description`, and `laws` (GDPR/CCPA/PIPA references). Rule ids are language-neutral; the LLM answers in the user's browser language.
- `src/popup/`: UI and wiring. Fetching a policy requests per-origin optional host permission at click time (`optional_host_permissions` in the manifest); only the Anthropic/OpenAI API hosts are in fixed `host_permissions`.

## Planned (not built yet)
Auto-detect on sign-up pages, per-jurisdiction rubric layers (GDPR/CCPA/PIPA; a Korean law MCP server is available for PIPA), a labeled eval set of real policies, optional self-hosted proxy, more providers, caching by policy hash.

## Constraints
- The tool itself must respect privacy: no telemetry; send only policy text to the user's chosen provider.
- Output is not legal advice; keep the disclaimer in the UI.

## Subagents (`.claude/agents/`)
Use them only when the task matches; do the work directly otherwise (token cost).
- `code-reviewer`: review a diff before commit
- `test-writer`: regression and edge-case tests for `src/core`
- `rubric-curator`: edit `rubric/*.json` with verified legal references
- `security-reviewer`: permissions, key handling, XSS, prompt injection (run before releases)
- `release-manager`: build/test gate, version bump, changelog, zip packaging
