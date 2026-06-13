import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { loadFont as loadBody } from "@remotion/google-fonts/Inter";
import { loadFont as loadDisplay } from "@remotion/google-fonts/Fraunces";
import { COLORS } from "../theme";

const { fontFamily: body } = loadBody("normal", { weights: ["400", "600", "700"], subsets: ["latin"] });
const { fontFamily: display } = loadDisplay("normal", { weights: ["700"], subsets: ["latin"] });

const TIERS = [
  { name: "Free", price: "₦0", period: "", features: ["1 CV Analysis / month", "ATS Score", "Basic Resume Assessment"], featured: false },
  { name: "Pro Plan 1", price: "₦5,000", period: "/ month", features: ["10 CV Analyses", "10 Optimized Cover Letters", "10 Optimized CVs"], featured: true },
  { name: "Pro Plan 2", price: "₦10,000", period: "/ month", features: ["20 CV Analyses", "20 Optimized CVs", "Priority Processing"], featured: false },
];

export const Scene6PricingChat: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOp = interpolate(frame, [0, 14], [0, 1], { extrapolateRight: "clamp" });
  const titleY = interpolate(spring({ frame, fps, config: { damping: 18 } }), [0, 1], [30, 0]);

  // chat bubble animation
  const chatStart = 70;
  const chatS = spring({ frame: frame - chatStart, fps, config: { damping: 14 } });
  const chatScale = interpolate(chatS, [0, 1], [0.6, 1]);
  const chatOp = interpolate(frame, [chatStart, chatStart + 14], [0, 1], { extrapolateRight: "clamp" });
  // typing dots → reply swap
  const showReply = frame >= chatStart + 28;
  const replyOp = interpolate(frame, [chatStart + 28, chatStart + 42], [0, 1], { extrapolateRight: "clamp" });

  const fadeOut = interpolate(frame, [145, 160], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: fadeOut, padding: "0 80px" }}>
      <div style={{ opacity: titleOp, transform: `translateY(${titleY}px)`, fontFamily: body, color: COLORS.gold, letterSpacing: 5, fontSize: 18, fontWeight: 600, marginBottom: 14 }}>
        STEP 04 — PRICING & ALWAYS-ON AI SUPPORT
      </div>
      <div style={{ opacity: titleOp, transform: `translateY(${titleY}px)`, fontFamily: display, fontSize: 56, color: COLORS.text, marginBottom: 56, textAlign: "center" }}>
        Plans that <span style={{ color: COLORS.goldSoft, fontStyle: "italic" }}>fit you.</span>
      </div>

      <div style={{ display: "flex", gap: 28, alignItems: "stretch" }}>
        {TIERS.map((t, i) => {
          const start = 16 + i * 10;
          const s = spring({ frame: frame - start, fps, config: { damping: 16 } });
          const op = interpolate(frame, [start, start + 14], [0, 1], { extrapolateRight: "clamp" });
          const y = interpolate(s, [0, 1], [40, 0]);
          const scale = t.featured ? 1.06 : 1;
          return (
            <div
              key={t.name}
              style={{
                opacity: op,
                transform: `translateY(${y}px) scale(${scale})`,
                width: 320,
                padding: "36px 32px",
                background: t.featured ? `linear-gradient(180deg, ${COLORS.surface2}, ${COLORS.surface})` : `${COLORS.surface}aa`,
                border: t.featured ? `1.5px solid ${COLORS.gold}` : `1px solid #ffffff15`,
                borderRadius: 18,
                boxShadow: t.featured ? `0 30px 80px -20px ${COLORS.gold}55` : "none",
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              {t.featured && (
                <div style={{ fontFamily: body, color: COLORS.gold, letterSpacing: 3, fontSize: 11, fontWeight: 700 }}>
                  ★ MOST POPULAR
                </div>
              )}
              <div style={{ fontFamily: display, fontSize: 32, color: COLORS.text }}>{t.name}</div>
              <div style={{ fontFamily: body, fontSize: 44, color: COLORS.text, fontWeight: 700 }}>
                {t.price}
                {t.period && <span style={{ fontSize: 16, color: COLORS.textDim, fontWeight: 400 }}> {t.period}</span>}
              </div>
              <div style={{ height: 1, background: `${COLORS.gold}22` }} />
              {t.features.map((f) => (
                <div key={f} style={{ fontFamily: body, color: COLORS.textDim, fontSize: 15, display: "flex", gap: 10 }}>
                  <span style={{ color: COLORS.gold }}>✓</span> {f}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* AI Chat bubble bottom-right */}
      <div
        style={{
          position: "absolute",
          bottom: 80,
          right: 100,
          opacity: chatOp,
          transform: `scale(${chatScale})`,
          transformOrigin: "bottom right",
          width: 340,
          background: `linear-gradient(180deg, ${COLORS.surface2}, ${COLORS.surface})`,
          border: `1px solid ${COLORS.gold}55`,
          borderRadius: 20,
          padding: 22,
          boxShadow: `0 30px 80px -10px ${COLORS.gold}44`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <div style={{ width: 34, height: 34, borderRadius: 999, background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.gold})`, display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.text, fontFamily: body, fontWeight: 700, fontSize: 14 }}>AI</div>
          <div style={{ fontFamily: body, fontSize: 13, color: COLORS.text, fontWeight: 600 }}>
            Career Boost Assistant
            <div style={{ fontSize: 11, color: COLORS.gold, fontWeight: 400, marginTop: 2 }}>● Online</div>
          </div>
        </div>
        {!showReply ? (
          <div style={{ display: "flex", gap: 6, padding: "12px 16px", background: `${COLORS.surface}cc`, borderRadius: 14, width: "fit-content" }}>
            {[0, 1, 2].map((i) => {
              const bounce = Math.sin((frame - chatStart) / 4 - i * 0.6) * 0.5 + 0.5;
              return <div key={i} style={{ width: 8, height: 8, borderRadius: 999, background: COLORS.gold, opacity: 0.4 + bounce * 0.6 }} />;
            })}
          </div>
        ) : (
          <div style={{ opacity: replyOp, fontFamily: body, fontSize: 14, color: COLORS.text, lineHeight: 1.5, padding: "12px 16px", background: `${COLORS.surface}cc`, borderRadius: 14 }}>
            Hi! Ask me anything about<br />Career Boost — I'm here 24/7.
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
