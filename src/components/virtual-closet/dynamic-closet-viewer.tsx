"use client"

import { Suspense } from "react"
import dynamic from "next/dynamic"

// Loading component
const Loading3DViewer = () => (
  <div className="w-full h-full flex items-center justify-center bg-muted/30 rounded-lg">
    <div className="flex flex-col items-center p-6 bg-background shadow-lg rounded-xl border">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
      <p className="text-sm text-muted-foreground max-w-xs text-center">Loading 3D viewer... This may take a moment.</p>
    </div>
  </div>
)

// Dynamically import the 3D viewer
const VirtualClosetViewer = dynamic(() => import("./virtual-closet-viewer"), {
  loading: () => <Loading3DViewer />,
  ssr: false,
})

interface DynamicClosetViewerProps {
  template: string
  items: any[]
  isLocked: boolean
  onItemUpdate: (itemId: string, updates: any) => void
  onItemSelect: (item: any) => void
  onItemRemove: (itemId: string) => void
}

export default function DynamicClosetViewer(props: DynamicClosetViewerProps) {
  return (
    <Suspense fallback={<Loading3DViewer />}>
      <VirtualClosetViewer {...props} />
    </Suspense>
  )
}
