import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { loadFont as loadDisplay } from "@remotion/google-fonts/Fraunces";
import { loadFont as loadBody } from "@remotion/google-fonts/Inter";
import { C } from "../theme";
import { FrameSequence } from "../FrameSequence";

const { fontFamily: display } = loadDisplay("normal", { weights: ["700"], subsets: ["latin"] });
const { fontFamily: body } = loadBody("normal", { weights: ["400", "600", "700"], subsets: ["latin"] });

const BrowserFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      width: 1600,
      borderRadius: 18,
      overflow: "hidden",
      boxShadow: `0 60px 120px -20px ${C.blue}55, 0 0 0 1px ${C.white}11`,
      background: "#1a1f33",
    }}
  >
    <div style={{ height: 44, background: "#1a1f33", display: "flex", alignItems: "center", padding: "0 18px", gap: 8 }}>
      <div style={{ width: 12, height: 12, borderRadius: 6, background: "#FF5F57" }} />
      <div style={{ width: 12, height: 12, borderRadius: 6, background: "#FEBC2E" }} />
      <div style={{ width: 12, height: 12, borderRadius: 6, background: "#28C840" }} />
      <div
        style={{
          marginLeft: 24,
          flex: 1,
          maxWidth: 520,
          background: "#0e1424",
          color: C.dim,
          fontFamily: body,
          fontSize: 13,
          padding: "6px 14px",
          borderRadius: 8,
          textAlign: "center",
        }}
      >
        🔒 www.thecareerboost.com
      </div>
    </div>
    {children}
  </div>
);

const ClipBlock: React.FC<{ dir: string; totalFrames: number; chip: string; title: string; sub: string; startFrame: number; durFrames: number }> = ({
  dir,
  totalFrames,
  chip,
  title,
  sub,
  startFrame,
  durFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - startFrame;
  const cardS = spring({ frame: local, fps, config: { damping: 18 } });
  const cardX = interpolate(cardS, [0, 1], [-60, 0]);
  const cardOp = interpolate(local, [0, 14], [0, 1], { extrapolateRight: "clamp" });

  const capS = spring({ frame: local - 10, fps, config: { damping: 14 } });
  const capX = interpolate(capS, [0, 1], [120, 0]);
  const capOp = interpolate(local, [10, 28], [0, 1], { extrapolateRight: "clamp" });

  const outOp = interpolate(local, [durFrames - 18, durFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ opacity: outOp, alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 48 }}>
        <div style={{ transform: `translateX(${cardX}px)`, opacity: cardOp }}>
          <BrowserFrame>
            <div style={{ width: 1600, height: 864, overflow: "hidden" }}>
              <FrameSequence
                dir={dir}
                totalFrames={totalFrames}
                style={{
                  width: 1700,
                  height: 918,
                  display: "block",
                  objectFit: "cover",
                  transformOrigin: "center",
                }}
              />
            </div>
          </BrowserFrame>
        </div>
      </div>

      {/* Floating caption */}
      <div
        style={{
          position: "absolute",
          right: 90,
          top: 140,
          maxWidth: 360,
          transform: `translateX(${capX}px)`,
          opacity: capOp,
          background: `${C.navyDeep}EE`,
          borderLeft: `4px solid ${C.teal}`,
          borderRadius: 12,
          padding: "20px 24px",
          boxShadow: `0 30px 60px -10px ${C.navyDeep}`,
        }}
      >
        <div style={{ fontFamily: body, color: C.teal, fontSize: 13, letterSpacing: 3, fontWeight: 700, marginBottom: 8 }}>{chip}</div>
        <div style={{ fontFamily: display, color: C.white, fontSize: 30, fontWeight: 700, lineHeight: 1.1 }}>{title}</div>
        <div style={{ fontFamily: body, color: C.dim, fontSize: 16, marginTop: 10, lineHeight: 1.4 }}>{sub}</div>
      </div>
    </AbsoluteFill>
  );
};

export const Scene4Product: React.FC = () => {
  const frame = useCurrentFrame();
  const headOp = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: "clamp" });
  const headOut = interpolate(frame, [580, 610], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill>
      {/* Top label */}
      <div
        style={{
          position: "absolute",
          top: 60,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: headOp * headOut,
          fontFamily: body,
          color: C.teal,
          letterSpacing: 6,
          fontSize: 16,
          fontWeight: 700,
        }}
      >
        SEE IT IN ACTION
      </div>

      <Sequence from={0} durationInFrames={210}>
        <ClipBlock dir="clips/c1" totalFrames={169} chip="STEP 01" title="Land more interviews." sub="Built for today's local and international recruitment standards." startFrame={0} durFrames={210} />
      </Sequence>
      <Sequence from={200} durationInFrames={220}>
        <ClipBlock dir="clips/c2" totalFrames={169} chip="STEP 02" title="Drop in your resume." sub="Paste the job description. The Career Boost reads both like a recruiter." startFrame={0} durFrames={220} />
      </Sequence>
      <Sequence from={410} durationInFrames={220}>
        <ClipBlock dir="clips/c3" totalFrames={170} chip="STEP 03" title="See exactly what to fix." sub="Match score, strengths, weaknesses, and missing keywords — instantly." startFrame={0} durFrames={220} />
      </Sequence>
    </AbsoluteFill>
  );
};
