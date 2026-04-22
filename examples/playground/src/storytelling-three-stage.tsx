import { useRef } from "react";

import { useFrame } from "@react-three/fiber";
import type { Mesh } from "three";

import {
  createStoryRendererRegistry,
  type StoryRenderProps,
  type StoryThreeSceneProps,
} from "@moritzbrantner/storytelling";
import { StoryCanvasStage } from "@moritzbrantner/storytelling/three";

type StoryVisualData = {
  hue: number;
  orbitSpeed: number;
};

function BeaconScene({ node, stageProps }: StoryThreeSceneProps<StoryVisualData>) {
  const coreRef = useRef<Mesh>(null);
  const ringRef = useRef<Mesh>(null);
  const hue = node.data?.hue ?? 195;
  const orbitSpeed = node.data?.orbitSpeed ?? 0.8;
  const ringColor = typeof stageProps?.ringColor === "string" ? stageProps.ringColor : "#dbeafe";

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    if (coreRef.current) {
      coreRef.current.rotation.x = t * 0.3;
      coreRef.current.rotation.y = t * 0.55;
      coreRef.current.position.y = Math.sin(t * orbitSpeed) * 0.18;
    }

    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.45;
      ringRef.current.rotation.x = Math.sin(t * 0.25) * 0.4;
    }
  });

  return (
    <>
      <color attach="background" args={["#030711"]} />
      <ambientLight intensity={0.85} />
      <directionalLight position={[4, 5, 3]} intensity={2.2} />
      <pointLight position={[-3, -2, 2]} intensity={1.4} color={`hsl(${hue}, 90%, 66%)`} />
      <mesh ref={coreRef}>
        <icosahedronGeometry args={[1.55, 1]} />
        <meshStandardMaterial
          color={`hsl(${hue}, 85%, 64%)`}
          emissive={`hsl(${hue}, 88%, 42%)`}
          emissiveIntensity={0.6}
          roughness={0.18}
          metalness={0.55}
        />
      </mesh>
      <mesh ref={ringRef} scale={2.25}>
        <torusGeometry args={[1.25, 0.08, 24, 96]} />
        <meshStandardMaterial color={ringColor} emissive="#93c5fd" emissiveIntensity={0.45} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.6, 0]}>
        <circleGeometry args={[4.5, 64]} />
        <meshStandardMaterial color="#0f172a" transparent opacity={0.55} />
      </mesh>
    </>
  );
}

const beaconThreeRegistry = createStoryRendererRegistry<StoryVisualData>({
  three: {
    beacon: BeaconScene,
  },
});

export function StoryThreeStageRenderer(props: StoryRenderProps<StoryVisualData>) {
  return <StoryCanvasStage {...props} registry={beaconThreeRegistry} />;
}

export const beaconStoryRegistry = createStoryRendererRegistry<StoryVisualData>({
  web: {
    beacon: StoryThreeStageRenderer,
  },
  three: {
    beacon: BeaconScene,
  },
});
