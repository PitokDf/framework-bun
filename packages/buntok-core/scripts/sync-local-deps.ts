/**
 * Sync dist symlinks to local dependents.
 *
 * When a project uses a local path dependency (e.g. "file:../buntok-core"),
 * Bun creates symlinks at `bun install` time. New files added after install
 * won't be symlinked automatically. This script fixes that.
 */
import { readdirSync, statSync, mkdirSync, symlinkSync, existsSync } from "fs";
import { join, basename } from "path";

const CORE_DIST = join(import.meta.dir, "..", "dist");

// Find all local dependents (projects that reference this package via file: or link:)
const MONOREPO_ROOT = join(import.meta.dir, "..", "..", "..");

function syncDir(distDir: string, targetDir: string) {
  const entries = readdirSync(distDir);
  for (const entry of entries) {
    const srcPath = join(distDir, entry);
    const dstPath = join(targetDir, entry);
    const srcStat = statSync(srcPath);

    if (srcStat.isDirectory()) {
      mkdirSync(dstPath, { recursive: true });
      syncDir(srcPath, dstPath);
    } else if (!existsSync(dstPath)) {
      try {
        symlinkSync(srcPath, dstPath);
      } catch {
        // Skip if symlink creation fails (e.g. permission issues)
      }
    }
  }
}

// Known local dependents (add more as needed)
const LOCAL_DEPENDENTS = [
  join(MONOREPO_ROOT, "packages", "buntok-test"),
];

for (const dep of LOCAL_DEPENDENTS) {
  const targetDist = join(dep, "node_modules", "@buntok", "core", "dist");
  if (existsSync(targetDist)) {
    console.log(`Syncing dist to ${dep}...`);
    syncDir(CORE_DIST, targetDist);
    console.log(`Done: ${dep}`);
  }
}
