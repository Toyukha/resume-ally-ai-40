import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { C, SCENE_LEN } from "../theme";
import { sceneExit, wordSpring } from "../anim";

const { fontFamily } = loadInter("normal", { weights: ["500", "700", "800"], subsets: ["latin"] });

type Props = { format: "9x16" | "1x1" };

const BRAND = "The Career Boost";

export const Slide5: React.FC<Props> = ({ format }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const exit = sceneExit(frame, SCENE_LEN);

  const isV = format === "9x16";

  // sweep
  const sweep = interpolate(frame, [10, 70], [-100, 110], { extrapolateRight: "clamp" });

  // checkmark
  const checkS = spring({ frame: frame - 40, fps, config: { damping: 8, stiffness: 180 } });
  const checkScale = interpolate(checkS, [0, 1], [0, 1]);
  const checkOp = interpolate(frame, [40, 55], [0, 1], { extrapolateRight: "clamp" });

  const tail = wordSpring(frame, fps, 70);

  // pulsing glow on the wordmark
  const glow = 0.5 + Math.sin(frame / 8) * 0.3;

  return (
    <AbsoluteFill
      style={{
        opacity: exit.op,
        transform: `translateY(${exit.y}px)`,
        alignItems: "center",
        justifyContent: "center",
        padding: "0 60px",
        position: "relative",
      }}
    >
      {/* sweep band */}
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: `${sweep}%`,
          width: 400,
          background: `linear-gradient(90deg, transparent, ${C.cyan}33, ${C.violet}55, ${C.cyan}33, transparent)`,
          transform: "skewX(-20deg)",
          filter: "blur(40px)",
          mixBlendMode: "screen",
        }}
      />

      {/* checkmark */}
      <div
        style={{
          width: isV ? 160 : 130,
          height: isV ? 160 : 130,
          borderRadius: "50%",
          background: `linear-gradient(135deg, ${C.cyan}, ${C.violet})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 50,
          opacity: checkOp,
          transform: `scale(${checkScale})`,
          boxShadow: `0 0 60px ${C.cyan}88`,
        }}
      >
        <svg width={isV ? 88 : 72} height={isV ? 88 : 72} viewBox="0 0 24 24" fill="none">
          <path
            d="M4 12.5l5 5L20 7"
            stroke={C.white}
            strokeWidth={3.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* brand wordmark assembles letter by letter */}
      <div
        style={{
          fontFamily,
          fontWeight: 800,
          fontSize: isV ? 96 : 84,
          letterSpacing: -3,
          lineHeight: 1.0,
          textAlign: "center",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          maxWidth: 1000,
        }}
      >
        {BRAND.split("").map((ch, i) => {
          const d = 6 + i * 3;
          const s = spring({ frame: frame - d, fps, config: { damping: 18, stiffness: 200 } });
          const y = interpolate(s, [0, 1], [40, 0]);
          const op = interpolate(frame, [d, d + 12], [0, 1], { extrapolateRight: "clamp" });
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                transform: `translateY(${y}px)`,
                opacity: op,
                color: C.white,
                whiteSpace: "pre",
                background: `linear-gradient(135deg, ${C.white} 0%, ${C.cyan} 100%)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                textShadow: `0 0 ${glow * 40}px ${C.cyan}66`,
              }}
            >
              {ch}
            </span>
          );
        })}
      </div>

      <div
        style={{
          marginTop: 40,
          fontFamily,
          fontWeight: 500,
          color: C.dim,
          fontSize: isV ? 44 : 38,
          opacity: tail.op,
          transform: `translateY(${tail.y}px)`,
          filter: `blur(${tail.blur}px)`,
          textAlign: "center",
        }}
      >
        helps you{" "}
        <span style={{ color: C.white, fontWeight: 700 }}>fix this</span> — fast.
      </div>
    </AbsoluteFill>
  );
};
