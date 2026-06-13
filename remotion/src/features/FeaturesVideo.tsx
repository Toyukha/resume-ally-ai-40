import { AbsoluteFill, Audio, staticFile } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { Background } from "../components/Background";
import { Scene1Hook } from "../scenes/Scene1Hook";
import { Scene2Upload } from "../scenes/Scene2Upload";
import { Scene3Match } from "../scenes/Scene3Match";
import { Scene4Optimize } from "../scenes/Scene4Optimize";
import { Scene6PricingChat } from "./Scene6PricingChat";
import { Scene5CTA } from "../scenes/Scene5CTA";

const S1 = 110;
const S2 = 130;
const S3 = 145;
const S4 = 135;
const S6 = 165;
const S5 = 245;
const T = 18;

// total raw - overlaps
export const FEATURES_DURATION = S1 + S2 + S3 + S4 + S6 + S5 - 5 * T;

export const FeaturesVideo: React.FC = () => {
  return (
    <AbsoluteFill>
      <Background />
      <Audio src={staticFile("audio/features-track.mp3")} volume={0.85} />
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={S1}>
          <Scene1Hook />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={S2}>
          <Scene2Upload />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={S3}>
          <Scene3Match />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={S4}>
          <Scene4Optimize />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={S6}>
          <Scene6PricingChat />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: T })} />
        <TransitionSeries.Sequence durationInFrames={S5}>
          <Scene5CTA />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
