import type { CSSProperties } from "react";

const ROLE_COLORS: Record<string, string> = {
  Citizen:     "#6366f1",
  Policymaker: "#3b82f6",
  Expert:      "#10b981",
  Skeptic:     "#f59e0b",
  Activist:    "#f43f5e",
  Journalist:  "#8b5cf6",
  Researcher:  "#06b6d4",
  Analyst:     "#64748b",
  Observer:    "#737373",
  Enthusiast:  "#f97316",
};

export function roleColor(role: string): string {
  return ROLE_COLORS[role] ?? "#6366f1";
}

interface JurorFaceProps {
  role: string;
  sentiment?: "positive" | "negative" | "neutral" | null;
  size?: number;
  isThinking?: boolean;
  style?: CSSProperties;
  className?: string;
}

export default function JurorFace({
  role,
  sentiment = null,
  size = 44,
  isThinking = false,
  style,
  className,
}: JurorFaceProps) {
  const color = roleColor(role);
  const s = size;
  const cx = s / 2;
  const cy = s / 2;
  const r = s / 2 - 1;

  // Eye positions
  const eyeY = cy - s * 0.08;
  const eyeLX = cx - s * 0.16;
  const eyeRX = cx + s * 0.16;
  const eyeR = s * 0.07;
  const pupilR = s * 0.038;

  // Mouth path
  let mouthPath: string;
  const mY = cy + s * 0.12;
  const mW = s * 0.22;
  if (sentiment === "positive") {
    // smile arc upward
    mouthPath = `M ${cx - mW} ${mY} Q ${cx} ${mY + mW * 0.9} ${cx + mW} ${mY}`;
  } else if (sentiment === "negative") {
    // frown arc downward
    mouthPath = `M ${cx - mW} ${mY + mW * 0.6} Q ${cx} ${mY - mW * 0.3} ${cx + mW} ${mY + mW * 0.6}`;
  } else {
    // neutral flat line
    mouthPath = `M ${cx - mW} ${mY + mW * 0.2} L ${cx + mW} ${mY + mW * 0.2}`;
  }

  // Thinking dots positions (three small dots at bottom of face)
  const dotY = cy + r * 0.7;

  return (
    <svg
      width={s}
      height={s}
      viewBox={`0 0 ${s} ${s}`}
      style={{ flexShrink: 0, ...style }}
      className={className}
      aria-hidden="true"
    >
      {/* Face background */}
      <circle cx={cx} cy={cy} r={r} fill={color} opacity={0.88} />

      {/* Subtle highlight top-left */}
      <circle cx={cx - r * 0.25} cy={cy - r * 0.3} r={r * 0.35} fill="white" opacity={0.12} />

      {/* Eyes (whites) */}
      <circle cx={eyeLX} cy={eyeY} r={eyeR} fill="white" opacity={0.95} />
      <circle cx={eyeRX} cy={eyeY} r={eyeR} fill="white" opacity={0.95} />

      {/* Pupils */}
      {!isThinking && (
        <>
          <circle cx={eyeLX} cy={eyeY + pupilR * 0.4} r={pupilR} fill="rgba(0,0,0,0.75)" />
          <circle cx={eyeRX} cy={eyeY + pupilR * 0.4} r={pupilR} fill="rgba(0,0,0,0.75)" />
        </>
      )}

      {/* Thinking pupils (upward) */}
      {isThinking && (
        <>
          <circle cx={eyeLX} cy={eyeY - pupilR * 0.5} r={pupilR} fill="rgba(0,0,0,0.75)" />
          <circle cx={eyeRX} cy={eyeY - pupilR * 0.5} r={pupilR} fill="rgba(0,0,0,0.75)" />
        </>
      )}

      {/* Mouth */}
      {!isThinking && (
        <path
          d={mouthPath}
          fill="none"
          stroke="white"
          strokeWidth={s * 0.045}
          strokeLinecap="round"
          opacity={0.9}
        />
      )}

      {/* Thinking dots (animated via CSS on the parent) */}
      {isThinking && (
        <>
          <circle cx={cx - s * 0.12} cy={dotY} r={s * 0.05} fill="white" opacity={0.6} />
          <circle cx={cx}             cy={dotY} r={s * 0.05} fill="white" opacity={0.6} />
          <circle cx={cx + s * 0.12} cy={dotY} r={s * 0.05} fill="white" opacity={0.6} />
        </>
      )}
    </svg>
  );
}
