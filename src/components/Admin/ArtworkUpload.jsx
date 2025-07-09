// src/components/Admin/ArtworkUpload.jsx - Dynamic artwork upload component
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { uploadArtworkImage } from '../../lib/imageUtils';

export default function ArtworkUpload() {
  const [artists, setArtists] = useState([]);
  const [selectedArtist, setSelectedArtist] = useState('');
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState({});
  const [uploadResults, setUploadResults] = useState({});

  // Fetch all artists on component mount
  useEffect(() => {
    fetchArtists();
  }, []);

  // Fetch artworks when artist is selected
  useEffect(() => {
    if (selectedArtist) {
      fetchArtworks(selectedArtist);
    } else {
      setArtworks([]);
    }
  }, [selectedArtist]);

  const fetchArtists = async () => {
    try {
      const { data, error } = await supabase
        .from('artists')
        .select('id, display_name, subdomain, status')
        .order('display_name');

      if (error) throw error;
      setArtists(data);
    } catch (error) {
      console.error('Error fetching artists:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchArtworks = async (artistId) => {
    try {
      setLoading(true);
      console.log('Fetching artworks for artist:', artistId); // Debug log
      
      const { data, error } = await supabase
        .from('artworks')
        .select(`
          id,
          title,
          description,
          medium,
          dimensions,
          storage_path,
          original_filename,
          display_order,
          is_visible
        `)
        .eq('artist_id', artistId)
        .order('display_order');

      if (error) {
        console.error('Error fetching artworks:', error); // Debug log
        throw error;
      }
      
      console.log('Fetched artworks:', data); // Debug log
      setArtworks(data || []);
    } catch (error) {
      console.error('Error fetching artworks:', error);
      setArtworks([]); // Ensure we set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (artworkId, file) => {
    setSelectedFiles(prev => ({
      ...prev,
      [artworkId]: file
    }));
  };

  const handleUpload = async (artworkId, artworkTitle) => {
    const file = selectedFiles[artworkId];
    if (!file || !selectedArtist) return;

    setUploading(true);
    
    try {
      const result = await uploadArtworkImage(
        file,
        selectedArtist,
        artworkId,
        artworkTitle
      );

      setUploadResults(prev => ({
        ...prev,
        [artworkId]: result
      }));

      if (result.success) {
        console.log('Upload successful:', result);
        // Refresh artworks to show updated storage info
        fetchArtworks(selectedArtist);
      } else {
        console.error('Upload failed:', result.error);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadResults(prev => ({
        ...prev,
        [artworkId]: { success: false, error: error.message }
      }));
    } finally {
      setUploading(false);
    }
  };

  const getImagePreview = (artwork) => {
    if (artwork.storage_path && artwork.original_filename) {
      const baseUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public`;
      return `${baseUrl}/artwork-web/${artwork.storage_path}/${artwork.original_filename}`;
    }
    return null;
  };

  if (loading && artists.length === 0) {
    return (
      <div style={{ padding: '2rem', color: 'white', textAlign: 'center' }}>
        Loading artists...
      </div>
    );
  }

  return (
    <div style={{
      padding: '2rem',
      maxWidth: '1200px',
      margin: '0 auto',
      background: '#1a1a1a',
      color: 'white',
      borderRadius: '0.5rem',
      minHeight: '100vh',
      overflowY: 'auto', // Make scrollable
      maxHeight: '100vh' // Ensure it doesn't exceed viewport
    }}>
      <h2 style={{ marginBottom: '2rem' }}>Artwork Upload Management</h2>
      
      {/* Artist Selection */}
      <div style={{ marginBottom: '2rem' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '0.5rem', 
          fontWeight: 'bold' 
        }}>
          Select Artist:
        </label>
        <select
          value={selectedArtist}
          onChange={(e) => setSelectedArtist(e.target.value)}
          style={{
            padding: '0.75rem',
            background: '#333',
            color: 'white',
            border: '1px solid #555',
            borderRadius: '0.25rem',
            width: '100%',
            maxWidth: '400px'
          }}
        >
          <option value="">-- Choose an artist --</option>
          {artists.map(artist => (
            <option key={artist.id} value={artist.id}>
              {artist.display_name} ({artist.subdomain}) - {artist.status}
            </option>
          ))}
        </select>
      </div>

      {/* Upload Instructions */}
      {selectedArtist && (
        <div style={{
          background: '#2a2a2a',
          padding: '1rem',
          borderRadius: '0.5rem',
          marginBottom: '2rem',
          border: '1px solid #444'
        }}>
          <h3 style={{ marginBottom: '0.5rem' }}>Upload Instructions:</h3>
          <ul style={{ margin: 0, paddingLeft: '1.5rem', opacity: 0.8 }}>
            <li>Upload one high-quality image per artwork (up to 50MB)</li>
            <li>System automatically generates thumbnails and web versions</li>
            <li>Supported formats: JPG, PNG, WebP</li>
            <li>Images are automatically watermarked for web display</li>
          </ul>
        </div>
      )}

      {/* Artworks List */}
      {loading && selectedArtist ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          Loading artworks...
        </div>
      ) : !selectedArtist ? (
        <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.7 }}>
          Please select an artist to see their artworks.
        </div>
      ) : artworks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.7 }}>
          No artworks found for this artist.
        </div>
      ) : (
        <div>
          <div style={{ marginBottom: '2rem', opacity: 0.8, fontSize: '1.1rem' }}>
            Found {artworks.length} artworks for {artists.find(a => a.id === selectedArtist)?.display_name}:
          </div>
          
          {/* Grid Layout for Artworks */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem'
          }}>
            {artworks.map((artwork, index) => {
              const hasImage = artwork.storage_path && artwork.original_filename;
              const imageUrl = getImagePreview(artwork);
              
              console.log(`Rendering artwork ${index + 1}:`, artwork.title, { hasImage, imageUrl }); // Debug log
              
              return (
                <div key={artwork.id} style={{
                  border: '1px solid #333',
                  borderRadius: '0.5rem',
                  padding: '1.5rem',
                  background: '#2a2a2a',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem'
                }}>
                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                      <h3 style={{ margin: '0 0 0.5rem 0', color: '#fff' }}>
                        {index + 1}. {artwork.title}
                      </h3>
                      <div style={{ fontSize: '0.9rem', opacity: 0.7 }}>
                        {artwork.medium} • {artwork.dimensions}
                      </div>
                    </div>
                    <div style={{
                      padding: '0.25rem 0.5rem',
                      background: hasImage ? '#2d5a2d' : '#5a2d2d',
                      borderRadius: '0.25rem',
                      fontSize: '0.75rem',
                      whiteSpace: 'nowrap'
                    }}>
                      {hasImage ? '✅ Has Image' : '❌ No Image'}
                    </div>
                  </div>

                  {/* Description */}
                  {artwork.description && (
                    <div style={{ fontSize: '0.85rem', opacity: 0.6, fontStyle: 'italic' }}>
                      {artwork.description}
                    </div>
                  )}

                  {/* Image Preview */}
                  {hasImage && (
                    <div style={{ textAlign: 'center' }}>
                      <img
                        src={imageUrl}
                        alt={artwork.title}
                        style={{
                          width: '100%',
                          maxWidth: '300px',
                          height: '200px',
                          objectFit: 'cover',
                          borderRadius: '0.25rem',
                          border: '1px solid #555'
                        }}
                        onLoad={() => console.log('Image loaded successfully:', imageUrl)}
                        onError={(e) => {
                          console.log('Image failed to load:', imageUrl);
                          e.target.style.display = 'none';
                        }}
                      />
                      <div style={{
                        fontSize: '0.75rem',
                        opacity: 0.6,
                        marginTop: '0.5rem'
                      }}>
                        Current Image
                      </div>
                    </div>
                  )}

                  {/* File Upload */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 'bold' }}>
                      {hasImage ? 'Replace Image:' : 'Upload Image:'}
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileSelect(artwork.id, e.target.files[0])}
                      style={{
                        padding: '0.5rem',
                        background: '#333',
                        color: 'white',
                        border: '1px solid #555',
                        borderRadius: '0.25rem',
                        width: '100%',
                        marginBottom: '1rem'
                      }}
                    />

                    {/* Upload Button */}
                    <button
                      onClick={() => handleUpload(artwork.id, artwork.title)}
                      disabled={!selectedFiles[artwork.id] || uploading}
                      style={{
                        padding: '0.75rem 1.5rem',
                        background: selectedFiles[artwork.id] ? '#4CAF50' : '#666',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.25rem',
                        cursor: selectedFiles[artwork.id] ? 'pointer' : 'not-allowed',
                        width: '100%',
                        fontSize: '0.9rem',
                        fontWeight: 'bold'
                      }}
                    >
                      {uploading ? 'Uploading...' : hasImage ? 'Replace Image' : 'Upload Image'}
                    </button>
                  </div>

                  {/* Upload Status */}
                  {uploadResults[artwork.id] && (
                    <div style={{
                      padding: '0.75rem',
                      borderRadius: '0.25rem',
                      background: uploadResults[artwork.id].success ? '#2d5a2d' : '#5a2d2d'
                    }}>
                      {uploadResults[artwork.id].success ? (
                        <div>
                          ✅ Upload successful!
                          <div style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '0.5rem' }}>
                            Stored at: {uploadResults[artwork.id].storagePath}
                          </div>
                        </div>
                      ) : (
                        <div>
                          ❌ Upload failed: {uploadResults[artwork.id].error}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Storage Info */}
                  {hasImage && (
                    <div style={{
                      fontSize: '0.7rem',
                      opacity: 0.5,
                      fontFamily: 'monospace',
                      background: '#333',
                      padding: '0.5rem',
                      borderRadius: '0.25rem'
                    }}>
                      <div>Path: {artwork.storage_path}</div>
                      <div>File: {artwork.original_filename}</div>
                      <div>ID: {artwork.id}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Status Summary */}
      {artworks.length > 0 && (
        <div style={{
          marginTop: '2rem',
          padding: '1rem',
          background: '#333',
          borderRadius: '0.25rem',
          fontSize: '0.9rem'
        }}>
          <strong>Summary:</strong> {artworks.filter(a => a.storage_path).length} of {artworks.length} artworks have images uploaded
        </div>
      )}
    </div>
  );
}