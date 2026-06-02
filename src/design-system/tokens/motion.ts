export const motionDuration = {
  /** design.md §8.2 transform press */
  instant: 150,
  fast: 160,
  normal: 200,
  slow: 400,
  splash: 800,
  emphasis: 1200,
} as const;

export const motionEasing = {
  standard: [0.2, 0, 0, 1] as const,
  emphasized: [0.22, 1, 0.36, 1] as const,
  decelerate: [0, 0, 0.2, 1] as const,
  easeOut: [0.22, 1, 0.36, 1] as const,
};

/** @deprecated use motionEasing.easeOut */
export const motion = {
  easeOut: motionEasing.easeOut,
  duration: motionDuration,
  easing: motionEasing,
};
