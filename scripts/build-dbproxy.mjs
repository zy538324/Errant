import { spawnSync } from 'child_process';
import path from 'path';
import fs from 'fs';

const funcDir = path.resolve(process.cwd(), 'amplify', 'backend', 'function', 'dbProxy');
if (!fs.existsSync(funcDir)) {
  console.error('dbProxy function directory not found:', funcDir);
  process.exit(1);
}

console.log('Installing dependencies for dbProxy...');
let res = spawnSync('npm', ['install', '--production'], { cwd: funcDir, stdio: 'inherit', shell: true });
if (res.status !== 0) process.exit(res.status);

// If Prisma schema exists at repo root, copy or generate Prisma client into function folder
const prismaSchema = path.resolve(process.cwd(), 'prisma', 'schema.prisma');
if (fs.existsSync(prismaSchema)) {
  console.log('Found prisma/schema.prisma — generating Prisma client inside function...');
  // run prisma generate with schema pointed to root schema, output to node_modules/@prisma/client inside function
  res = spawnSync('npx', ['prisma', 'generate', '--schema', prismaSchema], { cwd: funcDir, stdio: 'inherit', shell: true });
  if (res.status !== 0) process.exit(res.status);
} else {
  console.log('No prisma/schema.prisma found at repo root — skipping prisma generate.');
}

console.log('Packing function into zip (dbProxy.zip)...');
const zipName = path.resolve(funcDir, '..', 'dbProxy.zip');
res = spawnSync('tar', ['-czf', zipName, '-C', funcDir, '.'], { stdio: 'inherit', shell: true });
if (res.status !== 0) process.exit(res.status);

console.log('dbProxy build complete:', zipName);
