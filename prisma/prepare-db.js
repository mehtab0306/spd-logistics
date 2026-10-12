const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const schemaPath = path.join(__dirname, 'schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

const dbUrl = process.env.DATABASE_URL || '';

if (dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://')) {
  console.log('[prepare-db] 🐘 Detected PostgreSQL DATABASE_URL. Configuring Prisma for PostgreSQL.');
  schema = schema.replace(/provider\s*=\s*["']sqlite["']/, 'provider = "postgresql"');
  fs.writeFileSync(schemaPath, schema, 'utf8');

  // Push schema to PostgreSQL database during cloud build
  try {
    console.log('[prepare-db] Pushing Prisma schema to cloud database...');
    execSync('npx prisma db push --skip-generate', { stdio: 'inherit' });
    console.log('[prepare-db] Schema pushed successfully.');
  } catch (err) {
    console.warn('[prepare-db] Warning: Could not push schema automatically. Ensure database is reachable:', err.message);
  }
} else {
  console.log('[prepare-db] 📁 Using SQLite datasource provider (local/dev).');
  schema = schema.replace(/provider\s*=\s*["']postgresql["']/, 'provider = "sqlite"');
  fs.writeFileSync(schemaPath, schema, 'utf8');
}
