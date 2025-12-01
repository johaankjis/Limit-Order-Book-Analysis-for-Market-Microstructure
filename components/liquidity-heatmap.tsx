"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { LOBRecord } from "@/lib/lob-data"

interface LiquidityHeatmapProps {
  data: LOBRecord[]
}

export function LiquidityHeatmap({ data }: LiquidityHeatmapProps) {
  const heatmapData = useMemo(() => {
    // Sample every 50th record for performance
    const sampled = data.filter((_, i) => i % 50 === 0).slice(-50)

    // Get price range
    const allPrices = sampled.flatMap((d) => [...d.bidLevels.map((l) => l.price), ...d.askLevels.map((l) => l.price)])
    const minPrice = Math.min(...allPrices)
    const maxPrice = Math.max(...allPrices)

    // Create price buckets
    const numBuckets = 20
    const priceStep = (maxPrice - minPrice) / numBuckets
    const buckets: number[][] = []

    for (let i = 0; i < sampled.length; i++) {
      const row: number[] = new Array(numBuckets).fill(0)
      const snapshot = sampled[i]
      ;[...snapshot.bidLevels, ...snapshot.askLevels].forEach((level) => {
        const bucketIndex = Math.floor((level.price - minPrice) / priceStep)
        if (bucketIndex >= 0 && bucketIndex < numBuckets) {
          row[bucketIndex] += level.size
        }
      })

      buckets.push(row)
    }

    // Normalize
    const maxVol = Math.max(...buckets.flat())

    return {
      buckets,
      maxVol,
      minPrice,
      maxPrice,
      priceStep,
      timestamps: sampled.map((d) => d.timestamp),
    }
  }, [data])

  const getColor = (value: number, max: number) => {
    const intensity = value / max
    if (intensity < 0.2) return "bg-blue-950"
    if (intensity < 0.4) return "bg-blue-900"
    if (intensity < 0.6) return "bg-blue-700"
    if (intensity < 0.8) return "bg-blue-500"
    return "bg-blue-400"
  }

  const imbalanceHeatmap = useMemo(() => {
    const sampled = data.filter((_, i) => i % 20 === 0).slice(-100)
    return sampled.map((d) => ({
      timestamp: d.timestamp,
      imbalance: d.orderImbalance,
      spread: d.spread,
      volatility: d.volatility,
    }))
  }, [data])

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Main Liquidity Heatmap */}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="text-base">Liquidity Heatmap</CardTitle>
          <p className="text-xs text-muted-foreground">Order book depth across price levels over time</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Heatmap Grid */}
            <div className="overflow-x-auto">
              <div className="flex gap-px" style={{ minWidth: "100%" }}>
                {heatmapData.buckets.map((row, timeIdx) => (
                  <div key={timeIdx} className="flex flex-col gap-px">
                    {row.map((value, priceIdx) => (
                      <div
                        key={priceIdx}
                        className={`h-3 w-3 rounded-sm ${getColor(value, heatmapData.maxVol)}`}
                        title={`Vol: ${value.toLocaleString()}`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Low</span>
                <div className="flex gap-0.5">
                  <div className="h-3 w-6 rounded-sm bg-blue-950" />
                  <div className="h-3 w-6 rounded-sm bg-blue-900" />
                  <div className="h-3 w-6 rounded-sm bg-blue-700" />
                  <div className="h-3 w-6 rounded-sm bg-blue-500" />
                  <div className="h-3 w-6 rounded-sm bg-blue-400" />
                </div>
                <span className="text-xs text-muted-foreground">High</span>
              </div>
              <span className="text-xs text-muted-foreground">
                Price: ${heatmapData.minPrice.toFixed(2)} - ${heatmapData.maxPrice.toFixed(2)}
              </span>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 rounded-lg bg-muted/50 p-3">
              <div>
                <span className="text-xs text-muted-foreground">Max Volume</span>
                <p className="font-mono text-sm font-medium">{heatmapData.maxVol.toLocaleString()}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Price Range</span>
                <p className="font-mono text-sm font-medium">
                  ${(heatmapData.maxPrice - heatmapData.minPrice).toFixed(2)}
                </p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Time Samples</span>
                <p className="font-mono text-sm font-medium">{heatmapData.buckets.length}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order Flow Imbalance Heatmap */}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="text-base">Order Flow Dynamics</CardTitle>
          <p className="text-xs text-muted-foreground">Imbalance, spread, and volatility over time</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Imbalance Strip */}
            <div>
              <p className="mb-2 text-xs text-muted-foreground">Order Imbalance (Buy vs Sell Pressure)</p>
              <div className="flex gap-px rounded-lg overflow-hidden">
                {imbalanceHeatmap.map((d, i) => {
                  const color =
                    d.imbalance > 0.3
                      ? "bg-accent"
                      : d.imbalance > 0.1
                        ? "bg-accent/60"
                        : d.imbalance < -0.3
                          ? "bg-destructive"
                          : d.imbalance < -0.1
                            ? "bg-destructive/60"
                            : "bg-muted-foreground/30"
                  return (
                    <div
                      key={i}
                      className={`h-6 flex-1 ${color}`}
                      title={`Imbalance: ${(d.imbalance * 100).toFixed(1)}%`}
                    />
                  )
                })}
              </div>
              <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                <span>Sell Pressure</span>
                <span>Buy Pressure</span>
              </div>
            </div>

            {/* Spread Strip */}
            <div>
              <p className="mb-2 text-xs text-muted-foreground">Bid-Ask Spread (Liquidity Tightness)</p>
              <div className="flex gap-px rounded-lg overflow-hidden">
                {imbalanceHeatmap.map((d, i) => {
                  const avgSpread = imbalanceHeatmap.reduce((sum, x) => sum + x.spread, 0) / imbalanceHeatmap.length
                  const ratio = d.spread / avgSpread
                  const color =
                    ratio > 1.5
                      ? "bg-warning"
                      : ratio > 1.2
                        ? "bg-warning/60"
                        : ratio < 0.8
                          ? "bg-primary"
                          : "bg-primary/40"
                  return <div key={i} className={`h-6 flex-1 ${color}`} title={`Spread: $${d.spread.toFixed(4)}`} />
                })}
              </div>
              <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                <span>Tight</span>
                <span>Wide</span>
              </div>
            </div>

            {/* Volatility Strip */}
            <div>
              <p className="mb-2 text-xs text-muted-foreground">Realized Volatility</p>
              <div className="flex gap-px rounded-lg overflow-hidden">
                {imbalanceHeatmap.map((d, i) => {
                  const avgVol = imbalanceHeatmap.reduce((sum, x) => sum + x.volatility, 0) / imbalanceHeatmap.length
                  const ratio = d.volatility / avgVol
                  const color =
                    ratio > 2
                      ? "bg-destructive"
                      : ratio > 1.5
                        ? "bg-warning"
                        : ratio < 0.5
                          ? "bg-accent/40"
                          : "bg-accent/70"
                  return (
                    <div
                      key={i}
                      className={`h-6 flex-1 ${color}`}
                      title={`Vol: ${(d.volatility * 10000).toFixed(2)} bps`}
                    />
                  )
                })}
              </div>
              <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                <span>Low Vol</span>
                <span>High Vol</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
