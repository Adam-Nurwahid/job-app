import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { AppError, asyncHandler } from '../lib/errors';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();
router.use(authenticate);

const JOB_TYPES = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'FREELANCE'] as const;

const listQuery = z.object({
  q: z.string().trim().optional(),
  location: z.string().trim().optional(),
  type: z.enum(JOB_TYPES).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

const createSchema = z
  .object({
    title: z.string().trim().min(3, 'Judul minimal 3 karakter'),
    description: z.string().trim().min(10, 'Deskripsi minimal 10 karakter'),
    location: z.string().trim().min(2, 'Lokasi wajib diisi'),
    type: z.enum(JOB_TYPES),
    salaryMin: z.coerce.number().int().min(0).optional(),
    salaryMax: z.coerce.number().int().min(0).optional(),
  })
  .refine((d) => d.salaryMin === undefined || d.salaryMax === undefined || d.salaryMin <= d.salaryMax, {
    message: 'Gaji minimum tidak boleh lebih besar dari maksimum',
    path: ['salaryMin'],
  });

const applySchema = z.object({ coverLetter: z.string().trim().max(2000).optional() });

// Sertakan data perusahaan + status lamaran milik user yang sedang login
const jobInclude = (userId: string) => ({
  company: { select: { id: true, name: true } },
  applications: { where: { seekerId: userId }, select: { id: true, status: true } },
});

const withMine = <T extends { applications: unknown[] }>(job: T) => {
  const { applications, ...rest } = job;
  return { ...rest, myApplication: applications[0] ?? null };
};

// Daftar lowongan
router.get('/', asyncHandler(async (req, res) => {
  const { q, location, type, page, limit } = listQuery.parse(req.query);
  const where: Prisma.JobWhereInput = {
    isActive: true,
    ...(type && { type }),
    ...(location && { location: { contains: location, mode: 'insensitive' } }),
    ...(q && {
      OR: [
        { title: { contains: q, mode: 'insensitive' } },
        { company: { name: { contains: q, mode: 'insensitive' } } },
      ],
    }),
  };
  const [total, jobs] = await prisma.$transaction([
    prisma.job.count({ where }),
    prisma.job.findMany({
      where,
      include: jobInclude(req.user!.id),
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);
  res.json({ data: jobs.map(withMine), meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
}));

// Lowongan milik company yang login (harus sebelum '/:id')
router.get('/mine', requireRole('COMPANY'), asyncHandler(async (req, res) => {
  const jobs = await prisma.job.findMany({
    where: { companyId: req.user!.id },
    include: { _count: { select: { applications: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ data: jobs });
}));

router.post('/', requireRole('COMPANY'), asyncHandler(async (req, res) => {
  const data = createSchema.parse(req.body);
  const job = await prisma.job.create({ data: { ...data, companyId: req.user!.id } });
  res.status(201).json(job);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const job = await prisma.job.findUnique({ where: { id: req.params.id }, include: jobInclude(req.user!.id) });
  if (!job) throw new AppError(404, 'Lowongan tidak ditemukan');
  res.json(withMine(job));
}));

// Job Seeker melamar
router.post('/:id/apply', requireRole('JOB_SEEKER'), asyncHandler(async (req, res) => {
  const { coverLetter } = applySchema.parse(req.body ?? {});
  const job = await prisma.job.findUnique({ where: { id: req.params.id } });
  if (!job || !job.isActive) throw new AppError(404, 'Lowongan tidak ditemukan');

  try {
    const application = await prisma.application.create({
      data: {
        jobId: job.id,
        seekerId: req.user!.id,
        coverLetter,
        history: { create: { toStatus: 'APPLIED', changedById: req.user!.id, note: 'Lamaran dikirim' } },
      },
    });
    res.status(201).json(application);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      throw new AppError(409, 'Anda sudah melamar lowongan ini');
    }
    throw e;
  }
}));

// Company melihat pelamar di lowongan miliknya
router.get('/:id/applications', requireRole('COMPANY'), asyncHandler(async (req, res) => {
  const job = await prisma.job.findUnique({ where: { id: req.params.id } });
  if (!job) throw new AppError(404, 'Lowongan tidak ditemukan');
  if (job.companyId !== req.user!.id) throw new AppError(403, 'Ini bukan lowongan Anda');

  const applications = await prisma.application.findMany({
    where: { jobId: job.id },
    include: {
      seeker: { select: { id: true, name: true, email: true } },
      history: { orderBy: { createdAt: 'asc' } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ job, data: applications });
}));

export default router;
