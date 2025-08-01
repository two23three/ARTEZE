// src/components/Gallery/Portrait.jsx - Fixed version
import React, { useRef, useState } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { TextureLoader } from 'three';
import { Text } from '@react-three/drei';

export default function Portrait({ 
  position, 
  rotation, 
  title, 
  onClick, 
  isSelected, 
  id, 
  imageUrl,
  isAdminMode = false,
  isVisible = true
}) {
  const frameRef = useRef();
  const artworkRef = useRef();
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  // Debug log the imageUrl
  //console.log(`Portrait ${title}: imageUrl = ${imageUrl}`);
  
  // Try to load the image with better error handling
  let texture = null;
  try {
    if (imageUrl && !imageError) {
      texture = useLoader(
        TextureLoader, 
        imageUrl,
        undefined,
        (error) => {
          console.log(`Failed to load image for ${title}:`, error);
          setImageError(true);
        }
      );
    }
  } catch (error) {
    console.log(`Texture loading error for ${title}:`, error);
    setImageError(true);
  }
  
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
      if (imageError) return "#ff4444";
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
      
      {/* Debug info - remove this after testing */}
      {/* {imageError && (
        <Text
          position={[0, -1.8, 0.1]}
          fontSize={0.1}
          color="#ff4444"
          anchorX="center"
          anchorY="middle"
          maxWidth={2}
        >
          Image failed to load
        </Text>
      )} */}
      
      {!imageUrl && (
        <Text
          position={[0, -2.1, 0.1]}
          fontSize={0.08}
          color="#ffaa00"
          anchorX="center"
          anchorY="middle"
          maxWidth={2}
        >
          No image URL
        </Text>
      )}
    </group>
  );
}