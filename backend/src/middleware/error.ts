import { ErrorRequestHandler, RequestHandler } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { AppError } from '../lib/errors';

export const notFound: RequestHandler = (_req, res) => {
  res.status(404).json({ message: 'Endpoint tidak ditemukan' });
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: 'Validasi gagal',
      errors: err.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
    });
  }
  if (err instanceof AppError) return res.status(err.status).json({ message: err.message });
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
    return res.status(409).json({ message: 'Data sudah ada' });
  }
  console.error(err);
  res.status(500).json({ message: 'Terjadi kesalahan pada server' });
};
