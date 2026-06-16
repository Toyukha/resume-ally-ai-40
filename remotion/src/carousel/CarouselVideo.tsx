import { AbsoluteFill, Sequence, useVideoConfig, useCurrentFrame, interpolate } from "remotion";
import { Background } from "./Background";
import { Chrome } from "./Chrome";
import { Slide1 } from "./scenes/Slide1";
import { Slide2 } from "./scenes/Slide2";
import { Slide3 } from "./scenes/Slide3";
import { Slide4 } from "./scenes/Slide4";
import { Slide5 } from "./scenes/Slide5";
import { Slide6 } from "./scenes/Slide6";
import { SCENE_LEN, TOTAL } from "./theme";

export { TOTAL as CAROUSEL_DURATION };

type Props = { format: "9x16" | "1x1" };

const scenes = [Slide1, Slide2, Slide3, Slide4, Slide5, Slide6];

export const CarouselVideo: React.FC<Props> = ({ format }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // music ducking - softer in slide 5/6 so wordmark/CTA feel cleaner
  const musicVol = interpolate(
    frame,
    [0, SCENE_LEN * 4, SCENE_LEN * 4 + 30, durationInFrames - 20, durationInFrames],
    [0.7, 0.7, 0.55, 0.55, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill style={{ background: "#050816" }}>
      <Background />

      {scenes.map((Scene, i) => (
        <Sequence key={i} from={i * SCENE_LEN} durationInFrames={SCENE_LEN}>
          <Scene format={format} />
        </Sequence>
      ))}

      <Chrome format={format} />
    </AbsoluteFill>
  );
};

// Suppress unused-warning for variables kept for future audio re-enable
void useCurrentFrame;
void interpolate;
void useVideoConfig;
void SCENE_LEN;
