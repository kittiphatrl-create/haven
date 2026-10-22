import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUp,
  ChevronRight,
  LoaderCircle,
  MessageCircle,
  Sparkles,
} from "lucide-react";
import type { ConversationMessage } from "@/lib/demo";
import { QUICK_PROMPTS } from "@/lib/scripted";
import type { AiMode } from "@/hooks/use-demo";
import { Brand, Button } from "./ui";

type Props = {
  messages: ConversationMessage[];
  mode: AiMode;
  busy: boolean;
  error: { message: string; prompt: string; mode: "live" | "scripted" } | null;
  onSend: (message: string) => Promise<boolean>;
  onRetry: () => void;
  onScripted: () => void;
};
export function Assistant({
  messages,
  mode,
  busy,
  error,
  onSend,
  onRetry,
  onScripted,
}: Props) {
  const [input, setInput] = useState("");
  const [inputError, setInputError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const conversationRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const container = conversationRef.current;
    if (container)
      container.scrollTo({ top: container.scrollHeight, behavior: "instant" });
  }, [messages.length, busy]);

  function submit() {
    if (!input.trim()) {
      setInputError("Write a question, or choose a quick prompt.");
      inputRef.current?.focus();
      return;
    }
    if (input.trim().length > 1000) {
      setInputError("Keep your question within 1,000 characters.");
      return;
    }
    void onSend(input);
    setInput("");
    setInputError("");
  }
  return (
    <section
      className="panel assistant-panel"
      aria-labelledby="assistant-heading"
      aria-busy={busy}
    >
      <div className="assistant-header">
        <div className="assistant-header-top">
          <span>
            <Sparkles size={15} aria-hidden="true" /> HAVEN ASSISTANT
          </span>
          <span className="assistant-presence">
            {mode === "live"
              ? "Live AI"
              : mode === "scripted"
                ? "Scripted demo"
                : mode === "loading"
                  ? "Connecting"
                  : "AI unavailable"}
          </span>
        </div>
        <h2 id="assistant-heading">
          A little context.
          <br />A little closer.
        </h2>
        <p>Understand the moment. Choose your next step.</p>
      </div>
      <div
        className={`conversation ${messages.length ? "has-messages" : ""}`}
        ref={conversationRef}
        role="log"
        aria-label="Conversation with Haven"
        aria-live="polite"
        tabIndex={messages.length ? 0 : undefined}
      >
        {messages.length ? (
          messages.map((message) => (
            <article
              className={`chat-message chat-${message.role}`}
              key={message.id}
              aria-label={message.role === "user" ? "You" : "Haven"}
            >
              <div className="message-author">
                {message.role === "assistant" ? (
                  <>
                    <Brand small /> Haven{" "}
                    <span>
                      {message.mode === "live" ? "Live AI" : "Scripted reply"}
                    </span>
                  </>
                ) : (
                  "You"
                )}
              </div>
              <p>{message.content}</p>
              {!!message.activity?.length && (
                <div
                  className="tool-activity"
                  aria-label={
                    message.mode === "live"
                      ? "AI tool activity"
                      : "Scripted actions — no model tools were called"
                  }
                >
                  <span className="activity-label">
                    {message.mode === "live"
                      ? "Tool activity"
                      : "Scripted actions"}
                  </span>
                  {message.activity.map((item, index) => (
                    <span key={`${index}-${item}`}>
                      <ChevronRight size={12} aria-hidden="true" />
                      {item}
                    </span>
                  ))}
                </div>
              )}
            </article>
          ))
        ) : (
          <div className="assistant-welcome">
            <div className="home-arch">
              <Brand />
              <span className="arch-ground" />
            </div>
            <h3>Start with what you know.</h3>
            <p>
              Simulate a moment at home.
              <br />
              I’ll help you find the words to check in.
            </p>
            <span className="welcome-detail">
              Context first. Connection next.
            </span>
          </div>
        )}
        {busy && (
          <div className="assistant-loading" role="status">
            <LoaderCircle
              className="animate-spin"
              size={16}
              aria-hidden="true"
            />
            <span>
              {mode === "scripted"
                ? "Reading the current demo events…"
                : "Haven is checking the demo context…"}
            </span>
          </div>
        )}
        <div ref={endRef} />
      </div>
      {error && (
        <div className="request-error" role="alert" aria-label="Request error">
          <strong>
            {error.mode === "live" ? "AI unavailable" : "Reply unavailable"}
          </strong>
          <p>{error.message}</p>
          <div>
            {error.prompt && (
              <Button onClick={onRetry} disabled={busy}>
                Retry
              </Button>
            )}
            {mode !== "scripted" && (
              <Button onClick={onScripted}>
                Use Scripted demo <ArrowRight size={14} aria-hidden="true" />
              </Button>
            )}
          </div>
        </div>
      )}
      <div className="quick-prompts">
        <div className="quick-label">
          <MessageCircle size={13} aria-hidden="true" />
          <span>A PLACE TO START</span>
        </div>
        {QUICK_PROMPTS.map((prompt) => (
          <button
            type="button"
            className="quick-prompt"
            key={prompt}
            disabled={busy || mode === "loading"}
            onClick={() => void onSend(prompt)}
          >
            <span>{prompt}</span>
            <ArrowRight size={15} aria-hidden="true" />
          </button>
        ))}
      </div>
      <form
        className="composer"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <div className={`composer-field ${inputError ? "is-invalid" : ""}`}>
          <label className="sr-only" htmlFor="assistant-message">
            Ask Haven
          </label>
          <textarea
            className="resize-none"
            id="assistant-message"
            ref={inputRef}
            rows={1}
            placeholder="Ask about your home…"
            value={input}
            maxLength={1000}
            disabled={busy || mode === "loading"}
            aria-invalid={Boolean(inputError)}
            aria-describedby="composer-help composer-error"
            onChange={(event) => {
              setInput(event.target.value);
              setInputError("");
            }}
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                !event.shiftKey &&
                !event.nativeEvent.isComposing
              ) {
                event.preventDefault();
                submit();
              }
            }}
          />
          <Button
            variant="primary"
            className="send-button"
            type="submit"
            aria-label="Send question to Haven"
            disabled={busy || mode === "loading" || !input.trim()}
          >
            {busy ? (
              <LoaderCircle
                className="animate-spin"
                size={18}
                aria-hidden="true"
              />
            ) : (
              <ArrowUp size={20} aria-hidden="true" />
            )}
          </Button>
        </div>
        <p id="composer-error" className="composer-error">
          {inputError}
        </p>
        <p id="composer-help">
          {mode === "scripted"
            ? "Scripted replies use demo events. No AI is connected."
            : mode === "live"
              ? "AI can make mistakes. Review the context and every draft."
              : mode === "loading"
                ? "Checking the server connection…"
                : "Choose Scripted demo or retry the AI connection."}
        </p>
      </form>
    </section>
  );
}
