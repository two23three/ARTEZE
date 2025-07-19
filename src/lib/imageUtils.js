// src/lib/imageUtils.js - Fixed to match your existing database schema
import { supabase } from './supabase';

// Generate all image URLs from a single storage path
export function generateImageUrls(storagePath, filename = 'artwork.jpg') {
  const baseUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public`;
  
  console.log('Generating URLs for:', { storagePath, filename, baseUrl });
  
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

// Simple but effective upload that works with your current schema
export async function uploadArtworkImage(file, artistId, artworkId, artworkTitle) {
  try {
    console.log('Starting upload:', { artistId, artworkId, artworkTitle, fileSize: file.size });
    
    // Validate file
    validateImageFile(file);

    // Generate storage path and filename - use artwork ID for folder consistency
    const storagePath = `artist-${artistId}/${artworkId}`;
    const fileExtension = file.name.split('.').pop().toLowerCase();
    const filename = `${artworkTitle.toLowerCase().replace(/[^a-z0-9]/g, '-')}.${fileExtension}`;
    
    console.log('Storage path:', storagePath, 'Filename:', filename);

    // Update status to processing
    await supabase
      .from('artworks')
      .update({ processing_status: 'processing' })
      .eq('id', artworkId);

    // Upload to multiple buckets for different purposes
    const uploadResults = [];
    
    // 1. Upload to web bucket (main display)
    console.log('Uploading to artwork-web bucket...');
    try {
      const { data: webData, error: webError } = await supabase.storage
        .from('artwork-web')
        .upload(`${storagePath}/${filename}`, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (webError) throw webError;
      uploadResults.push({ bucket: 'web', success: true, data: webData });
      console.log('Web upload successful');
    } catch (error) {
      console.error('Web upload failed:', error);
      uploadResults.push({ bucket: 'web', success: false, error: error.message });
    }

    // 2. Upload to thumbnails bucket (same file for now - could be resized later)
    console.log('Uploading to artwork-thumbnails bucket...');
    try {
      const { data: thumbData, error: thumbError } = await supabase.storage
        .from('artwork-thumbnails')
        .upload(`${storagePath}/thumb-${filename}`, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (thumbError) throw thumbError;
      uploadResults.push({ bucket: 'thumbnails', success: true, data: thumbData });
      console.log('Thumbnail upload successful');
    } catch (error) {
      console.error('Thumbnail upload failed:', error);
      uploadResults.push({ bucket: 'thumbnails', success: false, error: error.message });
    }

    // 3. Upload high-res version (same file for now)
    console.log('Uploading high-res version...');
    try {
      const { data: hiresData, error: hiresError } = await supabase.storage
        .from('artwork-web')
        .upload(`${storagePath}/hires-${filename}`, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (hiresError) throw hiresError;
      uploadResults.push({ bucket: 'hires', success: true, data: hiresData });
      console.log('High-res upload successful');
    } catch (error) {
      console.error('High-res upload failed:', error);
      uploadResults.push({ bucket: 'hires', success: false, error: error.message });
    }

    // 4. Upload to private originals bucket
    console.log('Uploading to artwork-originals bucket...');
    try {
      const { data: originalData, error: originalError } = await supabase.storage
        .from('artwork-originals')
        .upload(`${storagePath}/${filename}`, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (originalError) throw originalError;
      uploadResults.push({ bucket: 'originals', success: true, data: originalData });
      console.log('Original upload successful');
    } catch (error) {
      console.error('Original upload failed:', error);
      uploadResults.push({ bucket: 'originals', success: false, error: error.message });
    }

    // Check if at least web upload succeeded
    const webUpload = uploadResults.find(r => r.bucket === 'web');
    if (!webUpload || !webUpload.success) {
      throw new Error('Web upload failed - this is required for display');
    }

    // Update artwork record with storage information
    console.log('Updating artwork record...');
    const { error: updateError } = await supabase
      .from('artworks')
      .update({ 
        storage_path: storagePath,
        original_filename: filename,
        file_size_mb: Math.round((file.size / 1024 / 1024) * 100) / 100,
        processed_at: new Date().toISOString(),
        processing_status: 'completed',
        processing_error: null
      })
      .eq('id', artworkId);

    if (updateError) {
      console.error('Database update error:', updateError);
      throw new Error(`Database update failed: ${updateError.message}`);
    }

    console.log('Upload completed successfully');

    return {
      success: true,
      storagePath,
      filename,
      urls: generateImageUrls(storagePath, filename),
      uploadResults
    };

  } catch (error) {
    console.error('Upload failed:', error);
    
    // Update artwork status to failed
    try {
      await supabase
        .from('artworks')
        .update({ 
          processing_status: 'failed',
          processing_error: error.message
        })
        .eq('id', artworkId);
    } catch (dbError) {
      console.error('Failed to update error status:', dbError);
    }

    return {
      success: false,
      error: error.message
    };
  }
}

// File validation
function validateImageFile(file) {
  const maxSize = 50 * 1024 * 1024; // 50MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (file.size > maxSize) {
    throw new Error('File size must be less than 50MB');
  }
  
  if (!allowedTypes.includes(file.type)) {
    throw new Error('File must be JPEG, PNG, or WebP format');
  }
  
  return true;
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

// Check if image URL is accessible
export async function checkImageUrl(url) {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    return false;
  }
}

// Get best available image URL for an artwork
export async function getBestImageUrl(artwork) {
  const urls = getArtworkImages(artwork);
  
  // Try URLs in order of preference
  const urlsToTry = [
    urls.hires,
    urls.web,
    urls.thumbnail
  ].filter(Boolean);

  for (const url of urlsToTry) {
    if (await checkImageUrl(url)) {
      return url;
    }
  }

  // Fallback to placeholder
  return generatePlaceholderUrls(artwork.title, 0).web;
}

// Preload image for better UX
export function preloadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

// Generate responsive image srcset
export function generateSrcSet(storagePath, filename) {
  const urls = generateImageUrls(storagePath, filename);
  
  return [
    `${urls.thumbnail} 400w`,
    `${urls.web} 1200w`,
    `${urls.hires} 1920w`
  ].join(', ');
}

// Simple batch upload
export async function batchUploadArtworks(files, artistId, onProgress) {
  const results = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    try {
      // Create artwork record first
      const { data: artwork, error: artworkError } = await supabase
        .from('artworks')
        .insert([{
          artist_id: artistId,
          title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
          description: '',
          medium: 'Digital',
          dimensions: 'Various',
          year: new Date().getFullYear(),
          position_x: (i % 5) * 3 - 6, // Spread across back wall
          position_y: 2.5,
          position_z: -9.8,
          rotation_x: 0,
          rotation_y: 0,
          rotation_z: 0,
          is_visible: true,
          is_for_sale: false,
          display_order: i + 1,
          processing_status: 'pending',
          original_filename: file.name
        }])
        .select()
        .single();

      if (artworkError) throw artworkError;

      // Upload image
      const uploadResult = await uploadArtworkImage(
        file,
        artistId,
        artwork.id,
        artwork.title
      );

      results.push({
        file: file.name,
        artwork: artwork,
        upload: uploadResult
      });

      // Report progress
      if (onProgress) {
        onProgress(i + 1, files.length, results);
      }

    } catch (error) {
      console.error(`Failed to upload ${file.name}:`, error);
      results.push({
        file: file.name,
        artwork: null,
        upload: { success: false, error: error.message }
      });
    }
  }

  return results;
}