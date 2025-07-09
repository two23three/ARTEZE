// src/components/Admin/GalleryAdminMode.jsx
import React, { useState, useCallback } from 'react';
import { Upload, X, Move, RotateCw, Eye, EyeOff, Save, Plus } from 'lucide-react';
import { uploadArtworkImage } from '../../lib/imageUtils';
import { supabase } from '../../lib/supabase';

export function AdminToolbar({ 
  isAdminMode, 
  onToggleAdmin, 
  onAddArtwork, 
  selectedArtwork, 
  onSaveChanges,
  hasUnsavedChanges 
}) {
  if (!isAdminMode) {
    return (
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 100
      }}>
        <button
          onClick={onToggleAdmin}
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
          onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
        >
          Admin Mode
        </button>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      background: 'rgba(0, 0, 0, 0.9)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '12px',
      padding: '16px',
      zIndex: 100,
      minWidth: '250px'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <h3 style={{ color: 'white', margin: 0, fontSize: '16px' }}>
          Gallery Admin
        </h3>
        <button
          onClick={onToggleAdmin}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            padding: '4px'
          }}
        >
          <X size={20} />
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <AdminButton
          icon={<Plus size={16} />}
          text="Add New Artwork"
          onClick={onAddArtwork}
          color="#10b981"
        />
        
        {hasUnsavedChanges && (
          <AdminButton
            icon={<Save size={16} />}
            text="Save Changes"
            onClick={onSaveChanges}
            color="#f59e0b"
          />
        )}
        
        <div style={{
          fontSize: '12px',
          color: 'rgba(255, 255, 255, 0.6)',
          textAlign: 'center',
          marginTop: '8px'
        }}>
          Click artworks to edit them
        </div>
      </div>
    </div>
  );
}

function AdminButton({ icon, text, onClick, color = '#6b7280' }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: color,
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        padding: '8px 12px',
        fontSize: '14px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        width: '100%'
      }}
      onMouseOver={(e) => e.target.style.opacity = '0.9'}
      onMouseOut={(e) => e.target.style.style = '1'}
    >
      {icon}
      {text}
    </button>
  );
}

