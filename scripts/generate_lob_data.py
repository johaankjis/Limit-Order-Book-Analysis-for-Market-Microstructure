"""
Limit Order Book (LOB) Synthetic Data Generator
Generates realistic tick-level order book data for market microstructure analysis
"""

import json
import random
import math
from datetime import datetime, timedelta

def generate_lob_data(num_records=100000, symbol="AAPL"):
    """
    Generate synthetic limit order book tick data
    
    Parameters:
    - num_records: Number of tick records to generate
    - symbol: Trading symbol
    
    Returns:
    - List of order book snapshots with bid/ask levels
    """
    
    # Initialize base price and parameters
    base_price = 150.00
    volatility = 0.0002  # Tick-level volatility
    spread_base = 0.01  # Base spread in dollars
    
    # Time parameters
    start_time = datetime(2024, 1, 15, 9, 30, 0)  # Market open
    
    data = []
    current_price = base_price
    
    # Volatility regime parameters (for GARCH-like behavior)
    current_volatility = volatility
    volatility_persistence = 0.95
    
    for i in range(num_records):
        # Time increment (microseconds to simulate tick data)
        time_delta = timedelta(microseconds=random.randint(100, 5000))
        timestamp = start_time + timedelta(microseconds=i * 500)
        
        # Update volatility (GARCH-like clustering)
        shock = random.gauss(0, 1)
        current_volatility = (volatility_persistence * current_volatility + 
                             (1 - volatility_persistence) * volatility * abs(shock))
        
        # Price movement with mean reversion
        price_change = random.gauss(0, current_volatility * current_price)
        current_price = max(current_price + price_change, 1.0)
        
        # Dynamic spread based on volatility
        spread = spread_base * (1 + current_volatility / volatility * 2)
        
        # Generate bid/ask levels (5 levels each)
        mid_price = current_price
        
        # Order flow imbalance factor (-1 to 1)
        imbalance = math.sin(i / 1000) * 0.3 + random.gauss(0, 0.2)
        imbalance = max(-0.8, min(0.8, imbalance))
        
        bid_levels = []
        ask_levels = []
        
        for level in range(5):
            level_offset = spread / 2 + level * spread * 0.5
            
            # Bid side
            bid_price = round(mid_price - level_offset, 2)
            bid_size = int(max(100, random.gauss(500, 200) * (1 - imbalance * 0.3) * (1 - level * 0.15)))
            bid_orders = random.randint(1, 10)
            bid_levels.append({
                "price": bid_price,
                "size": bid_size,
                "orders": bid_orders
            })
            
            # Ask side
            ask_price = round(mid_price + level_offset, 2)
            ask_size = int(max(100, random.gauss(500, 200) * (1 + imbalance * 0.3) * (1 - level * 0.15)))
            ask_orders = random.randint(1, 10)
            ask_levels.append({
                "price": ask_price,
                "size": ask_size,
                "orders": ask_orders
            })
        
        # Trade data (random trades)
        trade_side = "buy" if random.random() > 0.5 - imbalance * 0.2 else "sell"
        trade_price = ask_levels[0]["price"] if trade_side == "buy" else bid_levels[0]["price"]
        trade_size = random.randint(1, 100) * 100
        
        record = {
            "timestamp": timestamp.isoformat(),
            "symbol": symbol,
            "mid_price": round(mid_price, 4),
            "spread": round(spread, 4),
            "bid_levels": bid_levels,
            "ask_levels": ask_levels,
            "total_bid_volume": sum(b["size"] for b in bid_levels),
            "total_ask_volume": sum(a["size"] for a in ask_levels),
            "order_imbalance": round(imbalance, 4),
            "volatility": round(current_volatility, 6),
            "last_trade": {
                "price": trade_price,
                "size": trade_size,
                "side": trade_side
            }
        }
        
        data.append(record)
        
        if (i + 1) % 10000 == 0:
            print(f"Generated {i + 1:,} records...")
    
    return data


