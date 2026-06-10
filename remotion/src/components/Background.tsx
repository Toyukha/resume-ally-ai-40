import { AbsoluteFill, useCurrentFrame } from "remotion";
import { COLORS } from "../theme";

export const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame / 80) * 40;
  return (
    <AbsoluteFill style={{ background: COLORS.bgDeep, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at ${50 + drift / 20}% 30%, ${COLORS.primary}55, transparent 55%), radial-gradient(circle at 20% 80%, ${COLORS.gold}22, transparent 50%), linear-gradient(180deg, ${COLORS.bg} 0%, ${COLORS.bgDeep} 100%)`,
        }}
      />
      {/* subtle grid */}
      <svg
        width="100%"
        height="100%"
        style={{ position: "absolute", inset: 0, opacity: 0.08 }}
      >
        <defs>
          <pattern id="g" width="80" height="80" patternUnits="userSpaceOnUse">
            <path d="M80 0H0V80" fill="none" stroke={COLORS.gold} strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#g)" />
      </svg>
      {/* floating orbs */}
      {[0, 1, 2].map((i) => {
        const y = 200 + i * 280 + Math.sin((frame + i * 30) / 40) * 30;
        const x = 1500 - i * 200 + Math.cos((frame + i * 20) / 50) * 40;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: 12,
              height: 12,
              borderRadius: 999,
              background: i % 2 ? COLORS.gold : COLORS.primary,
              boxShadow: `0 0 40px ${i % 2 ? COLORS.gold : COLORS.primary}`,
              opacity: 0.6,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
