# Haven — A Little Closer to Home

**Know what happened. Choose what happens next.**

A local hackathon web app that turns simulated home events into a calm conversation and a user-reviewed check-in. The complete workflow runs without an API key. All product UI is English.

## What is real vs. simulated

| Real application behavior                                          | Simulated or unavailable                                                  |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| Button clicks create UUID events at the actual click time          | Doorbell, motion, and offline events are manually simulated               |
| The timeline and summaries read the current tab's state            | No Alexa+, Ring, Amazon, AWS, or home-device connection                   |
| Draft editing, cancellation, and confirmation                      | The recipient is the fictional “Household member”                         |
| Confirm adds exactly one local inbox entry per draft               | No SMS, email, emergency calls, or external messages                      |
| Server-side OpenAI SDK/tool-calling implementation                 | Live model behavior is unverified until tested with valid credentials     |
| Deterministic scripted replies based on the current event snapshot | Scripted mode calls no LLM and is not evidence of a working AI connection |

This is a **simulated Alexa+ experience**, not an official device integration or an Amazon product. It does not detect falls, diagnose conditions, prevent emergencies, establish presence, or determine whether anyone is safe.

## Setup

Use Node.js 24 LTS (the version used during development) and npm. No database or account setup is needed.

```powershell
cd F:\haven
npm ci
npm run dev
```

