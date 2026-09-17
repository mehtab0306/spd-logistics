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

  // Create / upsert official admin user (admin@gmail.com / admin)
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@gmail.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin';
  const adminName = process.env.ADMIN_NAME || 'System Admin';
  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
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
  console.log(`✓ Primary Admin user verified/created: ${adminEmail} (password: ${adminPassword})`);

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

  // Create sample customer if not exists
  const customerEmail = 'customer@spdlogistics.com';
  const existingCustUser = await prisma.user.findUnique({ where: { email: customerEmail } });
  if (!existingCustUser) {
    const custPass = await bcrypt.hash('customer123', 12);
    const user = await prisma.user.create({
      data: {
        email: customerEmail,
        password: custPass,
        name: 'Malik Traders',
        phone: '03001234567',
        role: 'CUSTOMER',
        status: 'ACTIVE',
      },
    });
    const cust = await prisma.customer.create({
      data: {
        userId: user.id,
        name: 'Malik Traders',
        companyName: 'Malik Logistics & Trading Co.',
        phone: '03001234567',
        email: customerEmail,
        city: 'Lahore',
        warehouse: 'LAHORE',
        openingBalance: 0,
        creditLimit: 250000,
        accountType: 'CUSTOMER',
        status: 'ACTIVE',
      },
    });
    await prisma.account.create({
      data: {
        customerId: cust.id,
        accountName: 'Malik Traders Account',
        accountType: 'CUSTOMER',
        openingBalance: 0,
      },
    });
    console.log(`✓ Sample customer created: ${customerEmail}`);
  }

  // Create sample driver if not exists
  const driverEmail = 'driver@spdlogistics.com';
  const existingDriverUser = await prisma.user.findUnique({ where: { email: driverEmail } });
  if (!existingDriverUser) {
    const driverPass = await bcrypt.hash('driver123', 12);
    const dUser = await prisma.user.create({
      data: {
        email: driverEmail,
        password: driverPass,
        name: 'Tariq Mehmood',
        phone: '03219876543',
        role: 'DRIVER',
        status: 'ACTIVE',
      },
    });
    const vehicle = await prisma.vehicle.upsert({
      where: { vehicleNumber: 'LES-9988' },
      update: {},
      create: {
        vehicleNumber: 'LES-9988',
        vehicleType: 'Heavy Truck (22-Wheeler)',
        model: 'Hino 700 Series',
        capacity: 35,
        status: 'AVAILABLE',
        currentLocation: 'Lahore Terminal',
        route: 'Lahore - Karachi Highway',
      },
    });
    await prisma.driver.create({
      data: {
        userId: dUser.id,
        name: 'Tariq Mehmood',
        phone: '03219876543',
        contact: '03219876543',
        cnic: '35201-1234567-1',
        licenseNumber: 'LHR-HTV-9921',
        vehicleNumber: vehicle.vehicleNumber,
        assignedVehicleId: vehicle.id,
        status: 'AVAILABLE',
      },
    });
    console.log(`✓ Sample driver created: ${driverEmail}`);
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
