import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { supabase } from '../supabaseClient';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (isSignUp) {
        const { data, error: signUpErr } = await supabase.auth.signUp({
          email: email.trim(),
          password
        });
        if (signUpErr) throw signUpErr;
        setMessage('Cadastro realizado com sucesso! Verifique seu e-mail para confirmação se necessário.');
      } else {
        const { data, error: signInErr } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password
        });
        if (signInErr) throw signInErr;
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Ocorreu um erro ao autenticar.');
    }
    setLoading(false);
  };

  return (
    <div className="page" style={{ maxWidth: '400px', padding: '40px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: 'calc(100vh - 120px)' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <span style={{ fontSize: '3rem' }}>⚽</span>
        <h1 style={{ marginTop: '8px', fontSize: '1.75rem' }}>Racha Stats</h1>
        <p className="text-muted text-sm">Faça login para gerenciar suas peladas</p>
      </div>

      <div className="card">
        <h2 style={{ fontSize: '1.2rem', marginBottom: '16px', textAlign: 'center' }}>
          {isSignUp ? 'Criar Nova Conta' : 'Entrar na Conta'}
        </h2>

        <form onSubmit={handleAuth}>
          <div className="form-group">
            <label className="form-label">E-mail</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="seu-email@exemplo.com"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Senha</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Digite sua senha..."
              required
            />
          </div>

          {error && <div className="card text-red text-sm text-center mb-md" style={{ background: 'var(--red-bg)', borderColor: 'rgba(255,68,68,0.2)', padding: '8px' }}>{error}</div>}
          {message && <div className="card text-green text-sm text-center mb-md" style={{ background: 'var(--green-bg)', borderColor: 'rgba(46,204,64,0.2)', padding: '8px' }}>{message}</div>}

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Aguarde...' : isSignUp ? 'Cadastrar' : 'Entrar'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setIsSignUp(!isSignUp)}
            style={{ border: 'none', background: 'none', color: 'var(--green-primary)' }}
          >
            {isSignUp ? 'Já tem uma conta? Entrar' : 'Não tem conta? Cadastre-se'}
          </button>
        </div>
      </div>
    </div>
  );
}
