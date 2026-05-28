export interface StockResult {
  ticker: string;
  price: number;
  daily_change_pct: number;
  ema8: number;
  ema21: number;
  ema55: number;
  ema89: number;
  ema144: number;
  resistance: number;
  distance_to_resistance_pct: number;
  above_ema8: boolean;
  above_ema21: boolean;
}

export interface ScanResponse {
  count: number;
  scanned: number;
  results: StockResult[];
}

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface EmaPoint {
  time: number;
  value: number;
}

export interface ChartData {
  ticker: string;
  candles: Candle[];
  emas: {
    ema8: EmaPoint[];
    ema21: EmaPoint[];
    ema55: EmaPoint[];
    ema89: EmaPoint[];
    ema144: EmaPoint[];
  };
  resistance: number | null;
}

export type ScanStatus = "idle" | "scanning" | "done" | "error";
