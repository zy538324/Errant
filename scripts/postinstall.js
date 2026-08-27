const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Path to project root (one level up from scripts directory)
const projectRoot = path.resolve(__dirname, '..');
const schemaPath = path.join(projectRoot, 'prisma', 'schema.prisma');

console.log(`[postinstall] Running from: ${process.cwd()}`);
console.log(`[postinstall] Resolved project root: ${projectRoot}`);
console.log(`[postinstall] Resolved schema path: ${schemaPath}`);

if (!fs.existsSync(schemaPath)) {
  console.error(`[postinstall] Error: Prisma schema not found at ${schemaPath}`);
  process.exit(1);
}

try {
  // Execute prisma generate with explicit --schema path from the project root directory
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
