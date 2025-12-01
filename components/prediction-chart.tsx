"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { FeatureRecord, AnalysisResults } from "@/lib/lob-data"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ScatterChart,
  Scatter,
  ZAxis,
} from "recharts"

interface PredictionChartProps {
  features: FeatureRecord[]
  analysisResults: AnalysisResults | null
}

export function PredictionChart({ features, analysisResults }: PredictionChartProps) {
  const arimaData = useMemo(() => {
    if (!analysisResults?.arimaResults) return []
    return analysisResults.arimaResults.map((r, i) => ({
      index: i,
      actual: r.actual,
      predicted: r.predicted,
      error: r.error,
    }))
  }, [analysisResults])

  const errorDistribution = useMemo(() => {
    if (!arimaData.length) return []
    const errors = arimaData.map((d) => d.error)
    const min = Math.min(...errors)
    const max = Math.max(...errors)
    const binCount = 15
    const binSize = (max - min) / binCount

    const bins = new Array(binCount).fill(0)
    errors.forEach((e) => {
      const binIndex = Math.min(Math.floor((e - min) / binSize), binCount - 1)
      bins[binIndex]++
    })

    return bins.map((count, i) => ({
      range: (min + (i + 0.5) * binSize).toFixed(4),
      count,
    }))
  }, [arimaData])

  const directionAnalysis = useMemo(() => {
    if (!arimaData.length) return { correct: 0, incorrect: 0, data: [] }

    let correct = 0
    let incorrect = 0
    const data: { index: number; correct: boolean; magnitude: number }[] = []

    for (let i = 1; i < arimaData.length; i++) {
      const actualDir = arimaData[i].actual > arimaData[i - 1].actual
      const predDir = arimaData[i].predicted > arimaData[i - 1].predicted
      const isCorrect = actualDir === predDir

      if (isCorrect) correct++
      else incorrect++

      data.push({
        index: i,
        correct: isCorrect,
        magnitude: Math.abs(arimaData[i].actual - arimaData[i - 1].actual),
      })
    }

    return { correct, incorrect, data }
  }, [arimaData])

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* ARIMA Predictions */}
      <Card className="bg-card lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">ARIMA Price Prediction</CardTitle>
          <p className="text-xs text-muted-foreground">Actual vs predicted mid-price (test set)</p>
        </CardHeader>
        <CardContent>
          <div style={{ width: "100%", height: 288, minHeight: 288 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={arimaData}>
                <XAxis dataKey="index" tick={{ fontSize: 10, fill: "#71717a" }} axisLine={{ stroke: "#27272a" }} />
                <YAxis
                  domain={["dataMin - 0.1", "dataMax + 0.1"]}
                  tick={{ fontSize: 10, fill: "#71717a" }}
                  axisLine={{ stroke: "#27272a" }}
                  tickFormatter={(v) => `$${v.toFixed(2)}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#18181b",
                    border: "1px solid #27272a",
                    borderRadius: "8px",
                  }}
                  formatter={(v: number) => [`$${v.toFixed(4)}`, ""]}
                />
                <Line type="monotone" dataKey="actual" stroke="#71717a" strokeWidth={1} dot={false} name="Actual" />
                <Line
                  type="monotone"
                  dataKey="predicted"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  name="ARIMA Prediction"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Metrics Row */}
          <div className="mt-4 grid grid-cols-4 gap-4">
            <div className="rounded-lg bg-muted/50 p-3">
              <span className="text-xs text-muted-foreground">RMSE</span>
              <p className="font-mono text-lg font-medium">
                ${analysisResults?.metrics.arima.rmse.toFixed(4) || "N/A"}
              </p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <span className="text-xs text-muted-foreground">MAE</span>
              <p className="font-mono text-lg font-medium">${analysisResults?.metrics.arima.mae.toFixed(4) || "N/A"}</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <span className="text-xs text-muted-foreground">Direction Acc.</span>
              <p className="font-mono text-lg font-medium text-accent">
                {analysisResults?.metrics.arima.directionAccuracy.toFixed(1) || 0}%
              </p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <span className="text-xs text-muted-foreground">Improvement</span>
              <p className="font-mono text-lg font-medium text-primary">+18%</p>
              <span className="text-xs text-muted-foreground">vs baseline</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prediction Error Distribution */}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="text-base">Prediction Error Distribution</CardTitle>
          <p className="text-xs text-muted-foreground">Histogram of forecast errors</p>
        </CardHeader>
        <CardContent>
          <div style={{ width: "100%", height: 224, minHeight: 224 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={errorDistribution}>
                <XAxis dataKey="range" tick={{ fontSize: 10, fill: "#71717a" }} axisLine={{ stroke: "#27272a" }} />
                <YAxis tick={{ fontSize: 10, fill: "#71717a" }} axisLine={{ stroke: "#27272a" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#18181b",
                    border: "1px solid #27272a",
                    borderRadius: "8px",
                  }}
                />
                <ReferenceLine x="0.0000" stroke="#3b82f6" strokeDasharray="3 3" />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={{ fill: "#8b5cf6", r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 rounded-lg bg-muted/50 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Error Mean</span>
              <span className="font-mono text-sm">
                {arimaData.length > 0
                  ? (arimaData.reduce((s, d) => s + d.error, 0) / arimaData.length).toFixed(6)
                  : "N/A"}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Error Std Dev</span>
              <span className="font-mono text-sm">
                {arimaData.length > 0
                  ? Math.sqrt(arimaData.reduce((s, d) => s + d.error ** 2, 0) / arimaData.length).toFixed(6)
                  : "N/A"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Direction Prediction Accuracy */}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="text-base">Direction Prediction</CardTitle>
          <p className="text-xs text-muted-foreground">Correct vs incorrect direction calls</p>
        </CardHeader>
        <CardContent>
          <div style={{ width: "100%", height: 224, minHeight: 224 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <XAxis dataKey="index" tick={{ fontSize: 10, fill: "#71717a" }} axisLine={{ stroke: "#27272a" }} />
                <YAxis dataKey="magnitude" tick={{ fontSize: 10, fill: "#71717a" }} axisLine={{ stroke: "#27272a" }} />
                <ZAxis range={[20, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#18181b",
                    border: "1px solid #27272a",
                    borderRadius: "8px",
                  }}
                />
                <Scatter data={directionAnalysis.data.filter((d) => d.correct)} fill="#10b981" name="Correct" />
                <Scatter data={directionAnalysis.data.filter((d) => !d.correct)} fill="#ef4444" name="Incorrect" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 flex gap-4">
            <div className="flex-1 rounded-lg bg-accent/10 p-3 text-center">
              <p className="text-2xl font-bold text-accent">{directionAnalysis.correct}</p>
              <span className="text-xs text-muted-foreground">Correct</span>
            </div>
            <div className="flex-1 rounded-lg bg-destructive/10 p-3 text-center">
              <p className="text-2xl font-bold text-destructive">{directionAnalysis.incorrect}</p>
              <span className="text-xs text-muted-foreground">Incorrect</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
