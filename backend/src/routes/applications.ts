import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { AppError, asyncHandler } from '../lib/errors';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();
router.use(authenticate);

const statusSchema = z.object({
  status: z.enum(['APPLIED', 'REVIEWING', 'SHORTLISTED', 'REJECTED', 'ACCEPTED']),
  note: z.string().trim().max(500).optional(),
});

// Lamaran milik Job Seeker + status + riwayat
router.get('/me', requireRole('JOB_SEEKER'), asyncHandler(async (req, res) => {
  const applications = await prisma.application.findMany({
    where: { seekerId: req.user!.id },
    include: {
      job: { include: { company: { select: { id: true, name: true } } } },
      history: { orderBy: { createdAt: 'asc' } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ data: applications });
}));

// Company mengubah status kandidat; update + history disimpan atomic dalam satu transaksi
router.patch('/:id/status', requireRole('COMPANY'), asyncHandler(async (req, res) => {
  const { status, note } = statusSchema.parse(req.body);
  const application = await prisma.application.findUnique({
    where: { id: req.params.id },
    include: { job: true },
  });
  if (!application) throw new AppError(404, 'Lamaran tidak ditemukan');
  if (application.job.companyId !== req.user!.id) throw new AppError(403, 'Ini bukan lamaran untuk lowongan Anda');
  if (application.status === status) throw new AppError(400, 'Status sudah sama dengan status saat ini');

  const updated = await prisma.$transaction(async (tx) => {
    await tx.applicationHistory.create({
      data: { applicationId: application.id, fromStatus: application.status, toStatus: status, note, changedById: req.user!.id },
    });
    return tx.application.update({
      where: { id: application.id },
      data: { status },
      include: { history: { orderBy: { createdAt: 'asc' } } },
    });
  });
  res.json(updated);
}));

export default router;
