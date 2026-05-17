import type { TraceEvent } from "@/lib/traces/types";
import TraceEventCard from "./TraceEventCard";

interface Props {
  events: TraceEvent[];
}

export default function TraceTimeline({ events }: Props) {
  if (events.length === 0) {
    return (
      <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "#404040" }}>
        No events recorded for this workflow run.
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {events.map((ev, i) => (
        <TraceEventCard key={ev.id} event={ev} index={i} />
      ))}
    </div>
  );
}
