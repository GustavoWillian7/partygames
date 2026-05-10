import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/useAuthStore';
import { connectSocket } from '../socket/socketManager';

type AuthMode = 'login' | 'register' | 'guest';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { setAuth, setLoading, isLoading, error, setError } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let endpoint = '';
      let body: Record<string, string> = {};

      if (mode === 'register') {
        endpoint = '/api/auth/register';
        body = { name, email, password };
      } else if (mode === 'login') {
        endpoint = '/api/auth/login';
        body = { email, password };
      } else {
        endpoint = '/api/auth/guest';
        body = { name };
      }

      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      setAuth(data.token, data.player);
      connectSocket(data.token);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const tab = (label: string, m: AuthMode) => (
    <button
      type="button"
      onClick={() => { setMode(m); setError(null); }}
      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
        mode === m
          ? 'bg-primary text-white'
          : 'bg-surface text-muted hover:text-text'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-surface rounded-2xl p-8 shadow-xl border border-surface/50"
      >
        <h1 className="text-3xl font-bold text-center text-primary mb-2">PartyGames</h1>
        <p className="text-muted text-center mb-6">Jogue com seus amigos!</p>

        <div className="flex gap-2 mb-6">
          {tab('Entrar', 'login')}
          {tab('Criar conta', 'register')}
          {tab('Convidado', 'guest')}
        </div>

        <AnimatePresence mode="wait">
          <motion.form
            key={mode}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            {(mode === 'register' || mode === 'guest') && (
              <div>
                <label className="block text-sm font-medium text-text mb-1">Nome</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-4 py-2 rounded-lg bg-background border border-surface focus:border-primary focus:outline-none text-text"
                  placeholder="Seu nickname"
                />
              </div>
            )}

            {mode !== 'guest' && (
              <div>
                <label className="block text-sm font-medium text-text mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 rounded-lg bg-background border border-surface focus:border-primary focus:outline-none text-text"
                  placeholder="seu@email.com"
                />
              </div>
            )}

            {mode !== 'guest' && (
              <div>
                <label className="block text-sm font-medium text-text mb-1">Senha</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2 rounded-lg bg-background border border-surface focus:border-primary focus:outline-none text-text"
                  placeholder="********"
                />
              </div>
            )}

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-danger text-sm text-center"
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-white font-semibold transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Carregando...' : mode === 'login' ? 'Entrar' : mode === 'register' ? 'Criar conta' : 'Jogar como convidado'}
            </button>
          </motion.form>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
