// src/components/Gallery/VirtualStudio.jsx - Fixed Mouse Look & Mobile Controls
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';

// Import gallery components
import Studio from './Studio';
import Character from './Character';
import GalleryLighting from './Lighting';
import Portrait from './Portrait';

// Import UI components
import Instructions from '../UI/Instructions';
import MobileControls from '../UI/MobileControls';
import ArtworkDetail from '../UI/ArtworkDetail';

// Import data
import { mockArtworks } from '../../data/mockArtworks';

// Movement handler component
function MovementHandler({ 
  keysPressed, 
  characterPosition, 
  characterRotation, 
  setCharacterPosition,
  setIsWalking,
  setWalkingSpeed 
}) {
  const lastTime = useRef(0);
  
  useFrame((state) => {
    const currentTime = state.clock.elapsedTime;
    const deltaTime = currentTime - lastTime.current;
    
    if (deltaTime < 0.016) return; // Limit to ~60fps
    lastTime.current = currentTime;
    
    const hasMovement = keysPressed.current.size > 0;
    setIsWalking(hasMovement);
    
    if (!hasMovement) {
      setWalkingSpeed(prev => Math.max(prev - 0.01, 0));
      return;
    }
    
    setWalkingSpeed(prev => Math.min(prev + 0.01, 0.05));
    
    const speed = 0.15;
    const [x, y, z] = characterPosition;

    // Calculate movement based on character rotation (first person)
    const forward = {
      x: -Math.sin(characterRotation),
      z: -Math.cos(characterRotation)
    };
    
    const right = {
      x: Math.cos(characterRotation),
      z: Math.sin(characterRotation)
    };

    let newX = x;
    let newZ = z;

    // Process movement keys relative to where character is looking
    if (keysPressed.current.has('w') || keysPressed.current.has('arrowup')) {
      newX += forward.x * speed;
      newZ += forward.z * speed;
    }
    if (keysPressed.current.has('s') || keysPressed.current.has('arrowdown')) {
      newX -= forward.x * speed;
      newZ -= forward.z * speed;
    }
    if (keysPressed.current.has('a') || keysPressed.current.has('arrowleft')) {
      newX -= right.x * speed;
      newZ -= right.z * speed;
    }
    if (keysPressed.current.has('d') || keysPressed.current.has('arrowright')) {
      newX += right.x * speed;
      newZ += right.z * speed;
    }

    // Boundary constraints
    newX = Math.max(-8.5, Math.min(8.5, newX));
    newZ = Math.max(-8.5, Math.min(8.5, newZ));

    // Update position if changed
    if (Math.abs(newX - x) > 0.001 || Math.abs(newZ - z) > 0.001) {
      setCharacterPosition([newX, y, newZ]);
    }
  });
  
  return null;
}

