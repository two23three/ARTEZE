// src/hooks/useArtistAuth.js - Simple authentication for demo
import { useState, useEffect } from 'react';

export function useArtistAuth(artistId) {
  const [isArtist, setIsArtist] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!artistId) {
      setLoading(false);
      return;
    }

    // Check if user is authenticated for this artist
    const authKey = `artist-auth-${artistId}`;
    const isAuthenticated = localStorage.getItem(authKey) === 'true';
    setIsArtist(isAuthenticated);
    setLoading(false);
  }, [artistId]);

  const login = () => {
    // Simple demo login - in production use proper authentication
    const password = prompt('Enter artist password:');
    if (password === 'artist123') {
      localStorage.setItem(`artist-auth-${artistId}`, 'true');
      setIsArtist(true);
      return true;
    } else {
      alert('Invalid password. Try: artist123');
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem(`artist-auth-${artistId}`);
    setIsArtist(false);
  };

  return { isArtist, loading, login, logout };
}