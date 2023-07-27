import { existsSync as exists } from "@/deps.ts";

export function orGzip(file: string) {
  if (exists(file)) return file;
  if (!file.endsWith(".gz") && exists(`${file}.gz`)) return `${file}.gz`;
  throw new Error(`File not found: ${file}`);
}
