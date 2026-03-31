import type { ReactNode } from "react";

export type StorySceneDefinition = {
  id: string;
  title: string;
  body: string;
  eyebrow?: string;
  menuLabel?: string;
};

export type StorySceneProps = {
  id: string;
  title: string;
  menuLabel?: string;
  eyebrow?: string;
  children: ReactNode;
  className?: string;
};

export type StorySceneMeta = Omit<StorySceneProps, "children" | "className">;
