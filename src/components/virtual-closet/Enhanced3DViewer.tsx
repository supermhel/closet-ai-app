"use client"

import { Suspense, useMemo, useRef, useEffect, useState, useCallback } from "react"
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber"
import { 
  OrbitControls, 
  Environment, 
  Html, 
  useProgress, 
  Bounds,
  useBounds,
  ContactShadows,
  Stats,
  PerformanceMonitor
} from "@react-three/drei"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import * as THREE from "three"
import { ErrorBoundary } from "@/components/error-boundary"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Settings, 
  Monitor,
  Smartphone,
  AlertTriangle,
  Eye,
  EyeOff
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

// Performance tracking interface
interface PerformanceMetrics {
  fps: number
  memoryUsage: number
  drawCalls: number
  triangles: number
  renderTime: number
}

// Enhanced loading component with progress and tips
function Enhanced3DLoader() {
  const { progress, loaded, total } = useProgress()
  const [loadingTip, setLoadingTip] = useState(0)
  
  const tips = [
    "💡 Drag to rotate your closet view",
    "💡 Scroll to zoom in and out", 
    "💡 Click items to select and move them",
    "💡 Use the template selector to change layouts",
    "💡 Enable performance mode for smoother experience"
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingTip((prev) => (prev + 1) % tips.length)
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <Html center>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center p-8 bg-background/90 backdrop-blur-md rounded-2xl border shadow-2xl max-w-sm"
      >
        {/* Loading spinner */}
        <div className="relative mb-6">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20"></div>
          <div 
            className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin"
            style={{ animationDuration: '1s' }}
          ></div>
        </div>
        
        {/* Progress info */}
        <div className="text-center mb-4">
          <p className="text-lg font-semibold mb-2">Loading 3D Closet</p>
          <div className="w-64 bg-muted rounded-full h-2 mb-2">
            <motion.div 
              className="bg-primary h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {Math.round(progress)}% • {loaded}/{total} assets
          </p>
        </div>

        {/* Loading tip */}
        <AnimatePresence mode="wait">
          <motion.p
            key={loadingTip}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-sm text-center text-muted-foreground"
          >
            {tips[loadingTip]}
          </motion.p>
        </AnimatePresence>
      </motion.div>
    </Html>
  )
}

// Enhanced 3D model with LOD and optimization
function Enhanced3DModel({
  url,
  position,
  scale = 1,
  onClick,
  isSelected = false,
  performanceMode = false,
}: {
  url: string
  position: [number, number, number]
  scale?: number
  onClick?: () => void
  isSelected?: boolean
  performanceMode?: boolean
}) {
  const gltf = useLoader(GLTFLoader, url)
  const meshRef = useRef<THREE.Group>(null)
  const [hovered, setHovered] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  
  // Optimize materials and geometry
  useEffect(() => {
    if (gltf.scene) {
      gltf.scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          // Enable frustum culling
          child.frustumCulled = true
          
          // Level of Detail optimization
          if (performanceMode) {
            if (child.geometry instanceof THREE.BufferGeometry) {
              child.geometry.computeBoundingSphere()
              child.geometry.computeBoundingBox()
            }
          }

          // Material optimization
          if (child.material) {
            const materials = Array.isArray(child.material) ? child.material : [child.material]
            materials.forEach((mat) => {
              if (mat instanceof THREE.MeshStandardMaterial) {
                // Reduce material quality in performance mode
                if (performanceMode) {
                  mat.roughness = Math.min(mat.roughness + 0.2, 1)
                  mat.metalness = Math.max(mat.metalness - 0.1, 0)
                }
                mat.needsUpdate = false
              }
            })
          }
        }
      })
    }
  }, [gltf, performanceMode])

  // Smooth animations
  useFrame((state) => {
    if (meshRef.current) {
      if (hovered || isSelected) {
        meshRef.current.rotation.y += 0.005
        meshRef.current.position.y += Math.sin(state.clock.elapsedTime * 2) * 0.01
      }
    }
  })

  const currentScale = useMemo(() => {
    let baseScale = scale
    if (hovered) baseScale *= 1.05
    if (isSelected) baseScale *= 1.1
    return baseScale
  }, [scale, hovered, isSelected])

  return (
    <group
      ref={meshRef}
      position={position}
      scale={currentScale}
      onClick={onClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      visible={isVisible}
    >
      <primitive object={gltf.scene.clone()} />
      
      {/* Selection indicator */}
      {isSelected && (
        <mesh position={[0, -0.5, 0]}>
          <cylinderGeometry args={[1.2, 1.2, 0.1, 32]} />
          <meshBasicMaterial color="#3b82f6" transparent opacity={0.3} />
        </mesh>
      )}
    </group>
  )
}

