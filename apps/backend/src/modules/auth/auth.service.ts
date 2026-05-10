import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../../config/env';
import { User } from './auth.model';

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
      throw new Error('Email already in use');
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
      throw new Error('Invalid credentials');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new Error('Invalid credentials');
    }

    const player = mapUserToProfile(user);
    return { player, token: generateToken(user.id) };
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
    return { player, token: generateToken(id) };
  },
};
