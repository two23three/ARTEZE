// src/components/Gallery/Portrait.jsx - Updated with admin mode support
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
    if (artworkRef.current) {
      if (isSelected) {
        // Gentle hover animation for selected artwork
        artworkRef.current.position.z = 0.06 + Math.sin(state.clock.elapsedTime * 2) * 0.02;
      } else if (isHovered && isAdminMode) {
        // Admin hover effect
        artworkRef.current.position.z = 0.08;
      } else {
        artworkRef.current.position.z = 0.06;
      }
    }
  });

  // Admin mode colors and styling
  const getFrameColor = () => {
    if (isAdminMode) {
      if (!isVisible) return "#ff4444"; // Red for hidden
      if (isSelected) return "#10b981"; // Green for selected
      if (isHovered) return "#f59e0b"; // Yellow for hovered
      return "#6b7280"; // Gray for normal admin
    }
    return "#8B4513"; // Normal brown frame
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
      
      {/* Admin Status Indicators */}
      {isAdminMode && (
        <>
          {/* Visibility indicator */}
          <Text
            position={[0, -1.8, 0.1]}
            fontSize={0.1}
            color={isVisible ? "#10b981" : "#ff4444"}
            anchorX="center"
            anchorY="middle"
          >
            {isVisible ? "👁️ Visible" : "🚫 Hidden"}
          </Text>
          
          {/* Edit indicator on hover */}
          {isHovered && (
            <Text
              position={[0, 1.5, 0.1]}
              fontSize={0.12}
              color="#f59e0b"
              anchorX="center"
              anchorY="middle"
            >
              ✏️ Click to Edit
            </Text>
          )}
        </>
      )}
      
      {/* Error indicator */}
      {imageError && !isAdminMode && (
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
      
      {/* Selection indicator for normal mode */}
      {isSelected && !isAdminMode && (
        <mesh position={[0, 0, 0.08]}>
          <ringGeometry args={[1.1, 1.15, 32]} />
          <meshBasicMaterial color="#ff6b6b" transparent opacity={0.7} />
        </mesh>
      )}
      
      {/* Admin selection indicator */}
      {isSelected && isAdminMode && (
        <mesh position={[0, 0, 0.08]}>
          <ringGeometry args={[1.1, 1.15, 32]} />
          <meshBasicMaterial color="#10b981" transparent opacity={0.8} />
        </mesh>
      )}
      
      {/* Admin grid indicator (for positioning) */}
      {isAdminMode && isHovered && (
        <mesh position={[0, 0, -0.05]} rotation={[0, 0, 0]}>
          <planeGeometry args={[2.4, 2.9]} />
          <meshBasicMaterial 
            color="#f59e0b" 
            transparent 
            opacity={0.1}
            wireframe={true}
          />
        </mesh>
      )}
    </group>
  );
}