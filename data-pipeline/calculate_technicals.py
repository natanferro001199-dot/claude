"""
Compute technical indicators from OHLCV price history.
Returns a TechnicalData dict matching the TypeScript TechnicalData type.
"""
import numpy as np

def compute_rsi(closes, period=14):
    if len(closes) < period + 1:
        return 50.0
    deltas = np.diff(closes)
    gains = np.where(deltas > 0, deltas, 0)
    losses = np.where(deltas < 0, -deltas, 0)
    avg_gain = np.mean(gains[:period])
    avg_loss = np.mean(losses[:period])
    for i in range(period, len(deltas)):
        avg_gain = (avg_gain * (period - 1) + gains[i]) / period
        avg_loss = (avg_loss * (period - 1) + losses[i]) / period
    if avg_loss == 0:
        return 100.0
    rs = avg_gain / avg_loss
    return round(100 - (100 / (1 + rs)), 2)

def compute_sma(closes, period):
    if len(closes) < period:
        return closes[-1] if closes else 0
    return round(float(np.mean(closes[-period:])), 4)

def compute_ema(closes, period):
    if len(closes) < period:
        return closes[-1] if closes else 0
    k = 2 / (period + 1)
    ema = np.mean(closes[:period])
    for price in closes[period:]:
        ema = price * k + ema * (1 - k)
    return round(float(ema), 4)

def compute_macd(closes, fast=12, slow=26, signal=9):
    if len(closes) < slow:
        return {"macd": 0, "signal": 0, "histogram": 0}
    ema_fast = compute_ema(closes, fast)
    ema_slow = compute_ema(closes, slow)
    macd_line = round(ema_fast - ema_slow, 4)
    # Simplified: signal = EMA of last 9 MACD values
    macd_values = [compute_ema(closes[:i], fast) - compute_ema(closes[:i], slow)
                   for i in range(slow, len(closes) + 1)]
    signal_line = round(compute_ema(macd_values, signal), 4) if macd_values else 0
    return {"macd": macd_line, "signal": signal_line, "histogram": round(macd_line - signal_line, 4)}

def compute_bollinger(closes, period=20, std_dev=2):
    if len(closes) < period:
        c = closes[-1] if closes else 0
        return {"upper": c, "middle": c, "lower": c}
    window = closes[-period:]
    middle = float(np.mean(window))
    std = float(np.std(window))
    return {
        "upper": round(middle + std_dev * std, 4),
        "middle": round(middle, 4),
        "lower": round(middle - std_dev * std, 4),
    }

def compute_atr(bars, period=14):
    if len(bars) < 2:
        return 0.0
    trs = []
    for i in range(1, len(bars)):
        high = bars[i]["high"]
        low = bars[i]["low"]
        prev_close = bars[i - 1]["close"]
        tr = max(high - low, abs(high - prev_close), abs(low - prev_close))
        trs.append(tr)
    if len(trs) < period:
        return round(float(np.mean(trs)), 4)
    return round(float(np.mean(trs[-period:])), 4)

def compute_technicals(price_history):
    if not price_history:
        return None
    closes = [b["close"] for b in price_history]
    volumes = [b["volume"] for b in price_history]
    last = closes[-1]

    rsi = compute_rsi(closes)
    sma20 = compute_sma(closes, 20)
    sma50 = compute_sma(closes, 50)
    sma200 = compute_sma(closes, 200)
    macd = compute_macd(closes)
    bb = compute_bollinger(closes)
    atr = compute_atr(price_history)
    vol_ma20 = int(np.mean(volumes[-20:])) if len(volumes) >= 20 else volumes[-1]

    # Support/Resistance: simple 20-period min/max
    window = closes[-20:] if len(closes) >= 20 else closes
    support = round(min(window) * 0.99, 2)
    resistance = round(max(window) * 1.01, 2)

    # Trend strength
    if last > sma50 > sma200 and macd["histogram"] > 0:
        trend = "strong-up"
    elif last > sma50 and macd["histogram"] > 0:
        trend = "up"
    elif last < sma50 < sma200 and macd["histogram"] < 0:
        trend = "strong-down"
    elif last < sma50:
        trend = "down"
    else:
        trend = "neutral"

    # Signals
    signals = []
    signals.append({"label": "RSI", "value": str(rsi),
                     "interpretation": "bullish" if rsi > 60 else "bearish" if rsi < 40 else "neutral"})
    macd_interp = "bullish" if macd["histogram"] > 0 else "bearish"
    signals.append({"label": "MACD", "value": "Bullish" if macd_interp == "bullish" else "Bearish",
                     "interpretation": macd_interp})
    sma50_pct = round((last / sma50 - 1) * 100, 1) if sma50 else 0
    signals.append({"label": "Price vs SMA50", "value": f"{'+' if sma50_pct >= 0 else ''}{sma50_pct}%",
                     "interpretation": "bullish" if sma50_pct > 5 else "bearish" if sma50_pct < -5 else "neutral"})
    sma200_pct = round((last / sma200 - 1) * 100, 1) if sma200 else 0
    signals.append({"label": "Price vs SMA200", "value": f"{'+' if sma200_pct >= 0 else ''}{sma200_pct}%",
                     "interpretation": "bullish" if sma200_pct > 0 else "bearish"})

    return {
        "indicators": {
            "rsi14": rsi,
            "sma20": sma20,
            "sma50": sma50,
            "sma200": sma200,
            "macd": macd,
            "bollingerBands": bb,
            "volumeMA20": vol_ma20,
            "atr14": atr,
        },
        "signals": signals,
        "trendStrength": trend,
        "supportLevel": support,
        "resistanceLevel": resistance,
    }
