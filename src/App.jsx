// src/App.jsx - Updated with upload route
import React from 'react';
import VirtualStudio from './components/Gallery/VirtualStudio';
import ArtworkUpload from './components/Admin/ArtworkUpload';
import './index.css';

export default function App() {
  // Simple routing based on URL path
  const path = window.location.pathname;
  
  if (path === '/upload' || path === '/admin') {
    return (
      <div style={{ background: '#111827', minHeight: '100vh' }}>
        <ArtworkUpload />
      </div>
    );
  }
  
  return (
    <div className="container">
      <VirtualStudio />
    </div>
  );
}