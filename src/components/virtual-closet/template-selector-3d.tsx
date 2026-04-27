"use client"

import React, { Suspense } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, useGLTF } from "@react-three/drei"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

// Define the structure for a single template option
interface TemplateOption {
  id: string
  name: string
  type: string
  modelPath: string // Path to the 3D model in /public
  isNew?: boolean
}

// Props for the main TemplateSelector3D component
interface TemplateSelector3DProps {
  options: TemplateOption[]
  selectedTemplate: string
  onSelect: (id: string) => void
}

// A component to load and display a 3D model
function Model({ path }: { path: string }) {
  // useGLTF pre-loads and caches the model for performance
  const { scene } = useGLTF(path)
  // Scale the model down to fit in the preview card
  return <primitive object={scene} scale={0.1} />
}

// A small, self-contained 3D viewer for a single template
function TemplatePreview({ modelPath }: { modelPath: string }) {
  return (
    <div className="w-full h-40 rounded-t-lg bg-gray-200 dark:bg-gray-800">
      <Canvas>
        <Suspense fallback={null}>
          <ambientLight intensity={1.5} />
          <directionalLight position={[10, 10, 5]} intensity={2} />
          <Model path={modelPath} />
          <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={1.5} />
        </Suspense>
      </Canvas>
    </div>
  )
}

// The main component that renders the grid of template options
export default function TemplateSelector3D({ options, selectedTemplate, onSelect }: TemplateSelector3DProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {options.map((option) => (
        <Card
          key={option.id}
          onClick={() => onSelect(option.id)}
          className={`cursor-pointer transition-all duration-200 ${selectedTemplate === option.id ? "ring-2 ring-primary shadow-lg" : "hover:shadow-md"}`}
        >
          <CardContent className="p-0">
            <TemplatePreview modelPath={option.modelPath} />
            <div className="p-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-md">{option.name}</h3>
                {option.isNew && <Badge variant="secondary">New</Badge>}
              </div>
              <p className="text-sm text-muted-foreground">{option.type}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
