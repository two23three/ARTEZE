// src/components/UI/ArtworkDetail.jsx - Fixed version without hook issues
import React, { useState, useRef, useEffect } from 'react';

export default function ArtworkDetail({ artwork, onClose }) {
  // Always declare all hooks first - never conditionally
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [showProcess, setShowProcess] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  
  const imageRef = useRef(null);
  const containerRef = useRef(null);
  const dragStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  // Effects that run when artwork changes
  useEffect(() => {
    if (artwork?.id) {
      // Reset view state when artwork changes
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setImageLoaded(false);
      setImageError(false);
      
      // Check if favorited
      const favorites = JSON.parse(localStorage.getItem('artworkFavorites') || '[]');
      setIsFavorited(favorites.includes(artwork.id));
    }
  }, [artwork?.id]);

  // Early return after all hooks are declared
  if (!artwork) return null;

  const getImageUrl = () => {
    // Try different resolution URLs in order of preference
    if (artwork.hiresUrl) return artwork.hiresUrl;
    if (artwork.imageUrl) return artwork.imageUrl;
    if (artwork.thumbnailUrl) return artwork.thumbnailUrl;
    
    // Final fallback to placeholder
    const encodedTitle = encodeURIComponent(artwork.title || 'Artwork');
    return `https://via.placeholder.com/1200x1500/f0f0f0/999?text=${encodedTitle}`;
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageLoaded(false);
    setImageError(true);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.5, 5));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.5, 0.5));
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e) => {
    if (zoom > 1) {
      setIsDragging(true);
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        panX: pan.x,
        panY: pan.y
      };
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging || zoom <= 1) return;
    
    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;
    
    setPan({
      x: dragStartRef.current.panX + deltaX,
      y: dragStartRef.current.panY + deltaY
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const toggleFavorite = () => {
    if (!artwork?.id) return;
    
    const favorites = JSON.parse(localStorage.getItem('artworkFavorites') || '[]');
    if (isFavorited) {
      const newFavorites = favorites.filter(id => id !== artwork.id);
      localStorage.setItem('artworkFavorites', JSON.stringify(newFavorites));
    } else {
      favorites.push(artwork.id);
      localStorage.setItem('artworkFavorites', JSON.stringify(favorites));
    }
    setIsFavorited(!isFavorited);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: artwork.title,
          text: `Check out "${artwork.title}" by this amazing artist!`,
          url: window.location.href
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const formatPrice = (price) => {
    if (!price) return null;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(price);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.95)',
      display: 'flex',
      zIndex: 200, // Much higher z-index to ensure it's above everything
      backdropFilter: 'blur(10px)'
    }}>
      {/* Image Viewer */}
      <div 
        ref={containerRef}
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
          position: 'relative'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={(e) => {
          if (e.target === e.currentTarget && zoom === 1) {
            handleZoomIn();
          }
        }}
      >
        {/* Loading State */}
        {!imageLoaded && !imageError && (
          <div style={{
            position: 'absolute',
            color: 'white',
            fontSize: '1.1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <div style={{
              width: '20px',
              height: '20px',
              border: '2px solid rgba(255,255,255,0.3)',
              borderTop: '2px solid white',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            Loading image...
          </div>
        )}

        {/* Main Artwork Image */}
        <img
          ref={imageRef}
          src={getImageUrl()}
          alt={artwork.title}
          onLoad={handleImageLoad}
          onError={handleImageError}
          style={{
            maxWidth: zoom === 1 ? '90%' : 'none',
            maxHeight: zoom === 1 ? '90%' : 'none',
            width: zoom > 1 ? `${zoom * 100}%` : 'auto',
            height: zoom > 1 ? `${zoom * 100}%` : 'auto',
            objectFit: 'contain',
            transform: `translate(${pan.x}px, ${pan.y}px)`,
            transition: isDragging ? 'none' : 'transform 0.3s ease',
            userSelect: 'none',
            display: imageLoaded ? 'block' : 'none'
          }}
          draggable={false}
        />

        {/* Error State */}
        {imageError && (
          <div style={{
            color: 'white',
            textAlign: 'center',
            padding: '2rem'
          }}>
            <div style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>
              Unable to load image
            </div>
            <div style={{ opacity: 0.7 }}>
              The image may still be processing or temporarily unavailable
            </div>
          </div>
        )}

        {/* Image Controls */}
        {imageLoaded && (
          <div style={{
            position: 'absolute',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '8px',
            background: 'rgba(0, 0, 0, 0.8)',
            borderRadius: '25px',
            padding: '8px 12px'
          }}>
            <ControlButton text="+" onClick={handleZoomIn} disabled={zoom >= 5} />
            <ControlButton text="−" onClick={handleZoomOut} disabled={zoom <= 0.5} />
            <ControlButton text="⟲" onClick={resetView} />
            <div style={{
              color: 'white',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              paddingLeft: '8px',
              minWidth: '60px'
            }}>
              {Math.round(zoom * 100)}%
            </div>
          </div>
        )}
      </div>

      {/* Info Panel */}
      <div style={{
        width: '400px',
        background: 'rgba(20, 20, 20, 0.95)',
        backdropFilter: 'blur(20px)',
        borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        color: 'white'
      }}>
        {/* Header */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start'
        }}>
          <div style={{ flex: 1 }}>
            <h2 style={{
              margin: '0 0 8px 0',
              fontSize: '1.5rem',
              fontWeight: '600',
              lineHeight: '1.3'
            }}>
              {artwork.title}
            </h2>
            {artwork.year && (
              <div style={{
                opacity: 0.7,
                fontSize: '0.9rem',
                marginBottom: '16px'
              }}>
                {artwork.year}
              </div>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: '8px', marginLeft: '16px' }}>
            <ControlButton 
              text={isFavorited ? "♥" : "♡"} 
              onClick={toggleFavorite}
              active={isFavorited}
            />
            <ControlButton text="⤴" onClick={handleShare} />
            <ControlButton text="✕" onClick={onClose} />
          </div>
        </div>

        {/* Metadata */}
        <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
          {/* Main Info */}
          <div style={{ marginBottom: '24px' }}>
            {artwork.medium && (
              <InfoRow label="Medium" value={artwork.medium} />
            )}
            {artwork.dimensions && (
              <InfoRow label="Dimensions" value={artwork.dimensions} />
            )}
            {artwork.price && artwork.isForSale && (
              <InfoRow 
                label="Price" 
                value={formatPrice(artwork.price)}
                highlight
              />
            )}
            {artwork.viewCount > 0 && (
              <InfoRow 
                label="Views" 
                value={`${artwork.viewCount} ${artwork.viewCount === 1 ? 'view' : 'views'}`}
              />
            )}
          </div>

          {/* Description */}
          {artwork.description && (
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: '500',
                margin: '0 0 8px 0',
                opacity: 0.9
              }}>
                About this piece
              </h3>
              <p style={{
                fontSize: '0.9rem',
                lineHeight: '1.6',
                opacity: 0.8,
                margin: 0
              }}>
                {artwork.description}
              </p>
            </div>
          )}

          {/* Actions */}
          {artwork.isForSale && (
            <div style={{
              padding: '16px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <div style={{
                fontSize: '0.9rem',
                marginBottom: '12px',
                opacity: 0.9
              }}>
                Interested in purchasing?
              </div>
              <button style={{
                width: '100%',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '12px',
                fontSize: '0.9rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}>
                Contact Artist
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Loading Animation Styles */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function ControlButton({ text, onClick, disabled = false, active = false }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        minWidth: '32px',
        height: '32px',
        borderRadius: '6px',
        border: 'none',
        background: active 
          ? 'rgba(16, 185, 129, 0.8)' 
          : disabled 
            ? 'rgba(255, 255, 255, 0.1)' 
            : 'rgba(255, 255, 255, 0.2)',
        color: disabled ? 'rgba(255, 255, 255, 0.4)' : 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s ease',
        fontSize: '16px',
        fontWeight: 'bold',
        padding: '0 8px'
      }}
    >
      {text}
    </button>
  );
}

function InfoRow({ label, value, highlight = false }) {
  return (
    <div style={{
      marginBottom: '12px',
      padding: highlight ? '8px 12px' : '0',
      background: highlight ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
      borderRadius: highlight ? '6px' : '0',
      border: highlight ? '1px solid rgba(16, 185, 129, 0.2)' : 'none'
    }}>
      <div style={{
        fontSize: '0.8rem',
        opacity: 0.6,
        marginBottom: '2px'
      }}>
        {label}
      </div>
      <div style={{
        fontSize: '0.9rem',
        fontWeight: highlight ? '500' : 'normal',
        color: highlight ? '#10b981' : 'white'
      }}>
        {value}
      </div>
    </div>
  );
}