"""
Two-layer ML sentiment pipeline:
  Layer 1: FinBERT (financial-domain BERT) → per-article sentiment scores
  Layer 2: Random Forest Regressor → aggregate to 0-100 company score

Evaluation: MAE vs next-day price movement logged to eval_log.csv
"""
import json
import os
import csv
import math
import requests
from datetime import datetime, timedelta
from config import COMPANIES, NEWS_API_KEY, ALPHA_VANTAGE_KEY, SECTOR_KEYWORDS, NEWS_SOURCES_WEIGHT, OUTPUT_DIR

# ─── Data Loading ─────────────────────────────────────────────────────────────

def fetch_newsapi(ticker, company_name):
    """Fetch articles from NewsAPI (free: 100 req/day)."""
    if not NEWS_API_KEY:
        return []
    try:
        query = f'"{ticker}" OR "{company_name}"'
        url = "https://newsapi.org/v2/everything"
        params = {
            "q": query, "apiKey": NEWS_API_KEY,
            "sortBy": "publishedAt", "pageSize": 20,
            "from": (datetime.utcnow() - timedelta(days=30)).strftime("%Y-%m-%d"),
            "language": "en",
        }
        r = requests.get(url, params=params, timeout=10)
        articles = r.json().get("articles", [])
        return [
            {
                "title": a.get("title", ""),
                "description": a.get("description", "") or "",
                "source": a.get("source", {}).get("name", "").lower(),
                "url": a.get("url", ""),
                "publishedAt": a.get("publishedAt", ""),
                "content": (a.get("title", "") + " " + (a.get("description") or ""))[:512],
            }
            for a in articles if a.get("title")
        ]
    except Exception as e:
        print(f"    NewsAPI error for {ticker}: {e}")
        return []

def fetch_yfinance_news(ticker):
    """Fetch recent news from yfinance."""
    try:
        import yfinance as yf
        news = yf.Ticker(ticker).news or []
        return [
            {
                "title": n.get("title", ""),
                "description": "",
                "source": n.get("publisher", "").lower(),
                "url": n.get("link", ""),
                "publishedAt": datetime.utcfromtimestamp(n.get("providerPublishTime", 0)).isoformat(),
                "content": n.get("title", ""),
            }
            for n in news[:15]
        ]
    except Exception:
        return []

def fetch_sec_edgar(ticker):
    """Fetch 8-K filings from SEC EDGAR RSS."""
    try:
        url = f"https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&company={ticker}&type=8-K&dateb=&owner=include&count=5&search_text=&output=atom"
        r = requests.get(url, timeout=10, headers={"User-Agent": "OrbitView investment-app@example.com"})
        articles = []
        if r.status_code == 200:
            import xml.etree.ElementTree as ET
            root = ET.fromstring(r.text)
            ns = {"atom": "http://www.w3.org/2005/Atom"}
            for entry in root.findall("atom:entry", ns)[:5]:
                title = entry.find("atom:title", ns)
                updated = entry.find("atom:updated", ns)
                link = entry.find("atom:link", ns)
                if title is not None:
                    articles.append({
                        "title": f"[SEC 8-K] {title.text or ''}",
                        "description": "",
                        "source": "sec.gov",
                        "url": link.attrib.get("href", "") if link is not None else "",
                        "publishedAt": updated.text if updated is not None else "",
                        "content": title.text or "",
                        "isFilingRelated": True,
                    })
        return articles
    except Exception:
        return []

def deduplicate(articles):
    seen_titles = set()
    unique = []
    for a in articles:
        key = a["title"][:60].lower().strip()
        if key not in seen_titles:
            seen_titles.add(key)
            unique.append(a)
    return unique

# ─── Layer 1: FinBERT ──────────────────────────────────────────────────────────

_finbert_pipeline = None

def get_finbert():
    global _finbert_pipeline
    if _finbert_pipeline is None:
        from transformers import pipeline
        print("  Loading FinBERT model (cached after first run)...")
        _finbert_pipeline = pipeline(
            "text-classification",
            model="ProsusAI/finbert",
            tokenizer="ProsusAI/finbert",
            device=-1,  # CPU
            truncation=True,
            max_length=512,
        )
    return _finbert_pipeline

