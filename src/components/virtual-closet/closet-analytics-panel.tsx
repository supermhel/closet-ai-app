"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { PieChart, BarChart, Sparkles, TrendingUp, ChevronDown, ChevronUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

import type { ClosetItem } from "@/types/virtual-closet"

interface ClosetAnalyticsPanelProps {
  stats: {
    totalItems: number
    placedItems: number
    mostCommonColor: string
    mostCommonCategory: string
    categoryDistribution: Record<string, number>
    colorDistribution: Record<string, number>
    seasonalDistribution: Record<string, number>
  }
  items?: ClosetItem[]
}

export default function ClosetAnalyticsPanel({ stats, items = [] }: ClosetAnalyticsPanelProps) {
  const [expanded, setExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  
  // Calculate additional analytics from items
  const utilizationRate = stats.totalItems > 0 ? (stats.placedItems / stats.totalItems) * 100 : 0
  const recentlyUsed = items.filter(item => {
    if (!item.lastUsed) return false
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    return item.lastUsed > thirtyDaysAgo
  }).length
  
  const organizationScore = stats.placedItems > 0 ? 
    Math.min(100, (stats.placedItems / Math.max(stats.totalItems, 1)) * 100 + 
    (Object.keys(stats.categoryDistribution).length * 10)) : 0

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Closet Analytics
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-4">
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground">Total Items</p>
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <p className="text-xl font-bold text-primary">{stats.totalItems}</p>
          </div>

          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground">Placed</p>
              <PieChart className="h-4 w-4 text-secondary" />
            </div>
            <p className="text-xl font-bold text-secondary">{stats.placedItems}</p>
          </div>

          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground">Top Category</p>
              <BarChart className="h-4 w-4 text-accent" />
            </div>
            <p className="text-sm font-bold text-accent">{stats.mostCommonCategory || "N/A"}</p>
          </div>

          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground">Top Color</p>
              <div className="w-4 h-4 rounded-full bg-primary" />
            </div>
            <p className="text-sm font-bold">{stats.mostCommonColor || "N/A"}</p>
          </div>

          <div className="p-3 rounded-lg bg-orange-50 border">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground">Utilization</p>
              <TrendingUp className="h-4 w-4 text-orange-600" />
            </div>
            <p className="text-sm font-bold">{utilizationRate.toFixed(0)}%</p>
          </div>

          <div className="p-3 rounded-lg bg-purple-50 border">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground">Organization</p>
              <Sparkles className="h-4 w-4 text-purple-600" />
            </div>
            <p className="text-sm font-bold">{organizationScore.toFixed(0)}%</p>
          </div>
        </div>

        {/* Expanded Details */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              {/* Tabs */}
              <div className="flex gap-1 mb-4 p-1 bg-muted rounded-lg">
                <Button
                  variant={activeTab === "overview" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab("overview")}
                >
                  Overview
                </Button>
                <Button
                  variant={activeTab === "categories" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab("categories")}
                >
                  Categories
                </Button>
                <Button
                  variant={activeTab === "usage" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab("usage")}
                >
                  Usage
                </Button>
              </div>

              {/* Tab Content */}
              <div className="space-y-4">
                {activeTab === "overview" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <h4 className="text-base font-medium mb-3 flex items-center gap-2">
                      <BarChart className="h-4 w-4 text-primary" />
                      Category Distribution
                    </h4>

                    <div className="space-y-2">
                      {Object.entries(stats.categoryDistribution).map(([category, count]) => (
                        <div key={category} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium capitalize">{category}</span>
                            <span className="text-muted-foreground">{count}</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <motion.div
                              className="h-full bg-primary rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${(count / stats.totalItems) * 100}%` }}
                              transition={{ duration: 0.7, delay: 0.1 }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {activeTab === "categories" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <h4 className="text-base font-medium mb-3">Category Breakdown</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(stats.categoryDistribution).map(([category, count]) => (
                        <div key={category} className="p-2 bg-muted rounded-md">
                          <div className="text-sm font-medium capitalize">{category}</div>
                          <div className="text-xs text-muted-foreground">{count} items</div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {activeTab === "usage" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <h4 className="text-base font-medium mb-3">Usage Statistics</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Placement Rate</span>
                        <Badge variant="outline">{Math.round((stats.placedItems / stats.totalItems) * 100)}%</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Most Used Category</span>
                        <Badge variant="secondary">{stats.mostCommonCategory}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Dominant Color</span>
                        <Badge variant="outline">{stats.mostCommonColor}</Badge>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}
