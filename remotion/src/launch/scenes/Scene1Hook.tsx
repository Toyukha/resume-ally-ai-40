import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { loadFont as loadDisplay } from "@remotion/google-fonts/Fraunces";
import { loadFont as loadBody } from "@remotion/google-fonts/Inter";
import { C } from "../theme";

const { fontFamily: display } = loadDisplay("normal", { weights: ["700", "900"], subsets: ["latin"] });
const { fontFamily: body } = loadBody("normal", { weights: ["400", "600", "700"], subsets: ["latin"] });

const REJECTIONS = [
  "Unfortunately, we will not be moving forward...",
  "We regret to inform you...",
  "After careful consideration...",
  "We've decided to pursue other candidates...",
  "Thank you for your interest, however...",
  "We will keep your resume on file...",
  "Unfortunately we cannot proceed at this time...",
  "We are unable to offer you the position...",
];

export const Scene1Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Scrolling rejection emails behind
  const scroll = interpolate(frame, [0, 240], [0, -600]);

  // Headline reveal
  const headOp = interpolate(frame, [10, 30], [0, 1], { extrapolateRight: "clamp" });
  const headY = interpolate(spring({ frame: frame - 10, fps, config: { damping: 18 } }), [0, 1], [40, 0]);

  // Big number "50"
  const numS = spring({ frame: frame - 40, fps, config: { damping: 12, stiffness: 140 } });
  const numScale = interpolate(numS, [0, 1], [0.4, 1]);
  const numOp = interpolate(frame, [40, 55], [0, 1], { extrapolateRight: "clamp" });

  // Question mark pulse
  const qPulse = 1 + Math.sin(frame / 8) * 0.04;
  const qOp = interpolate(frame, [90, 110], [0, 1], { extrapolateRight: "clamp" });
  const subOp = interpolate(frame, [110, 130], [0, 1], { extrapolateRight: "clamp" });

  const fadeOut = interpolate(frame, [215, 240], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ opacity: fadeOut }}>
      {/* Ghost rejection feed */}
      <AbsoluteFill style={{ opacity: 0.18, transform: `translateY(${scroll}px)`, padding: "60px 120px", display: "flex", flexDirection: "column", gap: 18 }}>
        {[...REJECTIONS, ...REJECTIONS, ...REJECTIONS].map((t, i) => (
          <div
            key={i}
            style={{
              fontFamily: body,
              color: C.white,
              fontSize: 28,
              borderLeft: `3px solid ${C.danger}`,
              paddingLeft: 20,
              opacity: 0.6,
            }}
          >
            <span style={{ color: C.danger, fontWeight: 700, marginRight: 12 }}>✕ Rejected</span>
            {t}
          </div>
        ))}
      </AbsoluteFill>

      {/* Vignette darken */}
      <AbsoluteFill style={{ background: `radial-gradient(ellipse at center, transparent 0%, ${C.navyDeep}EE 70%)` }} />

      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: "0 120px", textAlign: "center" }}>
        <div style={{ opacity: headOp, transform: `translateY(${headY}px)`, fontFamily: body, color: C.teal, letterSpacing: 8, fontSize: 22, fontWeight: 700, marginBottom: 32 }}>
          THE CAREER BOOST
        </div>

        <div style={{ opacity: numOp, transform: `scale(${numScale})`, marginBottom: 24 }}>
          <div style={{ fontFamily: display, fontSize: 220, fontWeight: 900, lineHeight: 0.9, color: C.white }}>
            Applied to <span style={{ background: `linear-gradient(135deg, ${C.blueSoft}, ${C.teal})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>50 jobs</span>
          </div>
        </div>

        <div style={{ opacity: qOp, transform: `scale(${qPulse})` }}>
          <h1 style={{ fontFamily: display, fontSize: 130, fontWeight: 700, color: C.white, margin: 0, lineHeight: 1 }}>
            Still no interviews<span style={{ color: C.danger }}>?</span>
          </h1>
        </div>

        <div style={{ opacity: subOp, fontFamily: body, color: C.dim, fontSize: 30, marginTop: 36, maxWidth: 1100 }}>
          You've done the work. You've applied everywhere.
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
