import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, Sequence } from "remotion";
import { loadFont as loadBody } from "@remotion/google-fonts/Inter";
import { loadFont as loadDisplay } from "@remotion/google-fonts/Fraunces";
import { COLORS } from "../theme";

const { fontFamily: body } = loadBody("normal", { weights: ["400", "600"], subsets: ["latin"] });
const { fontFamily: display } = loadDisplay("normal", { weights: ["700"], subsets: ["latin"] });

export const Scene2Upload: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cardS = spring({ frame, fps, config: { damping: 14, stiffness: 120 } });
  const cardScale = interpolate(cardS, [0, 1], [0.85, 1]);
  const cardOp = interpolate(frame, [0, 14], [0, 1], { extrapolateRight: "clamp" });

  const labelOp = interpolate(frame, [8, 22], [0, 1], { extrapolateRight: "clamp" });

  // file drops in
  const fileS = spring({ frame: frame - 18, fps, config: { damping: 12 } });
  const fileY = interpolate(fileS, [0, 1], [-180, 0]);
  const fileOp = interpolate(frame, [18, 30], [0, 1], { extrapolateRight: "clamp" });

  // progress
  const progress = interpolate(frame, [38, 78], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const fadeOut = interpolate(frame, [95, 110], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: fadeOut }}>
      <div style={{ opacity: labelOp, fontFamily: body, color: COLORS.gold, letterSpacing: 5, fontSize: 18, fontWeight: 600, marginBottom: 24 }}>
        STEP 01 — UPLOAD
      </div>
      <div style={{ opacity: labelOp, fontFamily: display, fontSize: 64, color: COLORS.text, marginBottom: 48 }}>
        Drop in your resume.
      </div>

      <div
        style={{
          width: 880,
          height: 420,
          borderRadius: 24,
          background: `linear-gradient(180deg, ${COLORS.surface} 0%, ${COLORS.surface2} 100%)`,
          border: `1.5px dashed ${COLORS.gold}66`,
          transform: `scale(${cardScale})`,
          opacity: cardOp,
          padding: 48,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
          boxShadow: `0 30px 80px -20px ${COLORS.primary}66`,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* File card flying in */}
        <Sequence from={0}>
          <div
            style={{
              transform: `translateY(${fileY}px)`,
              opacity: fileOp,
              width: 280,
              height: 110,
              background: COLORS.text,
              borderRadius: 14,
              display: "flex",
              alignItems: "center",
              gap: 20,
              padding: "0 24px",
              boxShadow: `0 20px 40px rgba(0,0,0,0.4)`,
            }}
          >
            <div
              style={{
                width: 52,
                height: 64,
                background: COLORS.primary,
                borderRadius: 6,
                color: COLORS.text,
                fontFamily: body,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
              }}
            >
              PDF
            </div>
            <div style={{ fontFamily: body, color: COLORS.primaryDeep }}>
              <div style={{ fontWeight: 700, fontSize: 18 }}>resume_2026.pdf</div>
              <div style={{ fontSize: 14, opacity: 0.6 }}>248 KB</div>
            </div>
          </div>
        </Sequence>

        {/* Progress bar */}
        <div style={{ width: 560, marginTop: 12 }}>
          <div style={{ height: 6, background: `${COLORS.gold}22`, borderRadius: 999, overflow: "hidden" }}>
            <div style={{ width: `${progress}%`, height: "100%", background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.gold})` }} />
          </div>
          <div style={{ fontFamily: body, color: COLORS.textDim, fontSize: 14, marginTop: 10, textAlign: "center" }}>
            {progress < 100 ? `Analyzing… ${Math.round(progress)}%` : "Resume parsed ✓"}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
