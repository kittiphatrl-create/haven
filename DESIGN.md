---
version: alpha
name: Haven
description: Calm context and user-reviewed simulated check-ins, expressed through navy, warm white, and muted teal.
colors:
  primary: "{colors.teal}"
  ink: "#172e3c"
  paper: "#f7f8f5"
  surface: "#ffffff"
  teal: "#28665e"
  teal-soft: "#eaf2ed"
  muted: "#60716f"
  line: "#dce3de"
  amber: "#805d25"
typography:
  sans:
    fontFamily: '"Segoe UI", "Helvetica Neue", Arial, sans-serif'
  serif:
    fontFamily: 'Georgia, "Times New Roman", serif'
  mono:
    fontFamily: "ui-monospace, monospace"
rounded:
  DEFAULT: "10px"
  panel: "20px"
spacing:
  section-gap: "22px"
  page-max: "1600px"
components:
  button:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
  panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
  textarea:
    textColor: "{colors.ink}"
  user-message:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
  arch-ground:
    backgroundColor: "{colors.line}"
  secondary-label:
    textColor: "{colors.muted}"
  simulation-badge:
    backgroundColor: "{colors.teal-soft}"
    textColor: "{colors.teal}"
  warning:
    textColor: "{colors.amber}"
---

# Haven design system

## Intent

An English, single-screen hackathon demo for families. Its job is to turn observed simulated home events into a calm summary and a user-reviewed check-in. The user supplied the product rules and visual direction. No stock imagery, real device claims, or safety conclusions.

## Colors

Runtime source of truth: `src/app/globals.css` custom properties, adapted to Tailwind with `@theme inline`.
The frontmatter semantic `primary` aliases `teal`; both refer to the single runtime `--teal` token. Component properties describe existing variants and do not generate another theme.

| Token     | Value   | Purpose                            |
| --------- | ------- | ---------------------------------- |
| ink       | #172e3c | Deep navy text and assistant panel |
| paper     | #f7f8f5 | Warm white page                    |
| surface   | #ffffff | Cards                              |
| teal      | #28665e | Actions and focus                  |
| teal-soft | #eaf2ed | Quiet context                      |
| muted     | #60716f | Secondary text                     |
| line      | #dce3de | Borders                            |
| amber     | #805d25 | Offline and scripted context       |

## Typography

Display: Georgia (local system serif), used only for the home heading and assistant welcome. Body: system sans-serif (Segoe UI on Windows). Utility: system monospace for event time. No network fonts or font swaps. Main conversation 14px; descriptive copy 12–14px; controls 12–13px; secondary labels 11–12px. Headings 22–42px. Native mobile text input is 16px.

## Layout

Three columns: event timeline, generous assistant workspace, review/inbox rail. Below 1120px the rail becomes a two-card row; below 760px all panels stack in workflow order. Document scrolling owns the page; long conversations and event lists have their own visible scrollbars on desktop.

## Signature

A small architectural arch surrounding a home icon: a quiet visual reference to a doorway and the distance between people. Used once in the assistant welcome, echoed in the simple house brand mark. No decorative dashboard metrics.

## Shapes and elevation

Panels 20px radius, controls 10px, small badges pill-shaped. Thin borders and a very soft shadow on the assistant only. Spacing uses 4px increments. Solid primary, outline secondary, ghost tertiary buttons share one primitive.

## Iconography

Lucide icons, 16–20px with 1.7px stroke; decorative icons hidden from assistive technology. No Amazon logo.

## Motion

160ms color/opacity transitions. Loading spinner only while a request is active. Reduced motion disables animations and transitions.

## State and accessibility

Visible 3px focus ring, semantic buttons, labeled editable fields, inline errors, polite status announcements. Every pending operation supports reset/abort. Simulation notices remain visible in all states. Time formatting uses the browser timezone, shown beside the timeline.

## Canonical UI map

| Capability        | Owner                                           | Contract                                                                | Verification               |
| ----------------- | ----------------------------------------------- | ----------------------------------------------------------------------- | -------------------------- |
| Buttons           | src/components/ui.tsx                           | Semantic native controls; primary/outline/ghost/danger variants         | Keyboard and browser tests |
| Form              | src/components/check-in.tsx + src/lib/schema.ts | Trimmed 1–600 character message; fixed simulated recipient              | Unit + browser validation  |
| Date              | src/lib/format.ts                               | Intl.DateTimeFormat; explicit browser timezone                          | Browser                    |
| Scrollbar         | src/app/globals.css                             | Visible global track/thumb, forced-colors fallback                      | Computed style + mobile    |
| Status            | src/components/haven-app.tsx                    | One polite inline live region; persistent errors                        | Browser                    |
| State transitions | src/lib/demo.ts                                 | draft to confirmed/cancelled; idempotent confirmation; reset generation | Unit + browser             |

No tables, select controls, authentication, or modal workflows are in scope. There is no sibling screen in this new one-page app; all three panels share these owners. Reset clears transient demo data immediately as specified; it is reversible by simulating new events and has no external effect.
