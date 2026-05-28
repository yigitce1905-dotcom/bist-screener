"use client";
import { useEffect, useRef, useState } from "react";
import { createChart, IChartApi, ISeriesApi, Time, CandlestickData, LineData } from "lightweight-charts";
import { ChartData } from "@/types";
import { API_BASE } from "@/lib/api";

interface Props {
  ticker: string;
  onClose: () => void;
}

const EMA_CONFIG = [
  { key: "ema8",   color: "#00ff88", label: "EMA 8",   width: 1.5 },
  { key: "ema21",  color: "#58a6ff", label: "EMA 21",  width: 1.5 },
  { key: "ema55",  color: "#e3b341", label: "EMA 55",  width: 2 },
  { key: "ema89",  color: "#f78166", label: "EMA 89",  width: 2 },
  { key: "ema144", color: "#bc8cff", label: "EMA 144", width: 2 },
] as const;

export default function StockChart({ ticker, onClose }: Props) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chart = useRef<IChartApi | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ChartData | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetch(`${API_BASE}/api/stock/${ticker}?days=180`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<ChartData>;
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [ticker]);

  useEffect(() => {
    if (!data || !chartRef.current) return;

    // Önceki grafiği temizle
    if (chart.current) {
      chart.current.remove();
      chart.current = null;
    }

    const container = chartRef.current;
    const c = createChart(container, {
      width: container.clientWidth,
      height: 480,
      layout: {
        background: { color: "#1c2128" },
        textColor: "#8b949e",
      },
      grid: {
        vertLines: { color: "#21262d" },
        horzLines: { color: "#21262d" },
      },
      crosshair: {
        vertLine: { color: "#444c56", style: 1 },
        horzLine: { color: "#444c56", style: 1 },
      },
      rightPriceScale: {
        borderColor: "#30363d",
      },
      timeScale: {
        borderColor: "#30363d",
        timeVisible: true,
      },
    });
    chart.current = c;

    // Mum serisi
    const candleSeries = c.addCandlestickSeries({
      upColor: "#00c96a",
      downColor: "#ff4d4d",
      borderUpColor: "#00c96a",
      borderDownColor: "#ff4d4d",
      wickUpColor: "#00c96a",
      wickDownColor: "#ff4d4d",
    });

    const candleData: CandlestickData[] = data.candles.map((candle) => ({
      time: candle.time as Time,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
    }));
    candleSeries.setData(candleData);

    // EMA serileri
    for (const ema of EMA_CONFIG) {
      const emaSeries = c.addLineSeries({
        color: ema.color,
        lineWidth: ema.width as 1 | 2 | 3 | 4,
        priceLineVisible: false,
        lastValueVisible: true,
        title: ema.label,
      });
      const emaPoints: LineData[] = (data.emas[ema.key as keyof typeof data.emas] ?? []).map((p) => ({
        time: p.time as Time,
        value: p.value,
      }));
      emaSeries.setData(emaPoints);
    }

    // Düşen trend direnç çizgisi (yatay kırmızı noktalı)
    if (data.resistance && candleData.length > 0) {
      const trendSeries = c.addLineSeries({
        color: "#ff6b6b",
        lineWidth: 2,
        lineStyle: 2, // dashed
        priceLineVisible: false,
        lastValueVisible: true,
        title: "Direnç",
      });
      const firstTime = candleData[0].time;
      const lastTime = candleData[candleData.length - 1].time;
      trendSeries.setData([
        { time: firstTime, value: data.resistance },
        { time: lastTime, value: data.resistance },
      ]);
    }

    c.timeScale().fitContent();

    // Responsive yeniden boyutlandırma
    const observer = new ResizeObserver(() => {
      if (chart.current && container) {
        chart.current.applyOptions({ width: container.clientWidth });
      }
    });
    observer.observe(container);

    return () => {
      observer.disconnect();
      if (chart.current) {
        chart.current.remove();
        chart.current = null;
      }
    };
  }, [data]);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="glass-card rounded-xl w-full max-w-5xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <span className="text-xl font-mono font-bold neon-text">{ticker}</span>
            <span className="text-text-secondary text-sm">• Günlük Grafik</span>
          </div>
          <div className="flex items-center gap-4">
            {/* EMA Lejant */}
            <div className="hidden sm:flex items-center gap-3 text-xs font-mono">
              {EMA_CONFIG.map((e) => (
                <span key={e.key} style={{ color: e.color }}>{e.label}</span>
              ))}
              <span style={{ color: "#ff6b6b" }}>— Direnç</span>
            </div>
            <button
              onClick={onClose}
              className="text-text-secondary hover:text-text-primary transition-colors text-lg font-bold w-8 h-8 flex items-center justify-center rounded hover:bg-bg-hover"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Chart area */}
        <div className="p-4">
          {loading && (
            <div className="flex items-center justify-center h-[480px] text-text-secondary">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-accent-green border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm">{ticker} verisi yükleniyor...</p>
              </div>
            </div>
          )}
          {error && (
            <div className="flex items-center justify-center h-[480px] text-accent-red">
              <p>Hata: {error}</p>
            </div>
          )}
          {!loading && !error && (
            <div ref={chartRef} className="w-full rounded-lg overflow-hidden" />
          )}
        </div>

        {/* Footer stats */}
        {data && !loading && (
          <div className="px-6 py-3 border-t border-border bg-bg-secondary flex flex-wrap gap-4 text-xs font-mono">
            {EMA_CONFIG.map((e) => {
              const last = data.emas[e.key as keyof typeof data.emas]?.slice(-1)[0];
              return last ? (
                <span key={e.key} style={{ color: e.color }}>
                  {e.label}: {last.value.toFixed(2)}
                </span>
              ) : null;
            })}
            {data.resistance && (
              <span style={{ color: "#ff6b6b" }}>Direnç: {data.resistance.toFixed(2)}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
