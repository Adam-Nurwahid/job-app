import { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { config } from '../config';
import { AppError } from '../lib/errors';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { id: string; role: Role };
    }
  }
}

export const authenticate: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) throw new AppError(401, 'Token tidak ditemukan');
  try {
    const payload = jwt.verify(header.slice(7), config.jwtSecret) as { sub: string; role: Role };
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    throw new AppError(401, 'Token tidak valid atau sudah kadaluarsa');
  }
};

export const requireRole =
  (...roles: Role[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) throw new AppError(403, 'Akses ditolak untuk role ini');
    next();
  };