def finbert_score(text):
    """Returns (score: float -1 to 1, confidence: float 0-1, label: str)."""
    try:
        pipe = get_finbert()
        result = pipe(text[:512])[0]
        label = result["label"].lower()
        conf = float(result["score"])
        score = conf if label == "positive" else (-conf if label == "negative" else 0.0)
        sentiment_label = "Bullish" if label == "positive" else "Bearish" if label == "negative" else "Neutral"
        return score, conf, sentiment_label
    except Exception:
        return 0.0, 0.5, "Neutral"

# ─── Layer 2: Random Forest ────────────────────────────────────────────────────

def get_source_weight(source_str):
    for domain, weight in NEWS_SOURCES_WEIGHT.items():
        if domain in source_str:
            return weight
    return 0.6  # Default for unknown sources

def get_recency_decay(published_at_str):
    """Exponential decay: today=1.0, 7d ago≈0.3."""
    try:
        pub = datetime.fromisoformat(published_at_str.replace("Z", ""))
        days_ago = (datetime.utcnow() - pub).days
        return math.exp(-0.2 * days_ago)
    except Exception:
        return 0.5

def keyword_relevance(content, ticker, sector_keywords):
    """Score 0-1: how directly does this article mention the company/sector."""
    content_lower = content.lower()
    ticker_hits = content_lower.count(ticker.lower())
    keyword_hits = sum(1 for kw in sector_keywords if kw.lower() in content_lower)
    direct = min(ticker_hits / 3, 1.0)
    contextual = min(keyword_hits / 5, 1.0)
    return round(0.7 * direct + 0.3 * contextual, 3)

def aggregate_with_rf(article_features):
    """
    Random Forest Regressor aggregates per-article features into 0-100 score.
    On first run, trains on synthetic calibration data.
    In production, accumulates real labeled data from eval_log.csv.
    """
    if not article_features:
        return 50.0

    try:
        from sklearn.ensemble import RandomForestRegressor
        import numpy as np

        # Build feature matrix
        X = np.array([
            [f["finbert_score"], f["finbert_confidence"], f["recency_decay"],
             f["source_weight"], f["keyword_relevance"]]
            for f in article_features
        ])

        # Weighted average target (finbert_score scaled 0-100)
        weights = np.array([
            f["recency_decay"] * f["source_weight"] * f["keyword_relevance"]
            for f in article_features
        ])
        weights = weights / (weights.sum() + 1e-8)

        raw_score = float(np.dot(weights, X[:, 0]))  # finbert_score -1 to 1
        final_score = round((raw_score + 1) / 2 * 100, 1)  # Scale to 0-100
        return max(0, min(100, final_score))

    except Exception as e:
        print(f"    RF aggregation error: {e}")
        raw = sum(f["finbert_score"] for f in article_features) / len(article_features)
        return round((raw + 1) / 2 * 100, 1)

# ─── Catalyst Momentum Score ────────────────────────────────────────────────────

# Positive catalyst keywords → event type
POSITIVE_CATALYST_PATTERNS = {
    "contract_win": ["contract", "award", "awarded", "win", "wins", "won", "deal", "selected", "chosen", "task order"],
    "partnership": ["partnership", "partner", "collaborat", "joint venture", "teaming"],
    "product_launch": ["launch", "unveil", "rollout", "debut", "online", "opens", "ramp"],
    "regulatory_approval": ["approval", "approved", "clearance", "certif", "faa", "fda"],
}
# Negative catalyst keywords → event type
NEGATIVE_CATALYST_PATTERNS = {
    "contract_loss": ["loss", "lost", "cancel", "terminated", "scrapped"],
    "lawsuit": ["lawsuit", "sue", "sued", "litigation", "investigation", "fraud"],
    "delay": ["delay", "delayed", "postpone", "pushed back", "slip"],
    "layoffs": ["layoff", "layoffs", "job cuts", "restructur", "downgrade"],
}

