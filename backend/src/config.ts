import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  // Boleh lebih dari satu origin, pisahkan dengan koma. Hilangkan slash di akhir.
  corsOrigin: (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim().replace(/\/$/, ''))
    .filter(Boolean),
};

if (config.jwtSecret.length < 16) {
  throw new Error('JWT_SECRET wajib diisi (minimal 16 karakter)');
}
