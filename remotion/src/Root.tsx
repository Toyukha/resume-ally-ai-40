import { Composition } from "remotion";
import { MainVideo, VIDEO_DURATION } from "./MainVideo";
import { LaunchVideo, LAUNCH_DURATION } from "./launch/LaunchVideo";
import { FeaturesVideo, FEATURES_DURATION } from "./features/FeaturesVideo";
import { CarouselVideo, CAROUSEL_DURATION } from "./carousel/CarouselVideo";

export const RemotionRoot = () => (
  <>
    <Composition
      id="main"
      component={MainVideo}
      durationInFrames={VIDEO_DURATION}
      fps={30}
      width={1920}
      height={1080}
    />
    <Composition
      id="launch"
      component={LaunchVideo}
      durationInFrames={LAUNCH_DURATION}
      fps={30}
      width={1920}
      height={1080}
    />
    <Composition
      id="features"
      component={FeaturesVideo}
      durationInFrames={FEATURES_DURATION}
      fps={30}
      width={1920}
      height={1080}
    />
    <Composition
      id="carousel-9x16"
      component={CarouselVideo}
      durationInFrames={CAROUSEL_DURATION}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{ format: "9x16" as const }}
    />
    <Composition
      id="carousel-1x1"
      component={CarouselVideo}
      durationInFrames={CAROUSEL_DURATION}
      fps={30}
      width={1080}
      height={1080}
      defaultProps={{ format: "1x1" as const }}
    />
  </>
);
