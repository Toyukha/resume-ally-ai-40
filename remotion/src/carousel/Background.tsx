import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { C } from "./theme";

export const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const t = frame / durationInFrames;

  // drifting mesh-gradient positions
  const x1 = interpolate(t, [0, 1], [10, 70]);
  const y1 = interpolate(t, [0, 1], [20, 80]);
  const x2 = interpolate(t, [0, 1], [85, 30]);
  const y2 = interpolate(t, [0, 1], [70, 20]);
  const x3 = interpolate(t, [0, 1], [50, 60]);
  const y3 = interpolate(t, [0, 1], [50, 40]);

  const wobble = Math.sin(frame / 24) * 6;

  return (
    <AbsoluteFill style={{ background: C.bgDeep, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: `
            radial-gradient(circle at ${x1}% ${y1}%, ${C.blue}55 0%, transparent 45%),
            radial-gradient(circle at ${x2}% ${y2}%, ${C.violet}55 0%, transparent 50%),
            radial-gradient(circle at ${x3}% ${y3 + wobble}%, ${C.cyan}44 0%, transparent 40%),
            linear-gradient(135deg, ${C.bgDeep} 0%, ${C.bg} 100%)
          `,
        }}
      />
      {/* grid overlay */}
      <AbsoluteFill
        style={{
          backgroundImage: `
            linear-gradient(${C.white}0A 1px, transparent 1px),
            linear-gradient(90deg, ${C.white}0A 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px",
          opacity: 0.6,
          mixBlendMode: "screen",
        }}
      />
      {/* vignette */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at center, transparent 40%, ${C.bgDeep}AA 100%)`,
        }}
      />
    </AbsoluteFill>
  );
};
