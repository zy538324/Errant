import { existsSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const removable = ['.next', '.astro', 'dist'];

for (const relativePath of removable) {
  const absolutePath = resolve(process.cwd(), relativePath);
  if (existsSync(absolutePath)) {
    rmSync(absolutePath, { recursive: true, force: true });
    console.log(`Removed stale build artifact: ${relativePath}`);
  }
}
