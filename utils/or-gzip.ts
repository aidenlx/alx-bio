import { exists } from "@/deps.ts";

export async function orGzip(file: string) {
  if (await exists(file)) return file;
  if (!file.endsWith(".gz") && (await exists(`${file}.gz`)))
    return `${file}.gz`;
  throw new Error(`File not found: ${file}`);
}
