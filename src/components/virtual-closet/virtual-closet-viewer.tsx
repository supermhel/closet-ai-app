"use client"

import { useRef, useState, useMemo, Suspense } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, Environment, Html, useGLTF } from "@react-three/drei"
import * as THREE from "three"
import { getModelUrlForItem } from "@/lib/services/virtualClosetService"
import type { ClosetItem } from "@/types/virtual-closet"

// 3D Model Component
function ItemModel({ modelUrl, imageUrl }: { modelUrl: string; imageUrl?: string }) {
  const gltf = useGLTF(modelUrl)

  if (!gltf?.scene) {
    return (
      <mesh>
        <boxGeometry args={[0.8, 1.0, 0.1]} />
        <meshStandardMaterial color="#e2e8f0" />
        {imageUrl && (
          <mesh position={[0, 0, 0.06]}>
            <planeGeometry args={[0.6, 0.8]} />
            <meshBasicMaterial transparent opacity={0.9}>
              <primitive object={new THREE.TextureLoader().load(imageUrl)} attach="map" />
            </meshBasicMaterial>
          </mesh>
        )}
      </mesh>
    )
  }
  
  return (
    <group>
      <primitive object={gltf.scene.clone()} scale={[0.8, 0.8, 0.8]} />
      {/* Apply texture from user's image if available */}
      {imageUrl && (
        <mesh position={[0, 0, 0.1]}>
          <planeGeometry args={[0.6, 0.8]} />
          <meshBasicMaterial transparent opacity={0.9}>
            <primitive object={new THREE.TextureLoader().load(imageUrl)} attach="map" />
          </meshBasicMaterial>
        </mesh>
      )}
    </group>
  )
}

// Template Model Component with better error handling
function TemplateModel({ templateId }: { templateId: string }) {
  const modelPath = `/models/${templateId}.glb`
  const gltf = useGLTF(modelPath)
  
  if (!gltf?.scene) {
    console.warn(`Template model has no scene: ${templateId}`)
    return <FallbackRoom />
  }
  
  // Clone the scene to avoid conflicts
  const clonedScene = gltf.scene.clone()
  
  // Configure shadows and materials
  clonedScene.traverse((child) => {
    const mesh = child as THREE.Mesh
    if (mesh.isMesh) {
      mesh.castShadow = true
      mesh.receiveShadow = true
      // Ensure materials are visible
      if (mesh.material) {
        const material = mesh.material as THREE.Material
        material.needsUpdate = true
        // Fix material visibility issues
        if ('transparent' in material) {
          const transparentMaterial = material as THREE.MeshStandardMaterial
          transparentMaterial.transparent = false
        }
        if ('opacity' in material) {
          const opacityMaterial = material as THREE.MeshStandardMaterial
          opacityMaterial.opacity = 1
        }
      }
    }
  })
  
  return (
    <group>
      {/* Room Environment */}
      <RoomEnvironment />
      
      {/* Closet positioned against back wall */}
      <group position={[0, 0, -5.5]}>
        <primitive 
          object={clonedScene} 
          scale={[2, 2, 2]} 
          position={[0, 0, 0]}
          rotation={[0, 0, 0]}
        />
      </group>
    </group>
  )
}

// Room Environment Component - Realistic bedroom/dressing room
function RoomEnvironment() {
  return (
    <group>
      {/* Floor - Realistic wooden floor */}
      <mesh position={[0, 0, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[15, 15]} />
        <meshStandardMaterial 
          color="#d4b896" 
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>
      
      {/* Back wall - Where closet will be positioned */}
      <mesh position={[0, 4, -7]} receiveShadow>
        <planeGeometry args={[15, 8]} />
        <meshStandardMaterial 
          color="#f5f5f5" 
          roughness={0.9}
          metalness={0.0}
        />
      </mesh>
      
      {/* Left wall */}
      <mesh position={[-7, 4, 0]} receiveShadow rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[15, 8]} />
        <meshStandardMaterial 
          color="#f8f8f8" 
          roughness={0.9}
          metalness={0.0}
        />
      </mesh>
      
      {/* Right wall */}
      <mesh position={[7, 4, 0]} receiveShadow rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[15, 8]} />
        <meshStandardMaterial 
          color="#f8f8f8" 
          roughness={0.9}
          metalness={0.0}
        />
      </mesh>
      
      {/* Ceiling */}
      <mesh position={[0, 8, 0]} receiveShadow rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[15, 15]} />
        <meshStandardMaterial 
          color="#ffffff" 
          roughness={0.7}
          metalness={0.0}
        />
      </mesh>
      
      {/* Baseboard trim */}
      <mesh position={[0, 0.1, -6.9]}>
        <boxGeometry args={[15, 0.2, 0.1]} />
        <meshStandardMaterial color="#d0d0d0" />
      </mesh>
    </group>
  )
}

// Fallback room component
function FallbackRoom() {
  return <RoomEnvironment />
}

// 3D Components (Floor removed - using RoomEnvironment floor instead)

