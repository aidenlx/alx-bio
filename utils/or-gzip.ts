import { existsSync as exists } from "@/deps.ts";

export function orGzip(file: string) {
  if (exists(file)) return file;
  const altFile = file.endsWith(".gz")
    ? file.replace(/\.gz$/, "")
    : `${file}.gz`;
  if (exists(altFile)) return altFile;
  throw new Error(`File not found: ${file}`);
}
