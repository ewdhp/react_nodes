import React, { useRef, useMemo, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Line, Sphere } from '@react-three/drei';
import * as THREE from 'three';

// 3D Node Component
function Node3D({ position, label, selected, onClick, id }) {
  const meshRef = useRef();
  
  useFrame((state) => {
    if (meshRef.current) {
      // Gentle rotation animation
      meshRef.current.rotation.y += 0.01;
    }
  });

  const color = selected ? '#2196f3' : '#ffffff';
  const scale = selected ? 1.2 : 1.0;

  return (
    <group position={position} onClick={() => onClick(id)}>
      {/* Node sphere */}
      <Sphere
        ref={meshRef}
        args={[0.5, 16, 16]}
        scale={scale}
      >
        <meshStandardMaterial color={color} />
      </Sphere>
      
      {/* Node label */}
      <Text
        position={[0, 0.8, 0]}
        fontSize={0.3}
        color="black"
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>
    </group>
  );
}

// 3D Edge Component
function Edge3D({ start, end }) {
  const points = useMemo(() => [
    new THREE.Vector3(...start),
    new THREE.Vector3(...end)
  ], [start, end]);

  return (
    <Line
      points={points}
      color="#666666"
      lineWidth={2}
    />
  );
}

// Main 3D Graph Component
export default function ThreeGraph({ nodes, edges, selectedNodes, onNodeClick }) {
  // Convert 2D positions to 3D positions
  const nodes3D = useMemo(() => {
    return nodes.map((node, index) => ({
      ...node,
      position3D: [
        (node.position?.x || 0) / 100, // Scale down for 3D
        (node.position?.y || 0) / 100,
        Math.sin(index) * 2 // Add Z dimension
      ]
    }));
  }, [nodes]);

  // Convert edges to 3D
  const edges3D = useMemo(() => {
    return edges.map(edge => {
      const sourceNode = nodes3D.find(n => n.id === edge.source);
      const targetNode = nodes3D.find(n => n.id === edge.target);
      
      if (!sourceNode || !targetNode) return null;
      
      return {
        ...edge,
        start: sourceNode.position3D,
        end: targetNode.position3D
      };
    }).filter(Boolean);
  }, [edges, nodes3D]);

  const handleNodeClick = useCallback((nodeId) => {
    onNodeClick?.(nodeId);
  }, [onNodeClick]);

  return (
    <div style={{ width: '100%', height: '100%', background: '#f0f0f0' }}>
      <Canvas
        camera={{ position: [10, 10, 10], fov: 75 }}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.6} />
        <pointLight position={[10, 10, 10]} intensity={0.8} />
        <directionalLight position={[-10, -10, -5]} intensity={0.5} />

        {/* Controls */}
        <OrbitControls enablePan enableZoom enableRotate />

        {/* Grid */}
        <gridHelper args={[20, 20]} />

        {/* Render Edges */}
        {edges3D.map((edge) => (
          <Edge3D
            key={edge.id}
            start={edge.start}
            end={edge.end}
          />
        ))}

        {/* Render Nodes */}
        {nodes3D.map((node) => (
          <Node3D
            key={node.id}
            id={node.id}
            position={node.position3D}
            label={node.data?.label || node.id}
            selected={selectedNodes.includes(node.id)}
            onClick={handleNodeClick}
          />
        ))}
      </Canvas>

      {/* 3D Controls Info */}
      <div
        style={{
          position: 'absolute',
          bottom: 20,
          left: 20,
          background: 'rgba(255,255,255,0.9)',
          padding: '12px 16px',
          borderRadius: 8,
          fontSize: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}
      >
        <div><strong>3D Controls:</strong></div>
        <div>• Mouse: Rotate view</div>
        <div>• Wheel: Zoom in/out</div>
        <div>• Right-click + drag: Pan</div>
        <div>• Click nodes: Select</div>
      </div>
    </div>
  );
}
