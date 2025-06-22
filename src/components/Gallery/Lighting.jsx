// src/components/Gallery/Lighting.jsx
import React from 'react';

export default function GalleryLighting() {
  return (
    <>
      {/* Ambient lighting for overall illumination */}
      <ambientLight intensity={0.4} />
      
      {/* Main directional light from above */}
      <directionalLight 
        position={[0, 10, 0]} 
        intensity={0.8}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      
      {/* Spotlights for artwork illumination */}
      <spotLight 
        position={[-5, 5, 5]} 
        intensity={0.5} 
        angle={0.3}
        penumbra={0.5}
        target-position={[-3, 2.5, -9.8]}
      />
      
      <spotLight 
        position={[5, 5, 5]} 
        intensity={0.5} 
        angle={0.3}
        penumbra={0.5}
        target-position={[3, 2.5, -9.8]}
      />
      
      {/* Side lighting for left wall artworks */}
      <pointLight position={[-5, 4, -3]} intensity={0.3} />
      <pointLight position={[-5, 4, 0]} intensity={0.3} />
      <pointLight position={[-5, 4, 3]} intensity={0.3} />
      
      {/* Back wall center lighting */}
      <pointLight position={[0, 4, -8]} intensity={0.4} />
    </>
  );
}