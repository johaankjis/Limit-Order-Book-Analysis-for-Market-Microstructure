"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MetricsPanel } from "./metrics-panel"
import { OrderBookView } from "./order-book-view"
import { LiquidityHeatmap } from "./liquidity-heatmap"
import { VolatilitySurface } from "./volatility-surface"
import { PredictionChart } from "./prediction-chart"
import { FeatureAnalysis } from "./feature-analysis"
import {
  generateLOBData,
  calculateFeatures,
  runTimeSeriesAnalysis,
  type LOBRecord,
  type FeatureRecord,
  type AnalysisResults,
} from "@/lib/lob-data"
import { BarChart3, Layers, LineChart, Activity, TrendingUp, Database } from "lucide-react"

export function LOBDashboard() {
  const [lobData, setLobData] = useState<LOBRecord[]>([])
  const [features, setFeatures] = useState<FeatureRecord[]>([])
  const [analysisResults, setAnalysisResults] = useState<AnalysisResults | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [dataStats, setDataStats] = useState({
    totalRecords: 0,
    avgSpread: 0,
    avgVolatility: 0,
    priceRange: { min: 0, max: 0 },
  })

  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true)

      // Generate synthetic LOB data
      const data = generateLOBData(5000)
      setLobData(data)

      // Calculate features
      const featureData = calculateFeatures(data)
      setFeatures(featureData)

      // Run analysis
      const results = runTimeSeriesAnalysis(featureData)
      setAnalysisResults(results)

      // Calculate stats
      const prices = data.map((d) => d.midPrice)
      const spreads = data.map((d) => d.spread)
      const vols = data.map((d) => d.volatility)

      setDataStats({
        totalRecords: data.length,
        avgSpread: spreads.reduce((a, b) => a + b, 0) / spreads.length,
        avgVolatility: vols.reduce((a, b) => a + b, 0) / vols.length,
        priceRange: { min: Math.min(...prices), max: Math.max(...prices) },
      })

      setIsLoading(false)
    }

    initializeData()
  }, [])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Generating 5,000 tick-level records...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-sm">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <BarChart3 className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">LOB Analysis</h1>
              <p className="text-xs text-muted-foreground">Market Microstructure Research</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 animate-pulse rounded-full bg-accent" />
              <span className="text-sm text-muted-foreground">Live</span>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">AAPL</p>
              <p className="text-xs text-muted-foreground">{dataStats.totalRecords.toLocaleString()} ticks</p>
            </div>
          </div>
        </div>
      </header>

      {/* Metrics */}
      <div className="p-6">
        <MetricsPanel data={lobData} features={features} analysisResults={analysisResults} stats={dataStats} />
      </div>

      {/* Main Content */}
      <div className="px-6 pb-6">
        <Tabs defaultValue="orderbook" className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-5 bg-muted">
            <TabsTrigger value="orderbook" className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              <span className="hidden sm:inline">Order Book</span>
            </TabsTrigger>
            <TabsTrigger value="heatmap" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <span className="hidden sm:inline">Liquidity</span>
            </TabsTrigger>
            <TabsTrigger value="volatility" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Volatility</span>
            </TabsTrigger>
            <TabsTrigger value="prediction" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Prediction</span>
            </TabsTrigger>
            <TabsTrigger value="features" className="flex items-center gap-2">
              <LineChart className="h-4 w-4" />
              <span className="hidden sm:inline">Features</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orderbook" className="space-y-6">
            <OrderBookView data={lobData} />
          </TabsContent>

          <TabsContent value="heatmap" className="space-y-6">
            <LiquidityHeatmap data={lobData} />
          </TabsContent>

          <TabsContent value="volatility" className="space-y-6">
            <VolatilitySurface data={lobData} analysisResults={analysisResults} />
          </TabsContent>

          <TabsContent value="prediction" className="space-y-6">
            <PredictionChart features={features} analysisResults={analysisResults} />
          </TabsContent>

          <TabsContent value="features" className="space-y-6">
            <FeatureAnalysis features={features} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
