import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router';
import Navbar from './components/Navbar';
import { supabase, ADMIN_EMAIL } from './supabaseClient';

export default function App() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setLoading(false);
    });

    // Listen to changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const user = session?.user || null;
  const isAdmin = user?.email === ADMIN_EMAIL;

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <>
      <Outlet context={{ session, user, isAdmin }} />
      <Navbar user={user} />
    </>
  );
}
