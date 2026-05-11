import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error('[Error]', err);

  const message = err.message;

  if (message === 'Invalid credentials') {
    return res.status(401).json({ error: message });
  }

  if (message === 'Email already in use') {
    return res.status(409).json({ error: message });
  }

  // Erros de validação (Zod) e outros erros de negócio
  if (message.includes('required') || message.includes('invalid') || message.includes('Invalid')) {
    return res.status(400).json({ error: message });
  }

  res.status(500).json({ error: 'Internal server error' });
}
