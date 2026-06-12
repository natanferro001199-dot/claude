"""
Fetch and structure IS, BS, CFS + DCF + valuation for a ticker.
Returns a FundamentalData dict matching the TypeScript FundamentalData type.
"""
import numpy as np

RISK_FREE_RATE = 0.045  # 10Y US Treasury approximation

def safe(val):
    """Convert pandas NaN / None to Python None."""
    try:
        if val is None:
            return None
        f = float(val)
        import math
        return None if math.isnan(f) or math.isinf(f) else round(f, 4)
    except Exception:
        return None

def fetch_statements(stock):
    try:
        info = stock.info or {}

        # Financials (annual, in absolute values from yfinance)
        fin = stock.financials  # Income statement
        bal = stock.balance_sheet
        cf = stock.cashflow

        def series_to_list(df, key, divisor=1e6):
            """Extract a metric across years, convert to $M."""
            if df is None or df.empty or key not in df.index:
                return [None, None, None, None]
            vals = df.loc[key].values[:4]  # Last 4 years
            return [safe(v / divisor) if v is not None else None for v in reversed(vals)]

        years = []
        if fin is not None and not fin.empty:
            years = [str(c.year) for c in reversed(fin.columns[:4])]
        if not years:
            years = ["2022", "2023", "2024", "2025"]

        is_data = {
            "years": years,
            "revenue": series_to_list(fin, "Total Revenue"),
            "grossProfit": series_to_list(fin, "Gross Profit"),
            "operatingIncome": series_to_list(fin, "Operating Income"),
            "ebitda": series_to_list(fin, "EBITDA"),
            "netIncome": series_to_list(fin, "Net Income"),
            "eps": series_to_list(fin, "Diluted EPS", divisor=1),
        }

        bs_data = {
            "years": years,
            "cash": series_to_list(bal, "Cash And Cash Equivalents"),
            "totalAssets": series_to_list(bal, "Total Assets"),
            "totalDebt": series_to_list(bal, "Total Debt"),
            "totalEquity": series_to_list(bal, "Stockholders Equity"),
            "sharesOutstanding": series_to_list(bal, "Ordinary Shares Number", divisor=1e6),
        }

        cf_data = {
            "years": years,
            "operatingCF": series_to_list(cf, "Operating Cash Flow"),
            "capex": series_to_list(cf, "Capital Expenditure"),
            "freeCashFlow": series_to_list(cf, "Free Cash Flow"),
            "financingCF": series_to_list(cf, "Financing Cash Flow"),
        }

        # Valuation multiples from info dict
        market_cap = info.get("marketCap")
        revenue = info.get("totalRevenue")
        ebitda_val = info.get("ebitda")
        enterprise_value = info.get("enterpriseValue")

        valuation = {
            "pe": safe(info.get("trailingPE")),
            "forwardPe": safe(info.get("forwardPE")),
            "evEbitda": safe(info.get("enterpriseToEbitda")),
            "evRevenue": safe(info.get("enterpriseToRevenue")),
            "ps": safe(info.get("priceToSalesTrailing12Months")),
            "pb": safe(info.get("priceToBook")),
            "pfcf": None,  # Computed manually if needed
        }

        # Financial health
        health = {
            "grossMargin": safe((info.get("grossMargins") or 0) * 100),
            "operatingMargin": safe((info.get("operatingMargins") or 0) * 100),
            "netMargin": safe((info.get("profitMargins") or 0) * 100),
            "roic": safe((info.get("returnOnEquity") or 0) * 100),
            "roe": safe((info.get("returnOnEquity") or 0) * 100),
            "debtToEquity": safe((info.get("debtToEquity") or 0) / 100),
            "currentRatio": safe(info.get("currentRatio")),
            "quickRatio": safe(info.get("quickRatio")),
            "fcfYield": None,
            "interestCoverage": None,
        }

        growth = {
            "revenueGrowthYoY": safe((info.get("revenueGrowth") or 0) * 100),
            "revenueGrowth3Y": None,
            "ebitdaGrowthYoY": None,
            "epsGrowthYoY": safe((info.get("earningsGrowth") or 0) * 100),
            "fcfGrowthYoY": None,
        }

        # Simple DCF computation
        price = info.get("currentPrice") or 1
        fcf_list = [v for v in cf_data["freeCashFlow"] if v is not None]
        latest_fcf = fcf_list[-1] * 1e6 if fcf_list else None  # back to absolute
        shares = info.get("sharesOutstanding") or 1

        dcf = compute_dcf(price, latest_fcf, shares, info)

        # Piotroski F-Score (simplified)
        piotroski = compute_piotroski(info, is_data, bs_data, cf_data)

        return {
            "valuation": valuation,
            "health": health,
            "growth": growth,
            "incomeStatement": is_data,
            "balanceSheet": bs_data,
            "cashFlow": cf_data,
            "dcf": dcf,
            "valuationBands": [],  # Requires historical data not available on free tier
            "sectorKpis": {},
            "piotroskiScore": piotroski,
        }
    except Exception as e:
        print(f"    Error fetching statements: {e}")
        return None

