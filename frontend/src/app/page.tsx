"use client";
import { useState } from "react";
import { ScanResponse, ScanStatus, StockResult } from "@/types";
import StockTable from "@/components/StockTable";
import StockChart from "@/components/StockChart";
import ScanButton from "@/components/ScanButton";
import StatsBar from "@/components/StatsBar";
import { API_BASE } from "@/lib/api";

const TOTAL_STOCKS = 100;

export default function Home() {
  const [status, setStatus] = useState<ScanStatus>("idle");
  const [results, setResults] = useState<StockResult[]>([]);
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  async function handleScan() {
    setStatus("scanning");
    setResults([]);
    try {
      const res = await fetch(`${API_BASE}/api/scan`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: ScanResponse = await res.json();
      setResults(data.results);
      setLastUpdated(new Date());
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <header className="border-b border-border bg-bg-secondary sticky top-0 z-40">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent-green/20 border border-accent-green/40 flex items-center justify-center">
              <svg className="w-4 h-4 text-accent-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-bold text-text-primary leading-none">BIST Screener</h1>
              <p className="text-xs text-text-secondary leading-none mt-0.5">EMA Boğa Dizilimi & Trend Kırılımı</p>
            </div>
          </div>

          {/* Kural rozeti */}
          <div className="hidden md:flex items-center gap-2 text-xs font-mono">
            <span className="px-2 py-1 rounded bg-bg-hover text-accent-green border border-border">
              EMA 8&gt;21&gt;55&gt;89&gt;144
            </span>
            <span className="px-2 py-1 rounded bg-bg-hover text-accent-blue border border-border">
              Fiyat &gt; EMA 55/89/144
            </span>
            <span className="px-2 py-1 rounded bg-bg-hover text-accent-yellow border border-border">
              Direnç Uzaklığı &lt;%10
            </span>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6">
        {/* Tarama kontrolleri */}
        <div className="mb-5">
          <ScanButton
            status={status}
            scanned={status === "done" ? TOTAL_STOCKS : 0}
            total={TOTAL_STOCKS}
            found={results.length}
            onClick={handleScan}
          />
        </div>

        {/* İstatistik çubuğu */}
        <StatsBar results={results} lastUpdated={lastUpdated} />

        {/* Kural açıklamaları (boş durum) */}
        {status === "idle" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 mb-6">
            {[
              {
                title: "Kural 1 — EMA Boğa Dizilimi",
                desc: "EMA 8 > EMA 21 > EMA 55 > EMA 89 > EMA 144 sıralaması tam olmalı. Kısa vadeli ortalamalar uzun vadelilerin üstünde.",
                color: "text-accent-green",
                icon: "↑",
              },
              {
                title: "Kural 2 — Fiyatın Konumu",
                desc: "Kapanış fiyatı EMA 55, 89 ve 144'ün kesinlikle üstünde olmalı. EMA 8/21 üstünde olması ekstra güç göstergesi.",
                color: "text-accent-blue",
                icon: "◎",
              },
              {
                title: "Kural 3 — Direnç Yakınlığı",
                desc: "EMA 8/21'in düşen trend direncine olan uzaklığı %10'dan az olmalı. Hisse kırılım eşiğinde sıkışmış demektir.",
                color: "text-accent-yellow",
                icon: "⟶",
              },
            ].map((rule) => (
              <div key={rule.title} className="glass-card rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-lg ${rule.color}`}>{rule.icon}</span>
                  <h3 className={`text-sm font-semibold ${rule.color}`}>{rule.title}</h3>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">{rule.desc}</p>
              </div>
            ))}
          </div>
        )}

        {/* Sonuç tablosu */}
        <StockTable
          results={results}
          onSelect={setSelectedTicker}
          selectedTicker={selectedTicker}
        />
      </main>

      {/* Grafik modal */}
      {selectedTicker && (
        <StockChart
          ticker={selectedTicker}
          onClose={() => setSelectedTicker(null)}
        />
      )}
    </div>
  );
}