// Advanced camera controls with mobile support
function AdvancedCameraControls({ 
  autoRotate = false,
  performanceMode = false 
}: { 
  autoRotate?: boolean
  performanceMode?: boolean 
}) {
  const controlsRef = useRef<any>()
  const { camera, gl } = useThree()
  
  useEffect(() => {
    // Mobile-specific touch controls
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    
    if (controlsRef.current) {
      controlsRef.current.enableDamping = !performanceMode
      controlsRef.current.dampingFactor = performanceMode ? 0.1 : 0.05
      controlsRef.current.autoRotate = autoRotate
      controlsRef.current.autoRotateSpeed = 0.5
      
      // Mobile optimizations
      if (isMobile) {
        controlsRef.current.enablePan = true
        controlsRef.current.enableZoom = true
        controlsRef.current.enableRotate = true
        controlsRef.current.touches = {
          ONE: THREE.TOUCH.ROTATE,
          TWO: THREE.TOUCH.DOLLY_PAN
        }
      }
    }
  }, [autoRotate, performanceMode])

  return (
    <OrbitControls
      ref={controlsRef}
      args={[camera, gl.domElement]}
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      minDistance={2}
      maxDistance={25}
      minPolarAngle={0}
      maxPolarAngle={Math.PI / 2}
    />
  )
}

// Performance monitor component
function PerformanceMonitorComponent({ 
  onMetricsUpdate 
}: { 
  onMetricsUpdate: (metrics: PerformanceMetrics) => void 
}) {
  const { gl } = useThree()
  
  useFrame(() => {
    const info = gl.info
    onMetricsUpdate({
      fps: 60, // Approximate, actual FPS would need more complex calculation
      memoryUsage: info.memory.geometries + info.memory.textures,
      drawCalls: info.render.calls,
      triangles: info.render.triangles,
      renderTime: performance.now()
    })
  })

  return null
}

// Enhanced 3D Viewer component
interface Enhanced3DViewerProps {
  template: string
  items: any[]
  isLocked: boolean
  onItemUpdate: (itemId: string, updates: any) => void
  onItemSelect: (item: any) => void
  onItemRemove: (itemId: string) => void
  performanceMode?: boolean
  showStats?: boolean
  enableShadows?: boolean
  quality?: 'low' | 'medium' | 'high'
}

