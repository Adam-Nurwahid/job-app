import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import authRoutes from './routes/auth';
import jobRoutes from './routes/jobs';
import applicationRoutes from './routes/applications';
import { errorHandler, notFound } from './middleware/error';

const app = express();

app.use(helmet());
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);

app.use(notFound);
app.use(errorHandler);

// Di Vercel app dijalankan sebagai serverless function (lihat api/index.ts), jadi tidak perlu listen.
if (!process.env.VERCEL) {
  app.listen(config.port, () => console.log(`API berjalan di http://localhost:${config.port}`));
}

export default app;
