/**
 * API_BASE kaynağı:
 *  - Production (Vercel): NEXT_PUBLIC_API_BASE env var (Render backend URL)
 *  - Local dev: boş → Next.js rewrites devreye girer (/api → localhost:8000)
 */
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";
