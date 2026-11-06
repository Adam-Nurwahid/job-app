import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('password123', 10);
  const company = await prisma.user.upsert({
    where: { email: 'hr@acme.test' },
    update: {},
    create: { email: 'hr@acme.test', name: 'Acme Teknologi', role: 'COMPANY', password },
  });
  await prisma.user.upsert({
    where: { email: 'seeker@test.com' },
    update: {},
    create: { email: 'seeker@test.com', name: 'Budi Santoso', role: 'JOB_SEEKER', password },
  });
  if ((await prisma.job.count()) === 0) {
    await prisma.job.createMany({
      data: [
        { title: 'Full Stack Developer', description: 'Membangun fitur web dengan React dan Node.js.', location: 'Jakarta', salaryMin: 10000000, salaryMax: 18000000, type: 'FULL_TIME', companyId: company.id },
        { title: 'Mobile Developer (Flutter)', description: 'Mengembangkan aplikasi mobile lintas platform.', location: 'Remote', salaryMin: 9000000, salaryMax: 15000000, type: 'CONTRACT', companyId: company.id },
        { title: 'UI/UX Intern', description: 'Membantu tim desain membuat prototype.', location: 'Bandung', salaryMin: 2000000, salaryMax: 3000000, type: 'INTERNSHIP', companyId: company.id },
      ],
    });
  }
  console.log('Seed selesai. Login: hr@acme.test / seeker@test.com (password: password123)');
}

main().finally(() => prisma.$disconnect());
