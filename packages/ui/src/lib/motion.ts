import type { MotionProps } from "motion/react";

const glassMotionTransition = {
  type: "spring",
  stiffness: 420,
  damping: 34,
  mass: 0.6,
} satisfies MotionProps["transition"];

const glassSurfaceMotion = {
  layout: true,
  transition: glassMotionTransition,
} satisfies MotionProps;

const glassInteractiveMotion = {
  layout: true,
  whileHover: { y: -1, scale: 1.012 },
  whileTap: { scale: 0.99 },
  transition: glassMotionTransition,
} satisfies MotionProps;

export { glassInteractiveMotion, glassMotionTransition, glassSurfaceMotion };
