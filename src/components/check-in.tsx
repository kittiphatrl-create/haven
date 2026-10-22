import {
  Check,
  CheckCheck,
  Inbox,
  MessageSquareHeart,
  Pencil,
  Send,
  UserRound,
  X,
} from "lucide-react";
import type { Draft } from "@/lib/schema";
import type { InboxMessage } from "@/lib/demo";
import { formatTime } from "@/lib/format";
import { Button, EmptyState } from "./ui";

type Props = {
  draft: Draft | null;
  busy: boolean;
  onEdit: (id: string, message: string) => void;
  onConfirm: (id: string) => void;
  onCancel: (id: string) => void;
};
export function CheckIn({ draft, busy, onEdit, onConfirm, onCancel }: Props) {
  const pending = draft?.status === "draft";
  const invalid =
    pending && (!draft.message.trim() || draft.message.trim().length > 600);
  return (
    <section
      className={`panel checkin-panel ${pending ? "has-draft" : ""}`}
      aria-labelledby="checkin-heading"
    >
      <div className="panel-heading">
        <div className="heading-with-icon">
          <MessageSquareHeart size={18} aria-hidden="true" />
          <h2 id="checkin-heading">Check-in preview</h2>
        </div>
        {pending && <span className="badge badge-review">Your review</span>}
      </div>
      <p className="panel-subtitle">A little care. Always your call.</p>
      {pending ? (
        <div className="draft-body">
          <div className="recipient">
            <span className="avatar">
              <UserRound size={18} aria-hidden="true" />
            </span>
            <div>
              <span className="field-eyebrow">TO · SIMULATED RECIPIENT</span>
              <strong>{draft.recipient}</strong>
            </div>
          </div>
          <label className="message-label" htmlFor="draft-message">
            <Pencil size={13} aria-hidden="true" /> Edit your message
          </label>
          <textarea
            id="draft-message"
            className="draft-textarea resize-none"
            value={draft.message}
            maxLength={600}
            onChange={(event) => onEdit(draft.id, event.target.value)}
            aria-invalid={invalid}
            aria-describedby="draft-help draft-validation"
            rows={5}
          />
          <div className="field-meta">
            <span id="draft-help">Make it sound like you.</span>
            <span>{draft.message.length}/600</span>
          </div>
          <p id="draft-validation" className="field-error">
            {invalid ? "Write a message between 1 and 600 characters." : ""}
          </p>
          <Button
            variant="primary"
            className="confirm-button"
            disabled={invalid || busy}
            onClick={() => onConfirm(draft.id)}
          >
            <Check size={16} aria-hidden="true" /> Confirm simulated send
          </Button>
          <Button
            variant="ghost"
            className="cancel-button"
            onClick={() => onCancel(draft.id)}
          >
            Cancel
          </Button>
          <p className="review-note">
            Only your confirmation adds this to the demo inbox.
          </p>
        </div>
      ) : draft ? (
        <div className="draft-outcome">
          <span className="outcome-icon">
            {draft.status === "confirmed" ? (
              <CheckCheck size={24} aria-hidden="true" />
            ) : (
              <X size={23} aria-hidden="true" />
            )}
          </span>
          <h3>
            {draft.status === "confirmed"
              ? "A little connection, made."
              : "Draft cancelled."}
          </h3>
          <p>
            {draft.status === "confirmed"
              ? "Added to simulated inbox — no external message sent."
              : "Nothing was added to the inbox. Ask Haven whenever you’re ready to start again."}
          </p>
        </div>
      ) : (
        <EmptyState
          compact
          icon={<Send size={24} strokeWidth={1.5} />}
          title="Thoughtful, before sent."
        >
          Ask Haven to help you check in. A message will be ready here for you
          to review.
        </EmptyState>
      )}
    </section>
  );
}

export function SimulatedInbox({
  messages,
  timeZone,
}: {
  messages: InboxMessage[];
  timeZone: string;
}) {
  return (
    <section className="panel inbox-panel" aria-labelledby="inbox-heading">
      <div className="panel-heading">
        <div className="heading-with-icon">
          <Inbox size={18} aria-hidden="true" />
          <h2 id="inbox-heading">Simulated inbox</h2>
        </div>
        <span className="count" aria-label={`${messages.length} messages`}>
          {messages.length}
        </span>
      </div>
      {messages.length ? (
        <ol
          className="inbox-list"
          aria-label="Confirmed simulated messages"
          tabIndex={0}
        >
          {[...messages].reverse().map((item) => (
            <li key={item.id} className="inbox-message">
              <div className="inbox-message-heading">
                <span>
                  <CheckCheck size={13} aria-hidden="true" /> {item.recipient}
                </span>
                <time dateTime={item.timestamp} title={timeZone}>
                  {formatTime(item.timestamp, timeZone)}
                </time>
              </div>
              <p>{item.message}</p>
              <span className="simulated-delivery">
                Simulated · confirmed by you
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <div className="inbox-empty">
          <span className="inbox-empty-icon">
            <Inbox size={20} strokeWidth={1.5} aria-hidden="true" />
          </span>
          <p>
            No messages yet.
            <br />
            <span>Confirmed check-ins will appear here.</span>
          </p>
        </div>
      )}
      <p className="inbox-disclaimer">
        Messages stay in this demo. No SMS, email, or emergency calls are sent.
      </p>
    </section>
  );
}
