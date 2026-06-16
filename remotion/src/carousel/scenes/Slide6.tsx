import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { C, SCENE_LEN } from "../theme";
import { sceneExit, wordSpring } from "../anim";

const { fontFamily } = loadInter("normal", { weights: ["500", "700", "800"], subsets: ["latin"] });

type Props = { format: "9x16" | "1x1" };

export const Slide6: React.FC<Props> = ({ format }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const exit = sceneExit(frame, SCENE_LEN);

  const isV = format === "9x16";

  const headline = wordSpring(frame, fps, 0);
  const url = wordSpring(frame, fps, 22);

  // pulsing CTA pill
  const pulse = 1 + Math.sin(frame / 7) * 0.025;

  // cursor blink
  const blink = Math.floor(frame / 15) % 2 === 0 ? 1 : 0;

  // CTA pill spring
  const pillS = spring({ frame: frame - 50, fps, config: { damping: 14, stiffness: 140 } });
  const pillScale = interpolate(pillS, [0, 1], [0.7, 1]);
  const pillOp = interpolate(frame, [50, 70], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        opacity: exit.op,
        transform: `translateY(${exit.y}px)`,
        alignItems: "center",
        justifyContent: "center",
        padding: "0 60px",
      }}
    >
      <div
        style={{
          opacity: headline.op,
          transform: `translateY(${headline.y}px)`,
          filter: `blur(${headline.blur}px)`,
          fontFamily,
          fontWeight: 500,
          color: C.dim,
          fontSize: isV ? 44 : 38,
          letterSpacing: 4,
          textTransform: "uppercase",
          marginBottom: 36,
        }}
      >
        Start landing interviews
      </div>

      <div
        style={{
          opacity: url.op,
          transform: `translateY(${url.y}px)`,
          filter: `blur(${url.blur}px)`,
          fontFamily,
          fontWeight: 800,
          fontSize: isV ? 92 : 78,
          letterSpacing: -3,
          lineHeight: 1,
          textAlign: "center",
          background: `linear-gradient(135deg, ${C.white} 0%, ${C.cyan} 60%, ${C.violet} 100%)`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        thecareerboost.com
        <span
          style={{
            display: "inline-block",
            width: 8,
            height: isV ? 80 : 68,
            background: C.cyan,
            opacity: blink,
            marginLeft: 8,
            boxShadow: `0 0 16px ${C.cyan}`,
          }}
        />
      </div>

      <div
        style={{
          marginTop: 80,
          opacity: pillOp,
          transform: `scale(${pillScale * pulse})`,
          padding: "26px 56px",
          background: `linear-gradient(135deg, ${C.blue}, ${C.violet})`,
          borderRadius: 999,
          fontFamily,
          fontWeight: 700,
          fontSize: isV ? 38 : 34,
          color: C.white,
          boxShadow: `0 30px 80px -10px ${C.violet}88, 0 0 0 1px ${C.white}22`,
          letterSpacing: -0.5,
        }}
      >
        Upload your resume →
      </div>

      <div
        style={{
          marginTop: 36,
          fontFamily,
          color: C.dim,
          fontSize: isV ? 24 : 22,
          opacity: pillOp,
        }}
      >
        Free · 60 seconds · No credit card
      </div>
    </AbsoluteFill>
  );
};
