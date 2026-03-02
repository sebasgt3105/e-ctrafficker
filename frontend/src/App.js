import React, { useState, useEffect } from 'react';
import './App.css';

const API_URL = 'https://e-ctrafficker.com/api';

function App() {
  const [activeTab, setActiveTab] = useState('accounts');
  
  return (
    <div className="app">
      <nav className="sidebar">
        <div className="logo">⚡ MetaEmerge</div>
        <ul className="nav-items">
          <li className={activeTab === 'accounts' ? 'active' : ''} onClick={() => setActiveTab('accounts')}>
            📋 Cuentas Ads
          </li>
          <li className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => setActiveTab('dashboard')}>
            📊 Dashboard
          </li>
          <li className={activeTab === 'campaigns' ? 'active' : ''} onClick={() => setActiveTab('campaigns')}>
            📢 Campañas
          </li>
          <li className={activeTab === 'audit' ? 'active' : ''} onClick={() => setActiveTab('audit')}>
            🔍 Auditoría
          </li>
          <li className={activeTab === 'chat' ? 'active' : ''} onClick={() => setActiveTab('chat')}>
            💬 Estratega
          </li>
          <li className={activeTab === 'landing' ? 'active' : ''} onClick={() => setActiveTab('landing')}>
            🎯 Landing
          </li>
          <li className={activeTab === 'finance' ? 'active' : ''} onClick={() => setActiveTab('finance')}>
            💰 Finanzas
          </li>
        </ul>
      </nav>
      
      <main className="content">
        {activeTab === 'accounts' && <Accounts />}
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'campaigns' && <Campaigns />}
        {activeTab === 'audit' && <Audit />}
        {activeTab === 'chat' && <Chat />}
        {activeTab === 'landing' && <Landing />}
        {activeTab === 'finance' && <Finance />}
      </main>
    </div>
  );
}

