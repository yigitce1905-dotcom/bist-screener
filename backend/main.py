"""
BIST Hisse Tarama API - FastAPI
Endpoints:
  GET /api/scan          -> Tüm BIST hisselerini tara
  GET /api/stock/{ticker} -> Tek hisse grafik verileri
  GET /api/stocks        -> İzlenecek hisse listesi
"""

import asyncio
import logging
from concurrent.futures import ThreadPoolExecutor
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from screener import BIST_STOCKS, scan_all_stocks, get_stock_chart_data

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="BIST Screener API", version="1.0.0")

import os

# CORS: localhost (dev) + *.vercel.app (production) + ALLOWED_ORIGINS env var
_extra = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", *_extra],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_methods=["*"],
    allow_headers=["*"],
)

executor = ThreadPoolExecutor(max_workers=8)


@app.get("/api/stocks")
async def list_stocks():
    """İzlenecek tüm BIST hisselerini döndür."""
    return {"stocks": BIST_STOCKS, "count": len(BIST_STOCKS)}


@app.get("/api/scan")
async def scan_stocks(ignore_rule3: bool = False, version: str = "v1"):
    """
    BIST hisselerini tara.
    version='v1' → Kırılım (EMA 8>21>55>89>144 boğa dizilimi)
    version='v2' → Pullback (EMA 21>55>89>144 + Fiyat EMA 8 altında)
    ignore_rule3=true → Düşen direnç kuralını atla
    """
    if version not in ("v1", "v2"):
        version = "v1"
    logger.info(f"Tarama: version={version}, ignore_rule3={ignore_rule3}")
    loop = asyncio.get_event_loop()
    results = await loop.run_in_executor(
        executor,
        lambda: scan_all_stocks(ignore_rule3=ignore_rule3, version=version),
    )

    # KURAL 4 sıralama: Ana yükselen trend desteğine yakınlığa göre (en yakın üstte)
    results.sort(key=lambda x: (
        x.get("distance_to_support_pct") if x.get("distance_to_support_pct") is not None else 9999
    ))

    logger.info(f"Tarama tamamlandı ({version}): {len(results)} hisse uyuyor")
    return {
        "count": len(results),
        "scanned": len(BIST_STOCKS),
        "version": version,
        "ignore_rule3": ignore_rule3,
        "results": results,
    }


@app.get("/api/stock/{ticker}")
async def get_stock(ticker: str, days: int = 120):
    """Tek hisse için grafik verisi (OHLCV + EMA + trend)."""
    ticker = ticker.upper()
    if ticker not in BIST_STOCKS:
        raise HTTPException(status_code=404, detail=f"{ticker} listede bulunamadı")

    loop = asyncio.get_event_loop()
    data = await loop.run_in_executor(
        executor, lambda: get_stock_chart_data(ticker, days)
    )
    if data is None:
        raise HTTPException(status_code=503, detail=f"{ticker} verisi alınamadı")
    return data


@app.get("/health")
async def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
