import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C } from "./theme";

export const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame / 90) * 40;
  return (
    <AbsoluteFill style={{ background: `radial-gradient(1400px 900px at 30% 20%, ${C.navy2} 0%, ${C.navyDeep} 60%, #03081A 100%)` }}>
      {/* Drifting blobs */}
      <div
        style={{
          position: "absolute",
          width: 900,
          height: 900,
          left: -200 + drift,
          top: -300,
          background: `radial-gradient(circle, ${C.blue}55 0%, transparent 60%)`,
          filter: "blur(30px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 800,
          height: 800,
          right: -200 - drift,
          bottom: -200,
          background: `radial-gradient(circle, ${C.teal}40 0%, transparent 60%)`,
          filter: "blur(30px)",
        }}
      />
      {/* Subtle grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            `linear-gradient(${C.white}06 1px, transparent 1px), linear-gradient(90deg, ${C.white}06 1px, transparent 1px)`,
          backgroundSize: "80px 80px",
          maskImage: "radial-gradient(ellipse at center, black 40%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 40%, transparent 80%)",
        }}
      />
    </AbsoluteFill>
  );
};
