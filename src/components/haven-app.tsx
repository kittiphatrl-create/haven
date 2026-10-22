"use client";

import {
  BellRing,
  ChevronRight,
  FlaskConical,
  Footprints,
  Heart,
  RotateCcw,
  ShieldCheck,
  WifiOff,
} from "lucide-react";
import { useDemo } from "@/hooks/use-demo";
import { Assistant } from "./assistant";
import { CheckIn, SimulatedInbox } from "./check-in";
import { Timeline } from "./timeline";
import { Brand, Button } from "./ui";

export function HavenApp() {
  const demo = useDemo();
  const { state, mode } = demo;
  return (
    <>
      <a className="skip-link" href="#workspace">
        Skip to workspace
      </a>
      <header className="site-header">
        <div className="header-inner">
          <div className="brand">
            <Brand />
            <div>
              <span className="brand-name">
                haven<span className="brand-period">.</span>
              </span>
              <p>A little closer to home</p>
            </div>
          </div>
          <div className="header-subtitle">
            Know what happened.
            <br />
            <strong>Choose what happens next.</strong>
          </div>
          <div className="header-badges">
            <span className="badge badge-simulation">
              <FlaskConical size={13} aria-hidden="true" /> Alexa+ experience
              simulation
            </span>
            <span
              className={`badge mode-badge mode-${mode}`}
              data-testid="ai-mode"
            >
              <span className="mode-dot" />
              {mode === "loading"
                ? "Checking AI connection…"
                : mode === "live"
                  ? "Live AI"
                  : mode === "scripted"
                    ? "Scripted demo — AI not connected"
                    : "AI unavailable"}
            </span>
          </div>
        </div>
      </header>
      <main className="main-shell">
        <div className="page-intro">
          <div>
            <div className="eyebrow">
              <span /> A LITTLE AWARENESS. A LITTLE CONNECTION.
            </div>
            <h1>Home is a little closer.</h1>
            <p>From a moment at the door to a message that matters.</p>
          </div>
          <div className="demo-notice">
            <ShieldCheck size={17} aria-hidden="true" />
            <span>Demo data only — no real devices connected</span>
          </div>
        </div>
        <section className="demo-controls" aria-labelledby="controls-heading">
          <div className="controls-description">
            <span className="controls-icon">
              <FlaskConical size={21} strokeWidth={1.5} aria-hidden="true" />
            </span>
            <div>
              <h2 id="controls-heading">Create a home moment</h2>
              <p>You set the scene. Haven adds context.</p>
            </div>
          </div>
          <div className="simulation-buttons">
            <Button
              className="doorbell-button"
              onClick={() => demo.simulate("doorbell")}
            >
              <BellRing size={16} aria-hidden="true" /> Simulate doorbell
            </Button>
            <Button onClick={() => demo.simulate("motion")}>
              <Footprints size={16} aria-hidden="true" /> Simulate motion
            </Button>
            <Button onClick={() => demo.simulate("device_offline")}>
              <WifiOff size={16} aria-hidden="true" /> Simulate device offline
            </Button>
          </div>
          <Button variant="ghost" className="reset-button" onClick={demo.reset}>
            <RotateCcw size={15} aria-hidden="true" /> Reset demo
          </Button>
        </section>
        <div className="workspace" id="workspace" tabIndex={-1}>
          <Timeline events={state.events} timeZone={demo.timeZone} />
          <Assistant
            key={state.generation}
            messages={state.conversation}
            mode={mode}
            busy={demo.busy}
            error={demo.error}
            onSend={demo.send}
            onRetry={demo.retry}
            onScripted={() => demo.chooseMode("scripted")}
          />
          <aside
            className="connection-rail"
            aria-label="Check-in and simulated inbox"
          >
            <CheckIn
              draft={state.draft}
              busy={demo.busy}
              onEdit={(id, message) =>
                demo.dispatch({ type: "edit", id, message })
              }
              onConfirm={(id) => {
                demo.dispatch({ type: "confirm", id });
              }}
              onCancel={(id) => {
                demo.dispatch({ type: "cancel", id });
              }}
            />
            <SimulatedInbox messages={state.inbox} timeZone={demo.timeZone} />
            <div className="human-note">
              <Heart size={16} aria-hidden="true" />
              <p>
                Technology brings the context.
                <br />
                <strong>You bring the care.</strong>
              </p>
            </div>
          </aside>
        </div>
        <div className="workspace-footer">
          <span>
            SIMULATE <ChevronRight size={12} aria-hidden="true" /> UNDERSTAND{" "}
            <ChevronRight size={12} aria-hidden="true" /> REVIEW & CONNECT
          </span>
          <div className="mode-controls" aria-label="AI mode selection">
            {mode === "live" && (
              <Button
                variant="ghost"
                onClick={() => demo.chooseMode("scripted")}
              >
                Use Scripted demo
              </Button>
            )}
            {mode === "scripted" && demo.liveConfigured && (
              <Button variant="ghost" onClick={() => demo.chooseMode("live")}>
                Use Live AI
              </Button>
            )}
          </div>
          <p>Session only. Refreshing clears your demo.</p>
        </div>
        <p
          className="screen-reader-status sr-only"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {demo.notice}
        </p>
      </main>
      <footer className="site-footer">
        <span>
          haven. <span>Made for the moments between.</span>
        </span>
        <p>A simulated Alexa+ experience. No official device integration.</p>
      </footer>
    </>
  );
}
