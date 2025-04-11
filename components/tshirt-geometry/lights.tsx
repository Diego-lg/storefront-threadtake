import React from "react";

export function Lights() {
  return (
    <>
      {/* Reduce explicit ambient light, rely more on Environment */}
      <ambientLight intensity={0.2} /> {/* Drastically reduce ambient light */}
      <directionalLight
        position={[10, 10, 5]}
        intensity={0.2} // Slightly reduce main directional intensity
        castShadow
        shadow-mapSize={[2048, 2048]} // Increase shadow map for better quality
        shadow-bias={-0.0001} // Helps prevent shadow acne
      />
      {/* Keep fill light subtle */}
      <directionalLight position={[-5, 5, -2]} intensity={0.15} />
      {/* Add a subtle spotlight for focus */}
      <spotLight
        position={[0, 10, 10]} // Position slightly different from directional
        angle={0.2}
        penumbra={0.5} // Softer edge
        intensity={0.5} // Subtle intensity
        castShadow={false} // Usually only one main shadow source is needed for performance/simplicity
      />
    </>
  );
}
