// src/hooks/useAnalytics.js - Track visitor interactions
import { supabase } from '../lib/supabase';

export function useAnalytics() {
  // Generate session ID for anonymous tracking
  const getSessionId = () => {
    let sessionId = sessionStorage.getItem('arteze-session-id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('arteze-session-id', sessionId);
    }
    return sessionId;
  };

  // Detect device type
  const getDeviceType = () => {
    const userAgent = navigator.userAgent;
    if (/tablet|ipad|playbook|silk/i.test(userAgent)) return 'tablet';
    if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) return 'mobile';
    return 'desktop';
  };

  // Start a gallery visit
  const startGalleryVisit = async (artistId) => {
    try {
      const { data, error } = await supabase
        .from('gallery_visits')
        .insert([{
          artist_id: artistId,
          visitor_id: getSessionId(),
          ip_address: null, // Will be populated by server
          user_agent: navigator.userAgent,
          device_type: getDeviceType(),
          entry_time: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      
      // Store visit ID for this session
      sessionStorage.setItem('current-visit-id', data.id);
      return data.id;
    } catch (error) {
      console.error('Error starting gallery visit:', error);
      return null;
    }
  };

  // Track artwork interaction
  const trackArtworkInteraction = async (artworkId, interactionType, duration = null, zoomLevel = null) => {
    try {
      const visitId = sessionStorage.getItem('current-visit-id');
      if (!visitId) return;

      await supabase
        .from('artwork_interactions')
        .insert([{
          artwork_id: artworkId,
          visit_id: visitId,
          interaction_type: interactionType, // 'viewed', 'detail_viewed', 'process_viewed'
          duration_seconds: duration,
          zoom_level: zoomLevel,
          coordinates: null // Can be expanded later for click/gaze tracking
        }]);

      // Also increment the artwork's view counter
      if (interactionType === 'viewed') {
        await supabase.rpc('increment_view_count', { artwork_id: artworkId });
      } else if (interactionType === 'detail_viewed') {
        await supabase.rpc('increment_detail_view_count', { artwork_id: artworkId });
      }

    } catch (error) {
      console.error('Error tracking artwork interaction:', error);
    }
  };

  // End gallery visit
  const endGalleryVisit = async (artworksViewed = 0) => {
    try {
      const visitId = sessionStorage.getItem('current-visit-id');
      if (!visitId) return;

      const entryTime = new Date(sessionStorage.getItem('visit-start-time') || Date.now());
      const totalTime = Math.floor((Date.now() - entryTime.getTime()) / 1000);

      await supabase
        .from('gallery_visits')
        .update({
          exit_time: new Date().toISOString(),
          total_time_seconds: totalTime,
          artworks_viewed: artworksViewed
        })
        .eq('id', visitId);

      // Clear session data
      sessionStorage.removeItem('current-visit-id');
      sessionStorage.removeItem('visit-start-time');

    } catch (error) {
      console.error('Error ending gallery visit:', error);
    }
  };

  return {
    startGalleryVisit,
    trackArtworkInteraction,
    endGalleryVisit
  };
}