import { Request, Response } from 'express';
import { authService } from './auth.service';

export const authController = {
  async register(req: Request, res: Response) {
    const { name, email, password } = req.body;
    const result = await authService.register(name, email, password);
    res.status(201).json(result);
  },

  async login(req: Request, res: Response) {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.json(result);
  },

  async guest(req: Request, res: Response) {
    const { name } = req.body;
    const result = await authService.guest(name);
    res.json(result);
  },
};
