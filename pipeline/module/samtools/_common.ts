import { getTempDir } from "@/utils/tmp-dir.ts";
import { basename, join } from "@/deps.ts";

export const required = ["samtools"];

export function samtoolsTemp(output: string) {
  const dirBase = basename(output).split(".")[0];
  return ["-T", join(getTempDir(), dirBase)];
}
