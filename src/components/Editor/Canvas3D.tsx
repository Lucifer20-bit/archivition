/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, PerspectiveCamera, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { Wall } from '../../types';

interface WallMeshProps {
  wall: Wall;
}

const WallMesh = ({ wall }: WallMeshProps) => {
  const { start, end, thickness, height } = wall;
  
  const length = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
  const angle = Math.atan2(end.y - start.y, end.x - start.x);
  
  // Center of the wall
  const centerX = (start.x + end.x) / 2;
  const centerY = (start.y + end.y) / 2;

  // Convert 2D coordinates to 3D (X, Z) with Y as height
  // Scale down for better 3D viewing
  const scale = 0.05;
  
  return (
    <mesh 
      position={[centerX * scale - 30, height * scale / 2, centerY * scale - 20]} 
      rotation={[0, -angle, 0]}
    >
      <boxGeometry args={[length * scale, height * scale, thickness * scale]} />
      <meshStandardMaterial color="#f4f4f5" roughness={0.5} metalness={0.1} />
    </mesh>
  );
};

interface Canvas3DProps {
  walls: Wall[];
}

export const Canvas3D = ({ walls }: Canvas3DProps) => {
  return (
    <div className="w-full h-full bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[50, 50, 50]} fov={45} />
        <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 2.1} />
        
        <ambientLight intensity={0.5} />
        <directionalLight 
          position={[10, 20, 10]} 
          intensity={1.5} 
          castShadow 
          shadow-mapSize={[1024, 1024]}
        />
        
        <Environment preset="city" />
        
        <group>
          {walls.map(wall => (
            <WallMesh key={wall.id} wall={wall} />
          ))}
        </group>

        <Grid 
          infiniteGrid 
          fadeDistance={100} 
          fadeStrength={5} 
          cellSize={1} 
          sectionSize={5} 
          sectionColor="#3b82f6" 
          cellColor="#52525b"
        />
        
        <ContactShadows 
          position={[0, 0, 0]} 
          opacity={0.4} 
          scale={100} 
          blur={2} 
          far={10} 
          resolution={256} 
          color="#000000" 
        />
        
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
          <planeGeometry args={[200, 200]} />
          <meshStandardMaterial color="#18181b" />
        </mesh>
      </Canvas>
    </div>
  );
};
