"use client";

import {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createEvent, createInitialState, demoReducer } from "@/lib/demo";
import { replySchema, type ChatRequest, type EventType } from "@/lib/schema";
import { ZodError } from "zod";

export type AiMode = "loading" | "live" | "scripted" | "unavailable";
type RequestError = {
  message: string;
  prompt: string;
  mode: "live" | "scripted";
};
const subscribeToTimeZone = () => () => {};
const browserTimeZone = () =>
  Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

function requestErrorMessage(error: unknown): string {
  if (
    error instanceof Error &&
    (error.name === "TimeoutError" || error.name === "AbortError")
  ) {
    return "The request took too long. Nothing was sent. Retry, or choose Scripted demo.";
  }
  if (error instanceof ZodError || error instanceof SyntaxError) {
    return "The reply could not be read. Please retry.";
  }
  if (error instanceof TypeError) {
    return "The demo server could not be reached. Check the local server and retry.";
  }
  return error instanceof Error
    ? error.message
    : "The reply could not be read. Please retry.";
}

export function useDemo() {
  const [state, dispatch] = useReducer(
    demoReducer,
    undefined,
    createInitialState,
  );
  const [mode, setMode] = useState<AiMode>("loading");
  const [liveConfigured, setLiveConfigured] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<RequestError | null>(null);
  const [notice, setNotice] = useState("");
  const timeZone = useSyncExternalStore(
    subscribeToTimeZone,
    browserTimeZone,
    () => "UTC",
  );
  const active = useRef<{ controller: AbortController; token: string } | null>(
    null,
  );

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/status", {
      signal: AbortSignal.any([controller.signal, AbortSignal.timeout(8000)]),
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Status unavailable");
        const status = await response.json();
        if (typeof status.liveConfigured !== "boolean")
          throw new Error("Invalid status");
        if (!controller.signal.aborted) {
          setLiveConfigured(status.liveConfigured);
          setMode(status.liveConfigured ? "live" : "scripted");
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setMode("unavailable");
          setError({
            message:
              "The AI connection status could not be checked. Retry a prompt or choose Scripted demo.",
            prompt: "",
            mode: "live",
          });
        }
      });
    return () => {
      controller.abort();
      active.current?.controller.abort();
    };
  }, []);

  const send = useCallback(
    async (
      prompt: string,
      retry = false,
      preferredMode?: "live" | "scripted",
    ) => {
      const message = prompt.trim();
      if (
        !message ||
        message.length > 1000 ||
        active.current ||
        mode === "loading"
      )
        return false;
      const requestMode =
        preferredMode ?? (mode === "scripted" ? "scripted" : "live");
      const controller = new AbortController();
      const token = crypto.randomUUID();
      active.current = { controller, token };
      const generation = state.generation;
      const history = (
        retry ? state.conversation.slice(0, -1) : state.conversation
      )
        .slice(-24)
        .map((item) => ({ role: item.role, content: item.content }));
      const body: ChatRequest = {
        message,
        events: state.events,
        history,
        mode: requestMode,
        timeZone,
      };
      if (!retry) dispatch({ type: "user", message });
      setBusy(true);
      setError(null);
      setNotice("");
      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: AbortSignal.any([
            controller.signal,
            AbortSignal.timeout(40_000),
          ]),
        });
        const data = await response.json();
        if (!response.ok)
          throw new Error(
            typeof data.error === "string"
              ? data.error
              : "The request could not be completed. Please retry.",
          );
        const reply = replySchema.parse(data);
        if (active.current?.token !== token || controller.signal.aborted)
          return false;
        dispatch({ type: "reply", generation, reply, mode: requestMode });
        setMode(requestMode);
        setNotice(
          reply.draft
            ? "Check-in draft ready for your review."
            : "Reply ready.",
        );
        return true;
      } catch (caught) {
        if (active.current?.token !== token || controller.signal.aborted)
          return false;
        setError({
          message: requestErrorMessage(caught),
          prompt: message,
          mode: requestMode,
        });
        if (requestMode === "live") setMode("unavailable");
        return false;
      } finally {
        if (active.current?.token === token) {
          active.current = null;
          setBusy(false);
        }
      }
    },
    [mode, state, timeZone],
  );

  function reset() {
    active.current?.controller.abort();
    active.current = null;
    dispatch({ type: "reset" });
    setBusy(false);
    setError(null);
    setNotice("Demo reset. Events, conversation, drafts, and inbox cleared.");
  }
  function chooseMode(next: "live" | "scripted") {
    active.current?.controller.abort();
    active.current = null;
    setBusy(false);
    setMode(next);
    setError(null);
    setNotice(
      next === "scripted"
        ? "Scripted demo selected. AI is not connected in this mode."
        : "Live AI selected. Your next prompt will use the server connection.",
    );
  }
  function simulate(type: EventType) {
    dispatch({ type: "event", event: createEvent(type) });
    setNotice("Simulated event added to the home timeline.");
  }
  return {
    state,
    dispatch,
    mode,
    liveConfigured,
    busy,
    error,
    notice,
    timeZone,
    send,
    reset,
    chooseMode,
    simulate,
    retry: () => error?.prompt && send(error.prompt, true, error.mode),
  };
}
