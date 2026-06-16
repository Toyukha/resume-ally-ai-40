import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";
import { C, SCENE_LEN } from "../theme";
import { sceneExit, wordSpring } from "../anim";

const { fontFamily } = loadInter("normal", { weights: ["500", "700", "800"], subsets: ["latin"] });
const { fontFamily: mono } = loadMono("normal", { weights: ["500"], subsets: ["latin"] });

type Props = { format: "9x16" | "1x1" };

export const Slide2: React.FC<Props> = ({ format }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const exit = sceneExit(frame, SCENE_LEN);

  // resume card entrance
  const cardS = spring({ frame: frame - 6, fps, config: { damping: 18, stiffness: 130 } });
  const cardY = interpolate(cardS, [0, 1], [80, 0]);
  const cardOp = interpolate(frame, [6, 24], [0, 1], { extrapolateRight: "clamp" });

  // scan line
  const scanY = interpolate(frame, [20, 70], [0, 100], { extrapolateRight: "clamp" });

  // reject stamp
  const stampS = spring({ frame: frame - 75, fps, config: { damping: 6, stiffness: 200 } });
  const stampScale = interpolate(stampS, [0, 1], [3, 1]);
  const stampOp = interpolate(frame, [75, 85], [0, 1], { extrapolateRight: "clamp" });
  const stampRot = -12;

  const headline = wordSpring(frame, fps, 0);
  const sub = wordSpring(frame, fps, 95);

  const cardW = format === "9x16" ? 600 : 500;
  const cardH = format === "9x16" ? 760 : 620;

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        opacity: exit.op,
        transform: `translateY(${exit.y}px)`,
        padding: "0 60px",
      }}
    >
      {/* Headline */}
      <div
        style={{
          opacity: headline.op,
          transform: `translateY(${headline.y}px)`,
          filter: `blur(${headline.blur}px)`,
          fontFamily,
          fontWeight: 800,
          color: C.white,
          fontSize: format === "9x16" ? 78 : 64,
          textAlign: "center",
          lineHeight: 1.1,
          letterSpacing: -2,
          maxWidth: 950,
          marginBottom: 50,
        }}
      >
        <span
          style={{
            background: `linear-gradient(135deg, ${C.danger} 0%, ${C.pink} 100%)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontWeight: 800,
          }}
        >
          ATS
        </span>{" "}
        rejects resumes <br />
        before recruiters see them.
      </div>

      {/* Resume card with scan */}
      <div
        style={{
          width: cardW,
          height: cardH,
          background: C.white,
          borderRadius: 18,
          padding: 40,
          position: "relative",
          overflow: "hidden",
          boxShadow: `0 30px 80px ${C.bgDeep}, 0 0 0 1px ${C.white}22`,
          opacity: cardOp,
          transform: `translateY(${cardY}px)`,
        }}
      >
        {/* fake resume content */}
        <div style={{ fontFamily, fontWeight: 800, fontSize: 28, color: C.bgDeep }}>Alex Morgan</div>
        <div style={{ fontFamily, fontSize: 16, color: "#64748B", marginTop: 6 }}>
          Senior Product Designer
        </div>
        <div style={{ height: 1, background: "#E2E8F0", margin: "22px 0" }} />
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            style={{
              height: 10,
              background: i % 4 === 0 ? "#CBD5E1" : "#E2E8F0",
              borderRadius: 999,
              marginBottom: 14,
              width: `${100 - (i % 3) * 12}%`,
            }}
          />
        ))}

        {/* scan line */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: `${scanY}%`,
            height: 3,
            background: `linear-gradient(90deg, transparent, ${C.cyan}, transparent)`,
            boxShadow: `0 0 24px ${C.cyan}`,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            fontFamily: mono,
            fontSize: 12,
            color: C.danger,
            background: `${C.danger}15`,
            border: `1px solid ${C.danger}55`,
            padding: "4px 10px",
            borderRadius: 6,
            letterSpacing: 1,
          }}
        >
          SCANNING…
        </div>

        {/* REJECTED stamp */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              opacity: stampOp,
              transform: `scale(${stampScale}) rotate(${stampRot}deg)`,
              fontFamily,
              fontWeight: 800,
              fontSize: 88,
              color: C.danger,
              border: `8px solid ${C.danger}`,
              padding: "10px 40px",
              letterSpacing: 4,
              borderRadius: 8,
              textShadow: `2px 2px 0 ${C.danger}33`,
            }}
          >
            REJECTED
          </div>
        </div>
      </div>

      {/* caption pill */}
      <div
        style={{
          marginTop: 40,
          opacity: sub.op,
          transform: `translateY(${sub.y}px)`,
          padding: "14px 28px",
          background: "rgba(0,0,0,0.55)",
          borderRadius: 999,
          fontFamily,
          fontWeight: 600,
          color: C.white,
          fontSize: 26,
          border: `1px solid ${C.white}22`,
        }}
      >
        75% of resumes never reach a human.
      </div>
    </AbsoluteFill>
  );
};
