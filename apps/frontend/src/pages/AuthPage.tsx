import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Gamepad2, Target, Dices, Fingerprint } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { connectSocket } from '../socket/socketManager';
import GlowInput from '../components/ui/GlowInput';
import ToastNotification from '../components/ui/ToastNotification';

const tabVariants = {
  enter: { opacity: 0, x: 20 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register' | 'guest'>('login');
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
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
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
        throw new Error(data.error || 'Falha na autenticação');
      }

      setAuth(data.token, data.player);
      connectSocket(data.token);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const modes: { key: typeof mode; label: string }[] = [
    { key: 'login', label: 'Entrar' },
    { key: 'register', label: 'Criar conta' },
    { key: 'guest', label: 'Convidado' },
  ];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background noise">
      {/* === LADO ESQUERDO: BRANDING === */}
      <div className="relative flex-1 flex flex-col justify-center items-start px-8 py-12 lg:px-16 lg:py-0 overflow-hidden">
        {/* Decorative orbs */}
        <div className="orb orb-1 opacity-20" />
        <div className="orb orb-2 opacity-15" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.175, 0.885, 0.32, 1.275] }}
          className="relative z-10 max-w-md"
        >
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
            className="mb-8"
          >
            <h1 className="font-display text-5xl lg:text-6xl font-bold text-gradient tracking-tight pb-1">
              PastelariaGames
            </h1>
            <p className="text-muted text-lg mt-2 font-light">
              Jogue com seus amigos. A qualquer hora.
            </p>
          </motion.div>

          {/* Icon stack */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex items-center gap-3 mb-8"
          >
            {[Gamepad2, Target, Dices, Fingerprint].map((Icon, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.08 }}
                className="text-3xl text-primary"
              >
                <Icon size={28} />
              </motion.div>
            ))}
          </motion.div>

          {/* Tagline bullets */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="space-y-3 text-sm text-muted"
          >
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-alt"></span>
              Salas privadas com código de 4 caracteres
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
              Jogue sem cadastro como convidado
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-light"></span>
              Modo Impostor e Encontre sua Dupla
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* === DIVIDER (desktop only) === */}
      <div className="hidden lg:block w-px bg-gradient-to-b from-transparent via-white/10 to-transparent self-stretch my-12" />

      {/* === LADO DIREITO: FORMULÁRIO === */}
      <div className="flex-1 flex items-center justify-center px-6 py-8 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-md"
        >
          <div className="glass-strong rounded-xl p-6 lg:p-8">
            {/* Tabs */}
            <div className="flex gap-1 mb-6 p-1 bg-background/50 rounded-lg">
              {modes.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => { setMode(m.key); setError(null); }}
                  className={`
                    flex-1 py-2 rounded-md text-sm font-medium transition-all duration-300
                    ${mode === m.key
                      ? 'bg-primary/15 text-primary border border-primary/30'
                      : 'text-muted hover:text-text hover:bg-white/5'
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
                transition={{ duration: 0.25 }}
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

                <button
                  type="submit"
                  disabled={isLoading}
                  className="
                    w-full py-3 rounded-lg font-semibold text-sm
                    border border-primary/40 text-primary
                    bg-transparent btn-fill btn-fill-primary
                    transition-all duration-300
                    hover:text-white
                    disabled:opacity-40 disabled:cursor-not-allowed
                  "
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Carregando...
                    </span>
                  ) : mode === 'login' ? (
                    'Entrar'
                  ) : mode === 'register' ? (
                    'Criar conta'
                  ) : (
                    'Jogar como convidado'
                  )}
                </button>
              </motion.form>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
