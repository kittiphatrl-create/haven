import { z } from "zod";

export const LIMITS = {
  events: 100,
  history: 24,
  message: 1000,
  draft: 600,
  body: 128_000,
} as const;
export const eventTypeSchema = z.enum(["doorbell", "motion", "device_offline"]);
export const eventSchema = z
  .object({
    id: z.uuid(),
    type: eventTypeSchema,
    location: z.enum(["Front door", "Entryway", "Home hub"]),
    timestamp: z.iso.datetime(),
    source: z.literal("simulation"),
  })
  .strict();
export type HomeEvent = z.infer<typeof eventSchema>;
export type EventType = HomeEvent["type"];
export const editedMessageSchema = z.string().trim().min(1).max(LIMITS.draft);
export const draftArgumentsSchema = z
  .object({
    recipient: z.literal("Household member"),
    message: editedMessageSchema,
  })
  .strict();
export const recentArgumentsSchema = z
  .object({ limit: z.number().int().min(1).max(LIMITS.events) })
  .strict();

export const chatRequestSchema = z
  .object({
    message: z.string().trim().min(1).max(LIMITS.message),
    events: z
      .array(eventSchema)
      .max(LIMITS.events)
      .refine(
        (events) => new Set(events.map((e) => e.id)).size === events.length,
      ),
    history: z
      .array(
        z
          .object({
            role: z.enum(["user", "assistant"]),
            content: z.string().trim().min(1).max(4000),
          })
          .strict(),
      )
      .max(LIMITS.history),
    mode: z.enum(["live", "scripted"]),
    timeZone: z
      .string()
      .min(1)
      .max(80)
      .refine((value) => {
        try {
          new Intl.DateTimeFormat("en", { timeZone: value });
          return true;
        } catch {
          return false;
        }
      }),
  })
  .strict();
export type ChatRequest = z.infer<typeof chatRequestSchema>;

export const draftSchema = draftArgumentsSchema.extend({
  id: z.uuid(),
  status: z.enum(["draft", "confirmed", "cancelled"]),
});
export type Draft = z.infer<typeof draftSchema>;
export const replySchema = z.object({
  text: z.string().min(1).max(4000),
  activity: z.array(z.string().max(160)).max(8),
  draft: draftSchema.optional(),
});
export type AssistantReply = z.infer<typeof replySchema>;
