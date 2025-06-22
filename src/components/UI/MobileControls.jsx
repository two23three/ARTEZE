// src/components/UI/MobileControls.jsx - First Person Mobile Version
import React from 'react';

export default function MobileControls({ onMove, onRotate, characterPosition, isMobile }) {
  // Don't render if not mobile
  if (!isMobile) return null;

  const handleMovement = (direction) => {
    const speed = 0.8;
    const [x, y, z] = characterPosition;
    let newX = x;
    let newZ = z;

    switch(direction) {
      case 'forward':
        if (z > -8.5) newZ = Math.max(z - speed, -8.5);
        break;
      case 'backward':
        if (z < 8.5) newZ = Math.min(z + speed, 8.5);
        break;
      case 'left':
        if (x > -8.5) newX = Math.max(x - speed, -8.5);
        break;
      case 'right':
        if (x < 8.5) newX = Math.min(x + speed, 8.5);
        break;
    }

    if (newX !== x || newZ !== z) {
      onMove([newX, y, newZ]);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 100,
      background: 'rgba(0, 0, 0, 0.8)',
      padding: '15px',
      borderRadius: '15px',
      backdropFilter: 'blur(10px)',
      userSelect: 'none'
    }}>
      {/* Movement Controls */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        alignItems: 'center',
        marginBottom: '15px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button 
            className="control-btn"
            onTouchStart={() => handleMovement('forward')}
            style={buttonStyle}
          >
            ↑
          </button>
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button 
            className="control-btn"
            onTouchStart={() => handleMovement('left')}
            style={buttonStyle}
          >
            ←
          </button>
          <button 
            className="control-btn"
            onTouchStart={() => handleMovement('backward')}
            style={buttonStyle}
          >
            ↓
          </button>
          <button 
            className="control-btn"
            onTouchStart={() => handleMovement('right')}
            style={buttonStyle}
          >
            →
          </button>
        </div>
      </div>

      {/* Look Controls */}
      <div style={{
        display: 'flex',
        gap: '10px',
        justifyContent: 'center',
        marginBottom: '10px'
      }}>
        <button 
          className="control-btn"
          onTouchStart={() => onRotate('up')}
          style={buttonStyle}
        >
          Look ↑
        </button>
        <button 
          className="control-btn"
          onTouchStart={() => onRotate('down')}
          style={buttonStyle}
        >
          Look ↓
        </button>
      </div>

      {/* Turn Controls */}
      <div style={{
        display: 'flex',
        gap: '10px',
        justifyContent: 'center'
      }}>
        <button 
          className="control-btn"
          onTouchStart={() => onRotate('left')}
          style={buttonStyle}
        >
          ↶
        </button>
        <button 
          className="control-btn"
          onTouchStart={() => onRotate('right')}
          style={buttonStyle}
        >
          ↷
        </button>
      </div>

      <div style={{
        textAlign: 'center',
        color: 'white',
        fontSize: '12px',
        marginTop: '10px',
        opacity: 0.8
      }}>
        Move around and look with controls above
      </div>
    </div>
  );
}

const buttonStyle = {
  background: 'rgba(255, 255, 255, 0.2)',
  border: '1px solid rgba(255, 255, 255, 0.3)',
  color: 'white',
  padding: '12px 16px',
  borderRadius: '8px',
  fontSize: '16px',
  cursor: 'pointer',
  userSelect: 'none',
  touchAction: 'manipulation'
};