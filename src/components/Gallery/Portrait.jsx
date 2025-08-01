// src/components/Gallery/Portrait.jsx - Updated with simple retry logic
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
  const [retryCount, setRetryCount] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  
  // Add cache busting and retry logic
  const getImageUrl = () => {
    if (!imageUrl || imageError) return null;
    // Add timestamp to bypass cache on retry
    return retryCount > 0 ? `${imageUrl}?retry=${retryCount}&t=${Date.now()}` : imageUrl;
  };

  const currentImageUrl = getImageUrl();
  
  // Try to load the image with retry logic
  let texture = null;
  try {
    if (currentImageUrl && !imageError) {
      texture = useLoader(TextureLoader, currentImageUrl, undefined, (error) => {
        console.log(`Image load failed for "${title}":`, error);
        setImageError(true);
      });
    }
  } catch (error) {
    console.log(`Texture loading error for "${title}":`, error);
    setImageError(true);
  }
  
  // Retry function
  const retryImage = () => {
    if (retryCount < 3) { // Max 3 retries
      console.log(`Retrying image load for "${title}" (attempt ${retryCount + 1})`);
      setImageError(false);
      setRetryCount(prev => prev + 1);
    }
  };

  // Auto-retry after delay on first failure
  React.useEffect(() => {
    if (imageError && retryCount === 0) {
      const timer = setTimeout(() => {
        retryImage();
      }, 2000); // Wait 2 seconds before first retry
      return () => clearTimeout(timer);
    }
  }, [imageError, retryCount]);
  
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
      if (imageError && retryCount >= 3) return "#ff4444"; // Red after all retries failed
      if (imageError) return "#ffa500"; // Orange while retrying
      if (isSelected) return "#ff6b6b";
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
          // If image failed and we haven't exceeded retries, retry on click
          if (imageError && retryCount < 3) {
            retryImage();
          } else {
            onClick(id);
          }
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
      
      {/* Status Text */}
      <Text
        position={[0, -1.8, 0.1]}
        fontSize={0.1}
        color={
          imageError ? (retryCount >= 3 ? "#ff4444" : "#ffa500") :
          isAdminMode ? (isVisible ? "#10b981" : "#ff4444") : "#666"
        }
        anchorX="center"
        anchorY="middle"
      >
        {imageError ? 
          (retryCount >= 3 ? "Click to retry" : `Retrying... (${retryCount}/3)`) :
          isAdminMode ? (isVisible ? "👁️ Visible" : "🚫 Hidden") : ""
        }
      </Text>
      
      {/* Selection indicators - same as before */}
      {isSelected && !isAdminMode && (
        <mesh position={[0, 0, 0.08]}>
          <ringGeometry args={[1.1, 1.15, 32]} />
          <meshBasicMaterial color="#ff6b6b" transparent opacity={0.7} />
        </mesh>
      )}
      
      {isSelected && isAdminMode && (
        <mesh position={[0, 0, 0.08]}>
          <ringGeometry args={[1.1, 1.15, 32]} />
          <meshBasicMaterial color="#10b981" transparent opacity={0.8} />
        </mesh>
      )}
    </group>
  );
}