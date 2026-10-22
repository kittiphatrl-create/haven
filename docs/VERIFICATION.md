# Verification record

Executed locally on 22 October 2026 (Asia/Bangkok). Host: Windows, Node.js 24.21.0, npm 11.19.0. Application: Next.js 16.4.2, OpenAI SDK 7.42.0. Installed Google Chrome was used headlessly by Playwright.

| Check                                | Command                                                                                       | Observed result                                                   |
| ------------------------------------ | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Reproducible dependency installation | `npm ci --ignore-scripts`                                                                     | Passed, 218 packages installed, zero advisories reported          |
| Lint                                 | `npm run lint`                                                                                | Passed, zero errors or warnings                                   |
| TypeScript                           | `npm run typecheck`                                                                           | Passed                                                            |
| Unit / orchestration tests           | `npm test -- --reporter=default --reporter=json --outputFile=docs/evidence/unit-results.json` | 34 tests passed in 3 files                                        |
| Production build                     | `npm run build`                                                                               | Passed; page, status API, chat API, and not-found route generated |
| Production browser tests             | `npm run test:e2e`                                                                            | 11 tests passed                                                   |
| Dependency advisories                | `npm audit --json`                                                                            | Zero known vulnerabilities at execution time                      |
| Static UI audit                      | Frontend Design Premium `audit_project.py F:/haven --mode strict`                             | Zero findings; report in `evidence/premium-audit.json`            |

Additional documentation checks: `npm run format:check` passed. `npx --yes --package @google/design.md designmd lint DESIGN.md` passed with zero errors or warnings. A direct request to the running app at `http://127.0.0.1:3000/api/status` returned HTTP 200 with `liveConfigured: false`.

## Browser coverage

- No-key startup, empty states, simulation notices, current timezone label, event creation, actual scripted API request, event-grounded reply, draft editing, and one confirmed inbox entry.
- A rapid double click on Confirm still creates exactly one entry.
- No-event response, unsupported scripted input, all three event types, and uncertainty prompt.
- Blank edited draft validation, cancellation, and reset.
- A controlled pending response delivered after Reset cannot restore conversation or a draft. The loading screenshot deliberately uses a held browser request; it is not a live AI latency measurement.
- Scripted server failure, retry with fresh events, and no duplicated user turn.
- Intercepted Live AI UI failure: Live AI → AI unavailable → explicit Scripted demo choice. No silent fallback.
- Tab isolation, keyboard activation and visible focus, and confirmation with keyboard input.
- Mobile widths 375px and 320px, including a 600-character unbroken message, without horizontal document overflow.
- axe-core scans of empty and editable-draft states using WCAG 2/2.1/2.2 A/AA tags produced no violations. Reduced-motion disables transitions.
- API rejection of invalid input, oversized bodies, foreign origins, unsupported content type, and a Live AI request without a key.

## Evidence

- `evidence/unit-results.json` — unit test results.
- `evidence/browser-results.json` — Playwright results, including test durations and failures if any.
- `evidence/premium-audit.json` — static UI findings.
- `evidence/desktop-empty.png`, `desktop-review.png`, `desktop-confirmed.png` — real scripted workflow screenshots.
- `evidence/desktop-loading.png`, `desktop-ai-unavailable.png` — controlled loading/failure UI states.
- `evidence/mobile-empty.png`, `mobile-confirmed.png` — narrow viewport screenshots.

## Not verified

**No OpenAI API key was configured and no real model request was made.** Live orchestration tests use a fake provider at the SDK boundary. Live-mode browser failure tests intercept requests inside Playwright. These demonstrate application behavior, not provider connectivity, real model grounding, latency, model access, or prompt-injection resistance in a deployed model.

No real device test, external messaging test, user study, screen-reader audit, or impact measurement was performed. Automated accessibility checks cover a subset of accessibility requirements. Manual visual inspection was performed on the captured desktop and mobile screenshots.

Doorbell sound update: the application now plays a synthesized two-tone chime after a doorbell click. The updated local suite passes 34 unit tests and 13 browser tests. Real Web Audio analyser samples verify signal output during both chime strikes; Reset closes playback, and unavailable audio does not block event creation. Lint, TypeScript, and production build pass. The hosted Vercel scripted demo at https://haven-chi-amber.vercel.app also passed three browser smoke tests covering audio, audio failure, and the complete reviewed check-in workflow. No live model requests were made.

The initial failed test runs and their causes are recorded in `FRICTION_LOG.md`; final result files are replaced by each new test run. Playwright emitted an environment warning that `NO_COLOR` was ignored while `FORCE_COLOR` was set. It did not fail the suite or affect application behavior.
