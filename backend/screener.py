"""
BIST Hisse Tarama Motoru (Optimized: Bulk Download)
- EMA boğa dizilimi (8>21>55>89>144)
- Fiyatın EMA55/89/144 üstünde olması
- Düşen trend direncine %10'dan az uzaklık
"""

import yfinance as yf
import pandas as pd
import numpy as np
from typing import Optional
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
import time
import pickle
import logging

logger = logging.getLogger(__name__)

# BIST 100 endeksi (en likit ~100 hisse)
BIST_STOCKS = [
    "AEFES", "AGHOL", "AKBNK", "AKFGY", "AKFYE", "AKSA", "AKSEN", "ALARK",
    "ALBRK", "ANSGR", "ARCLK", "ASELS", "ASTOR", "BERA", "BIMAS", "BIOEN",
    "BRSAN", "BRYAT", "BUCIM", "CANTE", "CCOLA", "CIMSA", "CWENE", "DOAS",
    "DOHOL", "ECILC", "EGEEN", "EKGYO", "ENJSA", "ENKAI", "EREGL", "EUPWR",
    "EUREN", "FROTO", "GARAN", "GESAN", "GLYHO", "GUBRF", "GWIND", "HALKB",
    "HEKTS", "IPEKE", "ISCTR", "ISDMR", "ISGYO", "KCAER", "KCHOL", "KLSER",
    "KMPUR", "KONTR", "KONYA", "KORDS", "KOZAA", "KOZAL", "KRDMD", "MAVI",
    "MGROS", "MIATK", "MPARK", "ODAS", "OTKAR", "OYAKC", "PAPIL", "PENTA",
    "PETKM", "PGSUS", "REEDR", "SAHOL", "SASA", "SDTTR", "SISE", "SKBNK",
    "SMRTG", "SOKM", "TAVHL", "TCELL", "THYAO", "TKFEN", "TKNSA", "TOASO",
    "TRGYO", "TSKB", "TTKOM", "TUKAS", "TUPRS", "TURSG", "ULKER", "VAKBN",
    "VESBE", "VESTL", "YEOTK", "YKBNK", "YYLGD", "ZOREN", "BFREN", "FENER",
    "HATEK", "INDES", "KARTN", "LOGO", "NUHCM", "TATGD",
]

EMA_PERIODS = [8, 21, 55, 89, 144]
TREND_LOOKBACK = 90
TREND_MARGIN = 0.10
MIN_DATA_DAYS = 200

# Yahoo Finance rate-limit'e karşı disk cache (2 saat geçerli)
CACHE_DIR = Path(__file__).parent / "_cache"
CACHE_DIR.mkdir(exist_ok=True)
CACHE_TTL_SEC = 2 * 60 * 60


def _cache_path(ticker_base: str) -> Path:
    return CACHE_DIR / f"{ticker_base}.pkl"


def _load_cache(ticker_base: str) -> Optional[pd.DataFrame]:
    p = _cache_path(ticker_base)
    if not p.exists():
        return None
    if time.time() - p.stat().st_mtime > CACHE_TTL_SEC:
        return None
    try:
        with open(p, "rb") as f:
            return pickle.load(f)
    except Exception:
        return None


def _save_cache(ticker_base: str, df: pd.DataFrame) -> None:
    try:
        with open(_cache_path(ticker_base), "wb") as f:
            pickle.dump(df, f)
    except Exception as e:
        logger.warning(f"{ticker_base} cache yazma hata: {e}")


def compute_ema(series: pd.Series, period: int) -> pd.Series:
    return series.ewm(span=period, adjust=False).mean()


def find_falling_trend_resistance(high: pd.Series, lookback: int = TREND_LOOKBACK) -> Optional[float]:
    recent = high.iloc[-lookback:].copy()
    if len(recent) < 10:
        return None

    pivot_indices, pivot_values = [], []
    arr = recent.values
    for i in range(2, len(arr) - 2):
        if (arr[i] >= arr[i-1] and arr[i] >= arr[i-2]
                and arr[i] >= arr[i+1] and arr[i] >= arr[i+2]):
            pivot_indices.append(i)
            pivot_values.append(arr[i])

    if len(pivot_values) < 2:
        return float(recent.max())

    x = np.array(pivot_indices, dtype=float)
    y = np.array(pivot_values, dtype=float)
    slope, intercept = np.polyfit(x, y, 1)
    today_idx = float(len(arr) - 1)
    return float(slope * today_idx + intercept)


