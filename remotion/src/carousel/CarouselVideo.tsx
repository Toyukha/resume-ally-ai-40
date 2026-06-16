import { AbsoluteFill, Sequence } from "remotion";
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
