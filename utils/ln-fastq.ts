import { join, $ } from "@/deps.ts";

export const createLocalFastq = (fastq: [string, string], workDir = ".") =>
  Promise.all(
    fastq.map(async (fq, i) => {
      const localFile = join(workDir, `${i + 1}.fq.gz`);
      /** overwrite existing symlinked file */
      await $`ln -sf ${fq} ${localFile}`;
      return localFile;
    }) as [Promise<string>, Promise<string>]
  );
