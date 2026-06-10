import { AbsoluteFill, Audio, staticFile } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { Background } from "./Background";
import { Scene1Hook } from "./scenes/Scene1Hook";
import { Scene2Problem } from "./scenes/Scene2Problem";
import { Scene3Logo } from "./scenes/Scene3Logo";
import { Scene4Product } from "./scenes/Scene4Product";
import { Scene6Transform } from "./scenes/Scene6Transform";
import { Scene7CTA } from "./scenes/Scene7CTA";

const S1 = 240; // 8s hook
const S2 = 210; // 7s problem
const S3 = 210; // 7s logo reveal
const S4 = 630; // 21s product (3 clips)
const S6 = 360; // 12s transform
const S7 = 390; // 13s CTA
const T = 18;

export const LAUNCH_DURATION = S1 + S2 + S3 + S4 + S6 + S7 - 5 * T;

export const LaunchVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#06122B" }}>
      <Background />
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={S1}>
          <Scene1Hook />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={S2}>
          <Scene2Problem />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={S3}>
          <Scene3Logo />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={springTiming({ config: { damping: 200 }, durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={S4}>
          <Scene4Product />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={S6}>
          <Scene6Transform />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={S7}>
          <Scene7CTA />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
