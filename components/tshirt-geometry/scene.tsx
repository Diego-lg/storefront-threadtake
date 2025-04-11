import React, { Suspense, RefObject } from "react"; // Import RefObject
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib"; // Keep this for the ref type for now, might adjust later if needed
import * as THREE from "three";
import TShirtModel from "./tshirt-model";
import { Loader } from "./loader";
import { Lights } from "./lights";
import { TShirtMaterials } from "./types/tshirt-types";

// Define props interface for Scene
interface SceneProps {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  shirtColor: string;
  patternTexture?: THREE.Texture | null; // Add patternTexture prop
  logoTexture?: THREE.Texture | null;
  isLogoMode: boolean;
  logoTargetPart: "front" | "back";
  logoScale: number;
  logoOffset: THREE.Vector2;
  materials: TShirtMaterials; // Add materials prop
  // Use InstanceType to get the correct ref type for the drei component
  // Use the type expected by the component: OrbitControls | null
  controlsRef?: RefObject<OrbitControlsImpl | null>;
}

// Scene is now a presentational component accepting props
export function Scene({
  canvasRef, // Destructure canvasRef
  logoTexture,
  isLogoMode,
  logoTargetPart,
  logoScale,
  logoOffset,
  materials, // Destructure materials prop
  controlsRef, // Destructure controlsRef
}: SceneProps) {
  // Removed the internal ref, using the passed one now

  // Removed the useMemo hook that re-created materials here

  return (
    <Canvas
      shadows
      gl={{ preserveDrawingBuffer: true, alpha: true }} // Added alpha: true
      ref={canvasRef as React.RefObject<HTMLCanvasElement>} // Assert type for R3F Canvas
      className="w-full h-full"
      style={{ touchAction: "none" }}
      camera={{ position: [0, 0, 2.5], fov: 75 }}
    >
      {/* <color attach="background" args={["#000000"]} /> Removed black background */}
      <Suspense fallback={<Loader />}>
        <OrbitControls
          ref={controlsRef as React.RefObject<OrbitControlsImpl>} // Assert type for Drei OrbitControls
          enableRotate={true}
          minDistance={0.5}
          maxDistance={3}
          enableZoom={false} // Keep zoom disabled? Consider if reset needs it.
          enablePan={false}
          minPolarAngle={Math.PI / 2} // Lock vertical rotation
          maxPolarAngle={Math.PI / 2} // Lock vertical rotation
        />
        <Lights />
        {/* Pass the received materials prop directly */}
        <TShirtModel
          materials={materials} // Pass materials from props
          logoTexture={logoTexture}
          isLogoMode={isLogoMode}
          logoTargetPart={logoTargetPart}
          logoScale={logoScale}
          logoOffset={logoOffset}
        />
        <Environment preset="city" />
        <ContactShadows
          position={[0, -0.8, 0]}
          opacity={0.25}
          scale={10}
          blur={1.5}
          far={0.0}
        />
      </Suspense>
    </Canvas>
  );
}
