import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/useAuthStore';
import { connectSocket } from '../socket/socketManager';
import GlassCard from '../components/ui/GlassCard';
import NeonButton from '../components/ui/NeonButton';
import GlowInput from '../components/ui/GlowInput';
import ToastNotification from '../components/ui/ToastNotification';

type AuthMode = 'login' | 'register' | 'guest';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const tabVariants = {
  enter: { opacity: 0, x: 20 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

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

  const modes: { key: AuthMode; label: string }[] = [
    { key: 'login', label: 'Entrar' },
    { key: 'register', label: 'Criar conta' },
    { key: 'guest', label: 'Convidado' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.175, 0.885, 0.32, 1.275] }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            className="inline-block mb-4"
          >
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30">
              <span className="text-4xl">🎮</span>
            </div>
          </motion.div>
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary-light neon-text">
            PartyGames
          </h1>
          <p className="text-muted mt-2">Jogue com seus amigos!</p>
        </div>

        <GlassCard variant="strong" className="p-8">
          {/* Tabs */}
          <div className="flex gap-2 mb-6 p-1 bg-background/50 rounded-xl">
            {modes.map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => { setMode(m.key); setError(null); }}
                className={`
                  flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300
                  ${mode === m.key
                    ? 'bg-primary text-white shadow-lg shadow-primary/30'
                    : 'text-muted hover:text-text'
                  }
                `}
              >
                {m.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.form
              key={mode}
              variants={tabVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              {(mode === 'register' || mode === 'guest') && (
                <GlowInput
                  label="Nome"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Seu nickname"
                />
              )}

              {mode !== 'guest' && (
                <>
                  <GlowInput
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="seu@email.com"
                  />
                  <GlowInput
                    label="Senha"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="********"
                  />
                </>
              )}

              <ToastNotification show={!!error} variant="error">
                {error}
              </ToastNotification>

              <NeonButton
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                disabled={isLoading}
                className="mt-2"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Carregando...
                  </span>
                ) : mode === 'login' ? (
                  'Entrar'
                ) : mode === 'register' ? (
                  'Criar conta'
                ) : (
                  'Jogar como convidado'
                )}
              </NeonButton>
            </motion.form>
          </AnimatePresence>
        </GlassCard>

        {/* Decorative elements */}
        <div className="flex justify-center gap-4 mt-8">
          {['🎯', '🎲', '🎭', '🎪'].map((emoji, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="text-2xl"
            >
              {emoji}
            </motion.span>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
