import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { loadFont as loadBody } from "@remotion/google-fonts/Inter";
import { loadFont as loadDisplay } from "@remotion/google-fonts/Fraunces";
import { COLORS } from "../theme";

const { fontFamily: body } = loadBody("normal", { weights: ["400", "600"], subsets: ["latin"] });
const { fontFamily: display } = loadDisplay("normal", { weights: ["700"], subsets: ["latin"] });

const BEFORE = [
  "Worked on the team",
  "Helped customers",
  "Did some reports",
];
const AFTER = [
  "Led 6-person engineering team",
  "Increased CSAT by 32%",
  "Authored 14 KPI dashboards",
];

export const Scene4Optimize: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleOp = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });

  const leftIn = spring({ frame, fps, config: { damping: 16 } });
  const leftX = interpolate(leftIn, [0, 1], [-80, 0]);

  const rightIn = spring({ frame: frame - 10, fps, config: { damping: 16 } });
  const rightX = interpolate(rightIn, [0, 1], [80, 0]);
  const rightOp = interpolate(frame, [10, 25], [0, 1], { extrapolateRight: "clamp" });

  const fadeOut = interpolate(frame, [100, 115], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: fadeOut, padding: "0 120px" }}>
      <div style={{ opacity: titleOp, fontFamily: body, color: COLORS.gold, letterSpacing: 5, fontSize: 18, fontWeight: 600, marginBottom: 16 }}>
        STEP 03 — AI REWRITE
      </div>
      <div style={{ opacity: titleOp, fontFamily: display, fontSize: 56, color: COLORS.text, marginBottom: 56, textAlign: "center" }}>
        Generic → <span style={{ color: COLORS.goldSoft, fontStyle: "italic" }}>recruiter-ready</span>.
      </div>

      <div style={{ display: "flex", gap: 48, alignItems: "stretch" }}>
        {/* Before */}
        <div
          style={{
            transform: `translateX(${leftX}px)`,
            width: 560,
            background: `${COLORS.surface}aa`,
            border: `1px solid #ffffff15`,
            borderRadius: 16,
            padding: 36,
          }}
        >
          <div style={{ fontFamily: body, color: COLORS.textDim, letterSpacing: 3, fontSize: 13, marginBottom: 18 }}>
            BEFORE
          </div>
          {BEFORE.map((t, i) => (
            <div key={t} style={{ fontFamily: body, color: "#7a8a85", fontSize: 22, padding: "12px 0", borderBottom: i < BEFORE.length - 1 ? `1px solid #ffffff08` : "none", textDecoration: "line-through", textDecorationColor: `${COLORS.gold}55` }}>
              • {t}
            </div>
          ))}
        </div>

        {/* Arrow */}
        <div style={{ display: "flex", alignItems: "center", fontSize: 56, color: COLORS.gold, opacity: rightOp }}>
          →
        </div>

        {/* After */}
        <div
          style={{
            transform: `translateX(${rightX}px)`,
            opacity: rightOp,
            width: 560,
            background: `linear-gradient(180deg, ${COLORS.surface2}, ${COLORS.surface})`,
            border: `1px solid ${COLORS.gold}55`,
            borderRadius: 16,
            padding: 36,
            boxShadow: `0 30px 80px -20px ${COLORS.gold}33`,
          }}
        >
          <div style={{ fontFamily: body, color: COLORS.gold, letterSpacing: 3, fontSize: 13, marginBottom: 18 }}>
            AFTER ✨
          </div>
          {AFTER.map((t, i) => {
            const start = 30 + i * 12;
            const op = interpolate(frame, [start, start + 14], [0, 1], { extrapolateRight: "clamp" });
            const y = interpolate(frame, [start, start + 14], [12, 0], { extrapolateRight: "clamp" });
            return (
              <div
                key={t}
                style={{
                  opacity: op,
                  transform: `translateY(${y}px)`,
                  fontFamily: body,
                  color: COLORS.text,
                  fontSize: 22,
                  fontWeight: 600,
                  padding: "12px 0",
                  borderBottom: i < AFTER.length - 1 ? `1px solid ${COLORS.gold}22` : "none",
                }}
              >
                • {t}
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
