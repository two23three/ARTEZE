// src/components/Gallery/Character.jsx - Fixed Bouncing Version
import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

export default function Character({ 
  position, 
  rotation, 
  cameraRotation, 
  isWalking,
  walkingSpeed 
}) {
  const meshRef = useRef();
  const leftShoeRef = useRef();
  const rightShoeRef = useRef();
  const { camera } = useThree();
  
  // Store base camera position to avoid cumulative errors
  const baseCameraY = useRef(1.6);
  
  useFrame((state, delta) => {
    if (meshRef.current) {
      // Update character position and rotation smoothly
      meshRef.current.position.lerp(new THREE.Vector3(...position), 0.3);
      meshRef.current.rotation.y = rotation;
      
      // Set camera position relative to character (first person)
      // Use the actual character position for smooth following
      const characterPos = meshRef.current.position;
      
      // Calculate head bob only if walking
      let headBobOffset = 0;
      if (isWalking && walkingSpeed > 0) {
        const bobAmount = Math.min(walkingSpeed * 0.5, 0.02); // Much smaller bob
        const bobSpeed = 6; // Slower bob
        headBobOffset = Math.sin(state.clock.elapsedTime * bobSpeed) * bobAmount;
      }
      
      // Set camera position with smooth interpolation
      const targetCameraPos = new THREE.Vector3(
        characterPos.x,
        characterPos.y + baseCameraY.current + headBobOffset,
        characterPos.z
      );
      
      camera.position.lerp(targetCameraPos, 0.2);
      
      // Apply camera rotation (look around)
      camera.rotation.y = rotation; // Horizontal rotation follows character
      camera.rotation.x = cameraRotation; // Vertical look up/down
      
      // Foot stepping animation (much more subtle)
      if (leftShoeRef.current && rightShoeRef.current) {
        if (isWalking && walkingSpeed > 0) {
          const stepTime = state.clock.elapsedTime * 5; // Slower stepping
          const stepAmount = 0.02; // Much smaller steps
          
          // Alternating foot movement
          const leftStep = Math.sin(stepTime) * stepAmount;
          const rightStep = Math.sin(stepTime + Math.PI) * stepAmount;
          
          leftShoeRef.current.position.z = 0.1 + leftStep;
          rightShoeRef.current.position.z = 0.1 + rightStep;
          
          // Very subtle vertical movement
          leftShoeRef.current.position.y = 0.05 + Math.max(0, Math.sin(stepTime)) * 0.01;
          rightShoeRef.current.position.y = 0.05 + Math.max(0, Math.sin(stepTime + Math.PI)) * 0.01;
        } else {
          // Return feet to neutral position smoothly
          leftShoeRef.current.position.z = THREE.MathUtils.lerp(leftShoeRef.current.position.z, 0.1, delta * 8);
          rightShoeRef.current.position.z = THREE.MathUtils.lerp(rightShoeRef.current.position.z, 0.1, delta * 8);
          leftShoeRef.current.position.y = THREE.MathUtils.lerp(leftShoeRef.current.position.y, 0.05, delta * 8);
          rightShoeRef.current.position.y = THREE.MathUtils.lerp(rightShoeRef.current.position.y, 0.05, delta * 8);
        }
      }
    }
  });

  return (
    <group ref={meshRef} position={position}>
      {/* Character body (invisible collision box) */}
      <mesh position={[0, 0.9, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 1.8]} />
        <meshBasicMaterial color="#ff0000" transparent opacity={0} />
      </mesh>
      
      {/* Visible feet/shoes for reference */}
      <mesh ref={leftShoeRef} position={[-0.15, 0.05, 0.1]} castShadow>
        <boxGeometry args={[0.3, 0.1, 0.5]} />
        <meshLambertMaterial color="#2c1810" />
      </mesh>
      
      <mesh ref={rightShoeRef} position={[0.15, 0.05, 0.1]} castShadow>
        <boxGeometry args={[0.3, 0.1, 0.5]} />
        <meshLambertMaterial color="#2c1810" />
      </mesh>
    </group>
  );
}