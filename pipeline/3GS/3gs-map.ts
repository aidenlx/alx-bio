import {
  cd,
  Command,
  ensureDir,
  EnumType,
  join as j,
  resolve,
} from "@/deps.ts";
import { PositiveInt } from "@/utils/validate.ts";
import { readGroup, Res } from "@/pipeline/_res.ts";
import minimap2 from "@/pipeline/module/minimap2.ts";
import samtoolsIndex from "@/pipeline/module/samtools/index.ts";

export default new Command()
  .name("3gs.map")
  .type("positiveInt", PositiveInt)
  .type("platform", new EnumType(["ont", "pb", "hifi"]))
  .option("-p, --platform <platform:platform>", "Platform", { required: true })
  .option("-t, --threads <count:positiveInt>", "Threads", { default: 4 })
  .option("--fq <path>", "fastq input in fq.gz format", { required: true })
  .option("-o, --out-dir <path>", "output directory", { default: "." })
  .option("-s, --sample <name>", "Sample Name", {
    required: true,
  })
  .action(async (opts) => {
    const reference = Res.hg38.refFa;

    const workPath = resolve(opts.outDir),
      sample = opts.sample,
      fastqInput = resolve(opts.fq),
      threads = opts.threads;

    await ensureDir(workPath);
    cd(workPath);

    const bamDir = "bamfile";

    const bamSorted = j(bamDir, `${sample}.sort.hg38.bam`);

    await ensureDir(bamDir);
    await minimap2(fastqInput, bamSorted, {
      threads,
      reference,
      readGroup: readGroup(sample, opts.platform),
      preset: `map-${opts.platform}`,
      sort: true,
    });
    await samtoolsIndex(bamSorted, { threads });
  });
