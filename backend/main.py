from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime
import os
import httpx
import json

app = FastAPI(title="MetaEmerge v2 - AI Marketing Platform")
api_router = APIRouter(prefix="/api")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== CONFIG ====================
SUPABASE_URL = "https://gtlhxzofzhyerlybzbyv.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0bGh4em9memh5ZXJseWJ6Ynl2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTk1NjUyOCwiZXhwIjoyMDg1NTMyNTI4fQ.fysOOEX65KxWUOMa1xbqdMx2pJ1jwJ75i0MIs4OSSjw"
META_TOKEN = "EAANDjEMkgdwBQtZB6dLleivFDdwEGp82JxY6Qh9ZCKdDnaOZAnVGzDZBG0GkV6xHazkZA32BYWbUo6fHYT3EqT6fqSSGYnySo6u4RkQ97uRN0faxKEZBUXNtaDKtI1u3wsAXbqfVIQoeZAckOzOph2a3QBreS6yerrnKDhin5XlG019ZCrTU8sKiYgHYt8dRfn7mZCgZDZD"

VERGARA_KNOWLEDGE = """
## METODOLOGÍA FELIPE VERGARA
- SEMÁFORO: 🔴 ROAS<1 pausar, 🟡 ROAS 1-2 optimizar, 🟢 ROAS>2 escalar
- CICLO: Atención → Interés → Deseo → Acción
- ESCALADO: Horizontal (nuevas audiencias) y Vertical (aumentar presupuesto 20-30%)
"""

# ==================== HELPERS ====================
async def meta_api_call(endpoint: str, params: dict = None, method: str = "GET", body: Any = None):
    url = f"https://graph.facebook.com/v19.0/{endpoint}"
    params = params or {}
    params['access_token'] = META_TOKEN
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        if method == "GET":
            response = await client.get(url, params=params)
        elif method == "POST":
            response = await client.post(url, params=params, json=body)
        return response.json()

async def supabase_query(table: str, query_params: str = "", method: str = "GET", body: Any = None):
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    if query_params:
        url += f"?{query_params}"
    
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
    }
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        if method == "GET":
            response = await client.get(url, headers=headers)
        elif method == "POST":
            response = await client.post(url, headers=headers, json=body)
        return response.json() if response.status_code < 400 else []

async def ollama_chat(prompt: str, system_prompt: str = "") -> str:
    url = "http://localhost:11434/api/chat"
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})
    
    payload = {"model": "qwen2.5:7b", "messages": messages, "stream": False}
    
    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(url, json=payload)
        data = response.json()
        return data.get("message", {}).get("content", "Error")

# ==================== MODELOS ====================
class ChatRequest(BaseModel):
    message: str
    account_id: Optional[str] = None

class CreateCampaignRequest(BaseModel):
    name: str
    objective: str
    budget: float
    audience: Dict[str, Any]
    ad_copy: Dict[str, Any]

# ==================== ENDPOINTS ====================

@api_router.get("/")
async def root():
    return {"message": "MetaEmerge v2 API", "version": "2.0"}

