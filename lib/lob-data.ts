// Types
export interface OrderLevel {
  price: number
  size: number
  orders: number
}

export interface LOBRecord {
  timestamp: string
  symbol: string
  midPrice: number
  spread: number
  bidLevels: OrderLevel[]
  askLevels: OrderLevel[]
  totalBidVolume: number
  totalAskVolume: number
  orderImbalance: number
  volatility: number
  lastTrade: {
    price: number
    size: number
    side: "buy" | "sell"
  }
}

export interface FeatureRecord {
  timestamp: string
  midPrice: number
  spread: number
  orderFlowImbalance: number
  depthImbalance: number
  priceMomentum: number
  priceVolatility: number
  spreadChange: number
  vwapBid: number
  vwapAsk: number
  totalBidVolume: number
  totalAskVolume: number
  volatility: number
  futureReturn: number
  futureDirection: number
}

export interface AnalysisResults {
  arimaResults: {
    timestamp: string
    actual: number
    predicted: number
    error: number
  }[]
  garchResults: {
    timestamp: string
    actualVolatility: number
    forecastVolatility: number
    conditionalVariance: number
  }[]
  volatilityRegimes: {
    timestamp: string
    volatility: number
    regime: "low" | "normal" | "high"
  }[]
  metrics: {
    arima: {
      mse: number
      rmse: number
      mae: number
      directionAccuracy: number
    }
    garch: {
      mse: number
      rmse: number
      mae: number
      directionAccuracy: number
    }
  }
}

// Data Generation
export function generateLOBData(numRecords = 5000): LOBRecord[] {
  const basePrice = 150.0
  const volatility = 0.0002
  const spreadBase = 0.01
  const startTime = new Date("2024-01-15T09:30:00")

  const data: LOBRecord[] = []
  let currentPrice = basePrice
  let currentVolatility = volatility
  const volatilityPersistence = 0.95

  for (let i = 0; i < numRecords; i++) {
    const timestamp = new Date(startTime.getTime() + i * 500)

    // Update volatility (GARCH-like clustering)
    const shock = gaussianRandom()
    currentVolatility =
      volatilityPersistence * currentVolatility + (1 - volatilityPersistence) * volatility * Math.abs(shock)

    // Price movement
    const priceChange = gaussianRandom() * currentVolatility * currentPrice
    currentPrice = Math.max(currentPrice + priceChange, 1.0)

    // Dynamic spread
    const spread = spreadBase * (1 + (currentVolatility / volatility) * 2)

    // Order flow imbalance
    const imbalance = Math.max(-0.8, Math.min(0.8, Math.sin(i / 1000) * 0.3 + gaussianRandom() * 0.2))

    // Generate levels
    const bidLevels: OrderLevel[] = []
    const askLevels: OrderLevel[] = []

    for (let level = 0; level < 5; level++) {
      const levelOffset = spread / 2 + level * spread * 0.5

      bidLevels.push({
        price: Math.round((currentPrice - levelOffset) * 100) / 100,
        size: Math.max(100, Math.round(gaussianRandom() * 200 + 500 * (1 - imbalance * 0.3) * (1 - level * 0.15))),
        orders: Math.floor(Math.random() * 10) + 1,
      })

      askLevels.push({
        price: Math.round((currentPrice + levelOffset) * 100) / 100,
        size: Math.max(100, Math.round(gaussianRandom() * 200 + 500 * (1 + imbalance * 0.3) * (1 - level * 0.15))),
        orders: Math.floor(Math.random() * 10) + 1,
      })
    }

    const totalBid = bidLevels.reduce((sum, l) => sum + l.size, 0)
    const totalAsk = askLevels.reduce((sum, l) => sum + l.size, 0)

    const tradeSide: "buy" | "sell" = Math.random() > 0.5 - imbalance * 0.2 ? "buy" : "sell"

    data.push({
      timestamp: timestamp.toISOString(),
      symbol: "AAPL",
      midPrice: Math.round(currentPrice * 10000) / 10000,
      spread: Math.round(spread * 10000) / 10000,
      bidLevels,
      askLevels,
      totalBidVolume: totalBid,
      totalAskVolume: totalAsk,
      orderImbalance: Math.round(imbalance * 10000) / 10000,
      volatility: Math.round(currentVolatility * 1000000) / 1000000,
      lastTrade: {
        price: tradeSide === "buy" ? askLevels[0].price : bidLevels[0].price,
        size: (Math.floor(Math.random() * 100) + 1) * 100,
        side: tradeSide,
      },
    })
  }

  return data
}

