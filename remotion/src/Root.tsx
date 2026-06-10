import { Composition } from "remotion";
import { MainVideo, VIDEO_DURATION } from "./MainVideo";
import { LaunchVideo, LAUNCH_DURATION } from "./launch/LaunchVideo";

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
  </>
);
