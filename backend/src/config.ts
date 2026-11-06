import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
};

if (config.jwtSecret.length < 16) {
  throw new Error('JWT_SECRET wajib diisi (minimal 16 karakter)');
}
