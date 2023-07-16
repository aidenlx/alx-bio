import { readLines } from "https://deno.land/std@0.192.0/io/read_lines.ts";
import { $, Command, EnumType, formatDate, join, exists } from "./deps.ts";
import type { ProcessOutput } from "./deps.ts";

const commonOptions = [
  "--parsable",
  "--output",
  "log-%A-%x_%a.out",
  "--error",
  "log-%A-%x_%a.err",
];

const ref = new EnumType(["hg19", "hg38"]);
const method = new EnumType(["wes", "wgs"]);
const script = (file: string) =>
  join("/genetics/home/stu_liujiyuan/pipeline/scripts/array", file);
const depAfterCorr = (...ids: ProcessOutput[]) => [
  "--dependency",
  `aftercorr:${ids.map(toJobId).join(",")}`,
];
const toJobId = (resp: ProcessOutput) => {
  if (resp.exitCode !== 0) {
    throw new Error("Job submission failed: " + resp.stderr);
  }
  return resp.stdout.trim();
};

export default new Command()
  .name("arr-sumbit")
  .description("Inspect a list of variant calls in a BAM file")
  .option("-a, --array <array:string>", "job array index values")
  .option("--dependency <deps:string>", "job dependency")
  .type("ref", ref)
  .type("method", method)
  .option("--parsable", "parsable output")
  .option("-J, --job-name <jobName:string>", "job name", {
    default: formatDate(new Date(), "M-d-Hm"),
  })
  .option("-m, --method <type:method>", "method", { required: true })
  .option("-r, --ref <ref:ref>", "reference genome", { required: true })
  .option("--skip-gt", "pause before gvcf->rawvcf")
  .arguments("<array_file:file>")
  .action(async (options, arrayFile) => {
    const job = (name: string) => ["-J", `${options.jobName}-${name}`];

    if (!(await exists(arrayFile, { isReadable: true, isFile: true }))) {
      throw new Error(
        "Array file does not exist or is not readable: " + arrayFile
      );
    }
    const list = await Deno.open(arrayFile, { read: true });
    let lineCount = 0;
    for await (const line of readLines(list)) {
      lineCount++;
      const lineNum = line.split("\t")[0].trim();
      if (lineNum !== String(lineCount)) {
        throw new Error(
          `Array index not match at line ${lineCount}: ${arrayFile}`
        );
      }
    }

    let array = `1-${lineCount}%4`;
    if (options.array) {
      if (options.array.startsWith("%")) {
        array = `1-${lineCount}` + options.array;
      } else {
        array = options.array;
      }
    }
    console.log(`Array file line count: ${lineCount}`);
    console.log(`Array index: ${array}`);

    const opts = [...commonOptions, ...["-a", array]];

    const ref_call = options.ref === "hg19" ? "hs37" : options.ref;

    const bam = await $`sbatch ${opts} ${job("bam")} ${
      options.dependency ? ["--dependency", options.dependency] : []
    } \
${script("snv-bam.slurm")} \
${arrayFile} ${ref_call} ${options.method}`;

    const vcf = await $`sbatch ${opts} ${job("vcf")} \
${depAfterCorr(bam)} ${script("snv-vcf.slurm")} \
${arrayFile} ${ref_call} ${options.method}`;

    const jobs = [bam, vcf];

    if (!options.skipGt) {
      const merge = await $`sbatch ${opts} ${job("merge")} \
${depAfterCorr(vcf)} ${script("snv-merge.slurm")} \
${arrayFile} ${ref_call}`;

      const ref_annot = options.ref;

      const cadd = await $`sbatch ${opts} ${job("cadd")} \
${depAfterCorr(merge)} ${script("cadd.slurm")} \
${arrayFile} ${ref_annot}`;

      const annot_single = await $`sbatch ${opts} ${job("anns")} \
${depAfterCorr(merge)} ${script("snv-annot-s.slurm")} \
${arrayFile} ${ref_annot}`;

      const annot_multi = await $`sbatch ${opts} ${job("annm")} \
${depAfterCorr(annot_single)} ${script("snv-annot-m.slurm")} \
${arrayFile} ${ref_annot}`;

      const final = await $`sbatch ${opts} ${job("final")} \
${depAfterCorr(annot_multi, cadd)} ${script("snv-final.slurm")} \
${arrayFile} ${ref_annot}`;
      jobs.push(merge, cadd, annot_single, annot_multi, final);
    }

    const jobIds = jobs.map(toJobId).join(" ");
    if (options.parsable) {
      console.log(jobIds);
    } else {
      console.log("Submitted jobs: " + jobIds);
    }
  });
