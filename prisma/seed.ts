// ============================================
// SPD LOGISTICS — Database Seed Script
// ============================================
// Creates a default admin user from environment variables.
// Run: npm run db:seed
// ============================================

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 SPD Logistics — Database Seed');
  console.log('================================');

  // Create / upsert official admin user
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@gmail.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin';
  const adminName = process.env.ADMIN_NAME || 'System Admin';
  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      username: 'admin',
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      name: adminName,
    },
    create: {
      email: adminEmail,
      username: 'admin',
      password: hashedPassword,
      name: adminName,
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
    },
  });
  console.log(`✓ Primary Admin user verified/configured: ${adminEmail}`);

  // Create default cash books (empty, with 0 balance)
  const defaultCashBooks = [
    {
      name: 'Hammad Cash Book',
      city: 'Lahore',
      description: 'Main cash book for Lahore operations',
      openingBalance: 0,
    },
    {
      name: 'Hammad Cash Book',
      city: 'Karachi',
      description: 'Main cash book for Karachi operations',
      openingBalance: 0,
    },
  ];

  for (const cb of defaultCashBooks) {
    const existing = await prisma.cashBook.findFirst({
      where: { name: cb.name, city: cb.city },
    });

    if (existing) {
      console.log(`✓ Cash book already exists: ${cb.name} — ${cb.city}`);
    } else {
      await prisma.cashBook.create({ data: cb });
      console.log(`✓ Cash book created: ${cb.name} — ${cb.city}`);
    }
  }


  console.log('');
  console.log('================================');
  console.log('✅ Seed complete!');
  console.log('');
  console.log('⚠️  IMPORTANT: Change the default admin password!');
  console.log(`   Email: ${adminEmail}`);
  console.log('');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed error:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
