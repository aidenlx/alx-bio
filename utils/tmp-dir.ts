import { ensureDirSync } from "@/deps.ts";
import sharedStart from "@/utils/share-start.ts";

let tempDir: string | null = null;
export function getTempDir() {
  if (tempDir) return tempDir;
  let globalTempDir = Deno.env.get("TMPDIR");
  if (globalTempDir?.startsWith("'") && globalTempDir.endsWith("'")) {
    globalTempDir = globalTempDir.slice(1, -1);
  }
  if (globalTempDir && sharedStart(globalTempDir, Deno.cwd())) {
    tempDir = globalTempDir;
    return globalTempDir;
  }
  // create in working dir if global temp dir is not set
  const basename = [Deno.env.get("SLURM_JOB_ID"), "tmp"]
    .filter(Boolean)
    .join(".");
  // const fullpath = path.resolve(basename);
  ensureDirSync(basename);
  tempDir = basename;
  return basename;
}
