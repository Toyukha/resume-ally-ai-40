import { Img, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

interface Props {
  dir: string;
  totalFrames: number; // number of source frames available
  sourceFps?: number;
  style?: React.CSSProperties;
}

// Plays a directory of f001.jpg, f002.jpg, ... as a video by mapping
// the composition frame (30fps) to the source frame number (24fps).
// Avoids the compositor's video decoder entirely.
export const FrameSequence: React.FC<Props> = ({ dir, totalFrames, sourceFps = 24, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const srcFrame = Math.min(totalFrames, Math.max(1, Math.floor((frame / fps) * sourceFps) + 1));
  const num = String(srcFrame).padStart(3, "0");
  return <Img src={staticFile(`${dir}/f${num}.jpg`)} style={style} />;
};
