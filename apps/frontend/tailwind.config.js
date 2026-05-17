/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0B0D17',
        surface: '#13162B',
        'surface-hover': '#1A1E3A',
        surfaceSolid: '#1e293b',
        primary: '#7C3AED',
        'primary-light': '#A78BFA',
        accent: '#22D3EE',
        'accent-light': '#67E8F9',
        'accent-alt': '#A3E635',
        info: '#22D3EE',
        danger: '#EF4444',
        'danger-light': '#FB7185',
        success: '#22C55E',
        'success-light': '#6EE7B7',
        warning: '#FACC15',
        text: '#F1F5F9',
        muted: '#94A3B8',
        neonPurple: '#b026ff',
        neonCyan: '#00f3ff',
        glassBorder: 'rgba(255, 255, 255, 0.08)',
        glassHighlight: 'rgba(255, 255, 255, 0.05)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'gradient-x': 'gradient-x 8s ease infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'float-delayed': 'float 6s ease-in-out 3s infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'spin-slow': 'spin 8s linear infinite',
        'bounce-soft': 'bounce-soft 2s ease-in-out infinite',
        'scale-in': 'scale-in 0.3s ease-out',
        'slide-up': 'slide-up 0.4s ease-out',
        'slide-down': 'slide-down 0.4s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'particle': 'particle 3s ease-in-out infinite',
      },
      keyframes: {
        'gradient-x': {
          '0%, 100%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(124, 58, 237, 0.3), 0 0 40px rgba(124, 58, 237, 0.1)' },
          '50%': { boxShadow: '0 0 30px rgba(124, 58, 237, 0.6), 0 0 60px rgba(124, 58, 237, 0.2)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'bounce-soft': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-down': {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'particle': {
          '0%, 100%': { transform: 'translate(0, 0)', opacity: '0' },
          '25%': { opacity: '0.8' },
          '50%': { transform: 'translate(20px, -30px)', opacity: '0.4' },
          '75%': { opacity: '0.8' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(ellipse at center, var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        '.glass': {
          background: 'rgba(19, 22, 43, 0.6)',
          backdropFilter: 'blur(16px) saturate(140%)',
          WebkitBackdropFilter: 'blur(16px) saturate(140%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 4px 24px 0 rgba(0, 0, 0, 0.3)',
        },
        '.glass-strong': {
          background: 'rgba(19, 22, 43, 0.85)',
          backdropFilter: 'blur(24px) saturate(160%)',
          WebkitBackdropFilter: 'blur(24px) saturate(160%)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.4)',
        },
        '.glass-card': {
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.02) 100%)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 4px 24px 0 rgba(0, 0, 0, 0.3)',
        },
        '.neon-border': {
          boxShadow: '0 0 5px rgba(124, 58, 237, 0.4), 0 0 15px rgba(124, 58, 237, 0.2)',
          border: '1px solid rgba(124, 58, 237, 0.4)',
        },
        '.neon-text': {
          textShadow: '0 0 10px rgba(124, 58, 237, 0.6), 0 0 20px rgba(124, 58, 237, 0.3)',
        },
        '.neon-text-cyan': {
          textShadow: '0 0 10px rgba(34, 211, 238, 0.6), 0 0 20px rgba(34, 211, 238, 0.3)',
        },
        '.noise': {
          position: 'relative',
        },
        '.noise::before': {
          content: '""',
          position: 'absolute',
          inset: '0',
          opacity: '0.035',
          pointerEvents: 'none',
          zIndex: '1',
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '200px 200px',
        },
        '.text-gradient': {
          background: 'linear-gradient(135deg, #A78BFA 0%, #22D3EE 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        },
        '.text-gradient-purple': {
          background: 'linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        },
        '.border-gradient': {
          position: 'relative',
          border: 'none',
        },
        '.border-gradient::before': {
          content: '""',
          position: 'absolute',
          inset: '0',
          borderRadius: 'inherit',
          padding: '1px',
          background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.5), rgba(34, 211, 238, 0.3))',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          pointerEvents: 'none',
        },
        '.btn-fill': {
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: '1',
        },
        '.btn-fill::before': {
          content: '""',
          position: 'absolute',
          bottom: '0',
          left: '0',
          width: '100%',
          height: '0%',
          transition: 'height 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: '-1',
        },
        '.btn-fill:hover::before': {
          height: '100%',
        },
        '.btn-fill-primary::before': {
          background: 'rgba(124, 58, 237, 0.9)',
        },
        '.btn-fill-accent::before': {
          background: 'rgba(34, 211, 238, 0.9)',
        },
        '.btn-fill-danger::before': {
          background: 'rgba(239, 68, 68, 0.9)',
        },
        '.card-lift': {
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        },
        '.card-lift:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4), 0 0 20px rgba(124, 58, 237, 0.15)',
        },
        '.input-glow': {
          transition: 'all 0.3s ease',
        },
        '.input-glow:focus': {
          boxShadow: '0 0 0 2px rgba(124, 58, 237, 0.2)',
          borderColor: 'rgba(124, 58, 237, 0.5)',
        },
      });
    },
  ],
};
