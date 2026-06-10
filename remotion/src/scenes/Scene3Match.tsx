import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { loadFont as loadBody } from "@remotion/google-fonts/Inter";
import { loadFont as loadDisplay } from "@remotion/google-fonts/Fraunces";
import { COLORS } from "../theme";

const { fontFamily: body } = loadBody("normal", { weights: ["400", "600", "700"], subsets: ["latin"] });
const { fontFamily: display } = loadDisplay("normal", { weights: ["700"], subsets: ["latin"] });

export const Scene3Match: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleOp = interpolate(frame, [0, 14], [0, 1], { extrapolateRight: "clamp" });
  const titleY = interpolate(spring({ frame, fps, config: { damping: 18 } }), [0, 1], [30, 0]);

  // animated score
  const score = Math.round(interpolate(frame, [12, 70], [42, 94], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const ringP = interpolate(frame, [12, 70], [0, 0.94], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const R = 140;
  const C = 2 * Math.PI * R;

  const keywords = ["TypeScript", "React", "Leadership", "Stakeholder Mgmt", "Agile"];
  const fadeOut = interpolate(frame, [105, 120], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: fadeOut }}>
      <div
        style={{
          opacity: titleOp,
          transform: `translateY(${titleY}px)`,
          fontFamily: body,
          color: COLORS.gold,
          letterSpacing: 5,
          fontSize: 18,
          fontWeight: 600,
          marginBottom: 16,
        }}
      >
        STEP 02 — ATS MATCH SCORE
      </div>
      <div
        style={{
          opacity: titleOp,
          transform: `translateY(${titleY}px)`,
          fontFamily: display,
          fontSize: 56,
          color: COLORS.text,
          marginBottom: 56,
        }}
      >
        See how you stack up.
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 100 }}>
        {/* Ring */}
        <div style={{ position: "relative", width: 360, height: 360 }}>
          <svg width="360" height="360" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="180" cy="180" r={R} fill="none" stroke={`${COLORS.gold}22`} strokeWidth="18" />
            <circle
              cx="180"
              cy="180"
              r={R}
              fill="none"
              stroke="url(#grad)"
              strokeWidth="18"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - ringP)}
            />
            <defs>
              <linearGradient id="grad" x1="0" x2="1">
                <stop offset="0" stopColor={COLORS.primary} />
                <stop offset="1" stopColor={COLORS.gold} />
              </linearGradient>
            </defs>
          </svg>
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ fontFamily: display, fontSize: 120, color: COLORS.text, lineHeight: 1 }}>
              {score}<span style={{ color: COLORS.gold, fontSize: 64 }}>%</span>
            </div>
            <div style={{ fontFamily: body, color: COLORS.textDim, fontSize: 18, letterSpacing: 3, marginTop: 8 }}>
              MATCH SCORE
            </div>
          </div>
        </div>

        {/* keyword list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, width: 420 }}>
          <div style={{ fontFamily: body, color: COLORS.textDim, letterSpacing: 3, fontSize: 14, marginBottom: 8 }}>
            KEYWORDS MATCHED
          </div>
          {keywords.map((k, i) => {
            const start = 20 + i * 10;
            const op = interpolate(frame, [start, start + 14], [0, 1], { extrapolateRight: "clamp" });
            const x = interpolate(frame, [start, start + 14], [40, 0], { extrapolateRight: "clamp" });
            return (
              <div
                key={k}
                style={{
                  opacity: op,
                  transform: `translateX(${x}px)`,
                  fontFamily: body,
                  color: COLORS.text,
                  fontSize: 22,
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "12px 18px",
                  background: `${COLORS.surface}cc`,
                  borderLeft: `3px solid ${COLORS.gold}`,
                  borderRadius: 6,
                }}
              >
                <span style={{ color: COLORS.gold, fontWeight: 700 }}>✓</span>
                {k}
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
