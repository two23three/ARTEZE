// src/components/UI/ArtworkDetail.jsx
import React from 'react';

export default function ArtworkDetail({ artwork, onClose }) {
  if (!artwork) return null;
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 30,
      padding: '2rem'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '0.5rem',
        padding: '2rem',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '80vh',
        overflow: 'auto'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'start', 
          marginBottom: '1rem' 
        }}>
          <h2 style={{ margin: 0, color: '#333' }}>{artwork.title}</h2>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#666',
              padding: '0.25rem'
            }}
          >
            ×
          </button>
        </div>
        
        {/* Placeholder for artwork image */}
        <div style={{
          width: '100%',
          height: '300px',
          background: '#f0f0f0',
          borderRadius: '0.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1rem',
          color: '#666',
          fontSize: '1.1rem'
        }}>
          [High Resolution Artwork Image]
        </div>
        
        <p style={{ 
          color: '#666', 
          fontSize: '0.9rem', 
          lineHeight: '1.5',
          margin: 0
        }}>
          {artwork.description}
        </p>
        
        {/* Future: Process images, additional metadata, etc. */}
      </div>
    </div>
  );
}