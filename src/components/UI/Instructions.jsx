// src/components/UI/Instructions.jsx - First Person Version
import React, { useState, useEffect } from 'react';

export default function Instructions() {
  const [showInstructions, setShowInstructions] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
  }, []);
  
  if (!showInstructions) return null;
  
  return (
    <div className="instructions">
      <h3>Welcome to the Virtual Studio</h3>
      <div style={{ marginBottom: '0.5rem', fontSize: '0.85rem' }}>
        {isMobile ? (
          <>
            <div><strong>Touch Controls:</strong></div>
            <div>• Use directional buttons to move</div>
            <div>• Use "Look ↑/↓" to look up and down</div>
            <div>• Use "↶/↷" to turn left and right</div>
            <div>• Tap artworks to select them</div>
          </>
        ) : (
          <>
            <div><strong>First Person Controls:</strong></div>
            <div>• <kbd>W A S D</kbd> or Arrow Keys to move</div>
            <div>• <strong>Click screen to enable mouse look</strong></div>
            <div>• <strong>Move mouse to look around</strong></div>
            <div>• <kbd>ESC</kbd> to exit mouse look / deselect</div>
            <div>• Click artworks to select them</div>
          </>
        )}
        <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', opacity: 0.8 }}>
          💡 Click selected artwork again for details
        </div>
      </div>
      <button onClick={() => setShowInstructions(false)}>
        Start Exploring
      </button>
    </div>
  );
}