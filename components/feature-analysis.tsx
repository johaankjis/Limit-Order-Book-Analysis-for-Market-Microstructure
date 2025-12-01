"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { FeatureRecord } from "@/lib/lob-data"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ScatterChart, Scatter, ZAxis } from "recharts"

interface FeatureAnalysisProps {
  features: FeatureRecord[]
}

export function FeatureAnalysis({ features }: FeatureAnalysisProps) {
  const timeSeriesData = useMemo(() => {
    return features
      .filter((_, i) => i % 10 === 0)
      .slice(-200)
      .map((f, i) => ({
        index: i,
        ofi: f.orderFlowImbalance * 100,
        depthImbalance: f.depthImbalance * 100,
        momentum: f.priceMomentum * 10000,
        spread: f.spread * 100,
      }))
  }, [features])

  const correlationData = useMemo(() => {
    // OFI vs Future Return correlation
    return features.slice(-500).map((f) => ({
      ofi: f.orderFlowImbalance * 100,
      futureReturn: f.futureReturn * 10000,
      depth: f.depthImbalance * 100,
    }))
  }, [features])

  const featureStats = useMemo(() => {
    const calc = (arr: number[]) => {
      const mean = arr.reduce((a, b) => a + b, 0) / arr.length
      const std = Math.sqrt(arr.reduce((s, v) => s + (v - mean) ** 2, 0) / arr.length)
      return { mean, std, min: Math.min(...arr), max: Math.max(...arr) }
    }

    return {
      ofi: calc(features.map((f) => f.orderFlowImbalance * 100)),
      depth: calc(features.map((f) => f.depthImbalance * 100)),
      momentum: calc(features.map((f) => f.priceMomentum * 10000)),
      spread: calc(features.map((f) => f.spread * 100)),
    }
  }, [features])

  // Calculate feature importance (simplified correlation with future return)
  const featureImportance = useMemo(() => {
    const correlate = (x: number[], y: number[]) => {
      const n = Math.min(x.length, y.length)
      const meanX = x.slice(0, n).reduce((a, b) => a + b, 0) / n
      const meanY = y.slice(0, n).reduce((a, b) => a + b, 0) / n

      let num = 0
      let denX = 0
      let denY = 0

      for (let i = 0; i < n; i++) {
        const dx = x[i] - meanX
        const dy = y[i] - meanY
        num += dx * dy
        denX += dx * dx
        denY += dy * dy
      }

      return denX && denY ? num / Math.sqrt(denX * denY) : 0
    }

    const futureReturns = features.map((f) => f.futureReturn)

    return [
      {
        name: "Order Flow Imbalance",
        importance: Math.abs(
          correlate(
            features.map((f) => f.orderFlowImbalance),
            futureReturns,
          ),
        ),
      },
      {
        name: "Depth Imbalance",
        importance: Math.abs(
          correlate(
            features.map((f) => f.depthImbalance),
            futureReturns,
          ),
        ),
      },
      {
        name: "Price Momentum",
        importance: Math.abs(
          correlate(
            features.map((f) => f.priceMomentum),
            futureReturns,
          ),
        ),
      },
      {
        name: "Spread",
        importance: Math.abs(
          correlate(
            features.map((f) => f.spread),
            futureReturns,
          ),
        ),
      },
      {
        name: "Volatility",
        importance: Math.abs(
          correlate(
            features.map((f) => f.volatility),
            futureReturns,
          ),
        ),
      },
    ].sort((a, b) => b.importance - a.importance)
  }, [features])

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Feature Time Series */}
      <Card className="bg-card lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Microstructure Features</CardTitle>
          <p className="text-xs text-muted-foreground">
            Order flow imbalance, depth imbalance, and price momentum over time
          </p>
        </CardHeader>
        <CardContent>
          <div style={{ width: "100%", height: 288, minHeight: 288 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeSeriesData}>
                <XAxis dataKey="index" tick={{ fontSize: 10, fill: "#71717a" }} axisLine={{ stroke: "#27272a" }} />
                <YAxis tick={{ fontSize: 10, fill: "#71717a" }} axisLine={{ stroke: "#27272a" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#18181b",
                    border: "1px solid #27272a",
                    borderRadius: "8px",
                  }}
                />
                <Line type="monotone" dataKey="ofi" stroke="#3b82f6" strokeWidth={1.5} dot={false} name="OFI (%)" />
                <Line
                  type="monotone"
                  dataKey="depthImbalance"
                  stroke="#10b981"
                  strokeWidth={1.5}
                  dot={false}
                  name="Depth Imb. (%)"
                />
                <Line
                  type="monotone"
                  dataKey="momentum"
                  stroke="#f59e0b"
                  strokeWidth={1.5}
                  dot={false}
                  name="Momentum (bps)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* OFI vs Future Return Scatter */}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="text-base">OFI vs Future Return</CardTitle>
          <p className="text-xs text-muted-foreground">Correlation between order flow and price movement</p>
        </CardHeader>
        <CardContent>
          <div style={{ width: "100%", height: 224, minHeight: 224 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <XAxis
                  dataKey="ofi"
                  name="OFI"
                  tick={{ fontSize: 10, fill: "#71717a" }}
                  axisLine={{ stroke: "#27272a" }}
                  label={{
                    value: "OFI (%)",
                    position: "bottom",
                    style: { fontSize: 10, fill: "#71717a" },
                  }}
                />
                <YAxis
                  dataKey="futureReturn"
                  name="Return"
                  tick={{ fontSize: 10, fill: "#71717a" }}
                  axisLine={{ stroke: "#27272a" }}
                  label={{
                    value: "Return (bps)",
                    angle: -90,
                    position: "insideLeft",
                    style: { fontSize: 10, fill: "#71717a" },
                  }}
                />
                <ZAxis range={[10, 50]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#18181b",
                    border: "1px solid #27272a",
                    borderRadius: "8px",
                  }}
                  formatter={(v: number) => [v.toFixed(2), ""]}
                />
                <Scatter data={correlationData} fill="#3b82f6" fillOpacity={0.5} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Feature Importance */}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="text-base">Feature Importance</CardTitle>
          <p className="text-xs text-muted-foreground">Correlation with future returns</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {featureImportance.map((f, i) => (
              <div key={f.name} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{f.name}</span>
                  <span className="font-mono">{(f.importance * 100).toFixed(1)}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${f.importance * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Feature Statistics */}
      <Card className="bg-card lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Feature Statistics</CardTitle>
          <p className="text-xs text-muted-foreground">Summary statistics for engineered features</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 font-medium text-muted-foreground">Feature</th>
                  <th className="pb-3 text-right font-medium text-muted-foreground">Mean</th>
                  <th className="pb-3 text-right font-medium text-muted-foreground">Std Dev</th>
                  <th className="pb-3 text-right font-medium text-muted-foreground">Min</th>
                  <th className="pb-3 text-right font-medium text-muted-foreground">Max</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                <tr className="border-b">
                  <td className="py-3">Order Flow Imbalance (%)</td>
                  <td className="py-3 text-right">{featureStats.ofi.mean.toFixed(2)}</td>
                  <td className="py-3 text-right">{featureStats.ofi.std.toFixed(2)}</td>
                  <td className="py-3 text-right">{featureStats.ofi.min.toFixed(2)}</td>
                  <td className="py-3 text-right">{featureStats.ofi.max.toFixed(2)}</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3">Depth Imbalance (%)</td>
                  <td className="py-3 text-right">{featureStats.depth.mean.toFixed(2)}</td>
                  <td className="py-3 text-right">{featureStats.depth.std.toFixed(2)}</td>
                  <td className="py-3 text-right">{featureStats.depth.min.toFixed(2)}</td>
                  <td className="py-3 text-right">{featureStats.depth.max.toFixed(2)}</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3">Price Momentum (bps)</td>
                  <td className="py-3 text-right">{featureStats.momentum.mean.toFixed(2)}</td>
                  <td className="py-3 text-right">{featureStats.momentum.std.toFixed(2)}</td>
                  <td className="py-3 text-right">{featureStats.momentum.min.toFixed(2)}</td>
                  <td className="py-3 text-right">{featureStats.momentum.max.toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="py-3">Spread (cents)</td>
                  <td className="py-3 text-right">{featureStats.spread.mean.toFixed(2)}</td>
                  <td className="py-3 text-right">{featureStats.spread.std.toFixed(2)}</td>
                  <td className="py-3 text-right">{featureStats.spread.min.toFixed(2)}</td>
                  <td className="py-3 text-right">{featureStats.spread.max.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
