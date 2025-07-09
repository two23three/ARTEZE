// src/components/Gallery/VirtualStudio.jsx - Updated with Supabase Integration
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

// Import hooks and utilities
import { useArtistGallery } from '../../hooks/useArtistGallery';
import { useAnalytics } from '../../hooks/useAnalytics';

// Helper function to extract subdomain
function getSubdomain() {
  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  
  // For development (localhost), default to 'samok'
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'samok'; // Default to samo.k's gallery for testing
  }
  
  // For production (subdomain.arteze.com)
  if (parts.length >= 3) {
    return parts[0]; // Return subdomain
  }
  
  // For main domain (arteze.com)
  return null;
}

// Loading component
function LoadingScreen() {
  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      color: 'white',
      fontSize: '1.2rem',
      textAlign: 'center',
      zIndex: 100
    }}>
      <div>Loading Gallery...</div>
      <div style={{ fontSize: '0.9rem', marginTop: '0.5rem', opacity: 0.7 }}>
        Preparing your virtual art experience
      </div>
    </div>
  );
}

// Error component
function ErrorScreen({ error, subdomain }) {
  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      color: 'white',
      fontSize: '1.2rem',
      textAlign: 'center',
      zIndex: 100,
      maxWidth: '400px',
      padding: '2rem'
    }}>
      <div>Gallery Not Found</div>
      <div style={{ fontSize: '0.9rem', marginTop: '0.5rem', opacity: 0.7 }}>
        {subdomain ? `No gallery found for "${subdomain}"` : 'Invalid gallery URL'}
      </div>
      <div style={{ fontSize: '0.8rem', marginTop: '1rem', opacity: 0.5 }}>
        {error}
      </div>
    </div>
  );
}

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
    
    if (deltaTime < 0.016) return;
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

    newX = Math.max(-8.5, Math.min(8.5, newX));
    newZ = Math.max(-8.5, Math.min(8.5, newZ));

    if (Math.abs(newX - x) > 0.001 || Math.abs(newZ - z) > 0.001) {
      setCharacterPosition([newX, y, newZ]);
    }
  });
  
  return null;
}

export default function VirtualStudio() {
  // Get subdomain from URL
  const subdomain = getSubdomain();
  
  // Fetch gallery data from Supabase
  const { artist, artworks, loading, error } = useArtistGallery(subdomain);
  
  // Analytics tracking
  const { startGalleryVisit, trackArtworkInteraction, endGalleryVisit } = useAnalytics();
  
  // Component state
  const [characterPosition, setCharacterPosition] = useState([0, 0, 5]);
  const [characterRotation, setCharacterRotation] = useState(0);
  const [cameraRotation, setCameraRotation] = useState(0);
  const [selectedArtwork, setSelectedArtwork] = useState(null);
  const [detailArtwork, setDetailArtwork] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isWalking, setIsWalking] = useState(false);
  const [walkingSpeed, setWalkingSpeed] = useState(0);
  const [viewedArtworks, setViewedArtworks] = useState(new Set());
  
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

  // Start analytics tracking when gallery loads
  useEffect(() => {
    if (artist && !loading) {
      startGalleryVisit(artist.id);
      sessionStorage.setItem('visit-start-time', Date.now().toString());
      
      // Track page visibility to end visit when user leaves
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'hidden') {
          endGalleryVisit(viewedArtworks.size);
        }
      };
      
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        endGalleryVisit(viewedArtworks.size);
      };
    }
  }, [artist, loading]);

  // Pointer lock setup for desktop
  useEffect(() => {
    if (isMobile) return;

    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    const handleClick = (event) => {
      if (event.target === canvas && !isPointerLocked.current) {
        canvas.requestPointerLock();
      }
    };

    const handlePointerLockChange = () => {
      isPointerLocked.current = document.pointerLockElement === canvas;
      
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

      const horizontalSensitivity = 0.001;
      const verticalSensitivity = 0.0008;

      if (Math.abs(movementX) > 1) {
        setCharacterRotation(prev => prev - movementX * horizontalSensitivity);
      }
      
      if (Math.abs(movementY) > 1) {
        setCameraRotation(prev => {
          const newRotation = prev - movementY * verticalSensitivity;
          return Math.max(-Math.PI/2, Math.min(Math.PI/2, newRotation));
        });
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isPointerLocked.current) {
        document.exitPointerLock();
      }
    };

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

  // Handle artwork selection with analytics
  const handleArtworkClick = useCallback(async (artworkId) => {
    const artwork = artworks.find(art => art.id === artworkId);
    if (!artwork) return;

    // Track artwork view if not already viewed
    if (!viewedArtworks.has(artworkId)) {
      await trackArtworkInteraction(artworkId, 'viewed');
      setViewedArtworks(prev => new Set([...prev, artworkId]));
    }

    if (selectedArtwork === artworkId) {
      // Second click - open detail view
      setDetailArtwork(artwork);
      await trackArtworkInteraction(artworkId, 'detail_viewed');
    } else {
      // First click - select artwork
      setSelectedArtwork(artworkId);
    }
  }, [selectedArtwork, artworks, trackArtworkInteraction, viewedArtworks]);

  // Keyboard event handlers
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

  const handleKeyUp = useCallback((event) => {
    const key = event.key.toLowerCase();
    keysPressed.current.delete(key);
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  // Mobile controls
  const handleMobileMove = useCallback((newPosition, movement) => {
    if (movement) {
      const { forward, right } = movement;
      
      setCharacterPosition(prevPosition => {
        const [x, y, z] = prevPosition;
        
        const cosRotation = Math.cos(characterRotation);
        const sinRotation = Math.sin(characterRotation);
        
        const deltaX = forward * -sinRotation + right * cosRotation;
        const deltaZ = forward * -cosRotation + right * -sinRotation;
        
        const newX = x + deltaX;
        const newZ = z + deltaZ;
        
        const clampedX = Math.max(-8.5, Math.min(8.5, newX));
        const clampedZ = Math.max(-8.5, Math.min(8.5, newZ));
        
        return [clampedX, y, clampedZ];
      });
      
      setIsWalking(Math.abs(forward) > 0.01 || Math.abs(right) > 0.01);
    } else if (newPosition) {
      setCharacterPosition(newPosition);
      setIsWalking(false);
    }
  }, [characterRotation, setIsWalking]);

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

  // Show loading screen
  if (loading) {
    return <LoadingScreen />;
  }

  // Show error screen
  if (error || !artist) {
    return <ErrorScreen error={error} subdomain={subdomain} />;
  }

  // Show gallery not found for main domain
  if (!subdomain) {
    return (
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        color: 'white',
        fontSize: '1.2rem',
        textAlign: 'center',
        zIndex: 100
      }}>
        <div>Welcome to Arteze</div>
        <div style={{ fontSize: '0.9rem', marginTop: '0.5rem', opacity: 0.7 }}>
          Visit an artist's gallery at: artist.arteze.com
        </div>
      </div>
    );
  }

  return (
    <>
      {/* 3D Canvas */}
      <Canvas 
        camera={{ position: [0, 1.6, 5], fov: 75 }}
        shadows
        style={{ background: '#2c2c2c' }}
        onCreated={({ gl }) => {
          gl.domElement.oncontextmenu = (e) => e.preventDefault();
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
        
        {/* Artwork Displays - Now using real data from Supabase */}
        {artworks.map((artwork) => (
          <Portrait
            key={artwork.id}
            position={artwork.position}
            rotation={artwork.rotation}
            title={artwork.title}
            id={artwork.id}
            imageUrl={artwork.imageUrl}
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
        {artist?.display_name}'s Gallery - {artworks.length} Artworks
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