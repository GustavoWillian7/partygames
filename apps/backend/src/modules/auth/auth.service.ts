import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../../config/env';
import { redis } from '../../config/redis';
import { User } from './auth.model';

const SESSION_TTL_SECONDS = 86400; // 24h

function generateToken(playerId: string) {
  return jwt.sign({ playerId }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as any });
}

function mapUserToProfile(user: { id: string; name: string; email: string; totalGames: number; totalWins: number; favoriteGame?: string; createdAt: Date; updatedAt: Date }) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    totalGames: user.totalGames,
    totalWins: user.totalWins,
    favoriteGame: user.favoriteGame,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export const authService = {
  async getById(playerId: string) {
    const user = await User.findOne({ id: playerId }).lean();
    if (!user) return undefined;
    return { id: user.id, name: user.name, email: user.email };
  },

  async register(name: string, email: string, password: string) {
    const existing = await User.findOne({ email }).lean();
    if (existing) {
      throw new Error('Este email já está em uso');
    }

    const id = uuidv4();
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      id,
      name,
      email,
      passwordHash,
      totalGames: 0,
      totalWins: 0,
    });

    const player = mapUserToProfile(user);
    return { player, token: generateToken(id) };
  },

  async login(email: string, password: string) {
    const user = await User.findOne({ email }).lean();
    if (!user) {
      throw new Error('Email ou senha incorretos');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new Error('Email ou senha incorretos');
    }

    // Verificar se já existe sessão ativa
    const sessionKey = `auth:session:${user.id}`;
    const existingSession = await redis.get(sessionKey);
    if (existingSession) {
      throw new Error('Esta conta já está em uso em outro dispositivo ou navegador');
    }

    const player = mapUserToProfile(user);
    const token = generateToken(user.id);
    await redis.set(sessionKey, token, 'EX', SESSION_TTL_SECONDS);
    return { player, token };
  },

  async guest(name: string) {
    const id = uuidv4();
    const email = `${id}@guest.local`;

    const user = await User.create({
      id,
      name,
      email,
      passwordHash: '',
      totalGames: 0,
      totalWins: 0,
    });

    const player = mapUserToProfile(user);
    const token = generateToken(id);
    await redis.set(`auth:session:${id}`, token, 'EX', SESSION_TTL_SECONDS);
    return { player, token };
  },

  async clearSession(playerId: string) {
    await redis.del(`auth:session:${playerId}`);
  },
};
