"use client"

import { Card, CardContent } from "@/components/ui/card"
import type { LOBRecord, FeatureRecord, AnalysisResults } from "@/lib/lob-data"
import { TrendingUp, TrendingDown, Activity, DollarSign, BarChart2, Percent } from "lucide-react"

interface MetricsPanelProps {
  data: LOBRecord[]
  features: FeatureRecord[]
  analysisResults: AnalysisResults | null
  stats: {
    totalRecords: number
    avgSpread: number
    avgVolatility: number
    priceRange: { min: number; max: number }
  }
}

export function MetricsPanel({ data, features, analysisResults, stats }: MetricsPanelProps) {
  const latestData = data[data.length - 1]
  const latestFeature = features[features.length - 1]

  const priceChange = data.length > 1 ? ((latestData.midPrice - data[0].midPrice) / data[0].midPrice) * 100 : 0

  const metrics = [
    {
      label: "Mid Price",
      value: `$${latestData?.midPrice.toFixed(2) || "0.00"}`,
      change: priceChange,
      icon: DollarSign,
    },
    {
      label: "Bid-Ask Spread",
      value: `$${stats.avgSpread.toFixed(4)}`,
      subtext: "avg",
      icon: BarChart2,
    },
    {
      label: "Volatility",
      value: `${(stats.avgVolatility * 10000).toFixed(2)} bps`,
      subtext: "10k bps",
      icon: Activity,
    },
    {
      label: "Order Imbalance",
      value: `${((latestFeature?.orderFlowImbalance || 0) * 100).toFixed(1)}%`,
      change: (latestFeature?.orderFlowImbalance || 0) * 100,
      icon: Percent,
    },
    {
      label: "Direction Accuracy",
      value: `${analysisResults?.metrics.arima.directionAccuracy.toFixed(1) || 0}%`,
      subtext: "ARIMA",
      icon: TrendingUp,
    },
    {
      label: "GARCH RMSE",
      value: (analysisResults?.metrics.garch.rmse || 0).toExponential(2),
      subtext: "volatility",
      icon: Activity,
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {metrics.map((metric, i) => (
        <Card key={i} className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{metric.label}</span>
              <metric.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-2">
              <span className="text-xl font-semibold">{metric.value}</span>
              {metric.change !== undefined && (
                <span
                  className={`ml-2 inline-flex items-center text-xs ${
                    metric.change >= 0 ? "text-accent" : "text-destructive"
                  }`}
                >
                  {metric.change >= 0 ? (
                    <TrendingUp className="mr-1 h-3 w-3" />
                  ) : (
                    <TrendingDown className="mr-1 h-3 w-3" />
                  )}
                  {Math.abs(metric.change).toFixed(2)}%
                </span>
              )}
              {metric.subtext && <span className="ml-2 text-xs text-muted-foreground">{metric.subtext}</span>}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
