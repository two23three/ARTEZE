// src/components/Gallery/Studio.jsx
import React from 'react';

export default function Studio() {
  return (
    <group>
      {/* Floor with subtle texture */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshLambertMaterial color="#e8e8e8" />
      </mesh>
      
      {/* Back Wall */}
      <mesh position={[0, 2.5, -10]} receiveShadow>
        <planeGeometry args={[20, 5]} />
        <meshLambertMaterial color="#f5f5f5" />
      </mesh>
      
      {/* Left Wall */}
      <mesh position={[-10, 2.5, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[20, 5]} />
        <meshLambertMaterial color="#f5f5f5" />
      </mesh>
      
      {/* Right Wall */}
      <mesh position={[10, 2.5, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[20, 5]} />
        <meshLambertMaterial color="#f8f8f8" />
      </mesh>
      
      {/* Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 5, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshLambertMaterial color="#ffffff" />
      </mesh>
      
      {/* Gallery Lighting Fixtures */}
      <mesh position={[-2, 4.8, -8]} rotation={[Math.PI, 0, 0]}>
        <cylinderGeometry args={[0.2, 0.15, 0.3]} />
        <meshLambertMaterial color="#333" />
      </mesh>
      
      <mesh position={[2, 4.8, -8]} rotation={[Math.PI, 0, 0]}>
        <cylinderGeometry args={[0.2, 0.15, 0.3]} />
        <meshLambertMaterial color="#333" />
      </mesh>
    </group>
  );
}