def _analyze_dataframe(ticker_base: str, df: pd.DataFrame,
                       ignore_rule3: bool = False) -> Optional[dict]:
    """Önceden indirilmiş bir DataFrame'i analiz eder."""
    try:
        if df is None or df.empty or len(df) < MIN_DATA_DAYS:
            return None

        df = df.dropna(subset=["Close", "High"])
        if len(df) < MIN_DATA_DAYS:
            return None

        close = df["Close"]
        high = df["High"]

        emas = {p: compute_ema(close, p) for p in EMA_PERIODS}
        latest = {p: float(emas[p].iloc[-1]) for p in EMA_PERIODS}
        current_price = float(close.iloc[-1])

        # KURAL 1: Boğa dizilimi
        if not (latest[8] > latest[21] > latest[55] > latest[89] > latest[144]):
            return None

        # KURAL 2: Fiyat EMA55/89/144 üstünde
        if not (current_price > latest[55]
                and current_price > latest[89]
                and current_price > latest[144]):
            return None

        # KURAL 3: Düşen trend direncine yakınlık (opsiyonel)
        resistance = find_falling_trend_resistance(high, TREND_LOOKBACK)
        distance_pct = None
        if resistance is not None:
            reference = min(latest[8], latest[21])
            if reference > 0:
                distance_pct = (resistance - reference) / reference

        if not ignore_rule3:
            if distance_pct is None or distance_pct < 0 or distance_pct >= TREND_MARGIN:
                return None

        prev_close = float(close.iloc[-2]) if len(close) > 1 else current_price
        daily_change_pct = ((current_price - prev_close) / prev_close) * 100

        return {
            "ticker": ticker_base,
            "price": round(current_price, 2),
            "daily_change_pct": round(daily_change_pct, 2),
            "ema8": round(latest[8], 2),
            "ema21": round(latest[21], 2),
            "ema55": round(latest[55], 2),
            "ema89": round(latest[89], 2),
            "ema144": round(latest[144], 2),
            "resistance": round(resistance, 2) if resistance else None,
            "distance_to_resistance_pct": round(distance_pct * 100, 2)
                if distance_pct is not None else None,
            "above_ema8": current_price > latest[8],
            "above_ema21": current_price > latest[21],
        }
    except Exception as e:
        logger.warning(f"{ticker_base} analiz hatası: {e}")
        return None


def _make_session():
    """Chrome TLS fingerprint'i ile Yahoo bot-tespitini aşan session."""
    try:
        from curl_cffi import requests as cffi_requests
        return cffi_requests.Session(impersonate="chrome120")
    except Exception as e:
        logger.warning(f"curl_cffi yuklenemedi: {e}")
        return None


_session = _make_session()


def _fetch_yahoo_chart(ticker_base: str) -> Optional[pd.DataFrame]:
    """Yahoo Chart API'ını direkt curl_cffi ile çağırıp DataFrame döndür."""
    if _session is None:
        return None
    url = (f"https://query2.finance.yahoo.com/v8/finance/chart/"
           f"{ticker_base}.IS?range=2y&interval=1d")
    try:
        r = _session.get(url, timeout=20)
        if r.status_code != 200:
            return None
        data = r.json()
        if "chart" not in data or not data["chart"].get("result"):
            return None
        result = data["chart"]["result"][0]
        timestamps = result.get("timestamp") or []
        if not timestamps:
            return None
        quote = result["indicators"]["quote"][0]
        # Bazı adjusted serileri varsa onları kullan
        adj = None
        if "adjclose" in result["indicators"]:
            adj = result["indicators"]["adjclose"][0].get("adjclose")

        df = pd.DataFrame({
            "Open":   quote.get("open"),
            "High":   quote.get("high"),
            "Low":    quote.get("low"),
            "Close":  adj if adj else quote.get("close"),
            "Volume": quote.get("volume"),
        }, index=pd.to_datetime(timestamps, unit="s"))
        df = df.dropna(subset=["Close"])
        return df if len(df) > 0 else None
    except Exception as e:
        logger.warning(f"{ticker_base} yahoo chart hata: {e}")
        return None


