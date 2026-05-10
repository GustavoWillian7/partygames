import mongoose from 'mongoose';

export interface IUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  totalGames: number;
  totalWins: number;
  favoriteGame?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new mongoose.Schema<IUser>(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, default: '' },
    totalGames: { type: Number, default: 0 },
    totalWins: { type: Number, default: 0 },
    favoriteGame: { type: String },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', userSchema);
