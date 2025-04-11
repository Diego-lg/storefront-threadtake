"use client";

import { Suspense, useRef, useEffect, useMemo, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment } from "@react-three/drei";
import * as THREE from "three";

// Preload the model - but only on client side
const MODEL_URL =
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/model_run-vUsBDzUhyOSsoJtmL0SNpEZrARCEhX.glb";

// Move preload inside a client-only component
function PreloadModel() {
  useEffect(() => {
    useGLTF.preload(MODEL_URL);
  }, []);

  return null;
}

function EarthIsland() {
  const meshRef = useRef<THREE.Mesh>(null);
  const radius = 1;
  // Reduce geometry complexity
  const widthSegments = 32; // Reduced from 128
  const heightSegments = 16; // Reduced from 64

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y -= delta * 0.5;
      meshRef.current.rotation.x -= delta * 0.25;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[radius, widthSegments, heightSegments]} />
      <meshBasicMaterial color="#228B22" />
    </mesh>
  );
}

function Trees() {
  // Reduce number of trees for better performance
  const treePositions = useMemo(() => {
    const positions: [number, number, number][] = [];
    for (let i = 0; i < 30; i++) {
      // Reduced from 100
      const theta = Math.random() * Math.PI;
      const phi = Math.random() * 2 * Math.PI;
      const x = -Math.cos(phi) * Math.sin(theta);
      const y = Math.cos(theta);
      const z = Math.sin(phi) * Math.sin(theta);
      positions.push([x, y, z] as [number, number, number]);
    }
    return positions;
  }, []);

  return (
    <>
      {treePositions.map((position, index) => (
        <group key={index} position={position}>
          <mesh position={[0, 0.05, 0]}>
            <cylinderGeometry args={[0.01, 0.01, 0.1, 6]} />
            <meshBasicMaterial color="#8B4513" />
          </mesh>
          <mesh position={[0, 0.1, 0]}>
            <coneGeometry args={[0.05, 0.1, 6]} />
            <meshBasicMaterial color="#228B22" />
          </mesh>
        </group>
      ))}
    </>
  );
}

function Model() {
  const { scene, animations } = useGLTF(MODEL_URL);
  const { camera } = useThree();
  const modelRef = useRef<THREE.Object3D>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);

  useEffect(() => {
    if (!animations || animations.length === 0) return;

    mixerRef.current = new THREE.AnimationMixer(scene);
    const action = mixerRef.current.clipAction(animations[0]);
    action.play();

    camera.position.set(0, 1.4, 3.2);
    camera.lookAt(0, 1.4, 0);

    return () => {
      if (mixerRef.current) mixerRef.current.stopAllAction();
    };
  }, [scene, animations, camera]);

  useFrame((state, delta) => {
    if (modelRef.current) {
      const time = Date.now() * 0.001;
      modelRef.current.position.y = Math.sin(time) * 0.02 + 1.9;
    }

    if (mixerRef.current) {
      mixerRef.current.update(delta);
    }
  });

  return (
    <primitive
      ref={modelRef}
      object={scene}
      scale={[0.02, 0.02, 0.02]}
      position={[0, 1.9, 0]}
    />
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 5, 5]} intensity={1.2} />

      <EarthIsland />
      <Trees />
      <Suspense fallback={null}>
        <Model />
      </Suspense>
    </>
  );
}

// Simple fallback component
function SimpleFallback() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-2xl">Loading...</div>
    </div>
  );
}

export default function Loading() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-transparent">
      {isClient ? (
        <div className="w-full h-[60vh] md:h-[80vh] flex items-center justify-center px-4 md:px-0">
          <PreloadModel />
          <div className="w-full max-w-[350px] sm:max-w-[450px] md:max-w-[600px] h-full">
            <Canvas
              camera={{ position: [0, 1.4, 3.2], fov: 100 }}
              className="w-full h-full"
              dpr={[1, 2]} // Limit pixel ratio for better performance
            >
              <Suspense fallback={null}>
                <Scene />
                <OrbitControls
                  enableZoom={false}
                  enablePan={false}
                  minDistance={1.5}
                  maxDistance={4}
                  maxPolarAngle={Math.PI / 2 - 0.1}
                />
                <Environment preset="sunset" />
              </Suspense>
            </Canvas>
          </div>
        </div>
      ) : (
        <SimpleFallback />
      )}
      <div
        className="text-lg sm:text-xl md:text-2xl mt-4 absolute bottom-5 md:bottom-10"
        aria-live="polite"
      >
        Loading...
      </div>
    </div>
  );
}