Open [Haven on localhost](http://127.0.0.1:3000). With no credentials it displays **“Scripted demo — AI not connected”**. No `.env.local` is necessary for this workflow.

For a recording, use the production server:

```powershell
npm run build
npm start
```

Both commands bind to the loopback interface by default. If port 3000 is occupied, use `npm run dev -- --port 3001` or `npm start -- --port 3001`.

## Environment variables

Copy `.env.example` to `.env.local` only if you want to configure Live AI:

```powershell
Copy-Item .env.example .env.local
```

| Variable             | Required             | Purpose                                                                     |
| -------------------- | -------------------- | --------------------------------------------------------------------------- |
| `OPENAI_API_KEY`     | Only for Live AI     | Server-side OpenAI credential; leave empty for scripted mode                |
| `OPENAI_MODEL`       | Optional             | A Responses API model supporting function calling; default `gpt-4.1-mini`   |
| `PLAYWRIGHT_CHANNEL` | Optional, tests only | Installed browser channel; defaults to `chrome`; `msedge` is also supported |

Restart the server after changing environment variables. Never prefix the key with `NEXT_PUBLIC_`; it must remain server-side. The status endpoint returns only whether a key is configured, never its value. A configured key selects Live AI by default; it does not prove model access. Making Live AI requests may incur provider charges. No paid model requests were made during development or verification.

Official implementation references: [Responses function calling](https://developers.openai.com/api/docs/guides/function-calling), [GPT-4.1 mini capabilities](https://developers.openai.com/api/docs/models/gpt-4.1-mini), and [Next.js installation](https://nextjs.org/docs/app/getting-started/installation).

## Run, test, and build

```powershell
npm run dev           # Local development
npm run lint          # ESLint + TypeScript + React Hooks rules, zero warnings
npm run typecheck     # TypeScript
npm test              # Logic, validation, HTTP boundaries, fake-provider orchestration
npm run build         # Production build
npm run test:e2e      # Production browser checks; builds must exist first
npm run format:check  # Prettier
npm audit             # Dependency advisory check
```

The browser suite starts its own production server on port 3100, explicitly removes the API key for that process, and uses installed Google Chrome in headless mode. To use Edge in PowerShell:

```powershell
$env:PLAYWRIGHT_CHANNEL = "msedge"
npm run test:e2e
```

No browser needs to be downloaded if Chrome or Edge is already installed. Screenshots and the JSON browser report are written to `docs/evidence/`; failure traces go to ignored `test-results/`. Browser tests that exercise Live AI UI states intercept the provider-facing app request; they make **no actual OpenAI calls**. See [verification notes](docs/VERIFICATION.md) for actual results and boundaries.

## Architecture

```text
src/app/page.tsx                         Next.js App Router entry
src/components/haven-app.tsx             Single responsive workspace
src/hooks/use-demo.ts                    Client requests, aborts, explicit mode changes
src/lib/demo.ts                          Browser-local state and draft state machine
src/lib/schema.ts                        Shared Zod validation and limits
src/lib/scripted.ts                      Deterministic responses and shared event reader
src/lib/live.ts                          Bounded OpenAI tool orchestration
src/lib/http.ts                          Body-size, JSON, and origin boundaries
src/app/api/chat/route.ts                Stateless Node.js request handler
src/app/api/status/route.ts              Non-secret configuration status
tests/                                  Unit and production browser checks
```

Each tab owns independent in-memory events, conversation, pending draft, and inbox. There is no shared server session store, browser storage, cookie, or database. The chat request carries a validated snapshot of that tab's data. This snapshot is demo input, not authenticated evidence from a physical home. The server has no send endpoint and no inbox to mutate.

### Confirmation state machine

```text
draft -- user clicks Confirm --> confirmed + one simulated inbox entry
draft -- user clicks Cancel  --> cancelled + no inbox entry
confirmed / cancelled        --> subsequent Confirm is ignored
```

The reducer checks the draft ID, current status, trimmed message validity, and existing inbox IDs. The model only returns a staged draft. It cannot trigger a confirmation or invoke a send tool. Edits remain local until a confirm click. A new check-in request can replace the current preview, so review, confirm, or cancel an edited draft before requesting another.

Reset immediately clears events, conversation, draft, and inbox without a reload. It aborts the active fetch, invalidates its token, and increments a reducer generation so a stale response cannot restore old data. It preserves the selected AI mode.

### AI tool workflow

1. Validate the request: message ≤1,000 characters, ≤100 unique-ID events, ≤24 history items of ≤4,000 characters each, valid timezone, strict keys. Bodies are capped at 128,000 bytes, including streamed bodies.
2. In Live AI, use the server-side OpenAI SDK with `store: false`, zero SDK retries, and a single 30-second deadline for the entire loop.
3. Force `get_recent_events` as the first model action. The tool reads only the current request's validated event snapshot; responses without this read are rejected.
4. Optionally allow `draft_check_in`, with a fictional fixed recipient and a 1–600 character message. Validate all tool arguments. One staged draft maximum per turn. No send tool exists.
5. Run at most four provider requests, one tool call per round. Disable tools on the final round and require a completed textual response. Return short action results, never internal reasoning.
6. The UI shows **Tool activity** for Live AI and **Scripted actions** for scripted replies. Scripted mode supports exactly the three quick prompts (case and ending punctuation are flexible); unsupported input gets an honest redirect.
7. If Live AI fails, show **AI unavailable**, an inline error, Retry, and an explicit **Use Scripted demo** choice. There is no automatic fallback. Client requests have a 40-second timeout.

Assistant instructions separate facts from unknowns and treat user/history/tool text as untrusted data. This is a mitigation, not a claim that prompts alone guarantee AI correctness. The confirmation boundary is enforced by application state independently of model behavior.

## Limitations and privacy

- Refreshing, closing the tab, restarting the UI, or clicking Reset loses local demo data. There is no recovery or durable storage. Only the latest 100 events and 60 visible conversation entries are retained; only the latest 24 entries go to the server.
- Both modes send the current demo event snapshot and recent conversation to the local app server. **Scripted mode uses no external AI service.** Live AI sends that context to OpenAI. Use fictional content only; do not enter personal information. `store: false` disables Responses application storage, not all provider-side retention under applicable provider policies.
- The app writes no prompt, event, message, or key logs. Browser test screenshots contain only fictional demo content. There are no analytics in the application. Next.js may display its own framework telemetry notice; it can be disabled with `NEXT_TELEMETRY_DISABLED=1`.
- No authentication, deployment hardening, distributed rate limit, durable audit trail, or multi-user collaboration is implemented. This local prototype should not be exposed publicly as a production service.
- Timestamps are real ISO strings and displayed with `Intl.DateTimeFormat` in the viewer's browser timezone, labeled beside the timeline. The server does not assume a country.
- Keyboard, mobile overflow, reduced-motion, and automated accessibility checks cover the listed tested states; they do not constitute user research or a full assistive-technology audit.
- Live API credentials, model access, latency, provider error details, and real model compliance still need an explicitly authorized live test. Scripted mode is a development and backup demo path, **not evidence that AI integration has been verified**.

## Recording and submission

- [Two-minute demo script](docs/DEMO_SCRIPT.md)
- [Submission draft](docs/SUBMISSION.md)
- [Product feedback templates](docs/PRODUCT_FEEDBACK.md)
- [Observed friction log](docs/FRICTION_LOG.md)
- [Design context](DESIGN.md)

The shortest click path is **Simulate doorbell → What happened at home? → Help me check in with someone at home. → edit the preview → Confirm simulated send → inspect Simulated inbox**.

## License

New application code is licensed under [MIT](LICENSE). Dependencies retain their respective licenses.
