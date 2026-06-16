import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { C, SCENE_LEN } from "../theme";
import { sceneExit, wordSpring } from "../anim";

const { fontFamily } = loadInter("normal", { weights: ["500", "700", "800"], subsets: ["latin"] });

type Props = { format: "9x16" | "1x1" };

const KEYWORDS = [
  { t: "TypeScript", missing: false, x: 8, y: 18 },
  { t: "Leadership", missing: true, x: 62, y: 12 },
  { t: "Figma", missing: false, x: 70, y: 32 },
  { t: "SQL", missing: true, x: 14, y: 38 },
  { t: "Agile", missing: false, x: 40, y: 24 },
  { t: "Stakeholders", missing: true, x: 8, y: 58 },
  { t: "Python", missing: false, x: 58, y: 56 },
  { t: "Strategy", missing: true, x: 36, y: 64 },
  { t: "A/B Testing", missing: false, x: 70, y: 70 },
];

export const Slide3: React.FC<Props> = ({ format }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const exit = sceneExit(frame, SCENE_LEN);

  const headline = wordSpring(frame, fps, 0);
  const sub = wordSpring(frame, fps, 100);

  // chips appear staggered, then "missing" ones fade
  const fadeStart = 75;

  const isV = format === "9x16";

  return (
    <AbsoluteFill
      style={{
        opacity: exit.op,
        transform: `translateY(${exit.y}px)`,
        padding: isV ? "200px 60px 200px" : "140px 60px 140px",
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
          fontSize: isV ? 82 : 70,
          textAlign: "center",
          lineHeight: 1.1,
          letterSpacing: -2,
        }}
      >
        Missing{" "}
        <span
          style={{
            background: `linear-gradient(135deg, ${C.cyan}, ${C.violet})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          keywords
        </span>{" "}
        <br />
        hurt your visibility.
      </div>

      {/* chips area */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: isV ? "38%" : "42%",
          bottom: isV ? "18%" : "20%",
        }}
      >
        {KEYWORDS.map((k, i) => {
          const delay = 20 + i * 4;
          const s = spring({ frame: frame - delay, fps, config: { damping: 14, stiffness: 160 } });
          const scale = interpolate(s, [0, 1], [0, 1]);
          const op = interpolate(frame, [delay, delay + 12], [0, 1], { extrapolateRight: "clamp" });
          const fadeOut = k.missing
            ? interpolate(frame, [fadeStart, fadeStart + 20], [1, 0.18], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              })
            : 1;
          const float = Math.sin(frame / 30 + i) * 6;

          return (
            <div
              key={k.t}
              style={{
                position: "absolute",
                left: `${k.x}%`,
                top: `${k.y}%`,
                transform: `scale(${scale}) translateY(${float}px)`,
                opacity: op * fadeOut,
              }}
            >
              <div
                style={{
                  fontFamily,
                  fontWeight: 600,
                  fontSize: 30,
                  color: k.missing ? C.dim : C.white,
                  padding: "12px 24px",
                  borderRadius: 999,
                  background: k.missing
                    ? `${C.white}08`
                    : `linear-gradient(135deg, ${C.blue}30, ${C.violet}30)`,
                  border: `1.5px solid ${k.missing ? C.white + "22" : C.cyan + "88"}`,
                  boxShadow: k.missing ? "none" : `0 0 20px ${C.cyan}33`,
                  textDecoration: k.missing ? "line-through" : "none",
                  whiteSpace: "nowrap",
                }}
              >
                {k.t}
              </div>
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
          bottom: isV ? 140 : 90,
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
          The right words make you discoverable.
        </span>
      </div>
    </AbsoluteFill>
  );
};
