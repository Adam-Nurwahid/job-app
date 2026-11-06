import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { Role } from '@prisma/client';
import { config } from '../config';
import { prisma } from '../lib/prisma';
import { AppError, asyncHandler } from '../lib/errors';
import { authenticate } from '../middleware/auth';

const router = Router();

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Nama minimal 2 karakter'),
  email: z.string().trim().toLowerCase().email('Email tidak valid'),
  password: z.string().min(8, 'Password minimal 8 karakter'),
  role: z.enum(['JOB_SEEKER', 'COMPANY']),
});
const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
});

const publicUser = (u: { id: string; name: string; email: string; role: Role }) => ({
  id: u.id, name: u.name, email: u.email, role: u.role,
});

const signToken = (u: { id: string; role: Role }) =>
  jwt.sign({ role: u.role }, config.jwtSecret, {
    subject: u.id,
    expiresIn: config.jwtExpiresIn as jwt.SignOptions['expiresIn'],
  });

router.post('/register', asyncHandler(async (req, res) => {
  const data = registerSchema.parse(req.body);
  if (await prisma.user.findUnique({ where: { email: data.email } })) {
    throw new AppError(409, 'Email sudah terdaftar');
  }
  const user = await prisma.user.create({ data: { ...data, password: await bcrypt.hash(data.password, 10) } });
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
}));

router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new AppError(401, 'Email atau password salah');
  }
  res.json({ token: signToken(user), user: publicUser(user) });
}));

router.get('/me', authenticate, asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) throw new AppError(401, 'User tidak ditemukan');
  res.json({ user: publicUser(user) });
}));

export default router;