function ClosetItem({
  item,
  onSelect,
  isSelected = false,
}: {
  item: ClosetItem
  onSelect: (item: ClosetItem) => void
  isSelected?: boolean
}) {
  const groupRef = useRef<THREE.Group>(null)
  const [hovered, setHovered] = useState(false)

  const position = item.position || { x: 0, y: 0.5, z: 0 }
  const scale = item.scale || { x: 1, y: 1, z: 1 }
  const modelUrl = item.modelUrl || getModelUrlForItem(item)

  return (
    <group
      ref={groupRef}
      position={[position.x, position.y, position.z]}
      scale={[scale.x, scale.y, scale.z]}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onPointerDown={() => onSelect(item)}
    >
      {/* Load actual 3D model */}
      <Suspense fallback={
        <mesh>
          <boxGeometry args={[0.8, 1.0, 0.1]} />
          <meshStandardMaterial color="#e2e8f0" />
        </mesh>
      }>
        <ItemModel modelUrl={modelUrl} imageUrl={item.imageUrl} />
      </Suspense>

      {/* Selection indicator */}
      {isSelected && (
        <mesh position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.8, 1.0, 32]} />
          <meshBasicMaterial color="#3b82f6" transparent opacity={0.5} />
        </mesh>
      )}

      {/* Hover indicator */}
      {hovered && !isSelected && (
        <mesh position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.8, 1.0, 32]} />
          <meshBasicMaterial color="#60a5fa" transparent opacity={0.3} />
        </mesh>
      )}

      {/* Item name label */}
      {(hovered || isSelected) && (
        <Html position={[0, 1.5, 0]} center>
          <div className="bg-background/90 backdrop-blur-sm rounded px-2 py-1 text-xs font-medium border shadow-sm">
            {item.name}
          </div>
        </Html>
      )}
    </group>
  )
}

interface VirtualClosetViewerProps {
  template: string
  items: ClosetItem[]
  isLocked: boolean
  onItemUpdate: (itemId: string, updates: Partial<ClosetItem>) => void
  onItemSelect: (item: ClosetItem) => void
  onItemRemove: (itemId: string) => void
}

// Preload common template models
useGLTF.preload('/models/closet-template.glb')
useGLTF.preload('/models/closet-template1.glb')
useGLTF.preload('/models/closet-template2.glb')
useGLTF.preload('/models/closet-template3.glb')

export default function VirtualClosetViewer({
  template,
  items,
  isLocked,
  onItemUpdate: _onItemUpdate,
  onItemSelect,
  onItemRemove: _onItemRemove,
}: VirtualClosetViewerProps) {
  // Suppress unused parameter warnings
  void _onItemUpdate
  void _onItemRemove
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)

  const performanceSettings = useMemo(
    () => ({
      shadowMapSize: 1024,
      pixelRatio: Math.min(window.devicePixelRatio, 2),
      antialias: true,
      frameloop: "demand" as const,
      shadows: true,
    }),
    [],
  )

  return (
    <div className="w-full h-full relative">
      <Canvas
        camera={{ position: [5, 6, 8], fov: 65 }}
        shadows={performanceSettings.shadows}
        dpr={performanceSettings.pixelRatio}
        gl={{
          antialias: performanceSettings.antialias,
          powerPreference: "high-performance",
        }}
        frameloop={performanceSettings.frameloop}
        className="w-full h-full"
        onPointerMissed={() => setSelectedItemId(null)}
      >
        {/* Enhanced lighting for room environment */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[8, 12, 6]}
          intensity={1.5}
          castShadow={performanceSettings.shadows}
          shadow-mapSize={[4096, 4096]}
          shadow-camera-far={50}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
        />
        {/* Room lighting */}
        <pointLight position={[0, 7, 0]} intensity={0.6} />
        <spotLight 
          position={[0, 7, 3]} 
          angle={0.6} 
          penumbra={0.5} 
          intensity={0.8}
          target-position={[0, 2, -5]}
        />
        <Environment preset="apartment" background={false} />

        {/* Template Model */}
        <Suspense fallback={null}>
          <TemplateModel templateId={template} />
        </Suspense>

        {(items || []).filter(item => item.placed).map((item) => (
          <ClosetItem
            key={item.id}
            item={item}
            onSelect={(selectedItem) => {
              setSelectedItemId(selectedItem.id)
              onItemSelect(selectedItem)
            }}
            isSelected={selectedItemId === item.id}
          />
        ))}

        <OrbitControls
          enabled={!isLocked}
          minDistance={4}
          maxDistance={25}
          maxPolarAngle={Math.PI / 2.2}
          target={[0, 3, -3]}
          dampingFactor={0.05}
          enableDamping
          enablePan={true}
          panSpeed={0.8}
          rotateSpeed={0.8}
          zoomSpeed={1}
          makeDefault
        />
      </Canvas>

      {/* Template indicator */}
      <div className="absolute top-4 left-4 bg-background/80 backdrop-blur-sm rounded-lg px-3 py-2 text-sm font-medium border">
        Template: {template}
      </div>

      {/* Item count */}
      <div className="absolute top-4 right-4 bg-background/80 backdrop-blur-sm rounded-lg px-3 py-2 text-sm font-medium border">
        {(items || []).filter(item => item.placed).length} items placed
      </div>
    </div>
  )
}
