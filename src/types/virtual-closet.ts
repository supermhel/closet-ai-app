export interface ClosetItem {
  id: string
  name: string
  category: string
  brand?: string
  size?: string
  colors: string[]
  tags: string[]
  seasons: string[]
  occasions: string[]
  imageUrl: string
  modelUrl?: string
  
  // 3D positioning properties
  position?: {
    x: number
    y: number
    z: number
  }
  rotation?: {
    x: number
    y: number
    z: number
  }
  scale?: {
    x: number
    y: number
    z: number
  }
  placed?: boolean
  
  // Analytics properties
  lastUsed?: Date
  usageCount: number
  accessibility?: 'easy' | 'moderate' | 'difficult'
  
  // Physical dimensions for space analysis
  size3D?: {
    width: number
    height: number
    depth: number
  }
}

export interface VirtualClosetLayout {
  id: string
  userId: string
  name: string
  templateId: string
  items: ClosetItem[]
  createdAt: Date
  updatedAt: Date
  isDefault?: boolean
  thumbnail?: string
}

export interface VirtualClosetLayoutDTO {
  id?: string
  userId: string
  name: string
  templateId: string
  items: ClosetItem[]
  createdAt: string
  updatedAt: string
  isDefault?: boolean
  thumbnail?: string
}

export interface ClosetStats {
  totalItems: number
  placedItems: number
  mostCommonColor: string
  mostCommonCategory: string
  categoryDistribution: Record<string, number>
  colorDistribution: Record<string, number>
  seasonalDistribution: Record<string, number>
  spaceUtilization?: number
  organizationScore?: number
  accessibilityScore?: number
}

export interface ClosetTemplate {
  id: string
  name: string
  type: string
  thumbnailUrl?: string
  modelPath: string
  dimensions: {
    width: number
    height: number
    depth: number
  }
  isNew?: boolean
}

export interface Position3D {
  x: number
  y: number
  z: number
}

export interface Rotation3D {
  x: number
  y: number
  z: number
}

export interface Scale3D {
  x: number
  y: number
  z: number
}

export interface ClosetInteraction {
  type: 'select' | 'move' | 'rotate' | 'scale' | 'delete'
  itemId: string
  position?: Position3D
  rotation?: Rotation3D
  scale?: Scale3D
  timestamp: Date
}

export interface ClosetAnalytics {
  userId: string
  layoutId?: string
  interactions: ClosetInteraction[]
  sessionDuration: number
  itemsPlaced: number
  itemsRemoved: number
  templatesViewed: string[]
  createdAt: Date
} 