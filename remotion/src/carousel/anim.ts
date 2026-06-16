import { interpolate, spring } from "remotion";

export const sceneEnter = (frame: number, fps: number) => {
  const s = spring({ frame, fps, config: { damping: 20, stiffness: 140 } });
  const y = interpolate(s, [0, 1], [50, 0]);
  const op = interpolate(frame, [0, 14], [0, 1], { extrapolateRight: "clamp" });
  const blur = interpolate(frame, [0, 18], [10, 0], { extrapolateRight: "clamp" });
  return { y, op, blur, s };
};

export const sceneExit = (frame: number, len: number) => {
  const start = len - 14;
  const op = interpolate(frame, [start, len], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const y = interpolate(frame, [start, len], [0, -30], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return { op, y };
};

// stagger word reveals
export const wordSpring = (
  frame: number,
  fps: number,
  delay: number,
): { op: number; y: number; blur: number } => {
  const f = frame - delay;
  const s = spring({ frame: f, fps, config: { damping: 18, stiffness: 160 } });
  const y = interpolate(s, [0, 1], [40, 0]);
  const op = interpolate(f, [0, 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const blur = interpolate(f, [0, 16], [12, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return { op, y, blur };
};
