import {
  editedMessageSchema,
  type AssistantReply,
  type Draft,
  type EventType,
  type HomeEvent,
} from "./schema";

export const EVENT_META = {
  doorbell: {
    title: "Doorbell rang",
    location: "Front door",
    description: "A simulated doorbell press. Who was there is unknown.",
  },
  motion: {
    title: "Motion recorded",
    location: "Entryway",
    description: "Simulated movement. It does not identify a person.",
  },
  device_offline: {
    title: "Device went offline",
    location: "Home hub",
    description: "A simulated connection change. The cause is unknown.",
  },
} as const;

export function createEvent(type: EventType): HomeEvent {
  return {
    id: crypto.randomUUID(),
    type,
    location: EVENT_META[type].location,
    timestamp: new Date().toISOString(),
    source: "simulation",
  };
}
export type ConversationMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  activity?: string[];
  mode?: "live" | "scripted";
};
export type InboxMessage = {
  id: string;
  draftId: string;
  recipient: string;
  message: string;
  timestamp: string;
};
export type DemoState = {
  generation: number;
  events: HomeEvent[];
  conversation: ConversationMessage[];
  draft: Draft | null;
  inbox: InboxMessage[];
};
export function createInitialState(): DemoState {
  return {
    generation: 0,
    events: [],
    conversation: [],
    draft: null,
    inbox: [],
  };
}
export type DemoAction =
  | { type: "event"; event: HomeEvent }
  | { type: "user"; message: string }
  | {
      type: "reply";
      generation: number;
      reply: AssistantReply;
      mode?: "live" | "scripted";
    }
  | { type: "edit"; id: string; message: string }
  | { type: "confirm" | "cancel"; id: string }
  | { type: "reset" };

export function demoReducer(state: DemoState, action: DemoAction): DemoState {
  switch (action.type) {
    case "event":
      return { ...state, events: [...state.events, action.event].slice(-100) };
    case "user":
      return {
        ...state,
        conversation: [
          ...state.conversation,
          {
            id: crypto.randomUUID(),
            role: "user" as const,
            content: action.message,
          },
        ].slice(-60),
      };
    case "reply":
      if (action.generation !== state.generation) return state;
      return {
        ...state,
        conversation: [
          ...state.conversation,
          {
            id: crypto.randomUUID(),
            role: "assistant" as const,
            content: action.reply.text,
            activity: action.reply.activity,
            mode: action.mode,
          },
        ].slice(-60),
        draft: action.reply.draft ?? state.draft,
      };
    case "edit":
      if (state.draft?.id !== action.id || state.draft.status !== "draft")
        return state;
      return { ...state, draft: { ...state.draft, message: action.message } };
    case "cancel":
      if (state.draft?.id !== action.id || state.draft.status !== "draft")
        return state;
      return { ...state, draft: { ...state.draft, status: "cancelled" } };
    case "confirm": {
      if (
        state.draft?.id !== action.id ||
        state.draft.status !== "draft" ||
        state.inbox.some((item) => item.draftId === action.id)
      )
        return state;
      const message = editedMessageSchema.safeParse(state.draft.message);
      if (!message.success) return state;
      return {
        ...state,
        draft: { ...state.draft, message: message.data, status: "confirmed" },
        inbox: [
          ...state.inbox,
          {
            id: state.draft.id,
            draftId: state.draft.id,
            recipient: state.draft.recipient,
            message: message.data,
            timestamp: new Date().toISOString(),
          },
        ],
      };
    }
    case "reset":
      return { ...createInitialState(), generation: state.generation + 1 };
  }
}
