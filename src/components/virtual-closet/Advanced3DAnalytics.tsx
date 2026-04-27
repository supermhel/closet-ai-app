"use client"

import { useState, useMemo, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart3,
  TrendingUp,
  Zap,
  Target,
  MapPin,
  Clock,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Maximize,
  Minimize,
  Palette,
  Shirt,
  Calendar
} from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts'

interface ClosetItem {
  id: string
  name: string
  category: string
  colors: string[]
  position: { x: number; y: number; z: number }
  lastUsed?: Date
  usageCount: number
  accessibility: 'easy' | 'moderate' | 'difficult'
  size: { width: number; height: number; depth: number }
}

interface SpaceAnalysis {
  totalSpace: number
  usedSpace: number
  efficiency: number
  accessibilityScore: number
  organizationScore: number
  recommendations: string[]
}

interface Advanced3DAnalyticsProps {
  items: ClosetItem[]
  templateDimensions: { width: number; height: number; depth: number }
  onOptimizationApply: (suggestions: OptimizationSuggestion[]) => void
}

interface OptimizationSuggestion {
  id: string
  type: 'position' | 'grouping' | 'accessibility' | 'space'
  title: string
  description: string
  impact: 'low' | 'medium' | 'high'
  itemsAffected: string[]
  newPositions?: Record<string, { x: number; y: number; z: number }>
}

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316']

