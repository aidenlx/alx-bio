import { genomeAssemblyHs37 } from "@/modules/common.ts";
import { defaultIntervalPadding } from "@/pipeline/_res.ts";
import { Command } from "@/deps.ts";

export default new Command()
  .name("snv.vcf")
  .description("Per-sample variant calling pipeline")
  .option("-t, --threads <count:integer>", "Threads", { default: 4 })
  .option(
    "--bait-intervals [path]",
    "bed file for WESeq capture region, run in WGS mode if not present"
  )
  .option("-o, --out-dir <path>", "output directory", { default: "." })
  .option("--no-cleanup", "skip cleanup, keep intermedia files")
  .type("genomeAssembly", genomeAssemblyHs37)
  .option("-r, --ref <assembly:genomeAssembly>", "reference genome", {
    required: true,
  })
  .option("-s, --sample <name>", "Sample Name", {
    required: true,
  })
  .option("--interval-padding <integer>", "interval padding", {
    default: defaultIntervalPadding,
  })
  .action(() => {
    throw new Error("Not implemented");
  });
// .action(async (options) => {
//   const { join: j } = path;

//   const threads = toPositiveInt(options.threads);
//   if (threads === null) {
//     throw new Error("threads must be a positive integer");
//   }

//   const workPath = path.resolve(options.outDir),
//     sample = options.sample;
//   if (nonAscii.test(workPath)) {
//     throw new Error(
//       "work path should not contain non-ascii characters: " + workPath
//     );
//   }
//   if (nonAscii.test(sample)) {
//     throw new Error(
//       "sample name should not contain non-ascii characters: " + sample
//     );
//   }

//   await fs.ensureDir(workPath);
//   cd(workPath);

//   const assembly = options.ref as SupportAssembly;
//   const baitIntervals = parseBaitIntevals(options.baitIntervals, assembly);

//   console.info(`baitIntervals: ${baitIntervals ?? "Disabled"}`);

//   const refFa = Res[assembly].refFa;

//   const cleanup = genCleanupFunc(options);

//   const bam_dir = "bamfile";
//   const bam_bqsr = j(bam_dir, `${sample}.bqsr.${assembly}.bam`);

//   const vcf_dir = "vcf";
//   fs.ensureDir(vcf_dir);
//   const gVcf = j(vcf_dir, `${sample}.g.${assembly}.vcf`);

//   if (baitIntervals) {
//     const interval_scatter = j(bam_dir, toIntervalScatter(sample, assembly));
//     const limit = pLimit(threads);
//     const getIntervals = () => glob(`${interval_scatter}/*.interval_list`);

//     console.info(`SPLIT TAG_REGION using ${baitIntervals}`);
//     await GATKSplitIntervals(baitIntervals, interval_scatter, {
//       reference: refFa,
//       intervalPadding,
//       threads,
//       quiet: true,
//     });

//     console.info("TASK: HaplotypeCaller");
//     const intervals = await getIntervals();
//     const toHcOutput = (list: string) =>
//       list.replace(/\.interval_list$/, ".g.vcf");
//     const hcTasks = intervals.map((list) =>
//       limit(() =>
//         GATKHaplotypeCaller(bam_bqsr, toHcOutput(list), {
//           reference: refFa,
//           dbsnp: Res[assembly].dbsnp,
//           threads,
//           intervals: list,
//           intervalPadding,
//           quiet: true,
//           emitRefConfidence: "GVCF",
//           args: ["--create-output-variant-index", "false"],
//         })
//       )
//     );
//     await Promise.all(hcTasks);

//     console.info("MERGE GVCF");
//     const unsortedGVcf = j(vcf_dir, `${sample}.u.g.${assembly}.vcf`);
//     async function gatherVCF() {
//       const { done, finish } = await checkDone(unsortedGVcf);
//       if (done) {
//         console.info("Skipping mergeVCF");
//         return;
//       }
//       const hcOutputs = intervals.map(toHcOutput);
//       await $`(rg "^#" ${hcOutputs[0]}; rg -v "^#" --no-filename ${hcOutputs}) > ${unsortedGVcf}`;
//       await finish();
//     }
//     await gatherVCF();
//     // await GATKGatherVcfs(intervals.map(toHcOutput), unsortedGVcf, {
//     //   args: ["--QUIET"],
//     // });
//     await cleanup(...intervals.map(toHcOutput));
//     await GATKSortVcf(unsortedGVcf, gVcf);
//     await cleanup(unsortedGVcf);
//   } else {
//     await GATKHaplotypeCaller(bam_bqsr, gVcf, {
//       threads,
//       reference: refFa,
//       dbsnp: Res[assembly].dbsnp,
//       memory: "20G",
//       emitRefConfidence: "GVCF",
//     });
//   }
//   console.info("TASK: VCF CALLING END");
//   // if gvcf exists, gzip and index it
//   if (await fs.pathExists(gVcf)) {
//     await $`bgzip ${gVcf} && gatk IndexFeatureFile -I ${gVcf}.gz`;
//   }
//   console.info("END ALL ************************************* Bey");
// });