export default function Enhanced3DViewer({
  template,
  items,
  isLocked,
  onItemUpdate,
  onItemSelect,
  onItemRemove,
  performanceMode = false,
  showStats = false,
  enableShadows = true,
  quality = 'medium'
}: Enhanced3DViewerProps) {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [cameraZoom, setCameraZoom] = useState(8)
  const [autoRotate, setAutoRotate] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null)
  const [renderingIssues, setRenderingIssues] = useState(false)

  // Performance settings based on device capabilities
  const performanceSettings = useMemo(() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    const pixelRatio = Math.min(window.devicePixelRatio, performanceMode ? 1.5 : 2)
    
    return {
      shadowMapSize: quality === 'high' ? 2048 : quality === 'medium' ? 1024 : 512,
      pixelRatio,
      antialias: !performanceMode && quality !== 'low',
      shadows: enableShadows && !performanceMode,
      frameloop: performanceMode ? "demand" : "always",
      powerPreference: performanceMode ? "low-power" : "high-performance",
      isMobile
    }
  }, [performanceMode, quality, enableShadows])

  // Reset camera position
  const resetCamera = useCallback(() => {
    setCameraZoom(8)
    setAutoRotate(false)
  }, [])

  // Handle performance degradation
  const handlePerformanceDegradation = useCallback(() => {
    setRenderingIssues(true)
    // Auto-enable performance mode if issues detected
    // This would trigger a prop update in the parent component
  }, [])

  return (
    <div className="w-full h-full relative overflow-hidden rounded-xl">
      {/* 3D Canvas */}
      <ErrorBoundary fallback={
        <div className="w-full h-full flex items-center justify-center bg-muted">
          <Card className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <h3 className="text-lg font-semibold mb-2">3D Rendering Error</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Unable to initialize 3D graphics. Please check your browser support.
            </p>
            <Button onClick={() => window.location.reload()}>
              Reload Page
            </Button>
          </Card>
        </div>
      }>
        <Canvas
          camera={{ 
            position: [5, 5, cameraZoom], 
            fov: 45,
            near: 0.1,
            far: 1000
          }}
          shadows={performanceSettings.shadows}
          dpr={performanceSettings.pixelRatio}
          gl={{ 
            antialias: performanceSettings.antialias,
            powerPreference: performanceSettings.powerPreference as WebGLPowerPreference,
            alpha: false,
            stencil: false,
            depth: true
          }}
          frameloop={performanceSettings.frameloop as any}
          className="bg-gradient-to-b from-sky-100 to-sky-200"
        >
          <Suspense fallback={<Enhanced3DLoader />}>
            {/* Lighting setup */}
            <ambientLight intensity={0.4} />
            <directionalLight 
              position={[10, 10, 5]} 
              intensity={0.8}
              castShadow={enableShadows}
              shadow-mapSize={[performanceSettings.shadowMapSize, performanceSettings.shadowMapSize]}
            />
            <pointLight position={[-10, -10, -5]} intensity={0.3} />

            {/* Environment */}
            <Environment preset="apartment" background={false} />
            
            {/* Floor with contact shadows */}
            {enableShadows && (
              <ContactShadows 
                position={[0, -0.5, 0]} 
                scale={30} 
                blur={2} 
                far={4} 
                resolution={512}
              />
            )}

            {/* Template model */}
            {template && (
              <Enhanced3DModel
                url={`/models/${template}.glb`}
                position={[0, 0, 0]}
                scale={1}
                performanceMode={performanceMode}
              />
            )}

            {/* Closet items */}
            <Bounds fit clip observe margin={1.2}>
              {items.map((item, index) => (
                <Enhanced3DModel
                  key={item.id}
                  url={item.modelUrl || `/models/${item.category?.toLowerCase()}.glb`}
                  position={item.position || [
                    (index % 5) * 2 - 4,
                    0.5,
                    Math.floor(index / 5) * 2 - 2
                  ]}
                  scale={0.8}
                  onClick={() => {
                    if (!isLocked) {
                      setSelectedItemId(item.id)
                      onItemSelect(item)
                    }
                  }}
                  isSelected={selectedItemId === item.id}
                  performanceMode={performanceMode}
                />
              ))}
            </Bounds>

            {/* Camera controls */}
            <AdvancedCameraControls 
              autoRotate={autoRotate}
              performanceMode={performanceMode}
            />

            {/* Performance monitoring */}
            {showStats && (
              <>
                <Stats />
                <PerformanceMonitor onDecline={handlePerformanceDegradation}>
                  <PerformanceMonitorComponent onMetricsUpdate={setPerformanceMetrics} />
                </PerformanceMonitor>
              </>
            )}
          </Suspense>
        </Canvas>
      </ErrorBoundary>

      {/* UI Controls Overlay */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-4 left-4 right-4 flex justify-between items-end"
          >
            {/* Left controls */}
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCameraZoom(prev => Math.max(prev - 2, 2))}
                className="backdrop-blur-md bg-background/80"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCameraZoom(prev => Math.min(prev + 2, 20))}
                className="backdrop-blur-md bg-background/80"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={resetCamera}
                className="backdrop-blur-md bg-background/80"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>

            {/* Center status */}
            <div className="flex gap-2">
              {performanceMode && (
                <Badge variant="secondary" className="backdrop-blur-md bg-background/80">
                  ⚡ Performance Mode
                </Badge>
              )}
              {renderingIssues && (
                <Badge variant="destructive" className="backdrop-blur-md bg-background/80">
                  ⚠️ Rendering Issues
                </Badge>
              )}
            </div>

            {/* Right controls */}
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setAutoRotate(!autoRotate)}
                className="backdrop-blur-md bg-background/80"
              >
                <RotateCcw className={`h-4 w-4 ${autoRotate ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowControls(false)}
                className="backdrop-blur-md bg-background/80"
              >
                <EyeOff className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Show controls button when hidden */}
      {!showControls && (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowControls(true)}
          className="absolute bottom-4 right-4 backdrop-blur-md bg-background/80"
        >
          <Eye className="h-4 w-4" />
        </Button>
      )}

      {/* Performance metrics overlay */}
      {showStats && performanceMetrics && (
        <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-md rounded-lg p-3 text-xs">
          <div>Draw Calls: {performanceMetrics.drawCalls}</div>
          <div>Triangles: {performanceMetrics.triangles}</div>
          <div>Memory: {performanceMetrics.memoryUsage}</div>
        </div>
      )}
    </div>
  )
} 