// ==================== CUENTAS ADS ====================
function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetch(`${API_URL}/accounts`).then(r => r.json()).then(d => setAccounts(d.accounts || [])).finally(() => setLoading(false));
  }, []);
  
  if (loading) return <div className="page"><h1>📋 Cargando cuentas...</h1></div>;
  
  return (
    <div className="page">
      <h1>📋 Cuentas de Ads Manager</h1>
      <div className="accounts-grid">
        {accounts.map((acc, i) => (
          <div key={i} className="account-card">
            <div className="account-header">
              <h3>{acc.name}</h3>
              <span className={`status ${acc.status === 'Activa' ? 'success' : 'warning'}`}>{acc.status}</span>
            </div>
            <div className="account-id">ID: {acc.id}</div>
            <div className="account-metrics">
              <div className="metric">
                <span className="label">Gastado</span>
                <span className="value">${acc.spend?.toFixed(2)}</span>
              </div>
              <div className="metric">
                <span className="label">Impresiones</span>
                <span className="value">{acc.impressions?.toLocaleString()}</span>
              </div>
              <div className="metric">
                <span className="label">Clicks</span>
                <span className="value">{acc.clicks?.toLocaleString()}</span>
              </div>
              <div className="metric">
                <span className="label">ROAS</span>
                <span className="value roas">{acc.roas}x</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==================== DASHBOARD ====================
function Dashboard() {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [metrics, setMetrics] = useState(null);
  
  useEffect(() => {
    fetch(`${API_URL}/accounts`).then(r => r.json()).then(d => {
      setAccounts(d.accounts || []);
      if (d.accounts?.length > 0) selectAccount(d.accounts[0].id);
    });
  }, []);
  
  const selectAccount = (id) => {
    setSelectedAccount(id);
    fetch(`${API_URL}/account/${id}/metrics`).then(r => r.json()).then(d => setMetrics(d.metrics));
  };
  
  return (
    <div className="page">
      <h1>📊 Dashboard</h1>
      <select className="account-select" value={selectedAccount || ''} onChange={e => selectAccount(e.target.value)}>
        {accounts.map((a, i) => <option key={i} value={a.id}>{a.name}</option>)}
      </select>
      
      {metrics && (
        <div className="stats-grid">
          <div className="stat-card"><div className="stat-value">{metrics.impressions?.toLocaleString()}</div><div className="stat-label">Impresiones</div></div>
          <div className="stat-card"><div className="stat-value">{metrics.reach?.toLocaleString()}</div><div className="stat-label">Alcance</div></div>
          <div className="stat-card"><div className="stat-value">{metrics.clicks?.toLocaleString()}</div><div className="stat-label">Clicks</div></div>
          <div className="stat-card"><div className="stat-value">${metrics.spend?.toFixed(2)}</div><div className="stat-label">Gastado</div></div>
          <div className="stat-card"><div className="stat-value">{metrics.ctr?.toFixed(2)}%</div><div className="stat-label">CTR</div></div>
          <div className="stat-card"><div className="stat-value">${metrics.cpc?.toFixed(2)}</div><div className="stat-label">CPC</div></div>
          <div className="stat-card"><div className="stat-value">{metrics.conversions}</div><div className="stat-label">Conversiones</div></div>
          <div className="stat-card highlight"><div className="stat-value">{metrics.roas}x</div><div className="stat-label">ROAS</div></div>
        </div>
      )}
    </div>
  );
}

// ==================== CAMPAÑAS ====================
function Campaigns() {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  
  useEffect(() => {
    fetch(`${API_URL}/accounts`).then(r => r.json()).then(d => {
      setAccounts(d.accounts || []);
      if (d.accounts?.length > 0) loadCampaigns(d.accounts[0].id);
    });
  }, []);
  
  const loadCampaigns = (id) => {
    setSelectedAccount(id);
    fetch(`${API_URL}/account/${id}/campaigns`).then(r => r.json()).then(d => setCampaigns(d.campaigns || []));
  };
  
  return (
    <div className="page">
      <h1>📢 Campañas</h1>
      <select className="account-select" value={selectedAccount || ''} onChange={e => loadCampaigns(e.target.value)}>
        {accounts.map((a, i) => <option key={i} value={a.id}>{a.name}</option>)}
      </select>
      
      <div className="campaigns-list">
        {campaigns.map((c, i) => (
          <div key={i} className={`campaign-card ${c.roas < 1 ? 'critical' : c.roas < 2 ? 'warning' : 'success'}`}>
            <div className="campaign-header">
              <span className="name">{c.name}</span>
              <span className={`status ${c.status?.toLowerCase()}`}>{c.status}</span>
            </div>
            <div className="campaign-metrics">
              <span>💰 ${c.spend?.toFixed(2)}</span>
              <span>👁️ {c.impressions?.toLocaleString()}</span>
              <span>🖱️ {c.clicks}</span>
              <span>📊 {c.roas}x</span>
              <span>✅ {c.conversions}</span>
            </div>
            <div className="campaign-audit">{c.audit}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==================== AUDITORÍA ====================
function Audit() {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [audit, setAudit] = useState(null);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    fetch(`${API_URL}/accounts`).then(r => r.json()).then(d => setAccounts(d.accounts || []));
  }, []);
  
  const runAudit = () => {
    if (!selectedAccount) return;
    setLoading(true);
    fetch(`${API_URL}/audit`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({account_id: selectedAccount})})
      .then(r => r.json()).then(d => setAudit(d)).finally(() => setLoading(false));
  };
  
  return (
    <div className="page">
      <h1>🔍 Auditoría de Cuenta</h1>
      <div className="form-row">
        <select className="account-select" value={selectedAccount || ''} onChange={e => setSelectedAccount(e.target.value)}>
          <option value="">Selecciona cuenta</option>
          {accounts.map((a, i) => <option key={i} value={a.id}>{a.name}</option>)}
        </select>
        <button className="btn-primary" onClick={runAudit} disabled={loading || !selectedAccount}>
          {loading ? '🔄 Analizando...' : '🚀 Ejecutar Auditoría'}
        </button>
      </div>
      
      {audit && (
        <div className="audit-result">
          <div className="summary">
            <h3>Resumen</h3>
            <div className="stats-grid">
              <div className="stat-card"><div className="stat-value">{audit.summary?.total_campaigns}</div><div className="stat-label">Total Campañas</div></div>
              <div className="stat-card"><div className="stat-value">{audit.summary?.active_campaigns}</div><div className="stat-label">Activas</div></div>
              <div className="stat-card"><div className="stat-value">${audit.summary?.total_spend?.toFixed(0)}</div><div className="stat-label">Gastado</div></div>
              <div className="stat-card highlight"><div className="stat-value">{audit.summary?.avg_roas}x</div><div className="stat-label">ROAS Promedio</div></div>
            </div>
          </div>
          <div className="recommendations">
            <h3>Recomendaciones (Felipe Vergara)</h3>
            {audit.recommendations?.map((r, i) => <div key={i} className="rec">{r}</div>)}
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== CHAT ====================
function Chat() {
  const [messages, setMessages] = useState([{role: 'system', content: 'Hola, soy tu Estratega Senior. Pregunta sobre tus campañas.'}]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  const send = async () => {
    if (!input.trim()) return;
    const userMsg = {role: 'user', content: input};
    setMessages(p => [...p, userMsg]);
    setInput(''); setLoading(true);
    const res = await fetch(`${API_URL}/chat`, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({message: input})});
    const data = await res.json();
    setMessages(p => [...p, {role: 'assistant', content: data.response}]); setLoading(false);
  };
  
  return (
    <div className="page">
      <h1>💬 Estratega IA</h1>
      <div className="chat-container">
        <div className="messages">
          {messages.map((m, i) => <div key={i} className={`message ${m.role}`}>{m.content}</div>)}
          {loading && <div className="message assistant">🤔...</div>}
        </div>
        <div className="chat-input">
          <input value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && send()} placeholder="Pregunta sobre tus campañas, audiencias, estrategias..." />
          <button onClick={send} disabled={loading}>Enviar</button>
        </div>
      </div>
    </div>
  );
}

// ==================== LANDING ====================
function Landing() {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const audit = async () => {
    if (!url) return;
    setLoading(true);
    const res = await fetch(`${API_URL}/landing/audit`, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({url})});
    const data = await res.json();
    setResult(data); setLoading(false);
  };
  
  return (
    <div className="page">
      <h1>🎯 Landing Audit</h1>
      <div className="form-row">
        <input placeholder="URL de tu landing" value={url} onChange={e => setUrl(e.target.value)} />
        <button className="btn-primary" onClick={audit} disabled={loading}>{loading ? '...' : 'Auditar'}</button>
      </div>
      {result && (
        <div className="audit-result">
          <div className={`score ${result.score >= 80 ? 'success' : result.score >= 60 ? 'warning' : 'critical'}`}>
            Puntuación: {result.score}/100
          </div>
          <div className="elements">
            {Object.entries(result.elements || {}).map(([k, v]) => <div key={k} className={v ? 'ok' : 'fail'}>{v ? '✓' : '✗'} {k}</div>)}
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== FINANZAS ====================
function Finance() {
  const [data, setData] = useState(null);
  
  useEffect(() => { fetch(`${API_URL}/finance`).then(r => r.json()).then(setData).catch(() => {}) }, []);
  
  return (
    <div className="page">
      <h1>💰 Finanzas</h1>
      {data ? (
        <div className="stats-grid">
          <div className="stat-card"><div className="stat-value">${data.total_income?.toFixed(0)}</div><div className="stat-label">Ingresos Totales</div></div>
          <div className="stat-card"><div className="stat-value">{data.total_orders}</div><div className="stat-label">Pedidos</div></div>
          <div className="stat-card"><div className="stat-value">{data.daily_avg?.toFixed(1)}</div><div className="stat-label">Ventas/Día</div></div>
          <div className="stat-card highlight"><div className="stat-value">{data.progress?.toFixed(1)}%</div><div className="stat-label">Meta 100/día</div></div>
        </div>
      ) : <p>Conecta Supabase para ver finanzas</p>}
    </div>
  );
}

export default App;
