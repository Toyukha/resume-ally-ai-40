import { AbsoluteFill, Sequence, Audio, staticFile, useVideoConfig, useCurrentFrame, interpolate } from "remotion";
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

      {/* Music */}
      <Audio src={staticFile("audio/carousel-music.mp3")} volume={() => musicVol} />

      {/* Swipe whooshes at each slide transition */}
      {[1, 2, 3, 4, 5].map((i) => (
        <Sequence key={`sw-${i}`} from={i * SCENE_LEN - 8} durationInFrames={20}>
          <Audio src={staticFile("audio/swipe.mp3")} volume={0.7} />
        </Sequence>
      ))}

      {/* Slide 2 - reject stamp */}
      <Sequence from={SCENE_LEN + 73} durationInFrames={30}>
        <Audio src={staticFile("audio/stamp.mp3")} volume={0.9} />
      </Sequence>

      {/* Slide 3 - chip pops (a few) */}
      {[20, 28, 36, 44, 52].map((d, i) => (
        <Sequence key={`cp-${i}`} from={SCENE_LEN * 2 + d} durationInFrames={12}>
          <Audio src={staticFile("audio/chip-pop.mp3")} volume={0.45} />
        </Sequence>
      ))}

      {/* Slide 5 - success chime */}
      <Sequence from={SCENE_LEN * 4 + 35} durationInFrames={45}>
        <Audio src={staticFile("audio/carousel-success.mp3")} volume={0.9} />
      </Sequence>

      {/* Slide 6 - CTA impact */}
      <Sequence from={SCENE_LEN * 5 + 4} durationInFrames={45}>
        <Audio src={staticFile("audio/carousel-cta.mp3")} volume={0.9} />
      </Sequence>
    </AbsoluteFill>
  );
};