def _fetch_one(ticker_base: str, use_cache: bool = True) -> tuple[str, Optional[pd.DataFrame]]:
    """Tek hisse için veri (önce cache, yoksa direkt Yahoo Chart API, retry'lı)."""
    if use_cache:
        cached = _load_cache(ticker_base)
        if cached is not None:
            return ticker_base, cached

    for attempt in range(3):
        df = _fetch_yahoo_chart(ticker_base)
        if df is not None and len(df) >= MIN_DATA_DAYS:
            _save_cache(ticker_base, df)
            return ticker_base, df
        time.sleep(1.0 * (attempt + 1))
    return ticker_base, None


def scan_all_stocks(max_workers: int = 8, ignore_rule3: bool = False) -> list[dict]:
    """
    BIST hisselerini paralel indirip 3 kurala göre tarar.
    Cache sayesinde 2 saat içinde yapılan ikinci taramalar saniyeler sürer.
    """
    logger.info(f"Tarama başladı: {len(BIST_STOCKS)} hisse, ignore_rule3={ignore_rule3}")

    results = []
    with ThreadPoolExecutor(max_workers=max_workers) as pool:
        futures = {pool.submit(_fetch_one, t): t for t in BIST_STOCKS}
        completed = 0
        for fut in as_completed(futures):
            completed += 1
            ticker_base, df = fut.result()
            if df is None:
                continue
            result = _analyze_dataframe(ticker_base, df, ignore_rule3=ignore_rule3)
            if result:
                results.append(result)
                logger.info(f"  PASS [{completed}/{len(BIST_STOCKS)}]: {ticker_base}")

    logger.info(f"Tarama tamamlandı: {len(results)} hisse uyuyor")
    return results


def get_stock_chart_data(ticker_base: str, days: int = 120) -> Optional[dict]:
    """Tek hisse için OHLCV + EMA verileri + trend direnç değeri döndürür."""
    try:
        # Önce cache, yoksa direkt Yahoo Chart API
        df = _load_cache(ticker_base)
        if df is None:
            df = _fetch_yahoo_chart(ticker_base)
            if df is not None:
                _save_cache(ticker_base, df)

        if df is None or len(df) < 50:
            return None

        df = df.dropna(subset=["Close", "High"])
        full_close = df["Close"]
        full_high = df["High"]

        emas_full = {p: compute_ema(full_close, p) for p in EMA_PERIODS}
        resistance = find_falling_trend_resistance(full_high, TREND_LOOKBACK)

        # Son N gün kırp
        df_view = df.tail(days)
        emas_cropped = {p: emas_full[p].iloc[-days:] for p in EMA_PERIODS}

        candles = []
        for ts, row in df_view.iterrows():
            candles.append({
                "time": int(ts.timestamp()),
                "open": round(float(row["Open"]), 2),
                "high": round(float(row["High"]), 2),
                "low": round(float(row["Low"]), 2),
                "close": round(float(row["Close"]), 2),
                "volume": int(row["Volume"]) if not pd.isna(row["Volume"]) else 0,
            })

        ema_data = {}
        for p in EMA_PERIODS:
            ema_data[f"ema{p}"] = [
                {"time": int(ts.timestamp()), "value": round(float(v), 2)}
                for ts, v in zip(df_view.index, emas_cropped[p])
                if not pd.isna(v)
            ]

        return {
            "ticker": ticker_base,
            "candles": candles,
            "emas": ema_data,
            "resistance": round(resistance, 2) if resistance else None,
        }
    except Exception as e:
        logger.warning(f"{ticker} chart hatası: {e}")
        return None