export function ArtworkEditPanel({ 
  artwork, 
  onClose, 
  onUpdate, 
  onDelete,
  position,
  rotation 
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formData, setFormData] = useState({
    title: artwork?.title || '',
    description: artwork?.description || '',
    medium: artwork?.medium || '',
    dimensions: artwork?.dimensions || '',
    year: artwork?.year || new Date().getFullYear(),
    isVisible: artwork?.isVisible ?? true,
    isForSale: artwork?.isForSale ?? false,
    price: artwork?.price || ''
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (file) => {
    if (!file || !artwork) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const result = await uploadArtworkImage(
        file,
        artwork.artistId,
        artwork.id,
        formData.title
      );

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (result.success) {
        onUpdate(artwork.id, {
          ...formData,
          imageUrl: result.urls.web,
          thumbnailUrl: result.urls.thumbnail,
          hiresUrl: result.urls.hires,
          storagePath: result.storagePath,
          originalFilename: result.filename
        });
        
        setTimeout(() => {
          setUploadProgress(0);
          setIsUploading(false);
        }, 1000);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      setIsUploading(false);
      setUploadProgress(0);
      alert('Upload failed: ' + error.message);
    }
  };

  const handleSave = () => {
    onUpdate(artwork.id, formData);
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this artwork?')) {
      onDelete(artwork.id);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      background: 'rgba(0, 0, 0, 0.95)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '16px',
      padding: '24px',
      width: '90%',
      maxWidth: '600px',
      maxHeight: '80vh',
      overflowY: 'auto',
      zIndex: 200,
      color: 'white'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <h2 style={{ margin: 0, fontSize: '20px' }}>
          Edit Artwork
        </h2>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            padding: '4px'
          }}
        >
          <X size={24} />
        </button>
      </div>

      {/* Image Upload Section */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '24px'
      }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>Artwork Image</h3>
        
        {/* Current Image Preview */}
        {artwork?.imageUrl && (
          <div style={{
            textAlign: 'center',
            marginBottom: '16px'
          }}>
            <img
              src={artwork.imageUrl}
              alt={artwork.title}
              style={{
                maxWidth: '200px',
                maxHeight: '250px',
                objectFit: 'cover',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}
            />
          </div>
        )}

        {/* Upload Progress */}
        {isUploading && (
          <div style={{
            marginBottom: '16px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            padding: '8px',
            overflow: 'hidden'
          }}>
            <div style={{
              background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
              height: '6px',
              borderRadius: '3px',
              width: `${uploadProgress}%`,
              transition: 'width 0.3s ease'
            }} />
            <div style={{
              fontSize: '12px',
              textAlign: 'center',
              marginTop: '4px',
              opacity: 0.8
            }}>
              Uploading... {uploadProgress}%
            </div>
          </div>
        )}

        {/* File Input */}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files[0];
            if (file) handleImageUpload(file);
          }}
          disabled={isUploading}
          style={{
            width: '100%',
            padding: '12px',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '2px dashed rgba(255, 255, 255, 0.3)',
            borderRadius: '8px',
            color: 'white',
            fontSize: '14px',
            cursor: isUploading ? 'not-allowed' : 'pointer'
          }}
        />
      </div>

      {/* Form Fields */}
      <div style={{ display: 'grid', gap: '16px' }}>
        <FormField
          label="Title"
          value={formData.title}
          onChange={(value) => handleInputChange('title', value)}
          required
        />
        
        <FormField
          label="Description"
          value={formData.description}
          onChange={(value) => handleInputChange('description', value)}
          multiline
        />
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <FormField
            label="Medium"
            value={formData.medium}
            onChange={(value) => handleInputChange('medium', value)}
          />
          
          <FormField
            label="Dimensions"
            value={formData.dimensions}
            onChange={(value) => handleInputChange('dimensions', value)}
          />
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <FormField
            label="Year"
            value={formData.year}
            onChange={(value) => handleInputChange('year', parseInt(value))}
            type="number"
          />
          
          <FormField
            label="Price (USD)"
            value={formData.price}
            onChange={(value) => handleInputChange('price', value)}
            type="number"
          />
        </div>

        {/* Toggles */}
        <div style={{ display: 'flex', gap: '24px' }}>
          <Toggle
            label="Visible in Gallery"
            checked={formData.isVisible}
            onChange={(checked) => handleInputChange('isVisible', checked)}
          />
          
          <Toggle
            label="For Sale"
            checked={formData.isForSale}
            onChange={(checked) => handleInputChange('isForSale', checked)}
          />
        </div>

        {/* Position Info */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '8px',
          padding: '12px',
          fontSize: '12px',
          opacity: 0.8
        }}>
          <div>Position: ({position?.[0]?.toFixed(2)}, {position?.[1]?.toFixed(2)}, {position?.[2]?.toFixed(2)})</div>
          <div>Rotation: ({rotation?.[0]?.toFixed(2)}, {rotation?.[1]?.toFixed(2)}, {rotation?.[2]?.toFixed(2)})</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginTop: '24px'
      }}>
        <button
          onClick={handleSave}
          disabled={isUploading}
          style={{
            flex: 1,
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: isUploading ? 'not-allowed' : 'pointer',
            opacity: isUploading ? 0.6 : 1
          }}
        >
          Save Changes
        </button>
        
        <button
          onClick={handleDelete}
          disabled={isUploading}
          style={{
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: isUploading ? 'not-allowed' : 'pointer',
            opacity: isUploading ? 0.6 : 1
          }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}

function FormField({ label, value, onChange, multiline = false, type = 'text', required = false }) {
  const Component = multiline ? 'textarea' : 'input';
  
  return (
    <div>
      <label style={{
        display: 'block',
        fontSize: '14px',
        fontWeight: '500',
        marginBottom: '6px',
        color: 'rgba(255, 255, 255, 0.9)'
      }}>
        {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>
      <Component
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: '10px 12px',
          background: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '6px',
          color: 'white',
          fontSize: '14px',
          resize: multiline ? 'vertical' : 'none',
          minHeight: multiline ? '80px' : 'auto'
        }}
        placeholder={`Enter ${label.toLowerCase()}`}
      />
    </div>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <button
        onClick={() => onChange(!checked)}
        style={{
          width: '44px',
          height: '24px',
          background: checked ? '#10b981' : 'rgba(255, 255, 255, 0.2)',
          border: 'none',
          borderRadius: '12px',
          position: 'relative',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
      >
        <div style={{
          width: '20px',
          height: '20px',
          background: 'white',
          borderRadius: '50%',
          position: 'absolute',
          top: '2px',
          left: checked ? '22px' : '2px',
          transition: 'left 0.2s ease'
        }} />
      </button>
      <label style={{
        fontSize: '14px',
        color: 'rgba(255, 255, 255, 0.9)',
        cursor: 'pointer'
      }} onClick={() => onChange(!checked)}>
        {label}
      </label>
    </div>
  );
}