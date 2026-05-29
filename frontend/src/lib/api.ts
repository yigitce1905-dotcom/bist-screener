/**
 * Backend API URL.
 * - Browser'da NEXT_PUBLIC_API_BASE varsa onu kullanır
 * - Yoksa: Vercel/production → Render backend URL'i
 * - Local dev (localhost) → boş, Next.js rewrites devreye girer (/api → localhost:8000)
 */
const PROD_API = "https://bist-screener-api-o156.onrender.com";

function resolveApiBase(): string {
  const fromEnv = process.env.NEXT_PUBLIC_API_BASE;
  if (fromEnv) return fromEnv;
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") return ""; // dev rewrites
  }
  return PROD_API;
}

export const API_BASE = resolveApiBase();
