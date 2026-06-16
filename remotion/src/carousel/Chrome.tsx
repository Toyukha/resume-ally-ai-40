import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";
import { C, SCENE_LEN } from "./theme";

const { fontFamily: inter } = loadInter("normal", { weights: ["500", "700", "800"], subsets: ["latin"] });
const { fontFamily: mono } = loadMono("normal", { weights: ["500"], subsets: ["latin"] });

export const Chrome: React.FC<{ format: "9x16" | "1x1" }> = ({ format }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const slideIdx = Math.min(5, Math.floor(frame / SCENE_LEN));
  const progress = interpolate(frame, [0, durationInFrames], [0, 100], {
    extrapolateRight: "clamp",
  });

  const pad = format === "9x16" ? 60 : 48;
  const fs = format === "9x16" ? 24 : 22;

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {/* top-left wordmark */}
      <div
        style={{
          position: "absolute",
          top: pad,
          left: pad,
          fontFamily: inter,
          fontWeight: 800,
          color: C.white,
          fontSize: fs,
          letterSpacing: -0.5,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 14,
            height: 14,
            borderRadius: 4,
            background: `linear-gradient(135deg, ${C.cyan}, ${C.violet})`,
            boxShadow: `0 0 18px ${C.cyan}88`,
          }}
        />
        The Career Boost
      </div>

      {/* top-right counter */}
      <div
        style={{
          position: "absolute",
          top: pad,
          right: pad,
          fontFamily: mono,
          fontWeight: 500,
          color: C.dim,
          fontSize: fs,
          letterSpacing: 2,
        }}
      >
        <span style={{ color: C.white }}>{String(slideIdx + 1).padStart(2, "0")}</span>
        <span style={{ opacity: 0.5 }}> / 06</span>
      </div>

      {/* bottom progress bar */}
      <div
        style={{
          position: "absolute",
          bottom: pad,
          left: pad,
          right: pad,
          height: 4,
          borderRadius: 999,
          background: `${C.white}1A`,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: "100%",
            background: `linear-gradient(90deg, ${C.cyan}, ${C.violet})`,
            boxShadow: `0 0 12px ${C.cyan}`,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
