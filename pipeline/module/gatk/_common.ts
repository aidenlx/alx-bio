import { getTempDir } from "@/utils/tmp-dir.ts";
import { exists } from "https://deno.land/std@0.194.0/fs/exists.ts";
import { $, pLimit } from "@/deps.ts";

export const required = ["gatk"];

export interface GATKOptions {
  javaOptions?: string[];
  args?: string[];
}

export function java(options: GATKOptions) {
  return options.javaOptions
    ? ["--java-options", options.javaOptions.join(" ")]
    : [];
}

export function gatkTempDir(allCap = false) {
  return [allCap ? "--TMP_DIR" : "--tmp-dir", getTempDir()];
}
export function gatkTempDirJava() {
  return `-Djava.io.tmpdir=${getTempDir()}`;
}

export async function indexVcfGz(...inputs: string[]) {
  const limit = pLimit(4);

  await Promise.all(
    inputs.map((vcf) =>
      limit(async function index() {
        if (!vcf.endsWith(".gz") || (await exists(`${vcf}.tbi`))) return;
        await $`tabix -p vcf ${vcf}`;
      })
    )
  );
}
