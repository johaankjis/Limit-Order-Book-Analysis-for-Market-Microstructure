"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { LOBRecord, AnalysisResults } from "@/lib/lob-data"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart, ComposedChart } from "recharts"

interface VolatilitySurfaceProps {
  data: LOBRecord[]
  analysisResults: AnalysisResults | null
}

export function VolatilitySurface({ data, analysisResults }: VolatilitySurfaceProps) {
  const volatilityData = useMemo(() => {
    return data
      .filter((_, i) => i % 10 === 0)
      .slice(-200)
      .map((d, i) => ({
        index: i,
        volatility: d.volatility * 10000, // Convert to basis points
        spread: d.spread * 100, // Convert to cents
        timestamp: new Date(d.timestamp).toLocaleTimeString(),
      }))
  }, [data])

  const regimeData = useMemo(() => {
    if (!analysisResults?.volatilityRegimes) return []
    return analysisResults.volatilityRegimes.slice(-100).map((r, i) => ({
      index: i,
      volatility: r.volatility * 10000,
      regime: r.regime,
      color: r.regime === "high" ? "#ef4444" : r.regime === "low" ? "#10b981" : "#3b82f6",
    }))
  }, [analysisResults])

  const garchForecast = useMemo(() => {
    if (!analysisResults?.garchResults) return []
    return analysisResults.garchResults.slice(-50).map((r, i) => ({
      index: i,
      actual: r.actualVolatility * 10000,
      forecast: r.forecastVolatility * 10000,
    }))
  }, [analysisResults])

  // Calculate volatility distribution
  const volDistribution = useMemo(() => {
    const vols = data.map((d) => d.volatility * 10000)
    const min = Math.min(...vols)
    const max = Math.max(...vols)
    const binCount = 20
    const binSize = (max - min) / binCount

    const bins = new Array(binCount).fill(0)
    vols.forEach((v) => {
      const binIndex = Math.min(Math.floor((v - min) / binSize), binCount - 1)
      bins[binIndex]++
    })

    return bins.map((count, i) => ({
      range: `${(min + i * binSize).toFixed(1)}`,
      count,
      percentage: (count / vols.length) * 100,
    }))
  }, [data])

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Volatility Time Series */}
      <Card className="bg-card lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Volatility Surface</CardTitle>
          <p className="text-xs text-muted-foreground">Realized volatility with GARCH regime detection</p>
        </CardHeader>
        <CardContent>
          <div style={{ width: "100%", height: 288, minHeight: 288 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={volatilityData}>
                <XAxis dataKey="index" tick={{ fontSize: 10, fill: "#71717a" }} axisLine={{ stroke: "#27272a" }} />
                <YAxis
                  yAxisId="vol"
                  tick={{ fontSize: 10, fill: "#71717a" }}
                  axisLine={{ stroke: "#27272a" }}
                  label={{
                    value: "Volatility (bps)",
                    angle: -90,
                    position: "insideLeft",
                    style: { fontSize: 10, fill: "#71717a" },
                  }}
                />
                <YAxis
                  yAxisId="spread"
                  orientation="right"
                  tick={{ fontSize: 10, fill: "#71717a" }}
                  axisLine={{ stroke: "#27272a" }}
                  label={{
                    value: "Spread (cents)",
                    angle: 90,
                    position: "insideRight",
                    style: { fontSize: 10, fill: "#71717a" },
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#18181b",
                    border: "1px solid #27272a",
                    borderRadius: "8px",
                  }}
                />
                <Area
                  yAxisId="vol"
                  type="monotone"
                  dataKey="volatility"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.2}
                  name="Volatility (bps)"
                />
                <Line
                  yAxisId="spread"
                  type="monotone"
                  dataKey="spread"
                  stroke="#f59e0b"
                  strokeWidth={1}
                  dot={false}
                  name="Spread (cents)"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* GARCH Forecast */}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="text-base">GARCH Volatility Forecast</CardTitle>
          <p className="text-xs text-muted-foreground">Actual vs predicted volatility</p>
        </CardHeader>
        <CardContent>
          <div style={{ width: "100%", height: 224, minHeight: 224 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={garchForecast}>
                <XAxis dataKey="index" tick={{ fontSize: 10, fill: "#71717a" }} axisLine={{ stroke: "#27272a" }} />
                <YAxis tick={{ fontSize: 10, fill: "#71717a" }} axisLine={{ stroke: "#27272a" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#18181b",
                    border: "1px solid #27272a",
                    borderRadius: "8px",
                  }}
                />
                <Line type="monotone" dataKey="actual" stroke="#71717a" strokeWidth={1} dot={false} name="Actual" />
                <Line
                  type="monotone"
                  dataKey="forecast"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  name="GARCH Forecast"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* GARCH Stats */}
          <div className="mt-4 grid grid-cols-2 gap-4 rounded-lg bg-muted/50 p-3">
            <div>
              <span className="text-xs text-muted-foreground">RMSE</span>
              <p className="font-mono text-sm font-medium">
                {analysisResults?.metrics.garch.rmse.toExponential(2) || "N/A"}
              </p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">MAE</span>
              <p className="font-mono text-sm font-medium">
                {analysisResults?.metrics.garch.mae.toExponential(2) || "N/A"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Volatility Distribution */}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="text-base">Volatility Distribution</CardTitle>
          <p className="text-xs text-muted-foreground">Histogram of realized volatility</p>
        </CardHeader>
        <CardContent>
          <div style={{ width: "100%", height: 224, minHeight: 224 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={volDistribution}>
                <XAxis dataKey="range" tick={{ fontSize: 10, fill: "#71717a" }} axisLine={{ stroke: "#27272a" }} />
                <YAxis tick={{ fontSize: 10, fill: "#71717a" }} axisLine={{ stroke: "#27272a" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#18181b",
                    border: "1px solid #27272a",
                    borderRadius: "8px",
                  }}
                  formatter={(v: number) => [`${v.toFixed(1)}%`, "Frequency"]}
                />
                <Area type="monotone" dataKey="percentage" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Regime Summary */}
          <div className="mt-4 flex gap-4">
            {["low", "normal", "high"].map((regime) => {
              const count = regimeData.filter((r) => r.regime === regime).length
              const pct = regimeData.length > 0 ? (count / regimeData.length) * 100 : 0
              return (
                <div key={regime} className="flex-1 rounded-lg bg-muted/50 p-2 text-center">
                  <div
                    className={`mb-1 h-2 w-2 rounded-full mx-auto ${
                      regime === "high" ? "bg-destructive" : regime === "low" ? "bg-accent" : "bg-primary"
                    }`}
                  />
                  <span className="text-xs capitalize text-muted-foreground">{regime}</span>
                  <p className="font-mono text-sm font-medium">{pct.toFixed(0)}%</p>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
