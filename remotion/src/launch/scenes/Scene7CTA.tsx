import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { loadFont as loadDisplay } from "@remotion/google-fonts/Fraunces";
import { loadFont as loadBody } from "@remotion/google-fonts/Inter";
import { C } from "../theme";

const { fontFamily: display } = loadDisplay("normal", { weights: ["700", "900"], subsets: ["latin"] });
const { fontFamily: body } = loadBody("normal", { weights: ["400", "600", "700"], subsets: ["latin"] });

const PLANS = [
  { name: "Free", price: "₦0", perk: "1 FREE CV Analysis", highlight: false },
  { name: "Pro Plan 1", price: "₦5,000", perk: "20 CV Analyses", highlight: true },
  { name: "Pro Plan 2", price: "₦10,000", perk: "30 CV Analyses", highlight: false },
];

export const Scene7CTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Pricing cards fan in
  const cardsOut = interpolate(frame, [110, 140], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Big CTA emerges after cards dissolve
  const ctaStart = 130;
  const ctaS = spring({ frame: frame - ctaStart, fps, config: { damping: 14, stiffness: 140 } });
  const ctaScale = interpolate(ctaS, [0, 1], [0.6, 1]);
  const ctaOp = interpolate(frame, [ctaStart, ctaStart + 16], [0, 1], { extrapolateRight: "clamp" });

  const startFreeOp = interpolate(frame, [170, 190], [0, 1], { extrapolateRight: "clamp" });

  // URL underline swipe
  const urlW = interpolate(frame, [220, 260], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const urlOp = interpolate(frame, [210, 230], [0, 1], { extrapolateRight: "clamp" });

  // Tagline
  const tagOp = interpolate(frame, [280, 310], [0, 1], { extrapolateRight: "clamp" });

  // Pulse on big pill
  const pulse = 1 + Math.sin(frame / 8) * 0.02;

  // Final crescendo zoom
  const finalScale = interpolate(frame, [330, 390], [1, 1.04], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", textAlign: "center", transform: `scale(${finalScale})` }}>
      {/* Pricing flash */}
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity: cardsOut, gap: 28 }}>
        {PLANS.map((p, i) => {
          const start = i * 10;
          const s = spring({ frame: frame - start, fps, config: { damping: 16 } });
          const y = interpolate(s, [0, 1], [60, 0]);
          const op = interpolate(frame, [start, start + 16], [0, 1], { extrapolateRight: "clamp" });
          return (
            <div
              key={p.name}
              style={{
                width: 300,
                padding: 36,
                borderRadius: 20,
                background: p.highlight ? `linear-gradient(180deg, ${C.blue}33, ${C.navy2})` : `${C.navy2}99`,
                border: p.highlight ? `1.5px solid ${C.teal}` : `1px solid ${C.white}15`,
                transform: `translateY(${y}px) ${p.highlight ? "scale(1.05)" : ""}`,
                opacity: op,
                boxShadow: p.highlight ? `0 30px 60px -10px ${C.teal}44` : "none",
              }}
            >
              <div style={{ fontFamily: body, color: C.dim, fontSize: 14, letterSpacing: 3, fontWeight: 700 }}>{p.name.toUpperCase()}</div>
              <div style={{ fontFamily: display, color: C.white, fontSize: 52, fontWeight: 900, margin: "14px 0" }}>{p.price}</div>
              <div style={{ fontFamily: body, color: C.teal, fontSize: 16, fontWeight: 600 }}>{p.perk}</div>
            </div>
          );
        })}
      </div>

      {/* Final CTA stack */}
      <div style={{ opacity: ctaOp, transform: `scale(${ctaScale})` }}>
        <div style={{ opacity: startFreeOp, fontFamily: body, color: C.teal, letterSpacing: 6, fontSize: 20, fontWeight: 700, marginBottom: 18 }}>
          ★  START FREE TODAY  ★
        </div>
        <h1 style={{ fontFamily: display, fontSize: 140, fontWeight: 900, color: C.white, margin: 0, lineHeight: 0.95, letterSpacing: -2 }}>
          Your next role,
          <br />
          <span style={{ background: `linear-gradient(135deg, ${C.blueSoft}, ${C.teal})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            one upload away.
          </span>
        </h1>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 14,
            marginTop: 50,
            padding: "26px 56px",
            background: `linear-gradient(135deg, ${C.blue}, ${C.teal})`,
            borderRadius: 999,
            fontFamily: body,
            color: C.white,
            fontWeight: 700,
            fontSize: 30,
            transform: `scale(${pulse})`,
            boxShadow: `0 30px 80px -10px ${C.teal}66`,
          }}
        >
          1 Free CV Analysis  →
        </div>

        <div
          style={{
            marginTop: 56,
            display: "inline-block",
            position: "relative",
            opacity: urlOp,
            fontFamily: body,
            color: C.white,
            fontSize: 32,
            fontWeight: 700,
            letterSpacing: 2,
          }}
        >
          www.thecareerboost.com
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: -8,
              height: 3,
              background: `linear-gradient(90deg, ${C.blue}, ${C.teal})`,
              clipPath: `inset(0 ${100 - urlW}% 0 0)`,
            }}
          />
        </div>

        <div style={{ opacity: tagOp, marginTop: 30, fontFamily: body, color: C.dim, fontSize: 22, fontStyle: "italic" }}>
          Helping job seekers turn applications into opportunities.
        </div>
      </div>
    </AbsoluteFill>
  );
};
