import { Request, Response, NextFunction } from 'express';

const ERROR_MESSAGES: Record<string, string> = {
  'Invalid credentials': 'Email ou senha incorretos',
  'Email already in use': 'Este email já está em uso',
  'Unauthorized': 'Não autorizado',
  'Authentication required': 'Autenticação necessária',
  'Invalid token': 'Token inválido',
  'Room not found': 'Sala não encontrada',
  'Room is full': 'A sala está cheia',
  'Game already in progress': 'Jogo já em andamento',
  'Only host can kick players': 'Apenas o host pode remover jogadores',
  'Only host can update settings': 'Apenas o host pode alterar as configurações',
  'Only host can start the game': 'Apenas o host pode iniciar o jogo',
  'Need at least 3 players to start': 'É necessário pelo menos 3 jogadores para iniciar',
  'Failed to generate unique room code': 'Falha ao gerar código único para a sala',
  'maxPlayers must be between 3 and 12': 'O máximo de jogadores deve estar entre 3 e 12',
  'Cannot set maxPlayers below current player count': 'Não é possível definir máximo de jogadores abaixo do número atual',
  'Game not found': 'Jogo não encontrado',
  'Not in clue phase': 'Não estamos na fase de dicas',
  'Not in voting phase': 'Não estamos na fase de votação',
  'Clue already given': 'Você já enviou sua dica',
  'Vote already cast': 'Você já votou',
  'Eliminated players cannot play': 'Jogadores eliminados não podem participar',
  'Eliminated players cannot vote': 'Jogadores eliminados não podem votar',
  'Esta conta já está em uso em outro dispositivo ou navegador': 'Esta conta já está em uso em outro dispositivo ou navegador',
};

function translateError(message: string): string {
  return ERROR_MESSAGES[message] || message;
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error('[Error]', err);

  const message = translateError(err.message);

  if (err.message === 'Invalid credentials' || err.message === 'Email ou senha incorretos') {
    return res.status(401).json({ error: message });
  }

  if (err.message === 'Email already in use' || err.message === 'Este email já está em uso') {
    return res.status(409).json({ error: message });
  }

  if (err.message === 'Esta conta já está em uso em outro dispositivo ou navegador') {
    return res.status(403).json({ error: message });
  }

  // Erros de validação (Zod) e outros erros de negócio
  if (err.message.includes('required') || err.message.includes('invalid') || err.message.includes('Invalid')) {
    return res.status(400).json({ error: message });
  }

  res.status(500).json({ error: 'Erro interno do servidor' });
}
