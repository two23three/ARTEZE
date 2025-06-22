// src/components/UI/MobileControls.jsx - Roblox-Style Controls
import React, { useRef, useState, useCallback } from 'react';

export default function MobileControls({ onMove, onRotate, characterPosition, isMobile }) {
  if (!isMobile) return null;

  const [joystickActive, setJoystickActive] = useState(false);
  const [joystickPosition, setJoystickPosition] = useState({ x: 0, y: 0 });
  const [cameraActive, setCameraActive] = useState(false);
  
  const joystickRef = useRef(null);
  const cameraZoneRef = useRef(null);
  const lastCameraPos = useRef({ x: 0, y: 0 });
  const moveInterval = useRef(null);
  const joystickPosRef = useRef({ x: 0, y: 0 }); // Fix closure issue

  // Joystick constants
  const JOYSTICK_SIZE = 70;
  const KNOB_SIZE = 30;
  const MAX_DISTANCE = (JOYSTICK_SIZE - KNOB_SIZE) / 2;

  // Calculate distance between two points
  const getDistance = (x1, y1, x2, y2) => {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  };

  // Calculate angle between two points
  const getAngle = (x1, y1, x2, y2) => {
    return Math.atan2(y2 - y1, x2 - x1);
  };

  // Handle joystick movement
  const handleJoystickMove = useCallback((clientX, clientY) => {
    if (!joystickRef.current) return;
    
    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const deltaX = clientX - centerX;
    const deltaY = clientY - centerY;
    const distance = getDistance(0, 0, deltaX, deltaY);
    
    let newPos;
    if (distance <= MAX_DISTANCE) {
      newPos = { x: deltaX, y: deltaY };
    } else {
      const angle = getAngle(0, 0, deltaX, deltaY);
      newPos = {
        x: Math.cos(angle) * MAX_DISTANCE,
        y: Math.sin(angle) * MAX_DISTANCE
      };
    }
    
    setJoystickPosition(newPos);
    joystickPosRef.current = newPos; // Keep ref in sync
  }, []);

  // Start continuous movement based on joystick position
  const startMovement = useCallback(() => {
    if (moveInterval.current) return;
    
    console.log('Starting joystick movement interval'); // Debug log
    
    moveInterval.current = setInterval(() => {
      const currentPos = joystickPosRef.current; // Use ref to avoid closure
      const magnitude = getDistance(0, 0, currentPos.x, currentPos.y);
      
      if (magnitude < 5) return; // Dead zone
      
      const normalizedMagnitude = Math.min(magnitude / MAX_DISTANCE, 1);
      const speed = normalizedMagnitude * 0.15; // Much slower - was 0.5, now 0.15
      
      // Calculate movement direction relative to joystick
      const moveRight = (currentPos.x / MAX_DISTANCE) * speed;
      const moveForward = -(currentPos.y / MAX_DISTANCE) * speed; // Invert Y
      
      console.log('Joystick sending movement:', { moveForward, moveRight, magnitude, speed, normalizedMagnitude }); // Enhanced debug log
      
      // Send movement vector to parent - let parent handle position calculation
      onMove(null, { forward: moveForward, right: moveRight });
    }, 16); // ~60fps
  }, [onMove]);

  // Stop movement
  const stopMovement = useCallback(() => {
    if (moveInterval.current) {
      clearInterval(moveInterval.current);
      moveInterval.current = null;
    }
  }, []);

  // Joystick touch handlers
  const handleJoystickStart = useCallback((event) => {
    setJoystickActive(true);
    const touch = event.touches[0];
    handleJoystickMove(touch.clientX, touch.clientY);
    startMovement();
  }, [handleJoystickMove, startMovement]);

  const handleJoystickMove_ = useCallback((event) => {
    if (!joystickActive) return;
    const touch = event.touches[0];
    handleJoystickMove(touch.clientX, touch.clientY);
  }, [joystickActive, handleJoystickMove]);

  const handleJoystickEnd = useCallback(() => {
    setJoystickActive(false);
    setJoystickPosition({ x: 0, y: 0 });
    joystickPosRef.current = { x: 0, y: 0 }; // Clear ref too
    stopMovement();
  }, [stopMovement]);

  // Camera control handlers
  const handleCameraStart = useCallback((event) => {
    setCameraActive(true);
    const touch = event.touches[0];
    lastCameraPos.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleCameraMove = useCallback((event) => {
    if (!cameraActive) return;
    
    const touch = event.touches[0];
    const deltaX = touch.clientX - lastCameraPos.current.x;
    const deltaY = touch.clientY - lastCameraPos.current.y;
    
    // Much lower sensitivity and better dead zones
    const horizontalSensitivity = 0.003; // Reduced from 0.005
    const verticalSensitivity = 0.002;   // Even lower for vertical
    
    // Dead zones to prevent accidental movement
    const horizontalDeadZone = 3;
    const verticalDeadZone = 5;
    
    // Only apply horizontal rotation if movement is primarily horizontal
    if (Math.abs(deltaX) > horizontalDeadZone && Math.abs(deltaX) > Math.abs(deltaY)) {
      onRotate('horizontal', -deltaX * horizontalSensitivity);
    }
    
    // Only apply vertical rotation if movement is primarily vertical
    if (Math.abs(deltaY) > verticalDeadZone && Math.abs(deltaY) > Math.abs(deltaX)) {
      onRotate('vertical', -deltaY * verticalSensitivity);
    }
    
    lastCameraPos.current = { x: touch.clientX, y: touch.clientY };
  }, [cameraActive, onRotate]);

  const handleCameraEnd = useCallback(() => {
    setCameraActive(false);
  }, []);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (moveInterval.current) {
        clearInterval(moveInterval.current);
      }
    };
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      pointerEvents: 'none',
      zIndex: 10
    }}>
      {/* Virtual Joystick */}
      <div
        ref={joystickRef}
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          width: `${JOYSTICK_SIZE}px`,
          height: `${JOYSTICK_SIZE}px`,
          background: joystickActive ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)',
          border: `2px solid ${joystickActive ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.3)'}`,
          borderRadius: '50%',
          pointerEvents: 'auto',
          touchAction: 'none'
        }}
        onTouchStart={handleJoystickStart}
        onTouchMove={handleJoystickMove_}
        onTouchEnd={handleJoystickEnd}
        onTouchCancel={handleJoystickEnd}
      >
        {/* Joystick Knob */}
        <div style={{
          position: 'absolute',
          width: `${KNOB_SIZE}px`,
          height: `${KNOB_SIZE}px`,
          background: joystickActive ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.6)',
          borderRadius: '50%',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translate(${joystickPosition.x}px, ${joystickPosition.y}px)`,
          transition: joystickActive ? 'none' : 'transform 0.2s ease-out',
          border: '1px solid rgba(0, 0, 0, 0.2)'
        }} />
      </div>

      {/* Camera Control Zone */}
      <div
        ref={cameraZoneRef}
        style={{
          position: 'absolute',
          right: 0,
          bottom: 0,
          width: '60%',
          height: '50%',
          background: cameraActive ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
          pointerEvents: 'auto',
          touchAction: 'none',
          borderTopLeft: cameraActive ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
          transition: 'background 0.2s ease'
        }}
        onTouchStart={handleCameraStart}
        onTouchMove={handleCameraMove}
        onTouchEnd={handleCameraEnd}
        onTouchCancel={handleCameraEnd}
      >
        {/* Subtle indicator with better instructions */}
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          fontSize: '11px',
          color: 'rgba(255, 255, 255, 0.6)',
          pointerEvents: 'none',
          opacity: cameraActive ? 1 : 0.4,
          transition: 'opacity 0.2s ease',
          textAlign: 'right',
          lineHeight: '1.3'
        }}>
          👀 Look around<br/>
          <span style={{ fontSize: '10px', opacity: 0.8 }}>
            Swipe horizontal ← → to turn<br/>
            Swipe vertical ↑ ↓ to look up/down
          </span>
        </div>
      </div>

      {/* Instructions with improved guidance */}
      <div style={{
        position: 'absolute',
        bottom: '100px',
        left: '20px',
        fontSize: '11px',
        color: 'rgba(255, 255, 255, 0.7)',
        pointerEvents: 'none',
        textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)',
        lineHeight: '1.3'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>Move</div>
        {joystickActive && (
          <div style={{ fontSize: '10px', opacity: 0.8 }}>
            ({Math.round(joystickPosition.x)}, {Math.round(joystickPosition.y)})
          </div>
        )}
      </div>
    </div>
  );
}