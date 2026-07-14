import React, { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router';
import { LogIn } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useToast } from '../components/ToastContext';

// Hand-drawn custom SVG soccer ball for the header
function SoccerBallLogo({ size = 48 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="256" cy="256" r="236" fill="#e8f5e9" stroke="#0d1612" strokeWidth="20"/>
      <polygon points="256,190 310,230 290,295 222,295 202,230" fill="#0d1612"/>
      
      <line x1="256" y1="190" x2="256" y2="80" stroke="#0d1612" strokeWidth="15" strokeLinecap="round"/>
      <line x1="310" y1="230" x2="415" y2="195" stroke="#0d1612" strokeWidth="15" strokeLinecap="round"/>
      <line x1="290" y1="295" x2="355" y2="395" stroke="#0d1612" strokeWidth="15" strokeLinecap="round"/>
      <line x1="222" y1="295" x2="157" y2="395" stroke="#0d1612" strokeWidth="15" strokeLinecap="round"/>
      <line x1="202" y1="230" x2="97" y2="195" stroke="#0d1612" strokeWidth="15" strokeLinecap="round"/>

      <polygon points="256,80 200,30 312,30" fill="#0d1612"/>
      <polygon points="415,195 465,140 465,250" fill="#0d1612"/>
      <polygon points="355,395 420,440 310,480" fill="#0d1612"/>
      <polygon points="157,395 92,440 202,480" fill="#0d1612"/>
      <polygon points="97,195 47,140 47,250" fill="#0d1612"/>
    </svg>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const toast = useToast();
  const { setSession, refreshSession } = useOutletContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { error: signUpErr } = await supabase.auth.signUp({
          email: email.trim(),
          password
        });
        if (signUpErr) throw signUpErr;
        toast.success('Cadastro realizado com sucesso! Verifique seu e-mail para confirmação se necessário.');
      } else {
        const { data, error: signInErr } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password
        });
        if (signInErr) throw signInErr;

        const activeSession = data.session || await refreshSession();
        if (!activeSession) {
          toast.warning('Sessão não foi iniciada. Confirme seu e-mail ou tente entrar novamente.');
          setLoading(false);
          return;
        }

        setSession(activeSession);
        toast.success('Login realizado com sucesso!');
        navigate('/', { replace: true });
      }
    } catch (err) {
      toast.error(err.message || 'Ocorreu um erro ao autenticar.');
    }
    setLoading(false);
  };

  return (
    <div className="page" style={{ maxWidth: '400px', padding: '40px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: 'calc(100vh - 120px)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
        <SoccerBallLogo size={56} />
        <h1 style={{ marginTop: '12px', fontSize: '1.75rem', fontWeight: 900 }}>Racha Stats</h1>
        <p className="text-muted text-sm" style={{ marginTop: '4px' }}>Faça login para gerenciar suas peladas</p>
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

          <button type="submit" className="btn btn-primary btn-block" disabled={loading} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <LogIn size={16} />
            <span>{loading ? 'Aguarde...' : isSignUp ? 'Cadastrar' : 'Entrar'}</span>
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
