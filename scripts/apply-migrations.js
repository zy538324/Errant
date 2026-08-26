#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

async function main() {
  const migrationsDir = path.join(process.cwd(), 'prisma', 'migrations');
  if (!fs.existsSync(migrationsDir)) {
    console.error('No prisma/migrations directory found.');
    process.exit(1);
  }

  const dirs = fs.readdirSync(migrationsDir).sort();
  const sqlFiles = [];
  for (const dir of dirs) {
    const migPath = path.join(migrationsDir, dir, 'migration.sql');
    if (fs.existsSync(migPath)) sqlFiles.push(migPath);
  }

  if (sqlFiles.length === 0) {
    console.error('No migration.sql files found under prisma/migrations.');
    process.exit(1);
  }

  // If DATABASE_URL isn't set in the environment, try to load it from .env
  if (!process.env.DATABASE_URL) {
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const envContents = fs.readFileSync(envPath, 'utf8');
      const match = envContents.match(/^DATABASE_URL=(.*)$/m);
      if (match) {
        // strip optional surrounding quotes
        process.env.DATABASE_URL = match[1].replace(/^"|"$/g, '').trim();
        console.log('Loaded DATABASE_URL from .env');
      }
    }
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  try {
    for (const file of sqlFiles) {
      const sql = fs.readFileSync(file, 'utf8');
      console.log('Applying', file);
      await client.query(sql);
    }
    console.log('Migrations applied successfully.');
  } catch (err) {
    console.error('Migration error:', err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
