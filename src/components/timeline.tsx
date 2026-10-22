import {
  BellRing,
  Footprints,
  WifiOff,
  Clock3,
  House,
  Info,
} from "lucide-react";
import { EVENT_META } from "@/lib/demo";
import { formatDate, formatTime } from "@/lib/format";
import type { HomeEvent } from "@/lib/schema";
import { EmptyState } from "./ui";

const icons = {
  doorbell: BellRing,
  motion: Footprints,
  device_offline: WifiOff,
};
export function Timeline({
  events,
  timeZone,
}: {
  events: HomeEvent[];
  timeZone: string;
}) {
  return (
    <section
      className="panel timeline-panel"
      aria-labelledby="timeline-heading"
    >
      <div className="panel-heading">
        <div className="heading-with-icon">
          <Clock3 size={18} aria-hidden="true" />
          <h2 id="timeline-heading">Home timeline</h2>
        </div>
        <span className="count" aria-label={`${events.length} events`}>
          {events.length}
        </span>
      </div>
      <p className="panel-subtitle">Little moments, in order.</p>
      <div className="timeline-context">
        <span className="context-dot" /> THIS DEMO SESSION{" "}
        <span className="timezone">{timeZone.replaceAll("_", " ")}</span>
      </div>
      {events.length === 0 ? (
        <EmptyState
          icon={<House size={29} strokeWidth={1.4} />}
          title="Your timeline starts here."
        >
          Simulate a doorbell press or a little movement. Your first moment will
          appear here.
        </EmptyState>
      ) : (
        <ol
          className="event-list"
          aria-label="Simulated home events"
          tabIndex={0}
        >
          {[...events].reverse().map((event) => {
            const Icon = icons[event.type];
            return (
              <li className={`event event-${event.type}`} key={event.id}>
                <span className="event-icon">
                  <Icon size={18} aria-hidden="true" />
                </span>
                <div className="event-content">
                  <div className="event-location">
                    {event.location} <span>Simulated</span>
                  </div>
                  <h3>{EVENT_META[event.type].title}</h3>
                  <time
                    dateTime={event.timestamp}
                    title={`${event.timestamp} · ${timeZone}`}
                  >
                    {formatDate(event.timestamp, timeZone)} ·{" "}
                    {formatTime(event.timestamp, timeZone)}
                  </time>
                  <p>{EVENT_META[event.type].description}</p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
      <div className="timeline-note">
        <Info size={16} aria-hidden="true" />
        <p>
          Events offer context. They don’t tell us who is home or how anyone is
          doing.
        </p>
      </div>
      {events.length === 100 && (
        <p className="limit-note">
          Showing the latest 100 events. Reset to start fresh.
        </p>
      )}
    </section>
  );
}
