"""
Fetch price + fundamental data for all companies via yfinance + FMP API.
Outputs per-ticker JSON to public/data/{sector}/{TICKER}.json
"""
import asyncio
import json
import os
from datetime import datetime, date, timedelta
import yfinance as yf
import requests
from config import COMPANIES, FMP_API_KEY, OUTPUT_DIR
from calculate_technicals import compute_technicals
from financial_statements import fetch_statements

MARKET_CAP_CATEGORIES = {
    "micro": 300_000_000,
    "small": 2_000_000_000,
    "mid": 10_000_000_000,
}

def get_market_cap_category(market_cap):
    if not market_cap:
        return "micro"
    if market_cap < MARKET_CAP_CATEGORIES["micro"]:
        return "micro"
    elif market_cap < MARKET_CAP_CATEGORIES["small"]:
        return "small"
    elif market_cap < MARKET_CAP_CATEGORIES["mid"]:
        return "mid"
    return "large"

def fetch_fmp_fundamentals(ticker):
    """Fetch deeper fundamentals from FMP (free tier)."""
    if not FMP_API_KEY:
        return {}
    try:
        url = f"https://financialmodelingprep.com/api/v3/key-metrics-ttm/{ticker}?apikey={FMP_API_KEY}"
        r = requests.get(url, timeout=10)
        data = r.json()
        if isinstance(data, list) and data:
            return data[0]
    except Exception:
        pass
    return {}

def process_ticker(ticker, sector):
    print(f"  Processing {ticker}...")
    try:
        stock = yf.Ticker(ticker)
        info = stock.info or {}

        price = info.get("currentPrice") or info.get("regularMarketPrice")
        prev_close = info.get("previousClose") or price
        price_change = (price - prev_close) if price and prev_close else 0
        price_change_pct = (price_change / prev_close * 100) if prev_close else 0
        market_cap = info.get("marketCap")

        # Price history (1 year of daily OHLCV)
        hist = stock.history(period="1y", interval="1d")
        price_history = []
        if not hist.empty:
            for idx, row in hist.iterrows():
                price_history.append({
                    "time": str(idx.date()),
                    "open": round(float(row["Open"]), 2),
                    "high": round(float(row["High"]), 2),
                    "low": round(float(row["Low"]), 2),
                    "close": round(float(row["Close"]), 2),
                    "volume": int(row["Volume"]),
                })

        # Data confidence
        confidence = "high"
        if not price_history or len(price_history) < 30:
            confidence = "low"
        elif market_cap and market_cap < 500_000_000:
            confidence = "medium"

        # Technical indicators
        technicals = compute_technicals(price_history) if price_history else None

        # Financial statements
        statements = fetch_statements(stock)

        # FMP supplemental
        fmp = fetch_fmp_fundamentals(ticker)

        output = {
            "company": {
                "ticker": ticker,
                "name": info.get("longName", ticker),
                "sector": sector,
                "exchange": info.get("exchange", ""),
                "description": info.get("longBusinessSummary", "")[:400],
                "founded": info.get("founded"),
                "employees": info.get("fullTimeEmployees"),
                "website": info.get("website"),
            },
            "price": {
                "price": round(price, 2) if price else None,
                "priceChange": round(price_change, 2),
                "priceChangePct": round(price_change_pct, 2),
                "open": round(float(info.get("open", price or 0)), 2),
                "high52w": round(float(info.get("fiftyTwoWeekHigh", 0)), 2),
                "low52w": round(float(info.get("fiftyTwoWeekLow", 0)), 2),
                "volume": info.get("volume") or info.get("regularMarketVolume"),
                "avgVolume30d": info.get("averageVolume"),
                "marketCap": market_cap,
                "marketCapCategory": get_market_cap_category(market_cap),
                "lastUpdated": datetime.utcnow().isoformat() + "Z",
                "dataConfidence": confidence,
            },
            "scores": compute_scores(info, statements, technicals),
            "priceHistory": price_history,
            "technical": technicals,
            "fundamental": statements,
        }

        return output
    except Exception as e:
        print(f"    ERROR processing {ticker}: {e}")
        return None

def compute_scores(info, statements, technicals):
    """Compute composite scores from available data."""
    tech_score = 50
    fund_score = 50

    if technicals:
        rsi = technicals.get("indicators", {}).get("rsi14", 50)
        macd_hist = technicals.get("indicators", {}).get("macd", {}).get("histogram", 0)
        trend = technicals.get("trendStrength", "neutral")
        tech_score = 50
        if rsi > 60: tech_score += 10
        if rsi < 40: tech_score -= 10
        if macd_hist > 0: tech_score += 10
        if trend in ("strong-up", "up"): tech_score += 10
        if trend in ("strong-down", "down"): tech_score -= 10
        tech_score = max(0, min(100, tech_score))

    piotroski = statements.get("piotroskiScore", 4) if statements else 4
    ohlson = statements.get("ohlsonScore") if statements else None

    return {
        "technicalScore": tech_score,
        "fundamentalScore": fund_score,
        "piotroskiScore": piotroski,
        "altmanZScore": None,
        "ohlsonScore": ohlson,
        "compositeScore": round((tech_score + fund_score) / 2),
    }

def main():
    os.makedirs(f"{OUTPUT_DIR}/aerospace", exist_ok=True)
    os.makedirs(f"{OUTPUT_DIR}/datacenters", exist_ok=True)

    manifest = {
        "lastUpdated": datetime.utcnow().isoformat() + "Z",
        "dataSource": "live",
        "companies": COMPANIES,
        "nextRefresh": (datetime.utcnow() + timedelta(days=1)).isoformat() + "Z",
    }

    for sector, tickers in COMPANIES.items():
        print(f"\nFetching {sector}...")
        for ticker in tickers:
            data = process_ticker(ticker, sector)
            if data:
                path = f"{OUTPUT_DIR}/{sector}/{ticker}.json"
                with open(path, "w") as f:
                    json.dump(data, f, indent=2, default=str)
                print(f"    Saved {path}")

    with open(f"{OUTPUT_DIR}/manifest.json", "w") as f:
        json.dump(manifest, f, indent=2)
    print("\nManifest updated.")

if __name__ == "__main__":
    main()
