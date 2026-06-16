import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { C, SCENE_LEN } from "../theme";
import { sceneExit, wordSpring } from "../anim";

const { fontFamily } = loadInter("normal", { weights: ["500", "700", "800"], subsets: ["latin"] });

type Props = { format: "9x16" | "1x1" };

export const Slide4: React.FC<Props> = ({ format }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const exit = sceneExit(frame, SCENE_LEN);

  const headline = wordSpring(frame, fps, 0);
  const sub = wordSpring(frame, fps, 95);

  const isV = format === "9x16";
  const cols = 4;
  const rows = isV ? 5 : 4;
  const total = cols * rows;

  // highlighted "different" card is one of them
  const highlightIdx = Math.floor((rows * cols) / 2) + 1;
  const highlightAppear = interpolate(frame, [85, 105], [0, 1], { extrapolateRight: "clamp" });

  const cardW = isV ? 170 : 180;
  const cardH = isV ? 220 : 220;
  const gap = 18;

  return (
    <AbsoluteFill
      style={{
        opacity: exit.op,
        transform: `translateY(${exit.y}px)`,
        alignItems: "center",
        padding: isV ? "180px 60px 60px" : "140px 60px 60px",
      }}
    >
      <div
        style={{
          opacity: headline.op,
          transform: `translateY(${headline.y}px)`,
          filter: `blur(${headline.blur}px)`,
          fontFamily,
          fontWeight: 800,
          color: C.white,
          fontSize: isV ? 80 : 68,
          textAlign: "center",
          lineHeight: 1.1,
          letterSpacing: -2,
          marginBottom: 50,
        }}
      >
        Generic CVs <br />
        rarely{" "}
        <span
          style={{
            background: `linear-gradient(135deg, ${C.cyan}, ${C.violet})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          stand out.
        </span>
      </div>

      {/* grid of identical resumes */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, ${cardW}px)`,
          gridAutoRows: `${cardH}px`,
          gap,
        }}
      >
        {Array.from({ length: total }).map((_, i) => {
          const delay = 12 + i * 2;
          const s = spring({ frame: frame - delay, fps, config: { damping: 18, stiffness: 160 } });
          const scale = interpolate(s, [0, 1], [0.6, 1]);
          const op = interpolate(frame, [delay, delay + 14], [0, 1], {
            extrapolateRight: "clamp",
          });

          const isHi = i === highlightIdx;
          const hiOp = isHi ? highlightAppear : 0;

          return (
            <div
              key={i}
              style={{
                position: "relative",
                background: `${C.white}10`,
                border: `1px solid ${C.white}1A`,
                borderRadius: 10,
                padding: 14,
                opacity: op,
                transform: `scale(${scale})`,
                overflow: "hidden",
              }}
            >
              <div style={{ height: 8, width: "55%", background: `${C.white}30`, borderRadius: 4 }} />
              <div style={{ height: 5, width: "40%", background: `${C.white}1F`, borderRadius: 4, marginTop: 6 }} />
              <div style={{ height: 1, background: `${C.white}1A`, margin: "12px 0" }} />
              {Array.from({ length: 6 }).map((__, j) => (
                <div
                  key={j}
                  style={{
                    height: 4,
                    background: `${C.white}1A`,
                    borderRadius: 999,
                    marginBottom: 7,
                    width: `${80 - (j % 3) * 12}%`,
                  }}
                />
              ))}

              {/* highlight ring */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: 10,
                  border: `2px solid ${C.cyan}`,
                  boxShadow: `0 0 30px ${C.cyan}88, inset 0 0 30px ${C.cyan}33`,
                  opacity: hiOp,
                  pointerEvents: "none",
                }}
              />
            </div>
          );
        })}
      </div>

      {/* caption */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: isV ? 130 : 80,
          textAlign: "center",
          opacity: sub.op,
          transform: `translateY(${sub.y}px)`,
        }}
      >
        <span
          style={{
            display: "inline-block",
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
          Tailored resumes get 3× more interviews.
        </span>
      </div>
    </AbsoluteFill>
  );
};
