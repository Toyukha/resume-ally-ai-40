import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { loadFont as loadBody } from "@remotion/google-fonts/Inter";
import { loadFont as loadDisplay } from "@remotion/google-fonts/Fraunces";
import { COLORS } from "../theme";

const { fontFamily: body } = loadBody("normal", { weights: ["400", "600"], subsets: ["latin"] });
const { fontFamily: display } = loadDisplay("normal", { weights: ["700"], subsets: ["latin"] });

export const Scene5CTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 14 } });
  const scale = interpolate(s, [0, 1], [0.85, 1]);
  const op = interpolate(frame, [0, 14], [0, 1], { extrapolateRight: "clamp" });

  const subOp = interpolate(frame, [18, 34], [0, 1], { extrapolateRight: "clamp" });
  const pillOp = interpolate(frame, [28, 44], [0, 1], { extrapolateRight: "clamp" });
  const pillS = spring({ frame: frame - 28, fps, config: { damping: 12 } });
  const pillScale = interpolate(pillS, [0, 1], [0.8, 1]);

  const urlOp = interpolate(frame, [50, 66], [0, 1], { extrapolateRight: "clamp" });

  // pulse on CTA
  const pulse = 1 + Math.sin(frame / 6) * 0.015;

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ opacity: op, transform: `scale(${scale})`, textAlign: "center" }}>
        <div style={{ fontFamily: body, color: COLORS.gold, letterSpacing: 6, fontSize: 20, fontWeight: 600 }}>
          ★ ★ ★ ★ ★
        </div>
        <h1
          style={{
            fontFamily: display,
            fontSize: 130,
            color: COLORS.text,
            margin: "20px 0 0",
            lineHeight: 1,
            letterSpacing: -2,
          }}
        >
          Land your <span style={{ color: COLORS.goldSoft, fontStyle: "italic" }}>next role.</span>
        </h1>
        <div
          style={{
            opacity: subOp,
            fontFamily: body,
            color: COLORS.textDim,
            fontSize: 32,
            marginTop: 32,
          }}
        >
          Free to start · No credit card · Results in 60s
        </div>

        <div
          style={{
            opacity: pillOp,
            transform: `scale(${pillScale * pulse})`,
            marginTop: 56,
            display: "inline-flex",
            alignItems: "center",
            gap: 16,
            padding: "26px 56px",
            background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.gold})`,
            borderRadius: 999,
            fontFamily: body,
            fontWeight: 700,
            fontSize: 30,
            color: COLORS.text,
            boxShadow: `0 30px 80px -10px ${COLORS.gold}55`,
          }}
        >
          Upload your resume →
        </div>

        <div
          style={{
            opacity: urlOp,
            marginTop: 56,
            fontFamily: body,
            color: COLORS.gold,
            letterSpacing: 4,
            fontSize: 24,
            fontWeight: 600,
          }}
        >
          thecareerboost.com
        </div>
      </div>
    </AbsoluteFill>
  );
};
