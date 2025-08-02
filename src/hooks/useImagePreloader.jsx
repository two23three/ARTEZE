// src/hooks/useImagePreloader.js - Centralized image loading system
import { useState, useEffect, useRef } from 'react';
import { TextureLoader } from 'three';

// Loading screen component
export function GalleryLoadingScreen({ loadingState }) {
  const { isLoading, progress, loadedCount, totalCount, errors } = loadingState;
  
  if (!isLoading) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.9)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      color: 'white'
    }}>
      <div style={{ textAlign: 'center', maxWidth: '400px', padding: '2rem' }}>
        <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>
          Loading Gallery
        </h2>
        
        <div style={{
          width: '100%',
          height: '8px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '4px',
          overflow: 'hidden',
          marginBottom: '1rem'
        }}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
            transition: 'width 0.3s ease'
          }} />
        </div>
        
        <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>
          Loading artworks: {loadedCount} of {totalCount}
        </div>
        
        <div style={{ fontSize: '0.8rem', marginTop: '0.5rem', opacity: 0.6 }}>
          {progress}% complete
        </div>
        
        {errors.length > 0 && (
          <div style={{
            marginTop: '1rem',
            padding: '0.5rem',
            background: 'rgba(239, 68, 68, 0.1)',
            borderRadius: '4px',
            fontSize: '0.75rem',
            opacity: 0.8
          }}>
            Some images failed to load ({errors.length})
          </div>
        )}
      </div>
    </div>
  );
}

export function useImagePreloader(artworks) {
  const [loadingState, setLoadingState] = useState({
    isLoading: true,
    progress: 0,
    loadedCount: 0,
    totalCount: 0,
    errors: []
  });
  
  const [loadedTextures, setLoadedTextures] = useState(new Map());
  const loaderRef = useRef(new TextureLoader());
  const abortControllerRef = useRef(null);

  useEffect(() => {
    if (!artworks || artworks.length === 0) {
      setLoadingState({
        isLoading: false,
        progress: 100,
        loadedCount: 0,
        totalCount: 0,
        errors: []
      });
      return;
    }

    // Cancel any previous loading
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const preloadImages = async () => {
      const artworksWithImages = artworks.filter(artwork => artwork.imageUrl);
      const totalCount = artworksWithImages.length;
      
      setLoadingState(prev => ({
        ...prev,
        isLoading: true,
        totalCount,
        loadedCount: 0,
        progress: 0,
        errors: []
      }));

      if (totalCount === 0) {
        setLoadingState(prev => ({
          ...prev,
          isLoading: false,
          progress: 100
        }));
        return;
      }

      const textureMap = new Map();
      const errors = [];
      let loadedCount = 0;

      // Load images with retry logic
      const loadWithRetry = async (artwork, maxRetries = 2) => {
        const imageUrls = [
          artwork.hiresUrl,
          artwork.imageUrl,
          artwork.thumbnailUrl
        ].filter(Boolean);

        for (let retry = 0; retry <= maxRetries; retry++) {
          for (const url of imageUrls) {
            if (abortControllerRef.current?.signal.aborted) return null;
            
            try {
              // Check if URL is accessible first
              const response = await fetch(url, { 
                method: 'HEAD',
                signal: abortControllerRef.current?.signal
              });
              
              if (!response.ok) continue;

              // Load texture
              const texture = await new Promise((resolve, reject) => {
                loaderRef.current.load(
                  url,
                  resolve,
                  undefined,
                  reject
                );
              });

              console.log(`✅ Loaded texture for ${artwork.title}`);
              return texture;
            } catch (error) {
              console.log(`❌ Failed to load ${url} (attempt ${retry + 1}):`, error.message);
              continue;
            }
          }
        }
        return null;
      };

      // Load all images concurrently
      const loadPromises = artworksWithImages.map(async (artwork) => {
        try {
          const texture = await loadWithRetry(artwork);
          
          if (texture) {
            textureMap.set(artwork.id, texture);
          } else {
            errors.push(`Failed to load image for: ${artwork.title}`);
          }
        } catch (error) {
          errors.push(`Error loading ${artwork.title}: ${error.message}`);
        }

        loadedCount++;
        const progress = Math.round((loadedCount / totalCount) * 100);
        
        setLoadingState(prev => ({
          ...prev,
          loadedCount,
          progress,
          errors: [...errors]
        }));
      });

      await Promise.allSettled(loadPromises);

      if (!abortControllerRef.current?.signal.aborted) {
        setLoadedTextures(textureMap);
        setLoadingState(prev => ({
          ...prev,
          isLoading: false,
          progress: 100
        }));
        
        console.log(`🎨 Gallery loaded: ${textureMap.size} of ${totalCount} images`);
      }
    };

    preloadImages();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [artworks]);

  const reloadImages = () => {
    // Force reload by clearing textures and restarting
    setLoadedTextures(new Map());
    setLoadingState(prev => ({ ...prev, isLoading: true, progress: 0 }));
  };

  const getTextureForArtwork = (artworkId) => {
    return loadedTextures.get(artworkId) || null;
  };

  return {
    loadingState,
    loadedTextures,
    getTextureForArtwork,
    reloadImages
  };
}