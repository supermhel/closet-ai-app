"use client"

import { Suspense, useMemo, useRef, useEffect, useState } from "react"
import { Canvas, useFrame, useLoader } from "@react-three/fiber"
import { OrbitControls, Environment, Html, useProgress } from "@react-three/drei"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import * as THREE from "three"
import { ErrorBoundary } from "@/components/error-boundary"

// Optimized loading component
function Loader() {
  const { progress } = useProgress()
  return (
    <Html center>
      <div className="flex flex-col items-center p-6 bg-background/80 backdrop-blur-sm rounded-xl border">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p className="text-sm text-muted-foreground">Loading 3D scene... {Math.round(progress)}%</p>
      </div>
    </Html>
  )
}

// Optimized 3D model component with LOD
function OptimizedModel({
  url,
  position,
  scale = 1,
  onClick,
}: {
  url: string
  position: [number, number, number]
  scale?: number
  onClick?: () => void
}) {
  const gltf = useLoader(GLTFLoader, url)
  const meshRef = useRef<THREE.Group>(null)
  const [hovered, setHovered] = useState(false)

  // Optimize materials for performance
  useEffect(() => {
    if (gltf.scene) {
      gltf.scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          // Enable frustum culling
          child.frustumCulled = true

          // Optimize materials
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach((mat) => {
                mat.needsUpdate = false
              })
            } else {
              child.material.needsUpdate = false
            }
          }
        }
      })
    }
  }, [gltf])

  // Animate on hover
  useFrame((state) => {
    if (meshRef.current && hovered) {
      meshRef.current.rotation.y += 0.01
    }
  })

  return (
    <group
      ref={meshRef}
      position={position}
      scale={hovered ? scale * 1.05 : scale}
      onClick={onClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <primitive object={gltf.scene.clone()} />
    </group>
  )
}

// Performance-optimized camera controls
function CameraControls() {
  const controlsRef = useRef<any>()

  useFrame(() => {
    if (controlsRef.current) {
      controlsRef.current.update()
    }
  })

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      minDistance={3}
      maxDistance={20}
      maxPolarAngle={Math.PI / 2}
      dampingFactor={0.05}
      enableDamping={true}
    />
  )
}

interface Optimized3DViewerProps {
  items: Array<{
    id: string
    modelUrl: string
    position: [number, number, number]
    scale?: number
  }>
  onItemClick?: (itemId: string) => void
  environment?: string
  quality?: "low" | "medium" | "high"
}

export function Optimized3DViewer({
  items,
  onItemClick,
  environment = "apartment",
  quality = "medium",
}: Optimized3DViewerProps) {
  // Memoize canvas settings based on quality
  const canvasSettings = useMemo(() => {
    const settings = {
      low: {
        antialias: false,
        powerPreference: "low-power" as const,
        pixelRatio: Math.min(window.devicePixelRatio, 1),
        shadowMapSize: 512,
      },
      medium: {
        antialias: true,
        powerPreference: "default" as const,
        pixelRatio: Math.min(window.devicePixelRatio, 1.5),
        shadowMapSize: 1024,
      },
      high: {
        antialias: true,
        powerPreference: "high-performance" as const,
        pixelRatio: Math.min(window.devicePixelRatio, 2),
        shadowMapSize: 2048,
      },
    }
    return settings[quality]
  }, [quality])

  // Performance monitoring
  useEffect(() => {
    let frameCount = 0
    let lastTime = performance.now()

    const measureFPS = () => {
      frameCount++
      const currentTime = performance.now()

      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime))

        // Log performance in development
        if (process.env.NODE_ENV === "development") {
          console.log(`3D Viewer FPS: ${fps}`)
        }

        // Automatically adjust quality if FPS is too low
        if (fps < 30 && quality === "high") {
          console.warn("Low FPS detected, consider reducing quality")
        }

        frameCount = 0
        lastTime = currentTime
      }

      requestAnimationFrame(measureFPS)
    }

    measureFPS()
  }, [quality])

  return (
    <ErrorBoundary
      level="component"
      fallback={(error, retry) => (
        <div className="w-full h-full flex items-center justify-center bg-muted/30 rounded-lg">
          <div className="text-center p-6">
            <p className="text-muted-foreground mb-4">Failed to load 3D viewer</p>
            <button onClick={retry} className="px-4 py-2 bg-primary text-primary-foreground rounded-md">
              Try Again
            </button>
          </div>
        </div>
      )}
    >
      <div className="w-full h-full">
        <Canvas
          camera={{ position: [0, 5, 10], fov: 50 }}
          gl={{
            antialias: canvasSettings.antialias,
            powerPreference: canvasSettings.powerPreference,
            alpha: true,
          }}
          dpr={canvasSettings.pixelRatio}
          shadows={quality !== "low"}
          onCreated={({ gl, scene }) => {
            // Optimize renderer settings
            gl.outputEncoding = THREE.sRGBEncoding
            gl.toneMapping = THREE.ACESFilmicToneMapping
            gl.toneMappingExposure = 1

            if (quality !== "low") {
              gl.shadowMap.enabled = true
              gl.shadowMap.type = THREE.PCFSoftShadowMap
              gl.shadowMap.setSize(canvasSettings.shadowMapSize, canvasSettings.shadowMapSize)
            }

            // Set background
            scene.background = new THREE.Color(0xf8f9fa)
          }}
        >
          <Suspense fallback={<Loader />}>
            {/* Lighting */}
            <ambientLight intensity={0.4} />
            <directionalLight
              position={[10, 10, 5]}
              intensity={1}
              castShadow={quality !== "low"}
              shadow-mapSize-width={canvasSettings.shadowMapSize}
              shadow-mapSize-height={canvasSettings.shadowMapSize}
            />

            {/* Environment */}
            <Environment preset={environment} />

            {/* 3D Models */}
            {items.map((item) => (
              <OptimizedModel
                key={item.id}
                url={item.modelUrl}
                position={item.position}
                scale={item.scale}
                onClick={() => onItemClick?.(item.id)}
              />
            ))}

            {/* Ground plane */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow={quality !== "low"}>
              <planeGeometry args={[20, 20]} />
              <meshStandardMaterial color="#f0f0f0" />
            </mesh>

            {/* Camera controls */}
            <CameraControls />
          </Suspense>
        </Canvas>
      </div>
    </ErrorBoundary>
  )
}

// Quality selector component
export function QualitySelector({
  quality,
  onQualityChange,
}: {
  quality: "low" | "medium" | "high"
  onQualityChange: (quality: "low" | "medium" | "high") => void
}) {
  return (
    <div className="absolute top-4 right-4 z-10">
      <select
        value={quality}
        onChange={(e) => onQualityChange(e.target.value as "low" | "medium" | "high")}
        className="px-3 py-1 bg-background/80 backdrop-blur-sm border rounded-md text-sm"
      >
        <option value="low">Low Quality</option>
        <option value="medium">Medium Quality</option>
        <option value="high">High Quality</option>
      </select>
    </div>
  )
}
