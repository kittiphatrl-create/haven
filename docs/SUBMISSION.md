# Haven — A Little Closer to Home

## Project name

Haven — A Little Closer to Home

## Elevator pitch

Haven turns simulated home events into calm context and thoughtful check-ins, with editable drafts and explicit confirmation before anything reaches a demo inbox.

## Inspiration

Small moments can prompt a simple question: what happened at home, and should I check in? Haven explores how an assistant could help a family understand limited observations while leaving the decision and wording to a person.

## What it does

A presenter simulates a doorbell, motion, or offline event. Haven shows a timestamped timeline, summarizes the current demo context, and distinguishes observations from unknowns. A check-in request prepares an editable message for a fictional household member. Only a user confirmation adds it to the simulated inbox. Cancel and Reset provide clear exits.

The app has two honest paths: deterministic scripted replies with no model connection, and server-side OpenAI function calling when a key is configured. Live failures are visible and require an explicit choice before using the scripted backup.

## How we built it

One Next.js App Router application uses React, TypeScript, Tailwind CSS, and Lucide icons. A browser-local reducer owns the demo session. Zod validates inputs and tool arguments. A stateless Node.js route uses the OpenAI SDK and a bounded Responses API loop with two tools: read recent events and prepare a draft. There is no send tool or external messaging endpoint. Tests use Vitest, Playwright, and axe-core.

## Challenges

The main challenge was separating a draft from a confirmed action in code, including repeated clicks and responses that arrive after Reset. A browser test also revealed that Next.js normalized an internal hostname differently from the browser's origin; we corrected the host comparison and added a regression test. We replaced an initial lint dependency chain after its advisory report identified vulnerable transitive packages.

## What we learned

A small, explicit workflow is easier to demonstrate and verify. Uncertainty needs a place in the product's response, and confirmation needs an application boundary independent of model instructions. A scripted backup is useful when it is clearly labeled and uses the same actual demo state.

These are implementation findings. We have not conducted user studies or measured family outcomes.

## What's next

Run authorized live-model evaluations with valid credentials, test diverse phrasing and adversarial instructions, and conduct accessibility and usability research with intended users. Any future real device or messaging integration would require its own permission, security, privacy, and delivery design. None is implemented or promised by this demo.

## Built with

Next.js, React, TypeScript, Tailwind CSS, lucide-react, Node.js, npm, OpenAI JavaScript SDK, Zod, Vitest, Playwright, axe-core, ESLint, Prettier, and Codex.

## Track positioning and verification boundary

**Simulated Alexa+ experience; not an official Alexa+, Ring, or Amazon integration.** Events and inbox entries are demo data only. No real SMS, email, or emergency calls. No fall detection, diagnosis, or safety assurance.

The OpenAI integration is implemented. Live model calls were not made during development or verification. The successful scripted workflow and fake-provider orchestration tests must not be submitted as proof of a verified live model integration. See `VERIFICATION.md` for executed checks.
