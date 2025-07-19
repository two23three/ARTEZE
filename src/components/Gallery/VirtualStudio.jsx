// src/components/Gallery/VirtualStudio.jsx - With Fixed Mouse Controls & Admin Mode
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
import { AdminToolbar, ArtworkEditPanel } from '../Admin/GalleryAdminMode';

// Import hooks and utilities
import { useArtistGallery } from '../../hooks/useArtistGallery';
import { useAnalytics } from '../../hooks/useAnalytics';
import { supabase } from '../../lib/supabase';

// Helper function to extract subdomain
// Helper function to extract subdomain
function getSubdomain() {
  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'samok';
  }
  
  // Handle main domain (arteze.vercel.app -> show samok as demo)
  if (hostname === 'arteze.vercel.app') {
    return 'samok';
  }
  
  // Handle real subdomains (artist.arteze.com)
  if (parts.length >= 3 && !hostname.includes('vercel.app')) {
    return parts[0];
  }
  
  return null;
}

// Check if user is the artist (simple auth check)
function useArtistAuth(artistId) {
  const [isArtist, setIsArtist] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // For now, simple localStorage check
    // In production, this would be proper authentication
    const isAuthenticated = localStorage.getItem('artist-auth') === artistId;
    setIsArtist(isAuthenticated);
    setLoading(false);
  }, [artistId]);

  const login = () => {
    // Simple demo login - in production use proper auth
    const password = prompt('Enter artist password:');
    if (password === 'artist123') {
      localStorage.setItem('artist-auth', artistId);
      setIsArtist(true);
    }
  };

  const logout = () => {
    localStorage.removeItem('artist-auth');
    setIsArtist(false);
  };

  return { isArtist, loading, login, logout };
}

// Generate default positions for new artworks
function generateDefaultPosition(existingArtworks) {
  const wallPositions = [
    // Back wall
    { x: -6, y: 2.5, z: -9.8, rotation: [0, 0, 0] },
    { x: -3, y: 2.5, z: -9.8, rotation: [0, 0, 0] },
    { x: 0, y: 2.5, z: -9.8, rotation: [0, 0, 0] },
    { x: 3, y: 2.5, z: -9.8, rotation: [0, 0, 0] },
    { x: 6, y: 2.5, z: -9.8, rotation: [0, 0, 0] },
    // Left wall
    { x: -9.8, y: 2.5, z: -6, rotation: [0, Math.PI / 2, 0] },
    { x: -9.8, y: 2.5, z: -3, rotation: [0, Math.PI / 2, 0] },
    { x: -9.8, y: 2.5, z: 0, rotation: [0, Math.PI / 2, 0] },
    { x: -9.8, y: 2.5, z: 3, rotation: [0, Math.PI / 2, 0] },
    // Right wall
    { x: 9.8, y: 2.5, z: -6, rotation: [0, -Math.PI / 2, 0] },
    { x: 9.8, y: 2.5, z: -3, rotation: [0, -Math.PI / 2, 0] },
    { x: 9.8, y: 2.5, z: 0, rotation: [0, -Math.PI / 2, 0] },
    { x: 9.8, y: 2.5, z: 3, rotation: [0, -Math.PI / 2, 0] }
  ];

  // Find first available position
  for (const pos of wallPositions) {
    const occupied = existingArtworks.some(artwork => 
      Math.abs(artwork.position[0] - pos.x) < 1 && 
      Math.abs(artwork.position[2] - pos.z) < 1
    );
    if (!occupied) {
      return { position: [pos.x, pos.y, pos.z], rotation: pos.rotation };
    }
  }

  // If no space, place in center
  return { position: [0, 2.5, -5], rotation: [0, 0, 0] };
}

// Loading and Error components
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

