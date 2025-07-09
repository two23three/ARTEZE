// src/components/Gallery/Portrait.jsx - Updated with real image support
import React, { useRef, useState } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { TextureLoader } from 'three';
import { Text } from '@react-three/drei';

export default function Portrait({ position, rotation, title, onClick, isSelected, id, imageUrl }) {
  const frameRef = useRef();
  const artworkRef = useRef();
  const [imageError, setImageError] = useState(false);
  
  // Try to load the real image, fallback to placeholder
  let texture = null;
  try {
    if (imageUrl && !imageError) {
      texture = useLoader(TextureLoader, imageUrl, undefined, () => {
        setImageError(true);
        console.log('Failed to load image:', imageUrl);
      });
    }
  } catch (error) {
    console.log('Texture loading error:', error);
    setImageError(true);
  }
  
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
        {texture ? (
          <meshLambertMaterial 
            map={texture}
            transparent 
            opacity={isSelected ? 0.9 : 1}
          />
        ) : (
          <meshLambertMaterial 
            color={imageError ? "#ff4444" : (isSelected ? "#ff6b6b" : "#f0f0f0")} 
            transparent 
            opacity={isSelected ? 0.9 : 1}
          />
        )}
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
      
      {/* Error indicator */}
      {imageError && (
        <Text
          position={[0, -1.8, 0.1]}
          fontSize={0.1}
          color="#ff4444"
          anchorX="center"
          anchorY="middle"
          maxWidth={2}
        >
          (Image not found)
        </Text>
      )}
      
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