export default function VirtualStudio() {
  const [characterPosition, setCharacterPosition] = useState([0, 0, 5]);
  const [characterRotation, setCharacterRotation] = useState(0);
  const [cameraRotation, setCameraRotation] = useState(0);
  const [selectedArtwork, setSelectedArtwork] = useState(null);
  const [detailArtwork, setDetailArtwork] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isWalking, setIsWalking] = useState(false);
  const [walkingSpeed, setWalkingSpeed] = useState(0);
  
  // Movement state tracking
  const keysPressed = useRef(new Set());
  const isPointerLocked = useRef(false);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Pointer lock setup for desktop - FIXED VERSION
  useEffect(() => {
    if (isMobile) return;

    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    const handleClick = (event) => {
      // Only request pointer lock if clicking on canvas and not already locked
      if (event.target === canvas && !isPointerLocked.current) {
        canvas.requestPointerLock();
      }
    };

    const handlePointerLockChange = () => {
      isPointerLocked.current = document.pointerLockElement === canvas;
      
      // Change cursor to indicate pointer lock status
      if (isPointerLocked.current) {
        document.body.style.cursor = 'none';
      } else {
        document.body.style.cursor = 'auto';
      }
    };

    const handleMouseMove = (event) => {
      if (!isPointerLocked.current) return;

      const movementX = event.movementX || 0;
      const movementY = event.movementY || 0;

      // FIXED: Proper sensitivity for smooth movement
      const sensitivity = 0.002;

      // Rotate character body for left/right look
      setCharacterRotation(prev => prev - movementX * sensitivity);
      
      // Rotate camera for up/down look with proper clamping
      setCameraRotation(prev => {
        const newRotation = prev - movementY * sensitivity;
        // Clamp between -90 and +90 degrees (looking down to looking up)
        return Math.max(-Math.PI/2, Math.min(Math.PI/2, newRotation));
      });
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isPointerLocked.current) {
        document.exitPointerLock();
      }
    };

    // Add event listeners to canvas specifically
    canvas.addEventListener('click', handleClick);
    document.addEventListener('pointerlockchange', handlePointerLockChange);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      canvas.removeEventListener('click', handleClick);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMobile]);

  // Handle artwork selection
  const handleArtworkClick = useCallback((artworkId) => {
    if (selectedArtwork === artworkId) {
      const artwork = mockArtworks.find(art => art.id === artworkId);
      setDetailArtwork(artwork);
    } else {
      setSelectedArtwork(artworkId);
    }
  }, [selectedArtwork]);

  // Handle key down events
  const handleKeyDown = useCallback((event) => {
    const key = event.key.toLowerCase();
    
    if (['w', 's', 'a', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
      event.preventDefault();
      keysPressed.current.add(key);
    }
    
    if (key === 'escape') {
      setSelectedArtwork(null);
      setDetailArtwork(null);
      if (document.exitPointerLock) {
        document.exitPointerLock();
      }
    }
  }, []);

  // Handle key up events
  const handleKeyUp = useCallback((event) => {
    const key = event.key.toLowerCase();
    keysPressed.current.delete(key);
  }, []);

  // Set up keyboard event listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  // Handle mobile movement - Roblox Style (relative to camera direction)
  const handleMobileMove = useCallback((newPosition, movement) => {
    if (movement) {
      // Movement relative to camera direction
      const { forward, right } = movement;
      const [x, y, z] = characterPosition;
      
      // Calculate movement direction based on character rotation
      const cosRotation = Math.cos(characterRotation);
      const sinRotation = Math.sin(characterRotation);
      
      // Apply movement relative to where character is facing
      const newX = x + (forward * -sinRotation + right * cosRotation);
      const newZ = z + (forward * -cosRotation + right * -sinRotation);
      
      // Apply boundaries
      const clampedX = Math.max(-8.5, Math.min(8.5, newX));
      const clampedZ = Math.max(-8.5, Math.min(8.5, newZ));
      
      setCharacterPosition([clampedX, y, clampedZ]);
    } else if (newPosition) {
      // Direct position update (fallback)
      setCharacterPosition(newPosition);
    }
  }, [characterPosition, characterRotation]);

  // Handle mobile rotation - Smooth camera control
  const handleMobileRotate = useCallback((axis, delta) => {
    if (axis === 'horizontal') {
      setCharacterRotation(prev => prev + delta);
    } else if (axis === 'vertical') {
      setCameraRotation(prev => {
        const newRotation = prev + delta;
        return Math.max(-Math.PI/2, Math.min(Math.PI/2, newRotation));
      });
    }
  }, []);

  return (
    <>
      {/* 3D Canvas */}
      <Canvas 
        camera={{ position: [0, 1.6, 5], fov: 75 }}
        shadows
        style={{ background: '#2c2c2c' }}
        onCreated={({ gl }) => {
          gl.domElement.oncontextmenu = (e) => e.preventDefault();
          // Ensure canvas can receive focus for pointer lock
          gl.domElement.setAttribute('tabindex', '0');
        }}
      >
        {/* Movement Handler */}
        <MovementHandler
          keysPressed={keysPressed}
          characterPosition={characterPosition}
          characterRotation={characterRotation}
          setCharacterPosition={setCharacterPosition}
          setIsWalking={setIsWalking}
          setWalkingSpeed={setWalkingSpeed}
        />
        
        {/* Gallery Environment */}
        <GalleryLighting />
        <Studio />
        
        {/* Visitor Character */}
        <Character 
          position={characterPosition}
          rotation={characterRotation}
          cameraRotation={cameraRotation}
          isWalking={isWalking}
          walkingSpeed={walkingSpeed}
        />
        
        {/* Artwork Displays */}
        {mockArtworks.map((artwork) => (
          <Portrait
            key={artwork.id}
            position={artwork.position}
            rotation={artwork.rotation}
            title={artwork.title}
            id={artwork.id}
            isSelected={selectedArtwork === artwork.id}
            onClick={handleArtworkClick}
          />
        ))}
      </Canvas>

      {/* UI Overlays */}
      <Instructions />
      
      {/* Mobile Controls */}
      {isMobile && (
        <MobileControls 
          onMove={handleMobileMove}
          onRotate={handleMobileRotate}
          characterPosition={characterPosition}
          isMobile={isMobile}
        />
      )}

      {/* Artwork Detail Modal */}
      <ArtworkDetail 
        artwork={detailArtwork}
        onClose={() => setDetailArtwork(null)}
      />

      {/* Info Panel */}
      <div className="version-label">
        Virtual Studio - Phase 1
        {!isPointerLocked.current && !isMobile && (
          <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
            Click canvas to enable mouse look
          </div>
        )}
        {isPointerLocked.current && !isMobile && (
          <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
            ESC to exit mouse look
          </div>
        )}
        {selectedArtwork && (
          <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
            Click artwork again for details
          </div>
        )}
      </div>
    </>
  );
}