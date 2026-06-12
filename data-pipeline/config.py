import os

FMP_API_KEY = os.environ.get("FMP_API_KEY", "")
NEWS_API_KEY = os.environ.get("NEWS_API_KEY", "")
ALPHA_VANTAGE_KEY = os.environ.get("ALPHA_VANTAGE_KEY", "")

COMPANIES = {
    "aerospace": ["RKLB", "RDW", "PL", "MNTS", "LUNR"],
    "datacenters": ["EQIX", "APLD", "NEBIUS", "IREN", "TSSI"],
}

PLACEHOLDERS = ["VOYAGER"]

OUTPUT_DIR = "public/data"

SECTOR_KEYWORDS = {
    "aerospace": [
        "rocket launch", "satellite", "LEO", "NASA contract", "space economy",
        "orbital", "reusable rocket", "space station", "Rocket Lab", "Redwire",
        "Planet Labs", "Momentus", "Intuitive Machines", "lunar"
    ],
    "datacenters": [
        "AI data center", "GPU cluster", "data center demand", "power capacity",
        "hyperscaler", "colocation", "liquid cooling", "AI infrastructure",
        "Equinix", "Applied Digital", "Nebius", "Iris Energy", "TSS"
    ],
}

NEWS_SOURCES_WEIGHT = {
    "reuters.com": 1.0,
    "bloomberg.com": 1.0,
    "wsj.com": 1.0,
    "ft.com": 0.95,
    "cnbc.com": 0.85,
    "seekingalpha.com": 0.7,
    "spacenews.com": 0.9,
    "reddit.com": 0.4,
}