def compute_dcf(price, latest_fcf, shares, info):
    """Compute 3-scenario DCF and reverse DCF."""
    wacc_base = RISK_FREE_RATE + 0.055  # ~10%
    scenarios = []
    for label, growth_rate, wacc_adj, terminal in [
        ("Bull", 0.30, -0.01, 0.035),
        ("Base", 0.15, 0.0, 0.025),
        ("Bear", 0.03, 0.02, 0.015),
    ]:
        wacc = wacc_base + wacc_adj
        if latest_fcf and latest_fcf > 0:
            fcf = latest_fcf
            pv = 0
            for yr in range(1, 11):
                fcf *= (1 + growth_rate)
                pv += fcf / (1 + wacc) ** yr
            terminal_val = (fcf * (1 + terminal)) / (wacc - terminal)
            pv += terminal_val / (1 + wacc) ** 10
            intrinsic = round(pv / shares, 2) if shares else 0
        else:
            intrinsic = price * (1.5 if label == "Bull" else 1.0 if label == "Base" else 0.6)
        upside = round((intrinsic / price - 1) * 100, 1) if price else 0
        scenarios.append({
            "label": label,
            "fcfGrowthRate": int(growth_rate * 100),
            "wacc": round(wacc * 100, 1),
            "terminalGrowth": round(terminal * 100, 1),
            "intrinsicValue": intrinsic,
            "upsideDownside": upside,
        })

    # Reverse DCF: what growth rate justifies current price?
    implied = 0.10  # Default
    if latest_fcf and latest_fcf > 0 and price and shares:
        target_equity = price * shares
        for rate in [x / 100 for x in range(-20, 201, 1)]:
            wacc = wacc_base
            fcf = latest_fcf
            pv = 0
            for yr in range(1, 11):
                fcf *= (1 + rate)
                pv += fcf / (1 + wacc) ** yr
            terminal_val = (fcf * 1.025) / (wacc - 0.025) if wacc > 0.025 else 0
            pv += terminal_val / (1 + wacc) ** 10
            if pv >= target_equity:
                implied = rate
                break

    return {
        "scenarios": scenarios,
        "impliedGrowthRate": round(implied * 100, 1),
        "currentPrice": price,
    }

def compute_piotroski(info, is_data, bs_data, cf_data):
    """Simplified Piotroski F-Score (0-9)."""
    score = 0
    try:
        # Profitability (4 criteria)
        net_income = is_data["netIncome"][-1] if is_data.get("netIncome") else None
        if net_income and net_income > 0: score += 1  # Positive ROA
        cf_op = cf_data["operatingCF"][-1] if cf_data.get("operatingCF") else None
        if cf_op and cf_op > 0: score += 1  # Positive operating CF
        if net_income and cf_op and cf_op > net_income: score += 1  # Accruals
        assets = bs_data["totalAssets"]
        if assets and len(assets) >= 2 and assets[-1] and assets[-2]:
            roa_now = (net_income or 0) / assets[-1]
            roa_prev = ((is_data["netIncome"][-2] or 0) if len(is_data.get("netIncome", [])) >= 2 else 0) / assets[-2]
            if roa_now > roa_prev: score += 1

        # Leverage/Liquidity (3 criteria)
        if (bs_data.get("totalDebt") and len(bs_data["totalDebt"]) >= 2 and
                bs_data["totalDebt"][-1] is not None and bs_data["totalDebt"][-2] is not None):
            if bs_data["totalDebt"][-1] < bs_data["totalDebt"][-2]: score += 1
        current_ratio = info.get("currentRatio")
        if current_ratio and current_ratio > 1: score += 1
        shares = bs_data.get("sharesOutstanding")
        if shares and len(shares) >= 2 and shares[-1] and shares[-2]:
            if shares[-1] <= shares[-2]: score += 1  # No dilution

        # Operating efficiency (2 criteria)
        gross_margins = info.get("grossMargins")
        if gross_margins and gross_margins > 0: score += 1
        rev = is_data.get("revenue")
        if rev and len(rev) >= 2 and rev[-1] and rev[-2]:
            if rev[-1] > rev[-2]: score += 1
    except Exception:
        pass
    return score
