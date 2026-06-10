import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { loadFont as loadDisplay } from "@remotion/google-fonts/Fraunces";
import { loadFont as loadBody } from "@remotion/google-fonts/Inter";
import { C } from "../theme";

const { fontFamily: display } = loadDisplay("normal", { weights: ["700"], subsets: ["latin"] });
const { fontFamily: body } = loadBody("normal", { weights: ["400", "600", "700"], subsets: ["latin"] });

const Stamp: React.FC<{ delay: number; rotate: number; left: number; top: number }> = ({ delay, rotate, left, top }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 8, stiffness: 180 } });
  const scale = interpolate(s, [0, 0.6, 1], [4, 0.85, 1]);
  const op = interpolate(frame, [delay, delay + 6], [0, 1], { extrapolateRight: "clamp" });
  // shake
  const shake = frame > delay + 6 && frame < delay + 18 ? Math.sin(frame * 2) * 2 : 0;
  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        transform: `rotate(${rotate}deg) scale(${scale}) translateX(${shake}px)`,
        opacity: op,
        fontFamily: body,
        fontWeight: 900,
        fontSize: 44,
        color: C.danger,
        border: `5px solid ${C.danger}`,
        padding: "10px 28px",
        letterSpacing: 4,
        background: `${C.white}10`,
        boxShadow: `0 0 0 2px ${C.danger}33`,
      }}
    >
      ATS REJECTED
    </div>
  );
};

export const Scene2Problem: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // CV slides + tilts in
  const cvS = spring({ frame, fps, config: { damping: 18 } });
  const cvY = interpolate(cvS, [0, 1], [60, 0]);
  const cvOp = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: "clamp" });

  const desat = interpolate(frame, [30, 80], [1, 0.35], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const titleOp = interpolate(frame, [110, 130], [0, 1], { extrapolateRight: "clamp" });
  const titleY = interpolate(spring({ frame: frame - 110, fps, config: { damping: 18 } }), [0, 1], [30, 0]);

  const subOp = interpolate(frame, [140, 160], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [190, 210], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ opacity: fadeOut }}>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        {/* CV mock */}
        <div
          style={{
            position: "relative",
            width: 640,
            height: 820,
            background: "#FAF6EC",
            borderRadius: 6,
            transform: `translateY(${cvY}px) rotate(-4deg)`,
            opacity: cvOp,
            boxShadow: `0 60px 120px -20px #000a, 0 0 0 1px ${C.white}11`,
            padding: 48,
            filter: `saturate(${desat})`,
          }}
        >
          <div style={{ fontFamily: display, fontSize: 36, color: "#1a1a1a", fontWeight: 700 }}>John Doe</div>
          <div style={{ fontFamily: body, fontSize: 14, color: "#555", marginTop: 4 }}>Software Engineer · john@email.com · +1 (555) 010-0000</div>
          <div style={{ height: 1, background: "#ccc", margin: "20px 0" }} />
          {[
            { h: "EXPERIENCE", lines: 5 },
            { h: "EDUCATION", lines: 2 },
            { h: "SKILLS", lines: 3 },
          ].map((s) => (
            <div key={s.h} style={{ marginBottom: 22 }}>
              <div style={{ fontFamily: body, fontWeight: 700, fontSize: 14, color: "#1a1a1a", letterSpacing: 2 }}>{s.h}</div>
              <div style={{ marginTop: 8 }}>
                {Array.from({ length: s.lines }).map((_, i) => (
                  <div key={i} style={{ height: 8, background: "#ddd", borderRadius: 2, marginBottom: 8, width: `${60 + (i % 3) * 14}%` }} />
                ))}
              </div>
            </div>
          ))}
        </div>

        <Stamp delay={30} rotate={-12} left={520} top={180} />
        <Stamp delay={48} rotate={8} left={920} top={420} />
        <Stamp delay={66} rotate={-5} left={620} top={660} />
      </AbsoluteFill>

      <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end", paddingBottom: 70, textAlign: "center" }}>
        <h2
          style={{
            opacity: titleOp,
            transform: `translateY(${titleY}px)`,
            fontFamily: display,
            fontSize: 76,
            fontWeight: 700,
            color: C.white,
            margin: 0,
            lineHeight: 1.05,
          }}
        >
          What if your CV is the <span style={{ color: C.danger, fontStyle: "italic" }}>problem?</span>
        </h2>
        <div style={{ opacity: subOp, fontFamily: body, color: C.dim, fontSize: 24, marginTop: 18 }}>
          Most resumes get rejected before recruiters even see them.
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
