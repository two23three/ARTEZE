// src/hooks/useArtistGallery.js - Custom hook for fetching gallery data
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getArtworkImages } from '../lib/imageUtils';

export function useArtistGallery(subdomain) {
  const [artist, setArtist] = useState(null);
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchGallery() {
      try {
        setLoading(true);
        setError(null);

        // Fetch artist data
        const { data: artistData, error: artistError } = await supabase
          .from('artists')
          .select(`
            id,
            subdomain,
            display_name,
            bio,
            website,
            instagram,
            phone,
            gallery_config,
            status,
            is_active
          `)
          .eq('subdomain', subdomain)
          .eq('status', 'approved')
          .eq('is_active', true)
          .single();

        if (artistError) throw artistError;
        
        if (!artistData) {
          throw new Error(`Artist with subdomain "${subdomain}" not found`);
        }

        setArtist(artistData);

        // Fetch artworks for this artist
        const { data: artworksData, error: artworksError } = await supabase
          .from('artworks')
          .select(`
            id,
            title,
            description,
            medium,
            dimensions,
            year,
            position_x,
            position_y,
            position_z,
            rotation_x,
            rotation_y,
            rotation_z,
            original_filename,
            storage_path,
            price_usd,
            is_for_sale,
            display_order,
            view_count,
            detail_view_count,
            created_at
          `)
          .eq('artist_id', artistData.id)
          .eq('is_visible', true)
          .order('display_order', { ascending: true });

        if (artworksError) throw artworksError;

        // Transform artworks data to match your existing component structure
        const transformedArtworks = artworksData.map((artwork, index) => {
          const images = getArtworkImages(artwork, index);
          
          return {
            id: artwork.id,
            title: artwork.title,
            description: artwork.description,
            medium: artwork.medium,
            dimensions: artwork.dimensions,
            year: artwork.year,
            position: [artwork.position_x, artwork.position_y, artwork.position_z],
            rotation: [artwork.rotation_x, artwork.rotation_y, artwork.rotation_z],
            // Generate image URLs from single storage path
            imageUrl: images.web,
            thumbnailUrl: images.thumbnail,
            hiresUrl: images.hires,
            price: artwork.price_usd,
            isForSale: artwork.is_for_sale,
            viewCount: artwork.view_count,
            detailViewCount: artwork.detail_view_count,
            originalFilename: artwork.original_filename,
            storagePath: artwork.storage_path,
            displayOrder: artwork.display_order
          };
        });

        setArtworks(transformedArtworks);

      } catch (err) {
        console.error('Error fetching gallery:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (subdomain) {
      fetchGallery();
    }
  }, [subdomain]);

  return { artist, artworks, loading, error, refetch: () => fetchGallery() };
}