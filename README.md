# E-CTrafficker 🚀

Plataforma SaaS de Meta Ads con IA - Auditor, Estratega y Creador de Campañas.

## 🌐 Links

- **Demo:** https://morrison-maternity-scope-warehouse.trycloudflare.com
- **GitHub:** https://github.com/sebasgt3105/e-ctrafficker

## 📋 Funcionalidades

- 📊 Dashboard de Métricas
- 🔍 Auditoría de Campañas (IA)
- 💬 Estratega Virtual
- 📢 Gestión de Campañas
- 🎯 Landing Page Audit
- 💰 Finanzas

## 🛠️ Tech Stack

- **Frontend:** React + Tailwind
- **Backend:** FastAPI (Python)
- **IA:** Ollama (qwen2.5:7b)
- **DB:** Supabase
- **Ads API:** Meta Marketing API

## 🚀 Deploy

```bash
# Backend
cd backend
pip install -r requirements.txt
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000

# Frontend
cd frontend
npm install
npm run build
npx serve -s build -l 3000
```

## ⚙️ Variables

- `META_TOKEN` - Token de Meta Ads API
- `SUPABASE_URL` - URL de Supabase
- `SUPABASE_KEY` - Clave de Supabase
