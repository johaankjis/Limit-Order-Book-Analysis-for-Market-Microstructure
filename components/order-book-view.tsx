"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import type { LOBRecord } from "@/lib/lob-data"
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts"

interface OrderBookViewProps {
  data: LOBRecord[]
}

export function OrderBookView({ data }: OrderBookViewProps) {
  const [selectedIndex, setSelectedIndex] = useState(data.length - 1)

  const currentSnapshot = data[selectedIndex]

  const depthChartData = useMemo(() => {
    if (!currentSnapshot) return []

    const bidData = currentSnapshot.bidLevels.map((level, i) => ({
      price: level.price,
      bidVolume: level.size,
      cumulativeBid: currentSnapshot.bidLevels.slice(0, i + 1).reduce((sum, l) => sum + l.size, 0),
      askVolume: 0,
      cumulativeAsk: 0,
    }))

    const askData = currentSnapshot.askLevels.map((level, i) => ({
      price: level.price,
      bidVolume: 0,
      cumulativeBid: 0,
      askVolume: level.size,
      cumulativeAsk: currentSnapshot.askLevels.slice(0, i + 1).reduce((sum, l) => sum + l.size, 0),
    }))

    return [...bidData.reverse(), ...askData]
  }, [currentSnapshot])

  const priceHistory = useMemo(() => {
    return data.slice(Math.max(0, selectedIndex - 100), selectedIndex + 1).map((d, i) => ({
      index: i,
      price: d.midPrice,
      spread: d.spread,
    }))
  }, [data, selectedIndex])

  if (!currentSnapshot) return null

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Order Book Ladder */}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="text-base">Order Book Snapshot</CardTitle>
          <p className="text-xs text-muted-foreground">
            Time: {new Date(currentSnapshot.timestamp).toLocaleTimeString()}
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Time Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Navigate Timeline</span>
                <span>
                  Tick {selectedIndex + 1} / {data.length}
                </span>
              </div>
              <Slider
                value={[selectedIndex]}
                onValueChange={(v) => setSelectedIndex(v[0])}
                max={data.length - 1}
                step={1}
                className="w-full"
              />
            </div>

            {/* Order Book Table */}
            <div className="grid grid-cols-2 gap-4">
              {/* Bids */}
              <div>
                <div className="mb-2 grid grid-cols-3 text-xs font-medium text-muted-foreground">
                  <span>Orders</span>
                  <span className="text-right">Size</span>
                  <span className="text-right">Bid</span>
                </div>
                {currentSnapshot.bidLevels.map((level, i) => (
                  <div key={i} className="relative grid grid-cols-3 py-1 text-sm">
                    <div
                      className="absolute inset-y-0 right-0 bg-accent/20"
                      style={{
                        width: `${(level.size / currentSnapshot.totalBidVolume) * 100}%`,
                      }}
                    />
                    <span className="relative z-10 text-muted-foreground">{level.orders}</span>
                    <span className="relative z-10 text-right">{level.size.toLocaleString()}</span>
                    <span className="relative z-10 text-right font-mono text-accent">{level.price.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Asks */}
              <div>
                <div className="mb-2 grid grid-cols-3 text-xs font-medium text-muted-foreground">
                  <span>Ask</span>
                  <span className="text-right">Size</span>
                  <span className="text-right">Orders</span>
                </div>
                {currentSnapshot.askLevels.map((level, i) => (
                  <div key={i} className="relative grid grid-cols-3 py-1 text-sm">
                    <div
                      className="absolute inset-y-0 left-0 bg-destructive/20"
                      style={{
                        width: `${(level.size / currentSnapshot.totalAskVolume) * 100}%`,
                      }}
                    />
                    <span className="relative z-10 font-mono text-destructive">{level.price.toFixed(2)}</span>
                    <span className="relative z-10 text-right">{level.size.toLocaleString()}</span>
                    <span className="relative z-10 text-right text-muted-foreground">{level.orders}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-4 rounded-lg bg-muted/50 p-3 text-sm">
              <div>
                <span className="text-muted-foreground">Spread</span>
                <p className="font-mono font-medium">${currentSnapshot.spread.toFixed(4)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Bid Vol</span>
                <p className="font-mono font-medium text-accent">{currentSnapshot.totalBidVolume.toLocaleString()}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Ask Vol</span>
                <p className="font-mono font-medium text-destructive">
                  {currentSnapshot.totalAskVolume.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Depth Chart */}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="text-base">Market Depth</CardTitle>
          <p className="text-xs text-muted-foreground">Cumulative volume by price level</p>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={depthChartData}>
                <XAxis
                  dataKey="price"
                  tickFormatter={(v) => `$${v.toFixed(2)}`}
                  tick={{ fontSize: 10, fill: "#71717a" }}
                  axisLine={{ stroke: "#27272a" }}
                />
                <YAxis tick={{ fontSize: 10, fill: "#71717a" }} axisLine={{ stroke: "#27272a" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#18181b",
                    border: "1px solid #27272a",
                    borderRadius: "8px",
                  }}
                  labelFormatter={(v) => `Price: $${Number(v).toFixed(2)}`}
                />
                <ReferenceLine x={currentSnapshot.midPrice} stroke="#3b82f6" strokeDasharray="3 3" />
                <Area
                  type="stepAfter"
                  dataKey="cumulativeBid"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.3}
                  name="Bid Depth"
                />
                <Area
                  type="stepAfter"
                  dataKey="cumulativeAsk"
                  stroke="#ef4444"
                  fill="#ef4444"
                  fillOpacity={0.3}
                  name="Ask Depth"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Price History Mini Chart */}
          <div className="mt-4">
            <p className="mb-2 text-xs text-muted-foreground">Price History (last 100 ticks)</p>
            <div className="h-24">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={priceHistory}>
                  <Area type="monotone" dataKey="price" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#18181b",
                      border: "1px solid #27272a",
                      borderRadius: "8px",
                    }}
                    labelFormatter={(v) => `Tick ${v}`}
                    formatter={(v: number) => [`$${v.toFixed(4)}`, "Price"]}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
