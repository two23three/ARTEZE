// src/components/Gallery/Portrait.jsx - Simplified version using preloaded textures
import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';

export default function Portrait({ 
  position, 
  rotation, 
  title, 
  onClick, 
  isSelected, 
  id, 
  texture, // Preloaded texture passed as prop
  isAdminMode = false,
  isVisible = true
}) {
  const frameRef = useRef();
  const artworkRef = useRef();
  const [isHovered, setIsHovered] = useState(false);
  
  useFrame((state) => {
    if (artworkRef.current) {
      if (isSelected) {
        artworkRef.current.position.z = 0.06 + Math.sin(state.clock.elapsedTime * 2) * 0.02;
      } else if (isHovered && isAdminMode) {
        artworkRef.current.position.z = 0.08;
      } else {
        artworkRef.current.position.z = 0.06;
      }
    }
  });

  const getFrameColor = () => {
    if (isAdminMode) {
      if (!isVisible) return "#ff4444";
      if (isSelected) return "#10b981";
      if (isHovered) return "#f59e0b";
      return "#6b7280";
    }
    return "#8B4513";
  };

  const getArtworkColor = () => {
    if (!texture) {
      if (isSelected) return "#ff6b6b";
      if (isAdminMode && !isVisible) return "#991b1b";
      return "#f0f0f0";
    }
    return null;
  };

  const getOpacity = () => {
    if (isAdminMode && !isVisible) return 0.5;
    if (isSelected) return 0.9;
    return 1;
  };

  return (
    <group position={position} rotation={rotation}>
      {/* Picture Frame */}
      <mesh ref={frameRef}>
        <boxGeometry args={[2.2, 2.7, 0.1]} />
        <meshLambertMaterial 
          color={getFrameColor()} 
          transparent
          opacity={getOpacity()}
        />
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
          setIsHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setIsHovered(false);
          document.body.style.cursor = 'auto';
        }}
      >
        <planeGeometry args={[2, 2.5]} />
        {texture ? (
          <meshLambertMaterial 
            map={texture}
            transparent 
            opacity={getOpacity()}
          />
        ) : (
          <meshLambertMaterial 
            color={getArtworkColor()} 
            transparent 
            opacity={getOpacity()}
          />
        )}
      </mesh>
      
      {/* Artwork Title */}
      <Text
        position={[0, -1.5, 0.1]}
        fontSize={0.15}
        color={isAdminMode && !isVisible ? "#ff4444" : "#333"}
        anchorX="center"
        anchorY="middle"
        maxWidth={2}
      >
        {title}
      </Text>
      
      {/* Show loading state if no texture */}
      {!texture && (
        <Text
          position={[0, -1.8, 0.1]}
          fontSize={0.1}
          color="#ffaa00"
          anchorX="center"
          anchorY="middle"
          maxWidth={2}
        >
          Loading...
        </Text>
      )}
    </group>
  );
}