export function calculateFeatures(data: LOBRecord[]): FeatureRecord[] {
  const features: FeatureRecord[] = []

  for (let i = 10; i < data.length; i++) {
    const record = data[i]

    // Depth imbalance
    const totalBid = record.totalBidVolume
    const totalAsk = record.totalAskVolume
    const depthImbalance = totalBid + totalAsk > 0 ? (totalBid - totalAsk) / (totalBid + totalAsk) : 0

    // Price momentum
    const lookbackPrices = data.slice(i - 10, i).map((d) => d.midPrice)
    const priceMomentum = (record.midPrice - lookbackPrices[0]) / lookbackPrices[0]
    const avgPrice = lookbackPrices.reduce((a, b) => a + b, 0) / 10
    const priceVolatility = lookbackPrices.reduce((s, p) => s + (p - avgPrice) ** 2, 0) / 10

    // Spread change
    const spreadChange = record.spread - data[i - 1].spread

    // VWAP
    const vwapBid = totalBid > 0 ? record.bidLevels.reduce((s, l) => s + l.price * l.size, 0) / totalBid : 0
    const vwapAsk = totalAsk > 0 ? record.askLevels.reduce((s, l) => s + l.price * l.size, 0) / totalAsk : 0

    // Future return
    const futureReturn = i < data.length - 1 ? (data[i + 1].midPrice - record.midPrice) / record.midPrice : 0

    features.push({
      timestamp: record.timestamp,
      midPrice: record.midPrice,
      spread: record.spread,
      orderFlowImbalance: record.orderImbalance,
      depthImbalance: Math.round(depthImbalance * 10000) / 10000,
      priceMomentum: Math.round(priceMomentum * 1000000) / 1000000,
      priceVolatility: Math.round(priceVolatility * 100000000) / 100000000,
      spreadChange: Math.round(spreadChange * 1000000) / 1000000,
      vwapBid: Math.round(vwapBid * 10000) / 10000,
      vwapAsk: Math.round(vwapAsk * 10000) / 10000,
      totalBidVolume: totalBid,
      totalAskVolume: totalAsk,
      volatility: record.volatility,
      futureReturn: Math.round(futureReturn * 100000000) / 100000000,
      futureDirection: futureReturn > 0 ? 1 : futureReturn < 0 ? -1 : 0,
    })
  }

  return features
}

export function runTimeSeriesAnalysis(features: FeatureRecord[]): AnalysisResults {
  const prices = features.map((f) => f.midPrice)
  const returns = prices.slice(1).map((p, i) => (p - prices[i]) / prices[i])

  const trainSize = Math.floor(prices.length * 0.8)

  // Simple ARIMA-like predictions
  const arimaResults: AnalysisResults["arimaResults"] = []
  const history: number[] = prices.slice(0, trainSize)

  for (let i = trainSize; i < prices.length; i++) {
    // Simple AR(1) prediction
    const lastPrice = history[history.length - 1]
    const avgChange =
      history.slice(-10).reduce((s, p, j, arr) => {
        if (j === 0) return s
        return s + (p - arr[j - 1])
      }, 0) / 9

    const predicted = lastPrice + avgChange * 0.7
    const actual = prices[i]

    arimaResults.push({
      timestamp: features[i].timestamp,
      actual,
      predicted,
      error: actual - predicted,
    })

    history.push(actual)
  }

  // GARCH-like volatility forecasts
  const garchResults: AnalysisResults["garchResults"] = []
  let condVar = 0.0001
  const omega = 0.00001
  const alpha = 0.1
  const beta = 0.85

  const trainReturns = returns.slice(0, trainSize)
  trainReturns.forEach((r) => {
    condVar = omega + alpha * r * r + beta * condVar
  })

  for (let i = trainSize; i < returns.length; i++) {
    const forecastVol = Math.sqrt(condVar)
    const actualVol = Math.abs(returns[i])

    garchResults.push({
      timestamp: features[i + 1]?.timestamp || features[i].timestamp,
      actualVolatility: actualVol,
      forecastVolatility: forecastVol,
      conditionalVariance: condVar,
    })

    condVar = omega + alpha * returns[i] * returns[i] + beta * condVar
  }

  // Volatility regimes
  const avgVol = features.reduce((s, f) => s + f.volatility, 0) / features.length
  const volatilityRegimes: AnalysisResults["volatilityRegimes"] = features.slice(-500).map((f) => ({
    timestamp: f.timestamp,
    volatility: f.volatility,
    regime: f.volatility > avgVol * 1.5 ? "high" : f.volatility < avgVol * 0.5 ? "low" : "normal",
  }))

  // Calculate metrics
  const calcMetrics = (actual: number[], predicted: number[]): AnalysisResults["metrics"]["arima"] => {
    const n = actual.length
    const mse = actual.reduce((s, a, i) => s + (a - predicted[i]) ** 2, 0) / n
    const rmse = Math.sqrt(mse)
    const mae = actual.reduce((s, a, i) => s + Math.abs(a - predicted[i]), 0) / n

    let correctDir = 0
    for (let i = 1; i < n; i++) {
      const actualDir = actual[i] > actual[i - 1]
      const predDir = predicted[i] > predicted[i - 1]
      if (actualDir === predDir) correctDir++
    }
    const directionAccuracy = (correctDir / (n - 1)) * 100

    return { mse, rmse, mae, directionAccuracy }
  }

  return {
    arimaResults,
    garchResults,
    volatilityRegimes,
    metrics: {
      arima: calcMetrics(
        arimaResults.map((r) => r.actual),
        arimaResults.map((r) => r.predicted),
      ),
      garch: calcMetrics(
        garchResults.map((r) => r.actualVolatility),
        garchResults.map((r) => r.forecastVolatility),
      ),
    },
  }
}

function gaussianRandom(): number {
  let u = 0
  let v = 0
  while (u === 0) u = Math.random()
  while (v === 0) v = Math.random()
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
}
