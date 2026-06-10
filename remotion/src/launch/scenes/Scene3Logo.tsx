import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { loadFont as loadDisplay } from "@remotion/google-fonts/Fraunces";
import { loadFont as loadBody } from "@remotion/google-fonts/Inter";
import { C } from "../theme";

const { fontFamily: display } = loadDisplay("normal", { weights: ["700", "900"], subsets: ["latin"] });
const { fontFamily: body } = loadBody("normal", { weights: ["400", "600", "700"], subsets: ["latin"] });

export const Scene3Logo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Logo spring zoom
  const logoS = spring({ frame, fps, config: { damping: 14, stiffness: 110 } });
  const logoScale = interpolate(logoS, [0, 1], [0.25, 1]);
  const logoOp = interpolate(frame, [0, 16], [0, 1], { extrapolateRight: "clamp" });

  // Burst rays
  const burst = interpolate(frame, [10, 60], [0, 1], { extrapolateRight: "clamp" });
  const burstOp = interpolate(frame, [10, 30, 70, 90], [0, 0.5, 0.5, 0]);

  // Title
  const titleOp = interpolate(frame, [40, 60], [0, 1], { extrapolateRight: "clamp" });
  const titleY = interpolate(spring({ frame: frame - 40, fps, config: { damping: 18 } }), [0, 1], [30, 0]);

  // Tagline reveal (clip-path swipe)
  const tagW = interpolate(frame, [70, 110], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const fadeOut = interpolate(frame, [190, 210], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", textAlign: "center", opacity: fadeOut }}>
      {/* Burst rays behind logo */}
      <div
        style={{
          position: "absolute",
          width: 1400,
          height: 1400,
          borderRadius: "50%",
          background: `conic-gradient(from 0deg, ${C.blue}00, ${C.blue}55, ${C.teal}55, ${C.blue}00, ${C.teal}55, ${C.blue}00)`,
          transform: `scale(${0.4 + burst * 0.8}) rotate(${frame * 0.6}deg)`,
          opacity: burstOp,
          filter: "blur(20px)",
        }}
      />

      <div style={{ opacity: logoOp, transform: `scale(${logoScale})`, marginBottom: 24 }}>
        <Img src={staticFile("cb-logo.jpeg")} style={{ width: 360, height: 360, objectFit: "cover", objectPosition: "0 0", borderRadius: 32, mixBlendMode: "screen" }} />
      </div>

      <h1
        style={{
          opacity: titleOp,
          transform: `translateY(${titleY}px)`,
          fontFamily: display,
          fontSize: 110,
          fontWeight: 900,
          color: C.white,
          margin: 0,
          lineHeight: 1,
          letterSpacing: -1,
        }}
      >
        The <span style={{ background: `linear-gradient(135deg, ${C.blueSoft}, ${C.teal})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Career Boost</span>
      </h1>

      <div
        style={{
          marginTop: 32,
          fontFamily: body,
          fontSize: 38,
          color: C.white,
          fontWeight: 600,
          overflow: "hidden",
          clipPath: `inset(0 ${100 - tagW}% 0 0)`,
        }}
      >
        Turn Applications Into Interviews.
      </div>
    </AbsoluteFill>
  );
};
