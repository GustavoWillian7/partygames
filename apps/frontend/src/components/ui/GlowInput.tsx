import { type InputHTMLAttributes, forwardRef } from 'react';

interface GlowInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const GlowInput = forwardRef<HTMLInputElement, GlowInputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-text mb-2">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            w-full px-4 py-2.5 rounded-xl
            bg-background/60 border border-glassBorder
            text-text placeholder:text-muted/50
            focus:outline-none input-glow
            transition-all duration-300
            ${error ? 'border-danger/50 focus:border-danger' : ''}
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="mt-1 text-xs text-danger">{error}</p>
        )}
      </div>
    );
  }
);

GlowInput.displayName = 'GlowInput';

export default GlowInput;
