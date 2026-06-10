import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { loadFont as loadDisplay } from "@remotion/google-fonts/Fraunces";
import { loadFont as loadBody } from "@remotion/google-fonts/Inter";
import { C } from "../theme";

const { fontFamily: display } = loadDisplay("normal", { weights: ["700", "900"], subsets: ["latin"] });
const { fontFamily: body } = loadBody("normal", { weights: ["400", "600", "700"], subsets: ["latin"] });

const Ring: React.FC<{ value: number; color: string; label: string; sub: string }> = ({ value, color, label, sub }) => {
  const R = 130;
  const C_ = 2 * Math.PI * R;
  return (
    <div style={{ position: "relative", width: 340, height: 340 }}>
      <svg width="340" height="340" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="170" cy="170" r={R} fill="none" stroke={`${C.white}15`} strokeWidth="20" />
        <circle
          cx="170"
          cy="170"
          r={R}
          fill="none"
          stroke={color}
          strokeWidth="20"
          strokeLinecap="round"
          strokeDasharray={C_}
          strokeDashoffset={C_ * (1 - value / 100)}
          style={{ filter: `drop-shadow(0 0 12px ${color}99)` }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: display, fontSize: 96, fontWeight: 900, color: C.white, lineHeight: 1 }}>
          {Math.round(value)}<span style={{ color, fontSize: 52 }}>%</span>
        </div>
        <div style={{ fontFamily: body, color: C.dim, fontSize: 14, letterSpacing: 3, marginTop: 6 }}>{label}</div>
        <div style={{ fontFamily: body, color, fontSize: 16, fontWeight: 700, marginTop: 6 }}>{sub}</div>
      </div>
    </div>
  );
};

export const Scene6Transform: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headOp = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: "clamp" });

  // Before stays at 42
  const beforeS = spring({ frame, fps, config: { damping: 14 } });
  const beforeOp = interpolate(beforeS, [0, 1], [0, 1]);

  // After animates from 42 -> 84
  const afterStart = 60;
  const afterVal = interpolate(frame, [afterStart, afterStart + 70], [42, 84], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const afterOp = interpolate(frame, [40, 60], [0, 1], { extrapolateRight: "clamp" });

  // Arrow
  const arrowOp = interpolate(frame, [50, 70], [0, 1], { extrapolateRight: "clamp" });

  // Toast
  const toastS = spring({ frame: frame - 160, fps, config: { damping: 10 } });
  const toastY = interpolate(toastS, [0, 1], [-80, 0]);
  const toastOp = interpolate(frame, [160, 180], [0, 1], { extrapolateRight: "clamp" });

  // Stats stagger
  const stats = ["More Visibility.", "More Confidence.", "More Interviews."];
  const fadeOut = interpolate(frame, [335, 360], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: fadeOut }}>
      <div style={{ opacity: headOp, fontFamily: body, color: C.teal, letterSpacing: 6, fontSize: 16, fontWeight: 700, marginBottom: 14 }}>
        THE TRANSFORMATION
      </div>
      <div style={{ opacity: headOp, fontFamily: display, fontSize: 64, color: C.white, marginBottom: 40, fontWeight: 700 }}>
        From <span style={{ color: C.danger }}>rejected</span> to <span style={{ color: C.teal }}>recruiter-ready</span>.
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 80 }}>
        <div style={{ opacity: beforeOp }}>
          <Ring value={42} color={C.danger} label="ATS SCORE" sub="BEFORE" />
        </div>
        <div style={{ opacity: arrowOp, fontFamily: display, fontSize: 80, color: C.teal }}>→</div>
        <div style={{ opacity: afterOp }}>
          <Ring value={afterVal} color={C.teal} label="ATS SCORE" sub="AFTER" />
        </div>
      </div>

      {/* Toast */}
      <div
        style={{
          marginTop: 50,
          transform: `translateY(${toastY}px)`,
          opacity: toastOp,
          background: `${C.teal}22`,
          border: `1.5px solid ${C.teal}`,
          padding: "16px 28px",
          borderRadius: 999,
          fontFamily: body,
          color: C.white,
          fontSize: 22,
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          gap: 14,
          boxShadow: `0 20px 60px -10px ${C.teal}55`,
        }}
      >
        <span style={{ fontSize: 26 }}>🎉</span> New interview invitation from a recruiter
      </div>

      {/* Stats row */}
      <div style={{ display: "flex", gap: 60, marginTop: 50 }}>
        {stats.map((s, i) => {
          const start = 220 + i * 18;
          const op = interpolate(frame, [start, start + 14], [0, 1], { extrapolateRight: "clamp" });
          const y = interpolate(frame, [start, start + 14], [20, 0], { extrapolateRight: "clamp" });
          return (
            <div
              key={s}
              style={{
                opacity: op,
                transform: `translateY(${y}px)`,
                fontFamily: display,
                color: C.white,
                fontSize: 38,
                fontWeight: 700,
                borderTop: `2px solid ${C.teal}`,
                paddingTop: 14,
              }}
            >
              {s}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