export default function Advanced3DAnalytics({ 
  items, 
  templateDimensions, 
  onOptimizationApply 
}: Advanced3DAnalyticsProps) {
  const [expanded, setExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const [showOptimizations, setShowOptimizations] = useState(false)

  // Calculate comprehensive space analysis
  const spaceAnalysis = useMemo((): SpaceAnalysis => {
    const totalSpace = templateDimensions.width * templateDimensions.height * templateDimensions.depth
    const usedSpace = items.reduce((acc, item) => 
      acc + (item.size.width * item.size.height * item.size.depth), 0
    )

    // Calculate accessibility score (0-100)
    const accessibilityScore = items.reduce((acc, item) => {
      const distance = Math.sqrt(
        item.position.x ** 2 + item.position.z ** 2
      )
      const heightPenalty = item.position.y > 1.5 ? 0.7 : 1
      const accessibility = Math.max(0, 100 - (distance * 10)) * heightPenalty
      return acc + accessibility
    }, 0) / items.length

    // Calculate organization score based on category grouping
    const categoryGroups = items.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = []
      acc[item.category].push(item.position)
      return acc
    }, {} as Record<string, Array<{ x: number; y: number; z: number }>>)

    const organizationScore = Object.values(categoryGroups).reduce((acc, positions) => {
      if (positions.length < 2) return acc + 100
      const avgDistance = positions.reduce((sum, pos, i) => {
        const others = positions.slice(i + 1)
        const distances = others.map(other => 
          Math.sqrt((pos.x - other.x) ** 2 + (pos.z - other.z) ** 2)
        )
        return sum + (distances.reduce((a, b) => a + b, 0) / distances.length || 0)
      }, 0) / positions.length
      return acc + Math.max(0, 100 - avgDistance * 20)
    }, 0) / Object.keys(categoryGroups).length

    // Generate recommendations
    const recommendations = []
    if (accessibilityScore < 70) {
      recommendations.push("Move frequently used items to more accessible positions")
    }
    if (organizationScore < 60) {
      recommendations.push("Group similar items together for better organization")
    }
    if (usedSpace / totalSpace > 0.8) {
      recommendations.push("Consider decluttering or using vertical space more efficiently")
    }
    if (usedSpace / totalSpace < 0.3) {
      recommendations.push("You have plenty of space for new items")
    }

    return {
      totalSpace,
      usedSpace,
      efficiency: (usedSpace / totalSpace) * 100,
      accessibilityScore,
      organizationScore,
      recommendations
    }
  }, [items, templateDimensions])

  // Usage analytics
  const usageAnalytics = useMemo(() => {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const recentlyUsed = items.filter(item => 
      item.lastUsed && item.lastUsed > thirtyDaysAgo
    ).length

    const neverUsed = items.filter(item => !item.lastUsed || item.usageCount === 0).length

    const categoryUsage = items.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = { total: 0, used: 0 }
      }
      acc[item.category].total++
      if (item.usageCount > 0) {
        acc[item.category].used++
      }
      return acc
    }, {} as Record<string, { total: number; used: number }>)

    const usageData = Object.entries(categoryUsage).map(([category, data]) => ({
      category,
      utilization: (data.used / data.total) * 100,
      total: data.total,
      used: data.used
    }))

    return {
      recentlyUsed,
      neverUsed,
      totalItems: items.length,
      utilizationRate: (recentlyUsed / items.length) * 100,
      categoryUsage: usageData
    }
  }, [items])

  // Color distribution analysis
  const colorAnalysis = useMemo(() => {
    const colorCounts = items.reduce((acc, item) => {
      item.colors.forEach(color => {
        acc[color] = (acc[color] || 0) + 1
      })
      return acc
    }, {} as Record<string, number>)

    return Object.entries(colorCounts)
      .map(([color, count]) => ({ color, count, percentage: (count / items.length) * 100 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
  }, [items])

  // Generate optimization suggestions
  const optimizationSuggestions = useMemo((): OptimizationSuggestion[] => {
    const suggestions: OptimizationSuggestion[] = []

    // Accessibility optimization
    const hardToReachItems = items.filter(item => {
      const distance = Math.sqrt(item.position.x ** 2 + item.position.z ** 2)
      return distance > 3 || item.position.y > 2
    })

    if (hardToReachItems.length > 0) {
      suggestions.push({
        id: 'accessibility',
        type: 'accessibility',
        title: 'Improve Item Accessibility',
        description: `Move ${hardToReachItems.length} items to more accessible positions`,
        impact: 'high',
        itemsAffected: hardToReachItems.map(item => item.id),
        newPositions: hardToReachItems.reduce((acc, item, index) => {
          acc[item.id] = {
            x: (index % 3) - 1,
            y: 0.5,
            z: Math.floor(index / 3) - 1
          }
          return acc
        }, {} as Record<string, { x: number; y: number; z: number }>)
      })
    }

    // Category grouping optimization
    const categories = [...new Set(items.map(item => item.category))]
    const ungroupedCategories = categories.filter(category => {
      const categoryItems = items.filter(item => item.category === category)
      if (categoryItems.length < 2) return false
      
      const avgDistance = categoryItems.reduce((sum, item, i) => {
        const others = categoryItems.slice(i + 1)
        const distances = others.map(other => 
          Math.sqrt((item.position.x - other.position.x) ** 2 + (item.position.z - other.position.z) ** 2)
        )
        return sum + (distances.reduce((a, b) => a + b, 0) / distances.length || 0)
      }, 0) / categoryItems.length

      return avgDistance > 2
    })

    if (ungroupedCategories.length > 0) {
      suggestions.push({
        id: 'grouping',
        type: 'grouping',
        title: 'Organize by Category',
        description: `Group ${ungroupedCategories.join(', ')} items together`,
        impact: 'medium',
        itemsAffected: items.filter(item => ungroupedCategories.includes(item.category)).map(item => item.id)
      })
    }

    // Space utilization optimization
    if (spaceAnalysis.efficiency < 30) {
      suggestions.push({
        id: 'space',
        type: 'space',
        title: 'Optimize Space Usage',
        description: 'Compact items to use space more efficiently',
        impact: 'medium',
        itemsAffected: items.map(item => item.id)
      })
    }

    return suggestions
  }, [items, spaceAnalysis])

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            3D Closet Analytics
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowOptimizations(!showOptimizations)}
            >
              <Lightbulb className="h-4 w-4 mr-2" />
              Optimize ({optimizationSuggestions.length})
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 rounded-lg bg-blue-50 border">
            <div className="flex items-center justify-between mb-2">
              <Maximize className="h-4 w-4 text-blue-600" />
              <Badge variant="secondary">{spaceAnalysis.efficiency.toFixed(1)}%</Badge>
            </div>
            <p className="text-sm font-medium text-blue-900">Space Efficiency</p>
            <Progress value={spaceAnalysis.efficiency} className="mt-2" />
          </div>

          <div className="p-4 rounded-lg bg-green-50 border">
            <div className="flex items-center justify-between mb-2">
              <Target className="h-4 w-4 text-green-600" />
              <Badge variant="secondary">{spaceAnalysis.accessibilityScore.toFixed(0)}%</Badge>
            </div>
            <p className="text-sm font-medium text-green-900">Accessibility</p>
            <Progress value={spaceAnalysis.accessibilityScore} className="mt-2" />
          </div>

          <div className="p-4 rounded-lg bg-purple-50 border">
            <div className="flex items-center justify-between mb-2">
              <Shirt className="h-4 w-4 text-purple-600" />
              <Badge variant="secondary">{usageAnalytics.utilizationRate.toFixed(0)}%</Badge>
            </div>
            <p className="text-sm font-medium text-purple-900">Usage Rate</p>
            <Progress value={usageAnalytics.utilizationRate} className="mt-2" />
          </div>

          <div className="p-4 rounded-lg bg-orange-50 border">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-4 w-4 text-orange-600" />
              <Badge variant="secondary">{spaceAnalysis.organizationScore.toFixed(0)}%</Badge>
            </div>
            <p className="text-sm font-medium text-orange-900">Organization</p>
            <Progress value={spaceAnalysis.organizationScore} className="mt-2" />
          </div>
        </div>

        {/* Optimization Suggestions */}
        <AnimatePresence>
          {showOptimizations && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-6 p-4 bg-muted/50 rounded-lg"
            >
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Optimization Suggestions
              </h3>
              <div className="space-y-3">
                {optimizationSuggestions.map((suggestion) => (
                  <div key={suggestion.id} className="flex items-center justify-between p-3 bg-background rounded border">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge 
                          variant={suggestion.impact === 'high' ? 'destructive' : suggestion.impact === 'medium' ? 'default' : 'secondary'}
                        >
                          {suggestion.impact} impact
                        </Badge>
                        <h4 className="font-medium">{suggestion.title}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => onOptimizationApply([suggestion])}
                    >
                      Apply
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                ))}
                {optimizationSuggestions.length > 1 && (
                  <Button 
                    variant="default" 
                    className="w-full"
                    onClick={() => onOptimizationApply(optimizationSuggestions)}
                  >
                    Apply All Optimizations
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Expanded Analytics */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="usage">Usage</TabsTrigger>
                  <TabsTrigger value="colors">Colors</TabsTrigger>
                  <TabsTrigger value="space">Space</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Quick Stats</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Total Items:</span>
                          <span className="font-medium">{items.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Recently Used:</span>
                          <span className="font-medium">{usageAnalytics.recentlyUsed}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Never Used:</span>
                          <span className="font-medium text-muted-foreground">{usageAnalytics.neverUsed}</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Recommendations</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {spaceAnalysis.recommendations.map((rec, index) => (
                            <div key={index} className="flex items-start gap-2 text-sm">
                              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span>{rec}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="usage" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Category Utilization</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={usageAnalytics.categoryUsage}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="category" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="utilization" fill="#3b82f6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="colors" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Color Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={colorAnalysis}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ color, percentage }) => `${color} ${percentage.toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="count"
                          >
                            {colorAnalysis.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="space" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Space Utilization</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Used Space</span>
                              <span>{spaceAnalysis.efficiency.toFixed(1)}%</span>
                            </div>
                            <Progress value={spaceAnalysis.efficiency} />
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {spaceAnalysis.usedSpace.toFixed(1)} / {spaceAnalysis.totalSpace.toFixed(1)} cubic units
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Accessibility Heatmap</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center text-sm text-muted-foreground">
                          3D heatmap visualization would be rendered here
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
} 