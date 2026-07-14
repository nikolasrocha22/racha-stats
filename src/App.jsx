import React, { useState, useEffect, useCallback } from 'react';
import { Outlet } from 'react-router';
import Navbar from './components/Navbar';
import { supabase, ADMIN_EMAIL } from './supabaseClient';
import { ToastProvider } from './components/ToastContext';

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    setSession(currentSession);
    return currentSession;
  }, []);

  useEffect(() => {
    // Get initial session
    refreshSession().then(() => {
      setLoading(false);
    });

    // Listen to changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [refreshSession]);

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
    <ToastProvider>
      <Outlet context={{ session, user, isAdmin, setSession, refreshSession }} />
      <Navbar user={user} />
    </ToastProvider>
  );
}
