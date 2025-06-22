// src/components/Gallery/Portrait.jsx
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';

export default function Portrait({ position, rotation, title, onClick, isSelected, id }) {
  const frameRef = useRef();
  const artworkRef = useRef();
  
  useFrame((state) => {
    if (artworkRef.current && isSelected) {
      // Gentle hover animation for selected artwork
      artworkRef.current.position.z = 0.06 + Math.sin(state.clock.elapsedTime * 2) * 0.02;
    }
  });

  return (
    <group position={position} rotation={rotation}>
      {/* Picture Frame */}
      <mesh ref={frameRef}>
        <boxGeometry args={[2.2, 2.7, 0.1]} />
        <meshLambertMaterial color="#8B4513" />
      </mesh>
      
      {/* Artwork Canvas */}
      <mesh 
        ref={artworkRef}
        position={[0, 0, 0.06]} 
        onClick={(event) => {
          event.stopPropagation();
          onClick(id);
        }}
        onPointerOver={(event) => {
          event.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
        }}
      >
        <planeGeometry args={[2, 2.5]} />
        <meshLambertMaterial 
          color={isSelected ? "#ff6b6b" : "#f0f0f0"} 
          transparent 
          opacity={isSelected ? 0.9 : 1}
        />
      </mesh>
      
      {/* Artwork Title */}
      <Text
        position={[0, -1.5, 0.1]}
        fontSize={0.15}
        color="#333"
        anchorX="center"
        anchorY="middle"
        maxWidth={2}
      >
        {title}
      </Text>
      
      {/* Selection indicator */}
      {isSelected && (
        <mesh position={[0, 0, 0.08]}>
          <ringGeometry args={[1.1, 1.15, 32]} />
          <meshBasicMaterial color="#ff6b6b" transparent opacity={0.7} />
        </mesh>
      )}
    </group>
  );
}