// Movement handler component - FIXED VERSION
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
  const subdomain = getSubdomain();
  const { artist, artworks, loading, error, refetch } = useArtistGallery(subdomain);
  const { isArtist, loading: authLoading, login } = useArtistAuth(artist?.id);
  const { startGalleryVisit, trackArtworkInteraction, endGalleryVisit } = useAnalytics();
  
  // Gallery state
  const [localArtworks, setLocalArtworks] = useState([]);
  const [characterPosition, setCharacterPosition] = useState([0, 0, 5]);
  const [characterRotation, setCharacterRotation] = useState(0);
  const [cameraRotation, setCameraRotation] = useState(0);
  const [selectedArtwork, setSelectedArtwork] = useState(null);
  const [detailArtwork, setDetailArtwork] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isWalking, setIsWalking] = useState(false);
  const [walkingSpeed, setWalkingSpeed] = useState(0);
  const [viewedArtworks, setViewedArtworks] = useState(new Set());
  
  // Admin state
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [editingArtwork, setEditingArtwork] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Movement state
  const keysPressed = useRef(new Set());
  const isPointerLocked = useRef(false);

  // Update local artworks when data changes
  useEffect(() => {
    if (artworks) {
      setLocalArtworks(artworks);
    }
  }, [artworks]);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Analytics tracking
  useEffect(() => {
    if (artist && !loading) {
      startGalleryVisit(artist.id);
      sessionStorage.setItem('visit-start-time', Date.now().toString());
      
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

  // Admin mode functions
  const handleToggleAdmin = () => {
    if (!isArtist) {
      login();
    } else {
      setIsAdminMode(!isAdminMode);
      setEditingArtwork(null);
    }
  };

  const handleAddArtwork = async () => {
    if (!artist) return;

    const defaultPos = generateDefaultPosition(localArtworks);
    
    try {
      const { data, error } = await supabase
        .from('artworks')
        .insert([{
          artist_id: artist.id,
          title: 'New Artwork',
          description: 'Description for new artwork',
          medium: 'Mixed Media',
          dimensions: '24" x 36"',
          year: new Date().getFullYear(),
          position_x: defaultPos.position[0],
          position_y: defaultPos.position[1],
          position_z: defaultPos.position[2],
          rotation_x: defaultPos.rotation[0],
          rotation_y: defaultPos.rotation[1],
          rotation_z: defaultPos.rotation[2],
          is_visible: true,
          is_for_sale: false,
          display_order: localArtworks.length + 1
        }])
        .select()
        .single();

      if (error) throw error;

      // Add to local state
      const newArtwork = {
        id: data.id,
        title: data.title,
        description: data.description,
        medium: data.medium,
        dimensions: data.dimensions,
        year: data.year,
        position: defaultPos.position,
        rotation: defaultPos.rotation,
        imageUrl: null,
        thumbnailUrl: null,
        hiresUrl: null,
        price: null,
        isForSale: data.is_for_sale,
        isVisible: data.is_visible,
        viewCount: 0,
        detailViewCount: 0,
        displayOrder: data.display_order
      };

      setLocalArtworks(prev => [...prev, newArtwork]);
      setEditingArtwork(newArtwork);
      setHasUnsavedChanges(true);
    } catch (error) {
      console.error('Error adding artwork:', error);
      alert('Failed to add artwork: ' + error.message);
    }
  };

  const handleUpdateArtwork = async (artworkId, updates) => {
    try {
      // Update local state immediately
      setLocalArtworks(prev => prev.map(artwork => 
        artwork.id === artworkId ? { ...artwork, ...updates } : artwork
      ));

      // Update in database
      const { error } = await supabase
        .from('artworks')
        .update({
          title: updates.title,
          description: updates.description,
          medium: updates.medium,
          dimensions: updates.dimensions,
          year: updates.year,
          is_visible: updates.isVisible,
          is_for_sale: updates.isForSale,
          price_usd: updates.price ? parseFloat(updates.price) : null
        })
        .eq('id', artworkId);

      if (error) throw error;

      setHasUnsavedChanges(false);
      setEditingArtwork(null);
    } catch (error) {
      console.error('Error updating artwork:', error);
      alert('Failed to update artwork: ' + error.message);
    }
  };

  const handleDeleteArtwork = async (artworkId) => {
    try {
      const { error } = await supabase
        .from('artworks')
        .delete()
        .eq('id', artworkId);

      if (error) throw error;

      setLocalArtworks(prev => prev.filter(artwork => artwork.id !== artworkId));
      setEditingArtwork(null);
      setSelectedArtwork(null);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error deleting artwork:', error);
      alert('Failed to delete artwork: ' + error.message);
    }
  };

  const handleSaveChanges = async () => {
    // Save any pending changes
    await refetch();
    setHasUnsavedChanges(false);
  };

  // Artwork interaction handlers
  const handleArtworkClick = useCallback(async (artworkId) => {
    const artwork = localArtworks.find(art => art.id === artworkId);
    if (!artwork) return;

    if (isAdminMode) {
      // In admin mode, clicking opens edit panel
      setEditingArtwork(artwork);
      return;
    }

    // Normal visitor mode
    if (!viewedArtworks.has(artworkId)) {
      await trackArtworkInteraction(artworkId, 'viewed');
      setViewedArtworks(prev => new Set([...prev, artworkId]));
    }

    if (selectedArtwork === artworkId) {
      setDetailArtwork(artwork);
      await trackArtworkInteraction(artworkId, 'detail_viewed');
    } else {
      setSelectedArtwork(artworkId);
    }
  }, [selectedArtwork, localArtworks, trackArtworkInteraction, viewedArtworks, isAdminMode]);

  // Keyboard handlers
  const handleKeyDown = useCallback((event) => {
    const key = event.key.toLowerCase();
    
    if (['w', 's', 'a', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
      event.preventDefault();
      keysPressed.current.add(key);
    }
    
    if (key === 'escape') {
      setSelectedArtwork(null);
      setDetailArtwork(null);
      setEditingArtwork(null);
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

  // Pointer lock setup for desktop - FIXED VERSION from earlier
  useEffect(() => {
    if (isMobile) return;

    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    const handleClick = (event) => {
      // Only request pointer lock if clicking on canvas and not already locked
      if (event.target === canvas && !isPointerLocked.current && !isAdminMode) {
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

      // Much lower sensitivity like mobile - was 0.002, now 0.001
      const horizontalSensitivity = 0.001;
      const verticalSensitivity = 0.0008; // Even lower for vertical

      // Dead zones to prevent tiny jittery movements
      if (Math.abs(movementX) > 1) {
        setCharacterRotation(prev => prev - movementX * horizontalSensitivity);
      }
      
      if (Math.abs(movementY) > 1) {
        setCameraRotation(prev => {
          const newRotation = prev - movementY * verticalSensitivity;
          // Clamp between -90 and +90 degrees (looking down to looking up)
          return Math.max(-Math.PI/2, Math.min(Math.PI/2, newRotation));
        });
      }
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
  }, [isMobile, isAdminMode]);

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

  // Loading states
  if (loading || authLoading) {
    return <LoadingScreen />;
  }

  if (error || !artist) {
    return <ErrorScreen error={error} subdomain={subdomain} />;
  }

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
      {/* Admin Toolbar */}
      {(isArtist || !isAdminMode) && (
        <AdminToolbar
          isAdminMode={isAdminMode}
          onToggleAdmin={handleToggleAdmin}
          onAddArtwork={handleAddArtwork}
          selectedArtwork={selectedArtwork}
          onSaveChanges={handleSaveChanges}
          hasUnsavedChanges={hasUnsavedChanges}
        />
      )}

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
        <MovementHandler
          keysPressed={keysPressed}
          characterPosition={characterPosition}
          characterRotation={characterRotation}
          setCharacterPosition={setCharacterPosition}
          setIsWalking={setIsWalking}
          setWalkingSpeed={setWalkingSpeed}
        />
        
        <GalleryLighting />
        <Studio />
        
        <Character 
          position={characterPosition}
          rotation={characterRotation}
          cameraRotation={cameraRotation}
          isWalking={isWalking}
          walkingSpeed={walkingSpeed}
        />
        
        {/* Render artworks with admin visual cues */}
        {localArtworks.map((artwork) => (
          <Portrait
            key={artwork.id}
            position={artwork.position}
            rotation={artwork.rotation}
            title={artwork.title}
            id={artwork.id}
            imageUrl={artwork.imageUrl}
            isSelected={selectedArtwork === artwork.id}
            onClick={handleArtworkClick}
            isAdminMode={isAdminMode}
            isVisible={artwork.isVisible}
          />
        ))}
      </Canvas>

      {/* UI Overlays */}
      {!isAdminMode && <Instructions />}
      
      {/* Mobile Controls */}
      {isMobile && !isAdminMode && (
        <MobileControls 
          onMove={handleMobileMove}
          onRotate={handleMobileRotate}
          characterPosition={characterPosition}
          isMobile={isMobile}
        />
      )}

      {/* Artwork Detail Modal */}
      {!isAdminMode && (
        <ArtworkDetail 
          artwork={detailArtwork}
          onClose={() => setDetailArtwork(null)}
        />
      )}

      {/* Admin Edit Panel */}
      {isAdminMode && editingArtwork && (
        <ArtworkEditPanel
          artwork={{...editingArtwork, artistId: artist.id}}
          onClose={() => setEditingArtwork(null)}
          onUpdate={handleUpdateArtwork}
          onDelete={handleDeleteArtwork}
          position={editingArtwork.position}
          rotation={editingArtwork.rotation}
        />
      )}

      {/* Info Panel */}
      <div className="version-label">
        {artist?.display_name}'s Gallery - {localArtworks.length} Artworks
        {isAdminMode && (
          <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', color: '#10b981' }}>
            Admin Mode Active
          </div>
        )}
        {!isPointerLocked.current && !isMobile && !isAdminMode && (
          <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
            Click canvas to enable mouse look
          </div>
        )}
        {isPointerLocked.current && !isMobile && (
          <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
            ESC to exit mouse look
          </div>
        )}
        {selectedArtwork && !isAdminMode && (
          <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
            Click artwork again for details
          </div>
        )}
      </div>
    </>
  );
}