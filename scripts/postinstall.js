const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const candidates = [
  process.env.INIT_CWD,
  process.env.npm_config_local_prefix,
  '/home/palmvine/repositories/Errant',
  path.resolve(__dirname, '..'),
  process.cwd(),
  path.resolve(process.cwd(), '../../..'),
].filter(Boolean);

console.log(`[postinstall] Running from: ${process.cwd()}`);
console.log(`[postinstall] Candidate paths:`, candidates);

let projectRoot = candidates.find((p) => fs.existsSync(path.join(p, 'prisma/schema.prisma')));

if (!projectRoot) {
  console.error(`[postinstall] Error: Could not locate prisma/schema.prisma in any candidate directory.`);
  process.exit(1);
}

const schemaPath = path.join(projectRoot, 'prisma', 'schema.prisma');
console.log(`[postinstall] Resolved project root: ${projectRoot}`);
console.log(`[postinstall] Resolved schema path: ${schemaPath}`);

try {
  execSync(`npx prisma generate --schema="${schemaPath}"`, {
    cwd: projectRoot,
    stdio: 'inherit',
    env: process.env,
  });
  console.log('[postinstall] Prisma generate completed successfully.');
} catch (error) {
  console.error('[postinstall] Error running prisma generate:', error);
  process.exit(1);
}
