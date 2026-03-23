/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useRef, useState, useCallback } from 'react';
import { Canvas, useThree, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Grid, PerspectiveCamera, Environment, ContactShadows, Text, Html, Line, Sky } from '@react-three/drei';
import * as THREE from 'three';
import { OBJExporter } from 'three/examples/jsm/exporters/OBJExporter.js';
import { Wall } from '../../types';
import { Tool } from './Canvas2D';
import { Maximize, Minimize, RotateCcw, Box as BoxIcon, Square, Download, Ruler } from 'lucide-react';
import { cn } from '../../lib/utils';

interface WallMeshProps {
  wall: Wall;
}

const WallMesh = ({ wall }: WallMeshProps) => {
  const { start, end, thickness, height, openings } = wall;
  
  const length = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
  const angle = Math.atan2(end.y - start.y, end.x - start.x);
  
  // Center of the wall
  const centerX = (start.x + end.x) / 2;
  const centerY = (start.y + end.y) / 2;

  // Convert 2D coordinates to 3D (X, Z) with Y as height
  // Scale down for better 3D viewing
  const scale = 0.05;
  
  return (
    <group 
      position={[centerX * scale - 30, 0, centerY * scale - 20]} 
      rotation={[0, -angle, 0]}
    >
      {/* Main Wall Body */}
      <mesh position={[0, height * scale / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[length * scale, height * scale, thickness * scale]} />
        <meshStandardMaterial 
          color="#ffffff" 
          roughness={0.8} 
          metalness={0}
          emissive="#000000"
          emissiveIntensity={0}
        />
      </mesh>

      {/* Wall Top Cap */}
      <mesh position={[0, height * scale, 0]} receiveShadow>
        <boxGeometry args={[length * scale + 0.02, 0.05, thickness * scale + 0.02]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.5} />
      </mesh>

      {/* Baseboard */}
      <mesh position={[0, 0.1, 0]} receiveShadow>
        <boxGeometry args={[length * scale + 0.01, 0.2, thickness * scale + 0.05]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.4} />
      </mesh>

      {/* Render Openings */}
      {openings?.map(opening => {
        const openingX = (opening.position - 0.5) * length * scale;
        const openingY = (opening.bottomHeight + opening.height / 2) * scale;
        
        return (
          <group key={opening.id} position={[openingX, openingY, 0]}>
            {/* Frame */}
            <mesh castShadow receiveShadow>
              <boxGeometry args={[opening.width * scale + 0.1, opening.height * scale + 0.1, thickness * scale + 0.05]} />
              <meshStandardMaterial color="#09090b" roughness={0.3} metalness={0.6} />
            </mesh>
            
            {/* Glass or Door Surface */}
            <mesh position={[0, 0, 0]} castShadow={opening.type === 'door'} receiveShadow>
              <boxGeometry args={[opening.width * scale, opening.height * scale, thickness * scale - 0.1]} />
              <meshStandardMaterial 
                color={opening.type === 'door' ? '#3f2a1d' : '#e0f2fe'} 
                transparent={opening.type === 'window'}
                opacity={opening.type === 'window' ? 0.4 : 1}
                roughness={opening.type === 'window' ? 0.05 : 0.6}
                metalness={opening.type === 'window' ? 0.8 : 0.2}
              />
            </mesh>

            {/* Door Handle */}
            {opening.type === 'door' && (
              <mesh position={[opening.width * scale * 0.35, -0.2, thickness * scale / 2 + 0.05]} castShadow>
                <sphereGeometry args={[0.08, 16, 16]} />
                <meshStandardMaterial color="#d4af37" metalness={1} roughness={0.05} />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
};

const SceneTracker = ({ onSceneReady }: { onSceneReady: (scene: THREE.Scene) => void }) => {
  const { scene } = useThree();
  React.useEffect(() => {
    onSceneReady(scene);
  }, [scene, onSceneReady]);
  return null;
};

interface Canvas3DProps {
  walls: Wall[];
  tool?: Tool;
  metersPerUnit?: number;
}

const MeasurementLine = ({ start, end, distance }: { start: THREE.Vector3; end: THREE.Vector3; distance: number }) => {
  const points = useMemo(() => [start, end], [start, end]);
  const center = useMemo(() => new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5), [start, end]);

  return (
    <group>
      <Line
        points={points}
        color="#f59e0b"
        lineWidth={2}
        dashed={false}
      />
      <mesh position={start}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={end}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={0.5} />
      </mesh>
      <Html position={center} center distanceFactor={15}>
        <div className="bg-amber-500 text-white px-2 py-1 rounded text-[10px] font-bold shadow-lg whitespace-nowrap">
          {distance.toFixed(2)}m
        </div>
      </Html>
    </group>
  );
};

export const Canvas3D = ({ walls, tool, metersPerUnit = 1 }: Canvas3DProps) => {
  const controlsRef = useRef<any>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const [measurePoints, setMeasurePoints] = useState<THREE.Vector3[]>([]);
  const [hoverPoint, setHoverPoint] = useState<THREE.Vector3 | null>(null);

  const handleCanvasClick = (e: ThreeEvent<MouseEvent>) => {
    if (tool !== 'measure3d') return;
    
    // Stop propagation to prevent OrbitControls from handling this as a drag
    e.stopPropagation();

    const point = e.point.clone();
    
    if (measurePoints.length >= 2) {
      setMeasurePoints([point]);
    } else {
      setMeasurePoints([...measurePoints, point]);
    }
  };

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (tool !== 'measure3d') return;
    setHoverPoint(e.point.clone());
  };

  const distance = useMemo(() => {
    if (measurePoints.length === 2) {
      // 1 unit in 3D = metersPerUnit meters
      return measurePoints[0].distanceTo(measurePoints[1]) * metersPerUnit;
    }
    return 0;
  }, [measurePoints, metersPerUnit]);

  const handleExport = () => {
    if (!sceneRef.current) return;
    const exporter = new OBJExporter();
    const result = exporter.parse(sceneRef.current);
    const blob = new Blob([result], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'floorplan.obj';
    link.click();
    URL.revokeObjectURL(url);
  };

  const resetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  const setTopView = () => {
    if (controlsRef.current) {
      controlsRef.current.setLookAt(0, 100, 0, 0, 0, 0, true);
    }
  };

  return (
    <div className="w-full h-full bg-zinc-50 border border-zinc-200 rounded-xl overflow-hidden shadow-2xl relative group">
      <Canvas 
        shadows 
        camera={{ position: [50, 50, 50], fov: 45 }}
        onPointerMissed={() => {
          if (tool === 'measure3d') setMeasurePoints([]);
        }}
      >
        <color attach="background" args={['#f8fafc']} />
        <OrbitControls 
          ref={controlsRef}
          makeDefault 
          minPolarAngle={0} 
          maxPolarAngle={Math.PI / 2.1} 
          enableDamping={true}
          dampingFactor={0.05}
          enabled={tool !== 'measure3d'}
        />
        
        <ambientLight intensity={0.4} />
        <directionalLight 
          position={[20, 40, 20]} 
          intensity={2} 
          castShadow 
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-50}
          shadow-camera-right={50}
          shadow-camera-top={50}
          shadow-camera-bottom={-50}
        />
        
        <Environment preset="apartment" />
        <Sky sunPosition={[100, 20, 100]} inclination={0} azimuth={0.25} />
        
        <group 
          onClick={handleCanvasClick}
          onPointerMove={handlePointerMove}
        >
          {walls.map(wall => (
            <WallMesh key={wall.id} wall={wall} />
          ))}
          
          {/* Main Floor */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
            <planeGeometry args={[100, 100]} />
            <meshStandardMaterial 
              color="#f5f5f4" 
              roughness={0.8} 
              metalness={0.1}
            />
          </mesh>

          {/* Decorative Floor Grid/Texture simulation */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
            <planeGeometry args={[100, 100]} />
            <meshStandardMaterial 
              color="#d6d3d1" 
              transparent 
              opacity={0.2} 
              roughness={0.5}
            />
          </mesh>
        </group>

        {/* Measurement Visuals */}
        {measurePoints.length > 0 && (
          <group>
            {measurePoints.map((p, i) => (
              <mesh key={i} position={p}>
                <sphereGeometry args={[0.15, 16, 16]} />
                <meshBasicMaterial color="#f59e0b" />
              </mesh>
            ))}
            {measurePoints.length === 2 && (
              <MeasurementLine 
                start={measurePoints[0]} 
                end={measurePoints[1]} 
                distance={distance} 
              />
            )}
            {measurePoints.length === 1 && hoverPoint && (
              <Line
                points={[measurePoints[0], hoverPoint]}
                color="#f59e0b"
                lineWidth={2}
                dashed
                dashSize={0.2}
                gapSize={0.1}
                transparent
                opacity={0.5}
              />
            )}
          </group>
        )}

        <SceneTracker onSceneReady={(scene) => { sceneRef.current = scene; }} />

        <Grid 
          infiniteGrid 
          fadeDistance={100} 
          fadeStrength={5} 
          cellSize={1} 
          sectionSize={5} 
          sectionColor="#e2e8f0" 
          cellColor="#f1f5f9"
          opacity={0.1}
        />
        
        <ContactShadows 
          position={[0, 0, 0]} 
          opacity={0.4} 
          scale={100} 
          blur={2.5} 
          far={10} 
          resolution={512} 
          color="#000000" 
        />
      </Canvas>

      {/* Camera Controls Overlay */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="bg-white/80 backdrop-blur-md p-1.5 rounded-xl border border-zinc-200 shadow-xl flex flex-col gap-1">
          <button 
            onClick={handleExport}
            className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-600 hover:text-zinc-900 transition-colors"
            title="Export as OBJ"
          >
            <Download size={18} />
          </button>
          <div className="h-px bg-zinc-100 my-0.5" />
          <button 
            onClick={resetCamera}
            className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-600 hover:text-zinc-900 transition-colors"
            title="Reset Camera"
          >
            <RotateCcw size={18} />
          </button>
          <div className="h-px bg-zinc-100 my-0.5" />
          <button 
            onClick={() => {
              if (controlsRef.current) {
                controlsRef.current.object.position.set(0, 80, 0);
                controlsRef.current.target.set(0, 0, 0);
                controlsRef.current.update();
              }
            }}
            className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-600 hover:text-zinc-900 transition-colors"
            title="Top View"
          >
            <Square size={18} />
          </button>
          <button 
            onClick={() => {
              if (controlsRef.current) {
                controlsRef.current.object.position.set(80, 20, 0);
                controlsRef.current.target.set(0, 0, 0);
                controlsRef.current.update();
              }
            }}
            className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-600 hover:text-zinc-900 transition-colors"
            title="Side View"
          >
            <BoxIcon size={18} />
          </button>
        </div>
      </div>

      <div className="absolute top-4 left-4 pointer-events-none">
        <div className="bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-zinc-200 shadow-sm flex items-center gap-2">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
            {tool === 'measure3d' ? '3D Measurement Active' : '3D Navigation Active'}
          </span>
          {tool === 'measure3d' && (
            <div className="flex items-center gap-1 ml-2">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-[10px] text-amber-500 font-medium">
                {measurePoints.length === 0 ? 'Click to start' : measurePoints.length === 1 ? 'Click second point' : 'Measurement complete'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
