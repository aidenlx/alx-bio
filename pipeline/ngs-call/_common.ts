import { ensureDir, join, path } from "@/deps.ts";
import { nonAscii } from "@/utils/ascii.ts";
import { Res, SupportAssembly } from "@/pipeline/_res.ts";
import glob from "@/utils/glob.ts";

export async function vaildateOptions(opts: {
  threads: number;
  outDir: string;
  sample: string;
  ref: SupportAssembly;
  cleanup?: boolean;
}) {
  const threads = opts.threads;
  if (threads <= 0) {
    throw new Error("threads must be a positive integer");
  }

  const workPath = path.resolve(opts.outDir),
    sample = opts.sample;
  if (nonAscii.test(workPath)) {
    throw new Error(
      "work path should not contain non-ascii characters: " + workPath
    );
  }
  if (nonAscii.test(sample)) {
    throw new Error(
      "sample name should not contain non-ascii characters: " + sample
    );
  }

  await ensureDir(workPath);

  return {
    threads,
    workPath,
    sample,
    assembly: opts.ref,
    reference: Res[opts.ref].refFa,
    cleanup: opts.cleanup
      ? async (...files: string[]) => {
          console.error("cleaning up: ", files);
          await Promise.all(files.map((f) => Deno.remove(f)));
        }
      : () => void 0,
  };
}

export const toIntervalScatter = (sample: string, assembly: SupportAssembly) =>
  `${sample}.${assembly}.interval_scatter`;

export const defaultIntervalPadding = 50;

export const getIntervals = async (interval_scatter: string) => {
  await ensureDir(interval_scatter);
  return (await glob(join(interval_scatter, "*.interval_list")))
    .filter((v) => v.isFile || v.isSymlink)
    .map((v) => v.path);
};