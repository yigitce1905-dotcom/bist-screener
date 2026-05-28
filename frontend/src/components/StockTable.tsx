"use client";
import { StockResult } from "@/types";
import clsx from "clsx";

interface Props {
  results: StockResult[];
  onSelect: (ticker: string) => void;
  selectedTicker: string | null;
}

const EMA_COLORS: Record<string, string> = {
  ema8: "#00ff88",
  ema21: "#58a6ff",
  ema55: "#e3b341",
  ema89: "#f78166",
  ema144: "#bc8cff",
};

export default function StockTable({ results, onSelect, selectedTicker }: Props) {
  if (results.length === 0) {
    return (
      <div className="text-center py-16 text-text-secondary">
        <p className="text-lg">Kurallara uyan hisse bulunamadı.</p>
        <p className="text-sm mt-1 text-text-muted">Taramayı başlatmak için butona basın.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-bg-secondary">
            <th className="px-4 py-3 text-left text-text-secondary font-medium">Hisse</th>
            <th className="px-4 py-3 text-right text-text-secondary font-medium">Fiyat ₺</th>
            <th className="px-4 py-3 text-right text-text-secondary font-medium">Gün %</th>
            <th className="px-4 py-3 text-right font-medium" style={{ color: EMA_COLORS.ema8 }}>EMA 8</th>
            <th className="px-4 py-3 text-right font-medium" style={{ color: EMA_COLORS.ema21 }}>EMA 21</th>
            <th className="px-4 py-3 text-right font-medium" style={{ color: EMA_COLORS.ema55 }}>EMA 55</th>
            <th className="px-4 py-3 text-right font-medium" style={{ color: EMA_COLORS.ema89 }}>EMA 89</th>
            <th className="px-4 py-3 text-right font-medium" style={{ color: EMA_COLORS.ema144 }}>EMA 144</th>
            <th className="px-4 py-3 text-right text-text-secondary font-medium">Direnç ₺</th>
            <th className="px-4 py-3 text-right text-text-secondary font-medium">Uzaklık %</th>
          </tr>
        </thead>
        <tbody>
          {results.map((s, i) => {
            const isSelected = s.ticker === selectedTicker;
            const changePos = s.daily_change_pct >= 0;
            return (
              <tr
                key={s.ticker}
                onClick={() => onSelect(s.ticker)}
                className={clsx(
                  "border-b border-border transition-colors table-row-hover animate-fade-in",
                  isSelected ? "bg-bg-hover border-l-2 border-l-accent-green" : "bg-bg-card"
                )}
                style={{ animationDelay: `${i * 40}ms` }}
              >
                {/* Hisse */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-text-primary">{s.ticker}</span>
                    {s.above_ema8 && s.above_ema21 && (
                      <span className="badge-green text-xs px-1.5 py-0.5 rounded font-mono">↑ EMA8/21</span>
                    )}
                  </div>
                </td>

                {/* Fiyat */}
                <td className="px-4 py-3 text-right font-mono font-semibold text-text-primary">
                  {s.price.toFixed(2)}
                </td>

                {/* Günlük değişim */}
                <td className="px-4 py-3 text-right font-mono">
                  <span className={clsx(
                    "px-2 py-0.5 rounded text-xs font-semibold",
                    changePos ? "badge-green" : "badge-red"
                  )}>
                    {changePos ? "+" : ""}{s.daily_change_pct.toFixed(2)}%
                  </span>
                </td>

                {/* EMA değerleri */}
                <td className="px-4 py-3 text-right font-mono text-xs" style={{ color: EMA_COLORS.ema8 }}>
                  {s.ema8.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-xs" style={{ color: EMA_COLORS.ema21 }}>
                  {s.ema21.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-xs" style={{ color: EMA_COLORS.ema55 }}>
                  {s.ema55.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-xs" style={{ color: EMA_COLORS.ema89 }}>
                  {s.ema89.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-xs" style={{ color: EMA_COLORS.ema144 }}>
                  {s.ema144.toFixed(2)}
                </td>

                {/* Direnç */}
                <td className="px-4 py-3 text-right font-mono text-xs text-accent-orange">
                  {s.resistance.toFixed(2)}
                </td>

                {/* Uzaklık */}
                <td className="px-4 py-3 text-right font-mono text-xs">
                  <span className={clsx(
                    "px-1.5 py-0.5 rounded",
                    s.distance_to_resistance_pct < 5
                      ? "text-accent-green font-bold"
                      : s.distance_to_resistance_pct < 8
                        ? "text-accent-yellow"
                        : "text-text-secondary"
                  )}>
                    %{s.distance_to_resistance_pct.toFixed(2)}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
