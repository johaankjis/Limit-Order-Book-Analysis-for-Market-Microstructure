"""
Time-Series Models for LOB Analysis
Implements ARIMA and GARCH models for volatility and price prediction
"""

import json
import math
import random
from collections import deque

# Simple ARIMA-like model implementation
class SimpleARIMA:
    """
    Simplified ARIMA model for price prediction
    Uses AR(p) component with differencing
    """
    
    def __init__(self, p=5, d=1):
        self.p = p  # AR order
        self.d = d  # Differencing order
        self.coefficients = None
        self.history = deque(maxlen=p + d + 10)
        
    def difference(self, series, order=1):
        """Apply differencing to make series stationary"""
        diff = series.copy()
        for _ in range(order):
            diff = [diff[i] - diff[i-1] for i in range(1, len(diff))]
        return diff
    
    def fit(self, data):
        """Fit ARIMA model using least squares approximation"""
        if len(data) < self.p + self.d + 10:
            return
        
        # Apply differencing
        diff_data = self.difference(data, self.d)
        
        # Simple AR coefficient estimation
        self.coefficients = []
        for lag in range(1, self.p + 1):
            if len(diff_data) > lag:
                # Correlation-based coefficient
                x = diff_data[lag:]
                y = diff_data[:-lag]
                if len(x) > 0 and len(y) > 0:
                    mean_x = sum(x) / len(x)
                    mean_y = sum(y) / len(y)
                    cov = sum((x[i] - mean_x) * (y[i] - mean_y) for i in range(min(len(x), len(y)))) / len(x)
                    var_y = sum((yi - mean_y)**2 for yi in y) / len(y)
                    coef = cov / var_y if var_y > 0 else 0
                    self.coefficients.append(coef * 0.5)  # Dampen coefficients
                else:
                    self.coefficients.append(0)
        
        self.history.extend(data[-self.p - self.d - 5:])
    
    def predict(self, steps=1):
        """Predict future values"""
        if self.coefficients is None or len(self.history) < self.p + self.d:
            return [list(self.history)[-1] if self.history else 0] * steps
        
        predictions = []
        temp_history = list(self.history)
        
        for _ in range(steps):
            diff_history = self.difference(temp_history, self.d)
            if len(diff_history) >= self.p:
                pred_diff = sum(
                    self.coefficients[i] * diff_history[-(i+1)] 
                    for i in range(min(self.p, len(self.coefficients)))
                )
                # Integrate back
                pred = temp_history[-1] + pred_diff
            else:
                pred = temp_history[-1]
            
            predictions.append(pred)
            temp_history.append(pred)
        
        return predictions


class SimpleGARCH:
    """
    Simplified GARCH(1,1) model for volatility estimation
    """
    
    def __init__(self, omega=0.00001, alpha=0.1, beta=0.85):
        self.omega = omega  # Constant term
        self.alpha = alpha  # ARCH term
        self.beta = beta    # GARCH term
        self.conditional_variance = omega / (1 - alpha - beta)
        self.last_return = 0
        self.variance_history = []
        
    def fit(self, returns):
        """Estimate GARCH parameters from return series"""
        if len(returns) < 10:
            return
        
        # Estimate unconditional variance
        mean_return = sum(returns) / len(returns)
        unconditional_var = sum((r - mean_return)**2 for r in returns) / len(returns)
        
        self.conditional_variance = unconditional_var
        self.variance_history = []
        
        # Generate variance series
        for r in returns:
            self.update(r)
    
    def update(self, return_value):
        """Update conditional variance with new return"""
        self.conditional_variance = (
            self.omega + 
            self.alpha * (return_value ** 2) + 
            self.beta * self.conditional_variance
        )
        self.last_return = return_value
        self.variance_history.append(self.conditional_variance)
        return self.conditional_variance
    
    def forecast(self, steps=1):
        """Forecast future volatility"""
        forecasts = []
        var_t = self.conditional_variance
        
        unconditional_var = self.omega / (1 - self.alpha - self.beta)
        
        for h in range(1, steps + 1):
            # Mean-reverting forecast
            var_h = unconditional_var + ((self.alpha + self.beta) ** h) * (var_t - unconditional_var)
            forecasts.append(math.sqrt(var_h))
        
        return forecasts


def calculate_model_metrics(actual, predicted):
    """Calculate prediction accuracy metrics"""
    if len(actual) != len(predicted) or len(actual) == 0:
        return {"mse": 0, "rmse": 0, "mae": 0, "direction_accuracy": 0}
    
    n = len(actual)
    
    # MSE
    mse = sum((a - p)**2 for a, p in zip(actual, predicted)) / n
    
    # RMSE
    rmse = math.sqrt(mse)
    
    # MAE
    mae = sum(abs(a - p) for a, p in zip(actual, predicted)) / n
    
    # Direction accuracy
    if n > 1:
        actual_dir = [1 if actual[i] > actual[i-1] else -1 for i in range(1, n)]
        pred_dir = [1 if predicted[i] > predicted[i-1] else -1 for i in range(1, n)]
        direction_accuracy = sum(1 for a, p in zip(actual_dir, pred_dir) if a == p) / len(actual_dir)
    else:
        direction_accuracy = 0
    
    return {
        "mse": round(mse, 10),
        "rmse": round(rmse, 8),
        "mae": round(mae, 8),
        "direction_accuracy": round(direction_accuracy * 100, 2)
    }


