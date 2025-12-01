# Limit Order Book Analysis for Market Microstructure

A Next.js web application for analyzing limit order book (LOB) data and market microstructure. This interactive dashboard provides real-time visualization of order book dynamics, volatility analysis, and price prediction using time-series models.

## Features

### Order Book Visualization
- **Real-time Order Book Snapshot**: Interactive view of 5-level bid/ask depth with price, size, and order count
- **Market Depth Chart**: Cumulative volume visualization across price levels
- **Timeline Navigation**: Slider to navigate through 5,000+ tick-level records
- **Price History**: Mini chart showing recent price movements

### Liquidity Analysis
- **Liquidity Heatmap**: Visual representation of order book depth across price levels over time
- **Order Flow Dynamics**: Real-time tracking of order imbalance, spread, and volatility
- **Volume Distribution**: Analysis of bid/ask volume patterns

### Volatility Surface
- **GARCH Volatility Forecasting**: Conditional variance estimation with regime detection
- **Volatility Distribution**: Histogram of realized volatility with low/normal/high regime classification
- **Spread-Volatility Correlation**: Dual-axis visualization of volatility and spread dynamics

### Price Prediction
- **ARIMA Model**: Autoregressive price prediction with actual vs predicted comparison
- **Prediction Error Analysis**: Distribution of forecast errors with statistical metrics
- **Direction Accuracy**: Scatter plot of correct vs incorrect direction predictions
- **Performance Metrics**: RMSE, MAE, and direction accuracy statistics

### Feature Analysis
- **Microstructure Features**: Time series of order flow imbalance, depth imbalance, and price momentum
- **Feature Correlation**: OFI vs future return scatter analysis
- **Feature Importance**: Ranking of predictive features by correlation with future returns
- **Statistical Summary**: Mean, std dev, min/max for all engineered features

## Technology Stack

- **Framework**: [Next.js 16](https://nextjs.org/) with React 19
- **Language**: TypeScript
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) with CSS variables
- **UI Components**: [Radix UI](https://www.radix-ui.com/) primitives with [shadcn/ui](https://ui.shadcn.com/)
- **Charts**: [Recharts](https://recharts.org/) for data visualization
- **Icons**: [Lucide React](https://lucide.dev/)
- **Analytics**: [Vercel Analytics](https://vercel.com/analytics)

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- pnpm (recommended) or npm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/johaankjis/Limit-Order-Book-Analysis-for-Market-Microstructure.git
   cd Limit-Order-Book-Analysis-for-Market-Microstructure
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Start the development server:
   ```bash
   pnpm dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
pnpm build
pnpm start
```

## Project Structure

```
├── app/
│   ├── globals.css        # Global styles and CSS variables
│   ├── layout.tsx         # Root layout with metadata and fonts
│   └── page.tsx           # Main entry point
├── components/
│   ├── ui/                # Reusable UI components (shadcn/ui)
│   ├── lob-dashboard.tsx  # Main dashboard component
│   ├── order-book-view.tsx    # Order book visualization
│   ├── liquidity-heatmap.tsx  # Liquidity heatmap component
│   ├── volatility-surface.tsx # Volatility analysis charts
│   ├── prediction-chart.tsx   # ARIMA prediction visualization
│   ├── feature-analysis.tsx   # Feature analysis component
│   └── metrics-panel.tsx      # Key metrics display
├── lib/
│   ├── lob-data.ts        # LOB data generation and analysis
│   └── utils.ts           # Utility functions
├── scripts/
│   ├── generate_lob_data.py   # Python LOB data generator
│   └── time_series_models.py  # ARIMA/GARCH implementations
├── hooks/
│   ├── use-mobile.ts      # Mobile detection hook
│   └── use-toast.ts       # Toast notification hook
└── styles/
    └── globals.css        # Additional global styles
```

## Data Generation

The application generates synthetic limit order book data that simulates realistic market conditions:

- **5,000 tick-level records** per session
- **5-level order book depth** (bid and ask sides)
- **GARCH-like volatility clustering**
- **Dynamic spreads** based on volatility
- **Order flow imbalance** patterns

### Python Scripts

For generating larger datasets or offline analysis:

```bash
# Generate 100,000 LOB records
python scripts/generate_lob_data.py

# Run time-series analysis
python scripts/time_series_models.py
```

## Key Metrics

The dashboard displays several market microstructure metrics:

| Metric | Description |
|--------|-------------|
| Mid Price | Current mid-point between best bid and ask |
| Bid-Ask Spread | Difference between best ask and bid prices |
| Volatility | Realized volatility in basis points |
| Order Imbalance | Buy vs sell pressure indicator |
| Direction Accuracy | ARIMA model prediction accuracy |
| GARCH RMSE | Volatility forecast error |

## Models

### ARIMA (AutoRegressive Integrated Moving Average)
- Used for price prediction
- AR(5) with differencing order 1
- 80/20 train/test split

### GARCH (Generalized Autoregressive Conditional Heteroskedasticity)
- Used for volatility forecasting
- GARCH(1,1) specification
- Regime detection (low/normal/high volatility)

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |

## License

This project is for educational and research purposes in market microstructure analysis.
