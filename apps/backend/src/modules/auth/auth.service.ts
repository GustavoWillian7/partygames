import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../../config/env';

const users = new Map<string, { id: string; name: string; email: string; passwordHash: string }>();

function generateToken(playerId: string) {
  return jwt.sign({ playerId }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
}

export const authService = {
  async register(name: string, email: string, password: string) {
    if (users.has(email)) {
      throw new Error('Email already in use');
    }
    const id = uuidv4();
    const passwordHash = await bcrypt.hash(password, 10);
    users.set(email, { id, name, email, passwordHash });

    const player = {
      id,
      email,
      name,
      totalGames: 0,
      totalWins: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return { player, token: generateToken(id) };
  },

  async login(email: string, password: string) {
    const user = users.get(email);
    if (!user) {
      throw new Error('Invalid credentials');
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new Error('Invalid credentials');
    }

    const player = {
      id: user.id,
      email: user.email,
      name: user.name,
      totalGames: 0,
      totalWins: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return { player, token: generateToken(user.id) };
  },

  async guest(name: string) {
    const id = uuidv4();
    const player = {
      id,
      email: '',
      name,
      totalGames: 0,
      totalWins: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return { player, token: generateToken(id) };
  },
};