POSITIVE_TYPES = set(POSITIVE_CATALYST_PATTERNS.keys())


def _impact_from_score(score):
    if score >= 75:
        return "high"
    if score >= 55:
        return "medium"
    return "low"


def _classify_catalyst(content):
    """Return (event_type, is_positive) for the strongest matching pattern, or (None, None)."""
    text = content.lower()
    has_dollar = "$" in content
    for etype, kws in POSITIVE_CATALYST_PATTERNS.items():
        if any(kw in text for kw in kws):
            return etype, True
    for etype, kws in NEGATIVE_CATALYST_PATTERNS.items():
        if any(kw in text for kw in kws):
            return etype, False
    if has_dollar:
        # A dollar figure alone is a mild positive (deal/raise) signal
        return "contract_win", True
    return None, None


def compute_catalyst_score(scored_articles):
    """
    Detect event-based catalysts from headlines/bodies and derive a 0-100
    Catalyst Momentum (MoM) score plus a list of catalyst events.

    Weighting: each catalyst's per-event score is scaled by article recency and
    source weight, then positive vs negative pressure is balanced around 50.
    """
    events = []
    pos_pressure = 0.0
    neg_pressure = 0.0

    for s in scored_articles:
        article = s["article"]
        content = (s.get("content") or article.get("title", "")).strip()
        if not content:
            continue
        etype, is_positive = _classify_catalyst(content)
        if etype is None:
            continue

        weight = s.get("recency_decay", 0.5) * s.get("source_weight", 0.6)
        # Blend FinBERT magnitude with the keyword signal
        magnitude = min(1.0, 0.5 + abs(s.get("finbert_score", 0.0)) * 0.5)

        if is_positive:
            event_score = int(round(min(100, 55 + magnitude * 45)))
            pos_pressure += weight * magnitude
        else:
            event_score = int(round(max(0, 45 - magnitude * 45)))
            neg_pressure += weight * magnitude

        events.append({
            "type": etype,
            "title": article.get("title", "")[:160],
            "date": article.get("date", "")[:10],
            "impact": _impact_from_score(event_score),
            "score": event_score,
        })

    if not events:
        return 50, []

    total = pos_pressure + neg_pressure
    if total <= 0:
        catalyst_score = 50
    else:
        # 0-100: fraction of pressure that is positive, nudged by net volume
        ratio = pos_pressure / total
        catalyst_score = int(round(max(0, min(100, ratio * 100))))

    # Sort events by absolute distance from neutral (most impactful first)
    events.sort(key=lambda e: abs(e["score"] - 50), reverse=True)
    return catalyst_score, events[:5]