def run_analysis(features_data):
    """Run full time-series analysis on feature data"""
    
    results = {
        "arima_results": [],
        "garch_results": [],
        "volatility_forecast": [],
        "price_forecast": [],
        "metrics": {}
    }
    
    # Extract price and return series
    prices = [f["mid_price"] for f in features_data]
    returns = [(prices[i] - prices[i-1]) / prices[i-1] for i in range(1, len(prices))]
    volatilities = [f["volatility"] for f in features_data]
    
    # Fit ARIMA model
    print("Fitting ARIMA model...")
    arima = SimpleARIMA(p=5, d=1)
    
    train_size = int(len(prices) * 0.8)
    arima.fit(prices[:train_size])
    
    # Generate predictions
    arima_predictions = []
    for i in range(train_size, len(prices)):
        arima.history.append(prices[i-1])
        pred = arima.predict(steps=1)[0]
        arima_predictions.append({
            "timestamp": features_data[i]["timestamp"],
            "actual": prices[i],
            "predicted": pred,
            "error": prices[i] - pred
        })
    
    results["arima_results"] = arima_predictions[-100:]  # Last 100 for display
    
    # Fit GARCH model
    print("Fitting GARCH model...")
    garch = SimpleGARCH()
    garch.fit(returns[:train_size])
    
    # Generate volatility forecasts
    garch_predictions = []
    for i in range(train_size, len(returns)):
        vol_forecast = garch.forecast(steps=1)[0]
        actual_vol = abs(returns[i])
        garch.update(returns[i])
        
        garch_predictions.append({
            "timestamp": features_data[i+1]["timestamp"],
            "actual_volatility": actual_vol,
            "forecast_volatility": vol_forecast,
            "conditional_variance": garch.conditional_variance
        })
    
    results["garch_results"] = garch_predictions[-100:]
    
    # Calculate metrics
    actual_prices = [p["actual"] for p in arima_predictions]
    pred_prices = [p["predicted"] for p in arima_predictions]
    
    results["metrics"]["arima"] = calculate_model_metrics(actual_prices, pred_prices)
    
    actual_vols = [g["actual_volatility"] for g in garch_predictions]
    pred_vols = [g["forecast_volatility"] for g in garch_predictions]
    
    results["metrics"]["garch"] = calculate_model_metrics(actual_vols, pred_vols)
    
    # Volatility regime detection
    avg_vol = sum(volatilities) / len(volatilities)
    high_vol_threshold = avg_vol * 1.5
    low_vol_threshold = avg_vol * 0.5
    
    regime_data = []
    for i, f in enumerate(features_data[-500:]):
        vol = f["volatility"]
        regime = "high" if vol > high_vol_threshold else ("low" if vol < low_vol_threshold else "normal")
        regime_data.append({
            "timestamp": f["timestamp"],
            "volatility": vol,
            "regime": regime
        })
    
    results["volatility_regimes"] = regime_data
    
    return results


if __name__ == "__main__":
    print("=" * 60)
    print("Time-Series Modeling for LOB Analysis")
    print("=" * 60)
    
    # Load feature data
    print("\nLoading feature data...")
    try:
        with open("features_data.json", "r") as f:
            features_data = json.load(f)
        print(f"Loaded {len(features_data):,} feature records")
    except FileNotFoundError:
        print("features_data.json not found. Generating sample data...")
        # Generate sample data if file doesn't exist
        features_data = []
        base_price = 150.0
        for i in range(5000):
            price = base_price + random.gauss(0, 0.1) * (i % 100) / 100
            features_data.append({
                "timestamp": f"2024-01-15T09:{30 + i//60:02d}:{i%60:02d}",
                "mid_price": price,
                "volatility": abs(random.gauss(0.0002, 0.0001)),
                "order_flow_imbalance": random.gauss(0, 0.3),
                "depth_imbalance": random.gauss(0, 0.2)
            })
            base_price = price
    
    # Run analysis
    print("\nRunning time-series analysis...")
    results = run_analysis(features_data)
    
    # Save results
    print("\nSaving model results...")
    with open("model_results.json", "w") as f:
        json.dump(results, f)
    
    # Print summary
    print("\n" + "=" * 60)
    print("Model Performance Summary")
    print("=" * 60)
    
    print("\nARIMA Model:")
    print(f"  RMSE: {results['metrics']['arima']['rmse']:.6f}")
    print(f"  MAE: {results['metrics']['arima']['mae']:.6f}")
    print(f"  Direction Accuracy: {results['metrics']['arima']['direction_accuracy']:.2f}%")
    
    print("\nGARCH Model:")
    print(f"  RMSE: {results['metrics']['garch']['rmse']:.6f}")
    print(f"  MAE: {results['metrics']['garch']['mae']:.6f}")
    
    print("\n" + "=" * 60)
    print("Analysis complete!")
    print("=" * 60)
