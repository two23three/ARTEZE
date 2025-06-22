// src/components/UI/Instructions.jsx - Updated Version
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
            <div><strong>Mobile Controls:</strong></div>
            <div>• <strong>Joystick</strong> (bottom-left): Drag to move around</div>
            <div>• <strong>Camera area</strong> (bottom-right): Swipe to look</div>
            <div>• Swipe <strong>horizontal ← →</strong> to turn left/right</div>
            <div>• Swipe <strong>vertical ↑ ↓</strong> to look up/down</div>
            <div>• Movement follows where you're looking</div>
            <div>• Tap artworks to select them</div>
          </>
        ) : (
          <>
            <div><strong>Desktop Controls:</strong></div>
            <div>• <kbd>W A S D</kbd> or Arrow Keys to move</div>
            <div>• <strong>Click canvas to enable mouse look</strong></div>
            <div>• <strong>Move mouse smoothly</strong> to look around</div>
            <div>• <kbd>ESC</kbd> to exit mouse look / deselect</div>
            <div>• Movement follows where you're looking</div>
            <div>• Click artworks to select them</div>
          </>
        )}
        <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', opacity: 0.9, fontStyle: 'italic' }}>
          💡 <strong>Tip:</strong> Click selected artwork again for details
        </div>
      </div>
      <button onClick={() => setShowInstructions(false)}>
        Start Exploring
      </button>
    </div>
  );
}