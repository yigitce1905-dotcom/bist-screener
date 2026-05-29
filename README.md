# BIST Screener

BIST hisselerini 3 teknik kurala göre tarayan dashboard.

- **KURAL 1**: EMA 8 > 21 > 55 > 89 > 144 (boğa dizilimi)
- **KURAL 2**: Fiyat EMA 55/89/144 üstünde
- **KURAL 3**: Düşen trend direncine uzaklık < %10

## Yerel Çalıştırma

### Backend (FastAPI)
```bash
cd backend
python -m venv venv
venv\Scripts\activate   # Windows
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```

## Deploy

- **Frontend**: Vercel (Next.js native)
- **Backend**: Render.com (`render.yaml` ile otomatik)
- Vercel'e env var ekle: `NEXT_PUBLIC_API_BASE=https://<render-url>`
# Auto-deploy aktif (2026-05-29)
