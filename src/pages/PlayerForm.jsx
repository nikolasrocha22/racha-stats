import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams, useOutletContext } from 'react-router';
import { db, useLiveQuery, addPlayer, updatePlayer } from '../db';
import { POSITIONS } from '../utils/formatters';

export default function PlayerForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useOutletContext();
  const isEdit = !!id;
  const fileRef = useRef();

  // Redirect if not logged in
  useEffect(() => {
    if (!user) navigate('/login');
  }, [user, navigate]);

  const existing = useLiveQuery(() => id ? db.players.get(Number(id)) : null, [id]);

  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [position, setPosition] = useState('');
  const [photo, setPhoto] = useState('');
  const [initialOvr, setInitialOvr] = useState(60);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  React.useEffect(() => {
    if (existing && !loaded) {
      if (!isAdmin && existing.user_id && existing.user_id !== user?.id) {
        navigate(`/players/${id}`);
        return;
      }
      setName(existing.name || '');
      setNickname(existing.nickname || '');
      setPosition(existing.position || '');
      setPhoto(existing.photo || '');
      setInitialOvr(existing.initialOvr || 60);
      setLoaded(true);
    }
  }, [existing, loaded, isAdmin, user, id, navigate]);

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      // Resize to max 300px
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const max = 300;
        let w = img.width, h = img.height;
        if (w > h) { h = (h / w) * max; w = max; }
        else { w = (w / h) * max; h = max; }
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        setPhoto(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (isEdit) {
        await updatePlayer(Number(id), { name: name.trim(), nickname: nickname.trim(), position, photo, initialOvr });
        navigate(`/players/${id}`);
      } else {
        const user_id = isAdmin ? null : user?.id;
        const newId = await addPlayer({ name: name.trim(), nickname: nickname.trim(), position, photo, user_id, initialOvr });
        navigate(`/players/${newId}`);
      }
    } catch (err) {
      alert('Erro ao salvar: ' + err.message);
    }
    setSaving(false);
  };

  if (isEdit && !existing) {
    return <div className="page"><div className="loading"><div className="loading-spinner" /> Carregando...</div></div>;
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>{isEdit ? '✏️ Editar Jogador' : '➕ Novo Jogador'}</h1>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)}>← Voltar</button>
      </div>

      {/* Photo */}
      <div className="photo-upload" style={{ marginBottom: '24px' }}>
        <div className="photo-upload-preview" onClick={() => fileRef.current.click()}>
          {photo ? (
            <img src={photo} alt="Preview" />
          ) : (
            <span style={{ fontSize: '2rem', opacity: 0.3 }}>📷</span>
          )}
        </div>
        <span className="photo-upload-text">Toque para {photo ? 'trocar' : 'adicionar'} foto</span>
        <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} />
      </div>

      <div className="form-group">
        <label className="form-label">Nome *</label>
        <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="Nome do jogador" autoFocus />
      </div>

      <div className="form-group">
        <label className="form-label">Apelido (opcional)</label>
        <input className="form-input" value={nickname} onChange={e => setNickname(e.target.value)} placeholder="Ex: Pelé, Fenômeno..." />
      </div>

      <div className="form-group">
        <label className="form-label">Posição preferida (opcional)</label>
        <select className="form-select" value={position} onChange={e => setPosition(e.target.value)}>
          {POSITIONS.map(p => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </div>

      <div className="form-group" style={{ marginBottom: '24px' }}>
        <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>OVR Inicial (Nota de Partida)</span>
          <span style={{ fontWeight: '800', color: 'var(--gold)', fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>{initialOvr}</span>
        </label>
        <input
          type="range"
          min="40"
          max="99"
          className="form-input"
          style={{ padding: '8px 0', cursor: 'pointer' }}
          value={initialOvr}
          onChange={e => setInitialOvr(Number(e.target.value))}
        />
        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
          Essa será sua nota de partida. Depois de jogar peladas, ela subirá ou descerá dinamicamente de acordo com o resultado do jogo!
        </span>
      </div>

      <button className="btn btn-primary btn-block" onClick={handleSave} disabled={saving || !name.trim()}>
        {saving ? 'Salvando...' : (isEdit ? 'Salvar Alterações' : 'Cadastrar Jogador')}
      </button>
    </div>
  );
}
