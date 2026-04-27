"use client"

import { Suspense, useState } from "react"
import { Canvas, useLoader } from "@react-three/fiber"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import { OrbitControls, Environment, Html } from "@react-three/drei"
import { motion, AnimatePresence } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  AlertTriangle, 
  RotateCcw, 
  Loader2,
  Download,
  CheckCircle 
} from "lucide-react"

interface Template3DModelProps {
  templateId: string
  onLoadSuccess?: () => void
  onLoadError?: (error: Error) => void
}

function Template3DModel({ templateId, onLoadSuccess, onLoadError }: Template3DModelProps) {
  const modelPath = `/models/${templateId}.glb`
  
  try {
    const gltf = useLoader(GLTFLoader, modelPath)
    
    // Call success callback
    if (onLoadSuccess) {
      onLoadSuccess()
    }
    
    return (
      <group>
        <primitive object={gltf.scene.clone()} scale={[1, 1, 1]} />
      </group>
    )
  } catch (error) {
    // Call error callback
    if (onLoadError) {
      onLoadError(error as Error)
    }
    
    // Fallback to simple geometry
    return (
      <group>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[4, 2, 6]} />
          <meshStandardMaterial color="#f3f4f6" wireframe />
        </mesh>
        <Html center>
          <div className="bg-background/90 backdrop-blur-sm rounded-lg p-3 border border-destructive/20">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">Template Load Failed</span>
            </div>
          </div>
        </Html>
      </group>
    )
  }
}

interface Enhanced3DTemplateLoaderProps {
  templateId: string
  className?: string
}

export default function Enhanced3DTemplateLoader({ 
  templateId, 
  className = "" 
}: Enhanced3DTemplateLoaderProps) {
  const [loadingState, setLoadingState] = useState<'loading' | 'loaded' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  const handleLoadSuccess = () => {
    setLoadingState('loaded')
    setError(null)
  }

  const handleLoadError = (error: Error) => {
    setLoadingState('error')
    setError(error.message)
  }

  const handleRetry = () => {
    setLoadingState('loading')
    setError(null)
    setRetryCount(prev => prev + 1)
  }

  const getTemplateInfo = (templateId: string) => {
    const templates: Record<string, { name: string; size: string; complexity: string }> = {
      'closet-template': { name: 'Modern Room', size: '1.0MB', complexity: 'Medium' },
      'closet-template1': { name: 'Walk-in Closet', size: '1.3MB', complexity: 'High' },
      'closet-template2': { name: 'Compact Closet', size: '310KB', complexity: 'Low' },
      'closet-template3': { name: 'Boutique Style', size: '29KB', complexity: 'Low' },
      'closet-template4': { name: 'Minimalist Wardrobe', size: '4.7MB', complexity: 'High' },
      'closet-template5': { name: 'Open Concept', size: '1.4MB', complexity: 'Medium' },
      'closet-template6': { name: 'Luxury Dressing Room', size: '27MB', complexity: 'Very High' },
      'closet-template7': { name: 'Vintage Armoire', size: '489KB', complexity: 'Medium' },
    }
    return templates[templateId] || { name: 'Unknown Template', size: 'Unknown', complexity: 'Unknown' }
  }

  const templateInfo = getTemplateInfo(templateId)

  return (
    <div className={`w-full h-full relative ${className}`}>
      {/* Loading State */}
      <AnimatePresence>
        {loadingState === 'loading' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-lg"
          >
            <Card className="p-6 text-center max-w-sm">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <Download className="h-5 w-5 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Loading {templateInfo.name}</h3>
                  <div className="flex gap-2 justify-center mb-2">
                    <Badge variant="outline">{templateInfo.size}</Badge>
                    <Badge variant="outline">{templateInfo.complexity}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This may take a moment depending on your connection
                  </p>
                  {retryCount > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Retry attempt {retryCount}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error State */}
      <AnimatePresence>
        {loadingState === 'error' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-lg"
          >
            <Card className="p-6 text-center max-w-sm border-destructive/20">
              <div className="flex flex-col items-center gap-4">
                <AlertTriangle className="h-12 w-12 text-destructive" />
                <div>
                  <h3 className="font-semibold mb-2 text-destructive">Template Load Failed</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {error || 'Failed to load 3D template'}
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button variant="outline" size="sm" onClick={handleRetry}>
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Retry
                    </Button>
                  </div>
                  {retryCount >= 3 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Try refreshing the page or check your internet connection
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success State Indicator */}
      <AnimatePresence>
        {loadingState === 'loaded' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute top-4 right-4 z-10"
          >
            <Badge variant="secondary" className="bg-green-50 border-green-200">
              <CheckCircle className="h-3 w-3 mr-1 text-green-600" />
              Template Loaded
            </Badge>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3D Canvas */}
      <Canvas
        className="w-full h-full"
        camera={{ position: [0, 5, 8], fov: 45 }}
        gl={{ antialias: true, alpha: false }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={0.8} />
        <pointLight position={[-10, -10, -5]} intensity={0.3} />

        <Environment preset="apartment" background={false} />

        <Suspense fallback={null}>
          <Template3DModel 
            key={`${templateId}-${retryCount}`} // Force re-render on retry
            templateId={templateId}
            onLoadSuccess={handleLoadSuccess}
            onLoadError={handleLoadError}
          />
        </Suspense>

        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={3}
          maxDistance={15}
          autoRotate={loadingState === 'loaded'}
          autoRotateSpeed={0.5}
        />
      </Canvas>
    </div>
  )
} 