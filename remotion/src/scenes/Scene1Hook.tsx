import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { loadFont as loadDisplay } from "@remotion/google-fonts/Fraunces";
import { loadFont as loadBody } from "@remotion/google-fonts/Inter";
import { COLORS } from "../theme";

const { fontFamily: display } = loadDisplay("normal", { weights: ["700"], subsets: ["latin"] });
const { fontFamily: body } = loadBody("normal", { weights: ["400", "600"], subsets: ["latin"] });

export const Scene1Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const op = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });
  const y = interpolate(spring({ frame, fps, config: { damping: 18 } }), [0, 1], [40, 0]);
  const lineW = interpolate(frame, [10, 40], [0, 180], { extrapolateRight: "clamp" });
  const subOp = interpolate(frame, [25, 45], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [70, 90], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ alignItems: "flex-start", justifyContent: "center", padding: "0 160px", opacity: fadeOut }}>
      <div style={{ transform: `translateY(${y}px)`, opacity: op }}>
        <div style={{ fontFamily: body, color: COLORS.gold, letterSpacing: 6, fontSize: 22, fontWeight: 600 }}>
          CAREER BOOST
        </div>
        <div style={{ height: 3, width: lineW, background: COLORS.gold, marginTop: 14, marginBottom: 28 }} />
        <h1
          style={{
            fontFamily: display,
            fontSize: 132,
            color: COLORS.text,
            lineHeight: 1.02,
            margin: 0,
            letterSpacing: -2,
            maxWidth: 1400,
          }}
        >
          Your resume,<br />
          <span style={{ color: COLORS.goldSoft, fontStyle: "italic" }}>tailored to win.</span>
        </h1>
        <div
          style={{
            fontFamily: body,
            color: COLORS.textDim,
            fontSize: 32,
            marginTop: 36,
            opacity: subOp,
            maxWidth: 1100,
          }}
        >
          Land more interviews in under a minute.
        </div>
      </div>
    </AbsoluteFill>
  );
};
