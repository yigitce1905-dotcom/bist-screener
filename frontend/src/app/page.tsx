"use client";
import { useState } from "react";
import { ScanResponse, ScanStatus, StockResult } from "@/types";
import StockTable from "@/components/StockTable";
import StockChart from "@/components/StockChart";
import ScanButton, { ScanVersion } from "@/components/ScanButton";
import StatsBar from "@/components/StatsBar";
import { API_BASE } from "@/lib/api";

const TOTAL_STOCKS = 500;

const VERSION_LABELS: Record<ScanVersion, { name: string; tag: string; color: string }> = {
  v1: { name: "Kırılım Avı",  tag: "V1", color: "text-accent-green" },
  v2: { name: "Pullback Avı", tag: "V2", color: "text-sky-400" },
};

export default function Home() {
  const [status, setStatus] = useState<ScanStatus>("idle");
  const [results, setResults] = useState<StockResult[]>([]);
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [activeVersion, setActiveVersion] = useState<ScanVersion | null>(null);

  async function handleScan(version: ScanVersion) {
    setStatus("scanning");
    setActiveVersion(version);
    setResults([]);
    try {
      const res = await fetch(`${API_BASE}/api/scan?version=${version}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: ScanResponse = await res.json();
      setResults(data.results);
      setLastUpdated(new Date());
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  const v1Rules = [
    { title: "Kural 1 — EMA Boğa Dizilimi", color: "text-accent-green", icon: "↑",
      desc: "EMA 8 > 21 > 55 > 89 > 144 sıralaması tam olmalı. Kısa vadeli ortalamalar uzun vadelilerin üstünde." },
    { title: "Kural 2 — Fiyatın Konumu", color: "text-accent-blue", icon: "◎",
      desc: "Kapanış fiyatı EMA 55, 89 ve 144'ün kesinlikle üstünde olmalı." },
    { title: "Kural 3 — Direnç Yakınlığı", color: "text-accent-yellow", icon: "⟶",
      desc: "Düşen trend direncine uzaklık %10'dan az. Hisse kırılım eşiğinde sıkışmış." },
    { title: "Kural 4 — Destek Sıralaması", color: "text-sky-400", icon: "↘",
      desc: "Sonuçlar ana yükselen trend desteğine yakınlığa göre sıralanır (yakın → üstte)." },
  ];

  const v2Rules = [
    { title: "Kural 1 — EMA 8 Altında", color: "text-sky-400", icon: "↓",
      desc: "EMA 21 > 55 > 89 > 144 dizilimi tam + Fiyat EMA 8'in ALTINDA. Kısa vadeli pullback fırsatı." },
    { title: "Kural 2 — Fiyatın Konumu", color: "text-accent-blue", icon: "◎",
      desc: "Kapanış fiyatı hâlâ EMA 55, 89 ve 144'ün üstünde. Uzun vadeli trend bozulmamış." },
    { title: "Kural 3 — Direnç Yakınlığı", color: "text-accent-yellow", icon: "⟶",
      desc: "Düşen trend direncine uzaklık %10'dan az." },
    { title: "Kural 4 — Destek Sıralaması", color: "text-sky-400", icon: "↘",
      desc: "Sonuçlar ana yükselen trend desteğine yakınlığa göre sıralanır." },
  ];

  const activeRules = activeVersion === "v2" ? v2Rules : v1Rules;

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
              <p className="text-xs text-text-secondary leading-none mt-0.5">
                {activeVersion
                  ? <>Aktif: <span className={VERSION_LABELS[activeVersion].color}>{VERSION_LABELS[activeVersion].tag} — {VERSION_LABELS[activeVersion].name}</span></>
                  : "İki strateji: Kırılım & Pullback"}
              </p>
            </div>
          </div>

          {/* Kural rozetleri (aktif versiyona göre) */}
          <div className="hidden md:flex items-center gap-2 text-xs font-mono">
            {activeVersion === "v2" ? (
              <>
                <span className="px-2 py-1 rounded bg-bg-hover text-sky-400 border border-border">
                  EMA 21&gt;55&gt;89&gt;144 + Fiyat&lt;EMA8
                </span>
                <span className="px-2 py-1 rounded bg-bg-hover text-accent-blue border border-border">
                  Fiyat &gt; EMA 55/89/144
                </span>
                <span className="px-2 py-1 rounded bg-bg-hover text-accent-yellow border border-border">
                  Direnç &lt;%10
                </span>
              </>
            ) : (
              <>
                <span className="px-2 py-1 rounded bg-bg-hover text-accent-green border border-border">
                  EMA 8&gt;21&gt;55&gt;89&gt;144
                </span>
                <span className="px-2 py-1 rounded bg-bg-hover text-accent-blue border border-border">
                  Fiyat &gt; EMA 55/89/144
                </span>
                <span className="px-2 py-1 rounded bg-bg-hover text-accent-yellow border border-border">
                  Direnç &lt;%10
                </span>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6">
        {/* Tarama kontrolleri (iki buton) */}
        <div className="mb-5">
          <ScanButton
            status={status}
            scanned={status === "done" ? TOTAL_STOCKS : 0}
            total={TOTAL_STOCKS}
            found={results.length}
            activeVersion={activeVersion}
            onScan={handleScan}
          />
        </div>

        <StatsBar results={results} lastUpdated={lastUpdated} />

        {status === "idle" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8 mb-6">
            {activeRules.map((rule) => (
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

        <StockTable
          results={results}
          onSelect={setSelectedTicker}
          selectedTicker={selectedTicker}
        />
      </main>

      {selectedTicker && (
        <StockChart ticker={selectedTicker} onClose={() => setSelectedTicker(null)} />
      )}
    </div>
  );
}
