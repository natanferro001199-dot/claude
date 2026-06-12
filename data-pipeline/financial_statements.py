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

def quarter_label(ts):
    """Convert a pandas Timestamp to a 'Q# YYYY' label."""
    try:
        q = (ts.month - 1) // 3 + 1
        return f"Q{q} {ts.year}"
    except Exception:
        return str(ts)

def fetch_statements(stock):
    try:
        info = stock.info or {}

        # Financials (annual, in absolute values from yfinance)
        fin = stock.financials  # Income statement
        bal = stock.balance_sheet
        cf = stock.cashflow

        # Quarterly statements (yfinance provides up to 8 recent quarters)
        finq = stock.quarterly_financials
        cfq = stock.quarterly_cashflow

        def series_to_list(df, key, divisor=1e6, count=5):
            """Extract a metric across the most recent `count` periods, convert to $M.

            Returns oldest -> newest ordering to match the years list.
            """
            if df is None or df.empty or key not in df.index:
                return [None] * count
            vals = df.loc[key].values[:count]  # Most recent `count` periods
            return [safe(v / divisor) if v is not None else None for v in reversed(vals)]

        def series_to_list_q(df, key, divisor=1e6, count=8):
            """Extract a quarterly metric, most-recent-first ordering."""
            if df is None or df.empty or key not in df.index:
                return [None] * count
            vals = df.loc[key].values[:count]  # Most recent `count` quarters
            return [safe(v / divisor) if v is not None else None for v in vals]

        # Annual periods — up to 5 years
        years = []
        if fin is not None and not fin.empty:
            years = [str(c.year) for c in reversed(fin.columns[:5])]
        if not years:
            years = ["2021", "2022", "2023", "2024", "2025"]

        # Quarterly periods — up to 8 quarters, most recent first
        quarters = []
        if finq is not None and not finq.empty:
            quarters = [quarter_label(c) for c in finq.columns[:8]]

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

        # Quarterly income statement (last 8 quarters, most recent first)
        is_data_q = {
            "quarters": quarters,
            "revenue": series_to_list_q(finq, "Total Revenue"),
            "grossProfit": series_to_list_q(finq, "Gross Profit"),
            "operatingIncome": series_to_list_q(finq, "Operating Income"),
            "netIncome": series_to_list_q(finq, "Net Income"),
            "eps": series_to_list_q(finq, "Diluted EPS", divisor=1),
        }

        # Quarterly cash flow (last 8 quarters, most recent first)
        cf_data_q = {
            "quarters": quarters,
            "operatingCF": series_to_list_q(cfq, "Operating Cash Flow"),
            "capex": series_to_list_q(cfq, "Capital Expenditure"),
            "freeCashFlow": series_to_list_q(cfq, "Free Cash Flow"),
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

        # Ohlson O-Score (probability of financial distress, 0-100)
        ohlson = compute_ohlson_o_score(info, is_data, bs_data, cf_data)

        return {
            "valuation": valuation,
            "health": health,
            "growth": growth,
            "incomeStatement": is_data,
            "balanceSheet": bs_data,
            "cashFlow": cf_data,
            "incomeStatementQ": is_data_q,
            "cashFlowQ": cf_data_q,
            "dcf": dcf,
            "valuationBands": [],  # Requires historical data not available on free tier
            "sectorKpis": {},
            "piotroskiScore": piotroski,
            "ohlsonScore": ohlson,
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

def compute_ohlson_o_score(info, is_data, bs_data, cf_data):
    """Ohlson O-Score (1980) — probability of financial distress (0-100).

    Returns a probability percentage. Higher = greater bankruptcy risk.
    Values flow in $M but ratios are unit-invariant; the GNP price-level
    index is normalized to a constant of 100.
    """
    import math
    try:
        ta = bs_data["totalAssets"][-1]
        te = bs_data["totalEquity"][-1]
        ni_list = is_data.get("netIncome") or []
        ni = ni_list[-1] if ni_list else None
        ni_prev = ni_list[-2] if len(ni_list) >= 2 else None
        ocf = cf_data["operatingCF"][-1] if cf_data.get("operatingCF") else None

        if ta is None or ta <= 0 or te is None:
            return None

        tl = ta - te  # Total liabilities
        if tl is None:
            return None

        current_ratio = info.get("currentRatio")
        # Current assets / liabilities not on the free tier — approximate.
        # Assume current liabilities ~40% of total liabilities, then derive
        # current assets from the current ratio.
        cl = tl * 0.4 if tl > 0 else abs(tl) * 0.4
        ca = (cl * current_ratio) if (cl and current_ratio) else cl
        wc = (ca - cl) if (ca is not None and cl is not None) else 0.0

        gnp = 100.0  # GNP price-level index normalization constant
        ni_val = ni if ni is not None else 0.0
        x1 = 1.0 if tl > ta else 0.0
        x2 = 1.0 if (ni is not None and ni < 0 and ni_prev is not None and ni_prev < 0) else 0.0
        nip = ni_prev if ni_prev is not None else ni_val
        denom = abs(ni_val) + abs(nip)
        chin = (ni_val - nip) / denom if denom else 0.0

        o = (-1.32
             - 0.407 * math.log(ta / gnp)
             + 6.03 * (tl / ta)
             - 1.43 * (wc / ta)
             + 0.076 * ((cl / ca) if (ca and ca != 0) else 0.0)
             - 1.72 * x1
             - 2.37 * (ni_val / ta)
             - 1.83 * ((ocf / tl) if (ocf is not None and tl) else 0.0)
             + 0.285 * x2
             - 0.521 * chin)

        # Numerically stable logistic
        if o >= 0:
            prob = 1.0 / (1.0 + math.exp(-o))
        else:
            e = math.exp(o)
            prob = e / (1.0 + e)
        return round(prob * 100, 1)
    except Exception:
        return None