def calculate_features(data):
    """
    Calculate microstructure features from LOB data
    """
    features = []
    
    for i, record in enumerate(data):
        if i < 10:  # Need lookback for some features
            continue
            
        # Order Flow Imbalance
        ofi = record["order_imbalance"]
        
        # Bid-Ask Spread
        spread = record["spread"]
        
        # Depth Imbalance
        total_bid = record["total_bid_volume"]
        total_ask = record["total_ask_volume"]
        depth_imbalance = (total_bid - total_ask) / (total_bid + total_ask) if (total_bid + total_ask) > 0 else 0
        
        # Price momentum (using mid price changes)
        if i >= 10:
            lookback_prices = [data[j]["mid_price"] for j in range(i-10, i)]
            price_momentum = (record["mid_price"] - lookback_prices[0]) / lookback_prices[0]
            price_volatility = sum((p - sum(lookback_prices)/10)**2 for p in lookback_prices) / 10
        else:
            price_momentum = 0
            price_volatility = 0
        
        # Spread change
        if i > 0:
            spread_change = spread - data[i-1]["spread"]
        else:
            spread_change = 0
        
        # Volume-weighted price
        vwap_bid = sum(b["price"] * b["size"] for b in record["bid_levels"]) / total_bid if total_bid > 0 else 0
        vwap_ask = sum(a["price"] * a["size"] for a in record["ask_levels"]) / total_ask if total_ask > 0 else 0
        
        # Future return (1-tick ahead) for prediction target
        if i < len(data) - 1:
            future_return = (data[i+1]["mid_price"] - record["mid_price"]) / record["mid_price"]
        else:
            future_return = 0
        
        feature_record = {
            "timestamp": record["timestamp"],
            "mid_price": record["mid_price"],
            "spread": spread,
            "order_flow_imbalance": round(ofi, 4),
            "depth_imbalance": round(depth_imbalance, 4),
            "price_momentum": round(price_momentum, 6),
            "price_volatility": round(price_volatility, 8),
            "spread_change": round(spread_change, 6),
            "vwap_bid": round(vwap_bid, 4),
            "vwap_ask": round(vwap_ask, 4),
            "total_bid_volume": total_bid,
            "total_ask_volume": total_ask,
            "volatility": record["volatility"],
            "future_return": round(future_return, 8),
            "future_direction": 1 if future_return > 0 else (-1 if future_return < 0 else 0)
        }
        
        features.append(feature_record)
    
    return features


if __name__ == "__main__":
    print("=" * 60)
    print("Limit Order Book Data Generator")
    print("=" * 60)
    
    # Generate LOB data
    print("\nGenerating 100,000 tick-level records...")
    lob_data = generate_lob_data(num_records=100000)
    
    print(f"\nGenerated {len(lob_data):,} LOB snapshots")
    
    # Calculate features
    print("\nCalculating microstructure features...")
    features = calculate_features(lob_data)
    print(f"Calculated features for {len(features):,} records")
    
    # Save data
    print("\nSaving data to JSON files...")
    
    with open("lob_data.json", "w") as f:
        json.dump(lob_data[:10000], f)  # Save first 10k for dashboard
    
    with open("features_data.json", "w") as f:
        json.dump(features[:10000], f)  # Save first 10k for dashboard
    
    # Print sample statistics
    print("\n" + "=" * 60)
    print("Sample Statistics")
    print("=" * 60)
    
    prices = [r["mid_price"] for r in lob_data]
    spreads = [r["spread"] for r in lob_data]
    volatilities = [r["volatility"] for r in lob_data]
    
    print(f"\nPrice Range: ${min(prices):.2f} - ${max(prices):.2f}")
    print(f"Average Spread: ${sum(spreads)/len(spreads):.4f}")
    print(f"Average Volatility: {sum(volatilities)/len(volatilities):.6f}")
    
    ofi_values = [f["order_flow_imbalance"] for f in features]
    print(f"Order Flow Imbalance Range: {min(ofi_values):.4f} to {max(ofi_values):.4f}")
    
    print("\n" + "=" * 60)
    print("Data generation complete!")
    print("=" * 60)
