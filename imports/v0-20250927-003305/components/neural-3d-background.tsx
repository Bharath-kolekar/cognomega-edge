"use client"

import { Canvas } from "@react-three/fiber"
import { OrbitControls, Sphere, MeshDistortMaterial, Float } from "@react-three/drei"
import { useRef } from "react"
import { useFrame } from "@react-three/fiber"
import type * as THREE from "three"

function NeuralSphere({
  position,
  color,
  speed = 1,
}: { position: [number, number, number]; color: string; speed?: number }) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * speed * 0.2
      meshRef.current.rotation.y = state.clock.elapsedTime * speed * 0.3
    }
  })

  return (
    <Float speed={speed} rotationIntensity={0.5} floatIntensity={0.5}>
      <Sphere ref={meshRef} position={position} args={[1, 32, 32]}>
        <MeshDistortMaterial
          color={color}
          attach="material"
          distort={0.4}
          speed={speed}
          roughness={0.1}
          metalness={0.8}
          transparent
          opacity={0.6}
        />
      </Sphere>
    </Float>
  )
}

function NeuralConnections() {
  const linesRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (linesRef.current) {
      linesRef.current.rotation.y = state.clock.elapsedTime * 0.1
    }
  })

  const connections = [
    { start: [-3, 0, 0], end: [3, 0, 0] },
    { start: [0, -3, 0], end: [0, 3, 0] },
    { start: [-2, -2, 0], end: [2, 2, 0] },
    { start: [2, -2, 0], end: [-2, 2, 0] },
  ]

  return (
    <group ref={linesRef}>
      {connections.map((connection, index) => (
        <line key={index}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={2}
              array={new Float32Array([...connection.start, ...connection.end])}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#4f46e5" transparent opacity={0.6} />
        </line>
      ))}
    </group>
  )
}

export function Neural3DBackground() {
  return (
    <div className="fixed inset-0 -z-10">
      <Canvas camera={{ position: [0, 0, 10], fov: 60 }}>
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={0.8} color="#4f46e5" />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#06b6d4" />

        <NeuralSphere position={[-3, 0, 0]} color="#4f46e5" speed={1} />
        <NeuralSphere position={[3, 0, 0]} color="#06b6d4" speed={0.8} />
        <NeuralSphere position={[0, 3, 0]} color="#ec4899" speed={1.2} />
        <NeuralSphere position={[0, -3, 0]} color="#8b5cf6" speed={0.9} />

        <NeuralConnections />

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.5}
          maxPolarAngle={Math.PI / 2}
          minPolarAngle={Math.PI / 2}
        />
      </Canvas>
    </div>
  )
}
