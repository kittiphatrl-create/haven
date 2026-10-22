# Implementation plan — 22 October 2026

The supplied request is the product specification and authorizes implementation today.

1. Set up an isolated Next.js/TypeScript/Tailwind project in F:/haven; preserve other folders.
2. Test and implement browser-local state, UUID/ISO events, draft transitions, idempotent confirmation, reset generation, and Zod request limits in src/lib.
3. Build the three-panel responsive workspace with empty states and accessible shared controls. Implement deterministic scripted replies from current state.
4. Implement stateless Node API routes and an OpenAI Responses tool loop (four requests maximum). Require an event read; expose no send tool. Validate tool arguments; use timeout, retry, explicit fallback choice, and cancellation.
5. Run logic tests, browser workflow/error/race/mobile/keyboard/accessibility checks, lint, TypeScript, and production build. Correct observed failures and save evidence.
6. Document setup, privacy, honest verification limits, a two-minute demo, submission copy, feedback templates, and observed friction.
