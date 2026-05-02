const hexagonalClipPath = "polygon(50% 0, 93.3% 25%, 93.3% 75%, 50% 100%, 6.7% 75%, 6.7% 25%)";
const octagonalClipPath =
  "polygon(30% 0, 70% 0, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0 70%, 0 30%)";

const avatarShapeStyles = {
  round: { borderRadius: "9999px" },
  square: { borderRadius: "var(--radius-md)" },
  hexagonal: { clipPath: hexagonalClipPath },
  octagonal: { clipPath: octagonalClipPath },
} as const;

export { avatarShapeStyles };