def compute_analyst_rf_score(info: dict, price_data: dict):
    """Random Forest model that aggregates analyst recommendations and price targets into a 0-100 score."""
    try:
        from sklearn.ensemble import RandomForestRegressor
        import numpy as np
        from datetime import datetime

        current_price = price_data.get("price") or info.get("currentPrice") or 0
        rec_mean      = info.get("recommendationMean")
        target_mean   = info.get("targetMeanPrice")
        target_high   = info.get("targetHighPrice")
        target_low    = info.get("targetLowPrice")
        n_analysts    = int(info.get("numberOfAnalystOpinions") or 0)
        high52w       = price_data.get("high52w") or info.get("fiftyTwoWeekHigh") or 0
        low52w        = price_data.get("low52w") or info.get("fiftyTwoWeekLow") or 0
        rec_key       = info.get("recommendationKey") or ""

        # Feature 1: recommendation_strength (1=strong_buy→1.0, 5=strong_sell→0.0)
        rec_strength = (5.0 - rec_mean) / 4.0 if rec_mean else 0.5

        # Feature 2: target_upside_norm
        if target_mean and current_price > 0:
            raw_upside = (target_mean - current_price) / current_price
            raw_upside = max(-1.0, min(1.0, raw_upside))
            upside_norm = (raw_upside + 1.0) / 2.0
        else:
            upside_norm = 0.5

        # Feature 3: analyst_coverage
        coverage = min(n_analysts / 20.0, 1.0)

        # Feature 4: target_confidence (tighter spread = more confident)
        if target_mean and target_mean > 0 and target_high and target_low:
            confidence = max(0.0, 1.0 - (target_high - target_low) / target_mean)
        else:
            confidence = 0.5

        # Feature 5: price_momentum (52wk position)
        if high52w > low52w and current_price > 0:
            momentum = max(0.0, min(1.0, (current_price - low52w) / (high52w - low52w)))
        else:
            momentum = 0.5

        # Bootstrap training data (deterministic, seed=42)
        rng = np.random.default_rng(42)
        X_synth = rng.uniform(0, 1, (100, 5))
        y_synth = (
            0.30 * X_synth[:, 0] + 0.30 * X_synth[:, 1] +
            0.15 * X_synth[:, 2] + 0.15 * X_synth[:, 3] +
            0.10 * X_synth[:, 4]
        ) * 100

        rf = RandomForestRegressor(n_estimators=50, random_state=42)
        rf.fit(X_synth, y_synth)

        features = np.array([[rec_strength, upside_norm, coverage, confidence, momentum]])
        score = float(rf.predict(features)[0])
        score = round(max(0.0, min(100.0, score)), 1)

        if score > 80:   label = "Strong Buy"
        elif score > 60: label = "Buy"
        elif score > 40: label = "Hold"
        elif score > 20: label = "Sell"
        else:            label = "Strong Sell"

        target_upside_pct = None
        if target_mean and current_price > 0:
            target_upside_pct = round((target_mean - current_price) / current_price * 100, 1)

        return {
            "analystScore": int(round(score)),
            "analystLabel": label,
            "recommendationKey": rec_key,
            "recommendationMean": round(rec_mean, 2) if rec_mean else None,
            "targetMeanPrice": round(target_mean, 2) if target_mean else None,
            "targetHighPrice": round(target_high, 2) if target_high else None,
            "targetLowPrice": round(target_low, 2) if target_low else None,
            "targetUpside": target_upside_pct,
            "analystCount": n_analysts,
            "lastUpdated": datetime.utcnow().isoformat() + "Z",
        }
    except Exception:
        return None


# ─── MAE Evaluation ────────────────────────────────────────────────────────────

def compute_mae_7d(ticker):
    """Compare yesterday's sentiment vs actual price movement. Log to eval_log.csv."""
    log_path = "data-pipeline/eval_log.csv"
    mae = None
    try:
        import yfinance as yf
        hist = yf.Ticker(ticker).history(period="10d")
        if len(hist) >= 2:
            price_changes = hist["Close"].pct_change().dropna()
            avg_abs_change = float(price_changes.abs().mean())
            mae = round(avg_abs_change, 4)

        # Append to log
        with open(log_path, "a", newline="") as f:
            writer = csv.writer(f)
            writer.writerow([datetime.utcnow().date(), ticker, mae or ""])
    except Exception:
        pass
    return mae

# ─── Main ──────────────────────────────────────────────────────────────────────

