// src/components/Gallery/Character.jsx - Debug logs removed
import React, { useRef } from 'react';
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
      // Update character position more aggressively for mobile
      const targetPos = new THREE.Vector3(...position);
      const currentPos = meshRef.current.position;
      const distance = currentPos.distanceTo(targetPos);
      
      if (distance > 0.01) {
        // Faster interpolation for mobile - was 0.3, now 0.8
        meshRef.current.position.lerp(targetPos, 0.8);
      } else {
        // Snap to exact position if very close
        meshRef.current.position.copy(targetPos);
      }
      
      meshRef.current.rotation.y = rotation;
      
      // Set camera position relative to character (first person)
      const characterPos = meshRef.current.position;
      
      // Calculate head bob only if walking
      let headBobOffset = 0;
      if (isWalking && walkingSpeed > 0) {
        const bobAmount = Math.min(walkingSpeed * 0.5, 0.02);
        const bobSpeed = 6;
        headBobOffset = Math.sin(state.clock.elapsedTime * bobSpeed) * bobAmount;
      }
      
      // Set camera position with faster interpolation for mobile
      const targetCameraPos = new THREE.Vector3(
        characterPos.x,
        characterPos.y + baseCameraY.current + headBobOffset,
        characterPos.z
      );
      
      // Faster camera following for mobile - was 0.2, now 0.6
      camera.position.lerp(targetCameraPos, 0.6);
      
      // Apply camera rotation (look around)
      camera.rotation.y = rotation;
      camera.rotation.x = cameraRotation;
      
      // Foot stepping animation
      if (leftShoeRef.current && rightShoeRef.current) {
        if (isWalking && walkingSpeed > 0) {
          const stepTime = state.clock.elapsedTime * 5;
          const stepAmount = 0.02;
          
          const leftStep = Math.sin(stepTime) * stepAmount;
          const rightStep = Math.sin(stepTime + Math.PI) * stepAmount;
          
          leftShoeRef.current.position.z = 0.1 + leftStep;
          rightShoeRef.current.position.z = 0.1 + rightStep;
          
          leftShoeRef.current.position.y = 0.05 + Math.max(0, Math.sin(stepTime)) * 0.01;
          rightShoeRef.current.position.y = 0.05 + Math.max(0, Math.sin(stepTime + Math.PI)) * 0.01;
        } else {
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
        <meshLambertMaterial color={isWalking ? "#ff6b6b" : "#2c1810"} />
      </mesh>
      
      <mesh ref={rightShoeRef} position={[0.15, 0.05, 0.1]} castShadow>
        <boxGeometry args={[0.3, 0.1, 0.5]} />
        <meshLambertMaterial color={isWalking ? "#ff6b6b" : "#2c1810"} />
      </mesh>
    </group>
  );
}