@api_router.get("/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

# ==================== CUENTAS ADS ====================
@api_router.get("/accounts")
async def get_ad_accounts():
    """Obtiene todas las cuentas de Ads Manager"""
    result = await meta_api_call("me/adaccounts?fields=id,name,account_status,currency,timezone_name,spend_cap")
    accounts = []
    
    for idx, acc in enumerate(result.get('data', [])):
        acc_id = acc.get('id')
        # Obtener métricas rápidas de cada cuenta
        try:
            insights = await meta_api_call(
                f"{acc_id}/insights",
                {"fields": "impressions,clicks,spend,conversion_value", "date_preset": "last_30d"}
            )
            data = insights.get('data', [{}])[0] if insights.get('data') else {}
        except:
            data = {}
        
        status_map = {1: "Activa", 2: "Inactiva", 3: "Pausada", 9: "Activa", 7: "Pendiente"}
        
        accounts.append({
            "id": acc_id,
            "name": acc.get('name') or f"Cuenta {idx+1}",
            "status": status_map.get(acc.get('account_status'), "Desconocido"),
            "currency": acc.get('currency', 'USD'),
            "spend": float(data.get('spend', 0)),
            "impressions": int(data.get('impressions', 0)),
            "clicks": int(data.get('clicks', 0)),
            "conversion_value": float(data.get('conversion_value', 0)),
            "roas": round(float(data.get('conversion_value', 0)) / float(data.get('spend', 1)), 2) if float(data.get('spend', 0)) > 0 else 0
        })
    
    return {"accounts": accounts, "total": len(accounts)}

# ==================== MÉTRICAS POR CUENTA ====================
@api_router.get("/account/{account_id}/metrics")
async def get_account_metrics(account_id: str, date_preset: str = "last_30d"):
    """Métricas detalladas de una cuenta específica"""
    fields = "impressions,reach,clicks,spend,ctr,cpc,cpm,conversions,conversion_value,frequency,canvas_avg_view_time,video_avg_watch_time"
    
    insights = await meta_api_call(
        f"{account_id}/insights",
        {"fields": fields, "date_preset": date_preset}
    )
    
    data = insights.get('data', [{}])[0] if insights.get('data') else {}
    spend = float(data.get('spend', 0))
    conv_value = float(data.get('conversion_value', 0))
    
    return {
        "account_id": account_id,
        "period": date_preset,
        "metrics": {
            "impressions": int(data.get('impressions', 0)),
            "reach": int(data.get('reach', 0)),
            "clicks": int(data.get('clicks', 0)),
            "spend": spend,
            "ctr": float(data.get('ctr', 0)),
            "cpc": float(data.get('cpc', 0)),
            "cpm": float(data.get('cpm', 0)),
            "conversions": int(data.get('conversions', 0)),
            "conversion_value": conv_value,
            "roas": round(conv_value / spend, 2) if spend > 0 else 0,
            "frequency": float(data.get('frequency', 0)),
            "canvas_avg_view_time": float(data.get('canvas_avg_view_time', 0)),
            "video_avg_watch_time": float(data.get('video_avg_watch_time', 0))
        }
    }

# ==================== CAMPAÑAS POR CUENTA ====================
@api_router.get("/account/{account_id}/campaigns")
async def get_account_campaigns(account_id: str):
    """Obtiene todas las campañas de una cuenta"""
    campaigns = await meta_api_call(
        f"{account_id}/campaigns",
        {"fields": "id,name,status,objective,daily_budget,lifetime_budget,created_time", "limit": 50}
    )
    
    result = []
    for camp in campaigns.get('data', [])[:20]:
        camp_id = camp.get('id')
        try:
            insights = await meta_api_call(
                f"{camp_id}/insights",
                {"fields": "impressions,clicks,spend,conversions,conversion_value,ctr", "date_preset": "last_30d"}
            )
            data = insights.get('data', [{}])[0] if insights.get('data') else {}
        except:
            data = {}
        
        spend = float(data.get('spend', 0))
        conv_value = float(data.get('conversion_value', 0))
        
        result.append({
            "id": camp_id,
            "name": camp.get('name'),
            "status": camp.get('status'),
            "objective": camp.get('objective'),
            "daily_budget": camp.get('daily_budget'),
            "spend": spend,
            "impressions": int(data.get('impressions', 0)),
            "clicks": int(data.get('clicks', 0)),
            "ctr": float(data.get('ctr', 0)),
            "conversions": int(data.get('conversions', 0)),
            "conversion_value": conv_value,
            "roas": round(conv_value / spend, 2) if spend > 0 else 0,
            "audit": "🔴 CRÍTICO" if (conv_value/spend if spend > 0 else 0) < 1 else "🟡 OPTIMIZAR" if (conv_value/spend if spend > 0 else 0) < 2 else "🟢 ESCALAR"
        })
    
    return {"account_id": account_id, "campaigns": result, "total": len(result)}

# ==================== ADSETS ====================
@api_router.get("/campaign/{campaign_id}/adsets")
async def get_campaign_adsets(campaign_id: str):
    """Obtiene los Ad Sets de una campaña"""
    adsets = await meta_api_call(
        f"{campaign_id}/adsets",
        {"fields": "id,name,status,daily_budget,optimization_goal,targeting", "limit": 20}
    )
    return {"campaign_id": campaign_id, "adsets": adsets.get('data', [])}

# ==================== ANUNCIOS ====================
@api_router.get("/adset/{adset_id}/ads")
async def get_adset_ads(adset_id: str):
    """Obtiene los anuncios de un Ad Set"""
    ads = await meta_api_call(
        f"{adset_id}/ads",
        {"fields": "id,name,status,creative", "limit": 20}
    )
    return {"adset_id": adset_id, "ads": ads.get('data', [])}

# ==================== AUDITORÍA ====================
@api_router.post("/audit")
async def audit_account(account_id: str = None):
    """Audita una cuenta específica"""
    if not account_id:
        # Usar primera cuenta
        accounts = await get_ad_accounts()
        account_id = accounts.get('accounts', [{}])[0].get('id')
    
    # Obtener campañas
    campaigns_data = await get_account_campaigns(account_id)
    campaigns = campaigns_data.get('campaigns', [])
    
    # Métricas generales
    metrics = await get_account_metrics(account_id)
    
    total_spend = sum(c.get('spend', 0) for c in campaigns)
    total_conv = sum(c.get('conversions', 0) for c in campaigns)
    total_value = sum(c.get('conversion_value', 0) for c in campaigns)
    avg_roas = total_value / total_spend if total_spend > 0 else 0
    
    return {
        "account_id": account_id,
        "summary": {
            "total_campaigns": len(campaigns),
            "active_campaigns": len([c for c in campaigns if c.get('status') == 'ACTIVE']),
            "total_spend": total_spend,
            "total_conversions": total_conv,
            "total_value": total_value,
            "avg_roas": round(avg_roas, 2)
        },
        "campaigns": campaigns,
        "metrics": metrics.get('metrics'),
        "recommendations": generate_recommendations(avg_roas, campaigns)
    }

def generate_recommendations(roas: float, campaigns: List[dict]) -> List[str]:
    recs = []
    if roas < 1:
        recs.append("🔴 ROAS CRÍTICO - Pausa campañas inmediatamente")
    elif roas < 2:
        recs.append("🟡 ROAS bajo - Optimiza copy e imágenes")
    else:
        recs.append("🟢 ROAS excelente - Escala presupuesto 20-30%")
    
    critical = [c for c in campaigns if c.get('roas', 0) < 1]
    if critical:
        recs.append(f"⚠️ {len(critical)} campañas con ROAS < 1 - Revisar targeting")
    
    return recs

# ==================== CHAT ====================
@api_router.post("/chat")
async def chat(request: ChatRequest):
    system = f"""Eres METAEMERGE, experto en Facebook Ads. Conocimiento: {VERGARA_KNOWLEDGE}
Tienes acceso a datos de las cuentas de Meta de Sebastián."""
    response = await ollama_chat(request.message, system)
    return {"response": response}

# ==================== LANDING ====================
@api_router.post("/landing/audit")
async def audit_landing(url: str):
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url)
            html = response.text.lower()
            
        score = 0
        elements = {
            "cta": bool("comprar" in html or "comprar" in html or "buy" in html),
            "whatsapp": bool("whatsapp" in html),
            "form": bool("<form" in html),
            "video": bool("video" in html),
            "testimonials": bool("testimonio" in html or "review" in html),
            "pricing": bool("precio" in html or "price" in html or "$" in html)
        }
        
        for v in elements.values():
            if v: score += 16
        
        return {"url": url, "score": min(score, 100), "elements": elements}
    except Exception as e:
        return {"error": str(e)}

@api_router.post("/landing/generate")
async def generate_landing(product_name: str, product_description: str):
    code = f"""<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{product_name}</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-900 text-white">
    <section class="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
        <div class="container mx-auto px-4 text-center">
            <h1 class="text-5xl font-bold mb-6">{product_name}</h1>
            <p class="text-xl text-gray-300 mb-8">{product_description}</p>
            <a href="https://wa.me/TUNUMERO" class="bg-green-600 hover:bg-green-700 text-white text-2xl font-bold px-12 py-6 rounded-full">
                Comprar Ahora 🗡️
            </a>
        </div>
    </section>
</body>
</html>"""
    return {"code": code}

# ==================== FINANZAS ====================
@api_router.get("/finance")
async def finance_summary():
    try:
        sales = await supabase_query("sales", "order=sale_date.desc&limit=30")
    except:
        sales = []
    
    total = sum(float(s.get('sale_value_cop', 0)) for s in sales)
    orders = len(sales)
    
    return {
        "total_income": total,
        "total_orders": orders,
        "daily_avg": orders / 30,
        "goal": 100,
        "progress": (orders/30/100)*100
    }

app.include_router(api_router)
