// src/lib/imageUtils.js - Utility functions for image handling

import { supabase } from './supabase';

// Generate all image URLs from a single storage path
export function generateImageUrls(storagePath, filename = 'artwork.jpg') {
  const baseUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public`;
  
  console.log('Generating URLs for:', { storagePath, filename, baseUrl }); // Debug log
  
  return {
    // Original (private - would need signed URL for access)
    original: null, // Private bucket
    
    // Web version (1200px, watermarked)
    web: `${baseUrl}/artwork-web/${storagePath}/${filename}`,
    
    // High-res version (1920px, watermarked) 
    hires: `${baseUrl}/artwork-web/${storagePath}/hires-${filename}`,
    
    // Thumbnail (300x400px)
    thumbnail: `${baseUrl}/artwork-thumbnails/${storagePath}/thumb-${filename}`
  };
}

// For development/testing - generate placeholder URLs
export function generatePlaceholderUrls(title, index = 0) {
  const colors = ['ff6b6b', '4ecdc4', '95e1d3', 'f9ca24', '6c5ce7', 'e17055'];
  const color = colors[index % colors.length];
  const encodedTitle = encodeURIComponent(title);
  
  return {
    web: `https://via.placeholder.com/1200x1500/${color}/ffffff?text=${encodedTitle}`,
    hires: `https://via.placeholder.com/1920x2400/${color}/ffffff?text=${encodedTitle}+HD`,
    thumbnail: `https://via.placeholder.com/300x400/${color}/ffffff?text=${encodedTitle}`
  };
}

// Upload and process artwork image
export async function uploadArtworkImage(file, artistId, artworkId, artworkTitle) {
  try {
    console.log('Starting upload:', { artistId, artworkId, artworkTitle, fileSize: file.size });
    
    // Generate storage path
    const storagePath = `artist-${artistId}/${artworkId}`;
    const fileExtension = file.name.split('.').pop().toLowerCase();
    const filename = `${artworkTitle.toLowerCase().replace(/[^a-z0-9]/g, '-')}.${fileExtension}`;
    
    console.log('Storage path:', storagePath, 'Filename:', filename);

    // 1. Upload to web bucket first (most important for display)
    console.log('Uploading to artwork-web bucket...');
    const { data: webUpload, error: webError } = await supabase.storage
      .from('artwork-web')
      .upload(`${storagePath}/${filename}`, file, {
        cacheControl: '3600'
        // Removed upsert - will try regular upload first
      });

    if (webError) {
      console.error('Web upload error:', webError);
      // If file exists, try to update instead
      if (webError.message?.includes('already exists')) {
        console.log('File exists, trying to replace...');
        const { data: updateData, error: updateError } = await supabase.storage
          .from('artwork-web')
          .update(`${storagePath}/${filename}`, file, {
            cacheControl: '3600'
          });
        if (updateError) {
          throw new Error(`Web upload/update failed: ${updateError.message}`);
        }
        console.log('Web update successful:', updateData);
      } else {
        throw new Error(`Web upload failed: ${webError.message}`);
      }
    } else {
      console.log('Web upload successful:', webUpload);
    }

    // 2. Upload to thumbnails bucket (using same file for now)
    console.log('Uploading to artwork-thumbnails bucket...');
    const { data: thumbUpload, error: thumbError } = await supabase.storage
      .from('artwork-thumbnails')
      .upload(`${storagePath}/thumb-${filename}`, file, {
        cacheControl: '3600'
      });

    if (thumbError) {
      console.error('Thumbnail upload error:', thumbError);
      // Try update if exists
      if (thumbError.message?.includes('already exists')) {
        await supabase.storage
          .from('artwork-thumbnails')
          .update(`${storagePath}/thumb-${filename}`, file, {
            cacheControl: '3600'
          });
      }
      console.warn('Thumbnail upload failed, continuing...');
    } else {
      console.log('Thumbnail upload successful:', thumbUpload);
    }

    // 3. Try to upload original to private bucket (optional)
    console.log('Uploading to artwork-originals bucket...');
    const { data: originalUpload, error: originalError } = await supabase.storage
      .from('artwork-originals')
      .upload(`${storagePath}/${filename}`, file, {
        cacheControl: '3600'
      });

    if (originalError) {
      console.error('Original upload error:', originalError);
      // Try update if exists
      if (originalError.message?.includes('already exists')) {
        await supabase.storage
          .from('artwork-originals')
          .update(`${storagePath}/${filename}`, file, {
            cacheControl: '3600'
          });
      }
      console.warn('Original upload failed, continuing...');
    } else {
      console.log('Original upload successful:', originalUpload);
    }

    // 4. Update artwork record with storage path
    console.log('Updating artwork record in database...');
    const { data: updateData, error: updateError } = await supabase
      .from('artworks')
      .update({ 
        storage_path: storagePath,
        original_filename: filename,
        file_size_mb: Math.round((file.size / 1024 / 1024) * 100) / 100
      })
      .eq('id', artworkId)
      .select();

    if (updateError) {
      console.error('Database update error:', updateError);
      throw new Error(`Database update failed: ${updateError.message}`);
    }
    
    console.log('Database update successful:', updateData);

    return {
      success: true,
      storagePath,
      filename,
      urls: generateImageUrls(storagePath, filename)
    };

  } catch (error) {
    console.error('Error uploading artwork:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Get artwork images (with fallback to placeholders)
export function getArtworkImages(artwork, index = 0) {
  if (artwork.storage_path && artwork.original_filename) {
    // Try to load real images
    return generateImageUrls(artwork.storage_path, artwork.original_filename);
  } else {
    // Fallback to placeholders
    return generatePlaceholderUrls(artwork.title, index);
  }
}