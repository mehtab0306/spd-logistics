import prisma from '@/lib/prisma';
import { hashPassword, comparePassword } from '@/lib/auth';

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('====================================================');
  console.log('  SPD LOGISTICS: REAL ADMIN CREDENTIAL TEST SUITE  ');
  console.log('====================================================\n');

  // Baseline preparation: Ensure admin is admin@gmail.com / admin
  const baselineHash = await hashPassword('admin');
  const baselineUser = await prisma.user.findFirst({
    where: { OR: [{ email: 'admin@gmail.com' }, { username: 'admin' }, { role: 'SUPER_ADMIN' }] },
  });
  if (!baselineUser) {
    throw new Error('Baseline admin user not found in database');
  }
  await prisma.user.update({
    where: { id: baselineUser.id },
    data: { email: 'admin@gmail.com', password: baselineHash, role: 'SUPER_ADMIN', status: 'ACTIVE', username: 'admin' },
  });
  console.log('Baseline established: admin@gmail.com / password: admin\n');

  // ----------------------------------------------------
  // TEST 1 — INITIAL LOGIN
  // ----------------------------------------------------
  console.log('[TEST 1] Initial Login: admin@gmail.com / admin');
  const t1Res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@gmail.com', password: 'admin' }),
  });
  const t1Data = await t1Res.json();
  if (t1Res.status !== 200 || !t1Data.success || !t1Data.data?.token) {
    throw new Error(`[TEST 1 FAILED] Initial login failed: ${JSON.stringify(t1Data)}`);
  }
  const token = t1Data.data.token;
  console.log('  -> Status: 200 OK | Authenticated User:', t1Data.data.email, '| Role:', t1Data.data.role);
  console.log('  [PASS] Test 1: Real Admin account logged in.\n');

  // ----------------------------------------------------
  // TEST 7 — WRONG CURRENT PASSWORD
  // ----------------------------------------------------
  console.log('[TEST 7] Wrong Current Password Rejection');
  const t7Res = await fetch(`${BASE_URL}/api/admin/profile/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Cookie': `spd-auth-token=${token}`,
    },
    body: JSON.stringify({
      currentPassword: 'wrongPassword999',
      newPassword: 'TestNewPassword123!',
      confirmPassword: 'TestNewPassword123!',
    }),
  });
  const t7Data = await t7Res.json();
  if (t7Res.status !== 400 || !t7Data.error?.includes('Current password is incorrect')) {
    throw new Error(`[TEST 7 FAILED] Expected 400 with "Current password is incorrect", got ${t7Res.status}: ${JSON.stringify(t7Data)}`);
  }
  console.log('  -> Status: 400 Bad Request | Error:', t7Data.error);
  console.log('  [PASS] Test 7: Invalid current password was rejected.\n');

  // ----------------------------------------------------
  // TEST 8 — PASSWORD MISMATCH
  // ----------------------------------------------------
  console.log('[TEST 8] Password Mismatch Rejection');
  const t8Res = await fetch(`${BASE_URL}/api/admin/profile/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Cookie': `spd-auth-token=${token}`,
    },
    body: JSON.stringify({
      currentPassword: 'admin',
      newPassword: 'TestNewPassword123!',
      confirmPassword: 'DifferentPassword789!',
    }),
  });
  const t8Data = await t8Res.json();
  if (t8Res.status !== 400 || !t8Data.error?.includes('New passwords do not match')) {
    throw new Error(`[TEST 8 FAILED] Expected 400 with "New passwords do not match", got ${t8Res.status}: ${JSON.stringify(t8Data)}`);
  }
  console.log('  -> Status: 400 Bad Request | Error:', t8Data.error);
  console.log('  [PASS] Test 8: Mismatched passwords were rejected before saving.\n');

  // ----------------------------------------------------
  // TEST 2 — CHANGE PASSWORD
  // ----------------------------------------------------
  console.log('[TEST 2] Change Password: admin -> TestNewPassword123!');
  const t2Res = await fetch(`${BASE_URL}/api/admin/profile/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Cookie': `spd-auth-token=${token}`,
    },
    body: JSON.stringify({
      currentPassword: 'admin',
      newPassword: 'TestNewPassword123!',
      confirmPassword: 'TestNewPassword123!',
    }),
  });
  const t2Data = await t2Res.json();
  if (t2Res.status !== 200 || !t2Data.success) {
    throw new Error(`[TEST 2 FAILED] Password change failed: ${JSON.stringify(t2Data)}`);
  }
  console.log('  -> Status: 200 OK | Message:', t2Data.message);
  console.log('  [PASS] Test 2: Password changed successfully confirmed by backend.\n');

  // ----------------------------------------------------
  // TEST 3 — OLD PASSWORD MUST FAIL
  // ----------------------------------------------------
  console.log('[TEST 3] Verify Old Password Fails');
  const t3Res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@gmail.com', password: 'admin' }),
  });
  const t3Data = await t3Res.json();
  if (t3Res.status === 200 && t3Data.success) {
    throw new Error(`[TEST 3 FAILED] Old password STILL works! It must fail.`);
  }
  console.log('  -> Status:', t3Res.status, '| Error message:', t3Data.error);
  console.log('  [PASS] Test 3: Old password cannot authenticate.\n');

  // ----------------------------------------------------
  // TEST 4 — NEW PASSWORD MUST WORK
  // ----------------------------------------------------
  console.log('[TEST 4] Verify New Password Works: TestNewPassword123!');
  const t4Res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@gmail.com', password: 'TestNewPassword123!' }),
  });
  const t4Data = await t4Res.json();
  if (t4Res.status !== 200 || !t4Data.success || !t4Data.data?.token) {
    throw new Error(`[TEST 4 FAILED] New password login failed: ${JSON.stringify(t4Data)}`);
  }
  const newToken = t4Data.data.token;
  console.log('  -> Status: 200 OK | Authenticated User:', t4Data.data.email);
  console.log('  [PASS] Test 4: New password successfully authenticated.\n');

  // ----------------------------------------------------
  // TEST 5 — REFRESH & DATABASE PERSISTENCE
  // ----------------------------------------------------
  console.log('[TEST 5] Verify Direct DB Persistence & Bcrypt Verification');
  const userCheck = await prisma.user.findUnique({
    where: { email: 'admin@gmail.com' },
  });
  if (!userCheck) throw new Error('[TEST 5 FAILED] User not found in DB');
  const hashMatches = await comparePassword('TestNewPassword123!', userCheck.password);
  if (!hashMatches) throw new Error('[TEST 5 FAILED] DB hash does not match TestNewPassword123!');
  console.log('  -> Stored Hash in dev.db matches TestNewPassword123!:', hashMatches);
  console.log('  [PASS] Test 5: Credentials permanently persisted in database.\n');

  // ----------------------------------------------------
  // TEST 6 — EMAIL CHANGE
  // ----------------------------------------------------
  console.log('[TEST 6] Change Email: admin@gmail.com -> newadmin@gmail.com');
  const t6Update = await fetch(`${BASE_URL}/api/admin/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${newToken}`,
      'Cookie': `spd-auth-token=${newToken}`,
    },
    body: JSON.stringify({
      email: 'newadmin@gmail.com',
      name: 'System Admin',
    }),
  });
  const t6UpdateData = await t6Update.json();
  if (t6Update.status !== 200 || !t6UpdateData.success) {
    throw new Error(`[TEST 6 FAILED] Failed to change email: ${JSON.stringify(t6UpdateData)}`);
  }
  console.log('  -> Profile Updated: New Email:', t6UpdateData.data.email);

  // Attempt login with OLD email -> MUST fail
  const t6OldLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@gmail.com', password: 'TestNewPassword123!' }),
  });
  const t6OldData = await t6OldLogin.json();
  if (t6OldLogin.status === 200 && t6OldData.success) {
    throw new Error('[TEST 6 FAILED] Old email still logged in! It must fail.');
  }
  console.log('  -> Old email login blocked:', t6OldLogin.status, t6OldData.error);

  // Attempt login with NEW email -> MUST succeed
  const t6NewLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'newadmin@gmail.com', password: 'TestNewPassword123!' }),
  });
  const t6NewData = await t6NewLogin.json();
  if (t6NewLogin.status !== 200 || !t6NewData.success) {
    throw new Error(`[TEST 6 FAILED] New email login failed: ${JSON.stringify(t6NewData)}`);
  }
  console.log('  -> New email login succeeded: 200 OK | Authenticated:', t6NewData.data.email);
  console.log('  [PASS] Test 6: Old email revoked, new email + password logged in successfully.\n');

  // Reset email back to admin@gmail.com and password to admin as initial development default
  const finalHash = await hashPassword('admin');
  await prisma.user.update({
    where: { id: userCheck.id },
    data: { email: 'admin@gmail.com', password: finalHash, username: 'admin' },
  });
  console.log('Clean Teardown: Re-established default baseline admin@gmail.com / admin.');

  console.log('\n====================================================');
  console.log('  SUCCESS: ALL 8 MANDATORY TESTS VERIFIED 100%     ');
  console.log('====================================================');
}

runTests()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
