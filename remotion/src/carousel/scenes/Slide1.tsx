import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { C, SCENE_LEN } from "../theme";
import { sceneExit, wordSpring } from "../anim";

const { fontFamily } = loadInter("normal", { weights: ["500", "800"], subsets: ["latin"] });

type Props = { format: "9x16" | "1x1" };

export const Slide1: React.FC<Props> = ({ format }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const exit = sceneExit(frame, SCENE_LEN);

  const titleSize = format === "9x16" ? 140 : 120;
  const subSize = format === "9x16" ? 64 : 54;

  const a = wordSpring(frame, fps, 0);
  const b = wordSpring(frame, fps, 36);

  // pulsing question mark
  const pulse = 1 + Math.sin(frame / 5) * 0.08;

  // soft zoom on whole frame
  const zoom = interpolate(frame, [0, SCENE_LEN], [1, 1.04]);

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        padding: format === "9x16" ? "0 80px" : "0 80px",
        opacity: exit.op,
        transform: `translateY(${exit.y}px) scale(${zoom})`,
      }}
    >
      <div style={{ textAlign: "center", maxWidth: 1000 }}>
        <h1
          style={{
            fontFamily,
            fontWeight: 800,
            fontSize: titleSize,
            color: C.white,
            margin: 0,
            lineHeight: 1.0,
            letterSpacing: -4,
            opacity: a.op,
            transform: `translateY(${a.y}px)`,
            filter: `blur(${a.blur}px)`,
            background: `linear-gradient(135deg, ${C.white} 0%, ${C.cyan} 100%)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          You're qualified.
        </h1>
        <div
          style={{
            marginTop: 60,
            fontFamily,
            fontWeight: 500,
            fontSize: subSize,
            color: C.dim,
            lineHeight: 1.2,
            opacity: b.op,
            transform: `translateY(${b.y}px)`,
            filter: `blur(${b.blur}px)`,
          }}
        >
          So why aren't you getting{" "}
          <span style={{ color: C.white, fontWeight: 800 }}>interviews</span>
          <span
            style={{
              display: "inline-block",
              color: C.cyan,
              transform: `scale(${pulse})`,
              transformOrigin: "center",
              textShadow: `0 0 30px ${C.cyan}`,
            }}
          >
            ?
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
