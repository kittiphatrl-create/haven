import { EVENT_META } from "./demo";
import { formatTime } from "./format";
import {
  draftArgumentsSchema,
  type AssistantReply,
  type Draft,
  type HomeEvent,
} from "./schema";

export const QUICK_PROMPTS = [
  "What happened at home?",
  "Help me check in with someone at home.",
  "What do we know, and what is still unknown?",
] as const;

export function createDraft(message: string): Draft {
  const args = draftArgumentsSchema.parse({
    recipient: "Household member",
    message,
  });
  return { ...args, id: crypto.randomUUID(), status: "draft" };
}
export function getRecentEvents(events: HomeEvent[], limit = 100): HomeEvent[] {
  return [...events]
    .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
    .slice(0, limit);
}
function eventSummary(events: HomeEvent[], timeZone: string) {
  if (!events.length)
    return "No events have been simulated yet. This does not tell us whether anyone is home or how they are doing.";
  const observed = getRecentEvents(events, 5)
    .map(
      (e) =>
        `• ${EVENT_META[e.type].title} at ${e.location}, ${formatTime(e.timestamp, timeZone)}.`,
    )
    .join("\n");
  const remainder =
    events.length > 5
      ? `\nShowing the latest 5 of ${events.length} events.`
      : "";
  return `Observed in this simulation:\n${observed}${remainder}\nTimes: ${timeZone}.\n\nWe do not know who was there or how anyone is doing. Motion does not identify a person; a device going offline does not establish danger.`;
}
export function scriptedReply(
  message: string,
  events: HomeEvent[],
  timeZone: string,
): AssistantReply {
  const normalized = message
    .trim()
    .toLowerCase()
    .replace(/[?.!]+$/g, "");
  const match = QUICK_PROMPTS.findIndex(
    (prompt) => prompt.toLowerCase().replace(/[?.!]+$/g, "") === normalized,
  );
  if (match === -1)
    return {
      text: "This scripted demo supports the three quick prompts below. Choose one to summarize current events, prepare a check-in, or explore what is still unknown.",
      activity: [],
    };
  const activity = [
    `Read ${events.length} recent ${events.length === 1 ? "event" : "events"}`,
  ];
  if (match === 1) {
    const draft = createDraft(
      "Hi, just checking in. How is your day going? Let me know when you have a moment.",
    );
    return {
      text: "I’ve prepared a check-in for your review. You can edit the message in the check-in preview, then confirm or cancel. Nothing has been sent.",
      activity: [...activity, "Prepared a check-in draft"],
      draft,
    };
  }
  return { text: eventSummary(events, timeZone), activity };
}