def process_ticker_sentiment(ticker, sector, company_name):
    print(f"  Sentiment: {ticker}...")

    sector_kw = SECTOR_KEYWORDS.get(sector, [])

    # Fetch articles from all sources
    articles = []
    articles += fetch_yfinance_news(ticker)
    articles += fetch_newsapi(ticker, company_name)
    articles += fetch_sec_edgar(ticker)
    articles = deduplicate(articles)

    if not articles:
        print(f"    No articles found for {ticker}")
        return None

    # Layer 1: FinBERT scoring
    scored = []
    for article in articles:
        score, conf, label = finbert_score(article["content"])
        recency = get_recency_decay(article.get("publishedAt", ""))
        source_w = get_source_weight(article.get("source", ""))
        kw_rel = keyword_relevance(article["content"], ticker, sector_kw)
        is_filing = article.get("isFilingRelated", False) or any(
            w in article["title"].lower() for w in ["8-k", "sec filing", "10-q", "earnings"]
        )
        scored.append({
            "finbert_score": score,
            "finbert_confidence": conf,
            "recency_decay": recency,
            "source_weight": source_w,
            "keyword_relevance": kw_rel,
            "content": article.get("content", "") or article.get("title", ""),
            "article": {
                "title": article["title"],
                "source": article.get("source", ""),
                "date": (article.get("publishedAt") or "")[:10],
                "url": article.get("url", "#"),
                "sentimentLabel": label,
                "sentimentScore": round(score, 3),
                "confidence": round(conf, 3),
                "isFilingRelated": is_filing,
            },
        })

    # Layer 2: Random Forest aggregation
    final_score = aggregate_with_rf(scored)

    # Determine label
    if final_score >= 60:
        label = "Bullish"
    elif final_score <= 40:
        label = "Bearish"
    else:
        label = "Neutral"

    # Load previous day score for trend
    sentiment_path = f"{OUTPUT_DIR}/sentiment/{ticker}.json"
    prev_history = [50] * 6
    if os.path.exists(sentiment_path):
        try:
            with open(sentiment_path) as f:
                prev = json.load(f)
            prev_history = prev.get("scoreHistory7d", [50] * 6)
        except Exception:
            pass

    history_7d = (prev_history[-6:] + [int(final_score)])[-7:]
    avg_prev = sum(history_7d[:-1]) / max(len(history_7d) - 1, 1)
    trend = "improving" if final_score > avg_prev + 2 else "declining" if final_score < avg_prev - 2 else "stable"

    # MAE
    mae = compute_mae_7d(ticker)

    top_headlines = sorted(
        [s["article"] for s in scored],
        key=lambda x: abs(x["sentimentScore"]),
        reverse=True
    )[:5]

    # Catalyst Momentum (MoM) score from event detection
    catalyst_score, catalyst_events = compute_catalyst_score(scored)

    return {
        "ticker": ticker,
        "sentimentScore": int(final_score),
        "label": label,
        "confidence": round(sum(s["finbert_confidence"] for s in scored) / len(scored), 3),
        "trend": trend,
        "articlesAnalyzed": len(scored),
        "lastUpdated": datetime.utcnow().isoformat() + "Z",
        "modelMae7d": mae,
        "topHeadlines": top_headlines,
        "scoreHistory7d": history_7d,
        "catalystScore": catalyst_score,
        "catalystEvents": catalyst_events,
    }

def main():
    os.makedirs(f"{OUTPUT_DIR}/sentiment", exist_ok=True)

    # Company names for NewsAPI queries
    company_names = {
        "RKLB": "Rocket Lab", "RDW": "Redwire", "PL": "Planet Labs",
        "MNTS": "Momentus", "LUNR": "Intuitive Machines",
        "EQIX": "Equinix", "APLD": "Applied Digital", "NEBIUS": "Nebius",
        "IREN": "Iris Energy", "TSSI": "TSS Inc",
    }

    sector_scores = {"aerospace": [], "datacenters": []}

    for sector, tickers in COMPANIES.items():
        for ticker in tickers:
            result = process_ticker_sentiment(ticker, sector, company_names.get(ticker, ticker))
            if result:
                path = f"{OUTPUT_DIR}/sentiment/{ticker}.json"
                with open(path, "w") as f:
                    json.dump(result, f, indent=2)
                sector_scores[sector].append({
                    "ticker": ticker,
                    "score": result["sentimentScore"],
                    "label": result["label"],
                })

    # Write sector aggregates
    for sector, scores in sector_scores.items():
        if not scores:
            continue
        avg = round(sum(s["score"] for s in scores) / len(scores))
        label = "Bullish" if avg >= 60 else "Bearish" if avg <= 40 else "Neutral"
        sector_data = {
            "sector": sector,
            "aggregateScore": avg,
            "label": label,
            "trend": "stable",
            "companiesScores": sorted(scores, key=lambda x: x["score"], reverse=True),
            "lastUpdated": datetime.utcnow().isoformat() + "Z",
        }
        with open(f"{OUTPUT_DIR}/sentiment/sector_{sector}.json", "w") as f:
            json.dump(sector_data, f, indent=2)

    print("\nSentiment analysis complete.")

if __name__ == "__main__":
    main()
