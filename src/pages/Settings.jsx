import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router';
import { db, useLiveQuery, addRestriction, deleteRestriction, exportAllData, importAllData, getSystemConfig, setSystemConfig } from '../db';
import { getInitials } from '../utils/formatters';

export default function Settings() {
  const navigate = useNavigate();
  const { user, isAdmin } = useOutletContext();

  // Protect Settings page
  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
    }
  }, [isAdmin, navigate]);

  const players = useLiveQuery(() => db.players.toArray());
  const restrictions = useLiveQuery(() => db.restrictions.toArray());

  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);
  const [newRestrA, setNewRestrA] = useState('');
  const [newRestrB, setNewRestrB] = useState('');
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    getSystemConfig('api_key').then(val => {
      if (val) setApiKey(val);
    });
  }, []);

  const saveApiKey = async () => {
    try {
      await setSystemConfig('api_key', apiKey.trim());
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      alert('Erro ao salvar chave: ' + err.message);
    }
  };

  const handleExport = async () => {
    const data = await exportAllData();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `racha-stats-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!confirm('⚠️ Isso vai SUBSTITUIR todos os dados atuais. Tem certeza?')) return;
    setImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await importAllData(data);
      alert('✅ Dados importados com sucesso!');
      window.location.reload();
    } catch (err) {
      alert('❌ Erro ao importar: ' + err.message);
    }
    setImporting(false);
  };

  const handleAddRestriction = async () => {
    if (!newRestrA || !newRestrB || newRestrA === newRestrB) return;
    await addRestriction(Number(newRestrA), Number(newRestrB));
    setNewRestrA('');
    setNewRestrB('');
  };

  const getPlayerName = (id) => {
    const p = (players || []).find(p => p.id === id);
    return p?.nickname || p?.name || 'Desconhecido';
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>⚙️ Configurações</h1>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)}>← Voltar</button>
      </div>

      {/* API Key */}
      <div className="section-title">🤖 API Key (Gemini ou NVIDIA)</div>
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="form-group" style={{ marginBottom: '8px' }}>
          <label className="form-label">API Key</label>
          <input type="password" className="form-input" value={apiKey} onChange={e => setApiKey(e.target.value)}
            placeholder="Cole sua API key (Gemini ou NVIDIA nvapi-)..." />
        </div>
        <p className="text-xs text-muted mb-sm">
          Aceita chaves do Google Gemini ou NVIDIA (iniciando com <code>nvapi-</code>). Atualmente, a chave NVIDIA Nemotron de teste está ativa por padrão.
        </p>
        <button className="btn btn-primary btn-sm" onClick={saveApiKey}>
          {saved ? '✓ Salva!' : 'Salvar Key'}
        </button>
      </div>

      {/* Restrictions */}
      <div className="section-title">🚫 Restrições de Sorteio</div>
      <div className="card" style={{ marginBottom: '24px' }}>
        <p className="text-xs text-muted mb-md">Duplas que NÃO podem ficar no mesmo time no sorteio.</p>

        {(restrictions || []).map(r => (
          <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
            <span className="text-sm">🚫 {getPlayerName(r.playerAId)} + {getPlayerName(r.playerBId)}</span>
            <button className="btn btn-danger btn-sm" onClick={() => deleteRestriction(r.id)} style={{ padding: '4px 8px' }}>✕</button>
          </div>
        ))}

        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
          <select className="form-select" value={newRestrA} onChange={e => setNewRestrA(e.target.value)} style={{ flex: 1 }}>
            <option value="">Jogador 1</option>
            {(players || []).map(p => <option key={p.id} value={p.id}>{p.nickname || p.name}</option>)}
          </select>
          <select className="form-select" value={newRestrB} onChange={e => setNewRestrB(e.target.value)} style={{ flex: 1 }}>
            <option value="">Jogador 2</option>
            {(players || []).filter(p => String(p.id) !== newRestrA).map(p => <option key={p.id} value={p.id}>{p.nickname || p.name}</option>)}
          </select>
          <button className="btn btn-primary btn-sm" onClick={handleAddRestriction}
            disabled={!newRestrA || !newRestrB}>+</button>
        </div>
      </div>

      {/* Export/Import */}
      <div className="section-title">💾 Dados</div>
      <div className="card" style={{ marginBottom: '24px' }}>
        <p className="text-xs text-muted mb-md">Exporte seus dados como JSON para backup ou transfira para outro navegador.</p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={handleExport}>📥 Exportar</button>
          <label className="btn btn-secondary" style={{ flex: 1, cursor: 'pointer' }}>
            📤 Importar
            <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} disabled={importing} />
          </label>
        </div>
      </div>

      {/* About */}
      <div className="section-title">ℹ️ Sobre</div>
      <div className="card">
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>⚽</div>
          <h3>Racha Stats</h3>
          <p className="text-sm text-muted">O histórico oficial das suas peladas</p>
          <p className="text-xs text-muted mt-sm">v1.0.0 • Dados salvos localmente</p>
        </div>
      </div>
    </div>
  );
}
