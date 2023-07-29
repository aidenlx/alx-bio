import { Command, EnumType, exists, $ } from "@/deps.ts";
import { Res, parseIntevals } from "./_res.ts";
import { nonAscii } from "@/utils/ascii.ts";
import GATKCollectHsMetrics from "@/pipeline/module/gatk/collectHsMetrics.ts";

export default new Command()
  .name("snv.hs-stat")
  .description("Collect Hs Metrics for given WES probes")
  .type("genomeAssembly", new EnumType(["hs37"]))
  .option("-r, --ref <assembly:genomeAssembly>", "reference genome", {
    required: true,
  })
  .option("--bait-intervals <path:string>", "bed file for WESeq capture region")
  .option(
    "--target-intervals <path:string>",
    "bed file for WESeq target region",
    {
      depends: ["bait-intervals"],
    }
  )
  .arguments("<bam:string>")
  .action(async (opts, inputBam) => {
    if (nonAscii.test(inputBam)) {
      throw new Error(
        "path to input bam file should not contain non-ascii characters: " +
          inputBam
      );
    }

    const assembly = opts.ref;
    const [bait, isBaitBultiIn] = parseIntevals(
        opts.baitIntervals ?? true,
        assembly,
        "Bait"
      ),
      [target] = parseIntevals(
        // allow choose proper target bed file automatically when set baitIntervals to builtin ones
        (!opts.targetIntervals && isBaitBultiIn
          ? opts.baitIntervals
          : opts.targetIntervals) ?? true,
        assembly,
        "Target"
      );
    if (!bait || !target) {
      throw new Error(
        "baitIntervals and targetIntervals should be both true or both with path to bed"
      );
    }
    const baitIntervals = bait.replace(/\.bed$/, ".interval_list");
    const targetIntervals = target.replace(/\.bed$/, ".interval_list");
    const ref = Res[assembly].refFa;

    const refDict = ref.replace(/\.fa$/, ".dict");
    if (!(await exists(baitIntervals))) {
      const command = `gatk BedToIntervalList -I ${bait} -O ${baitIntervals} -SD ${refDict}`;
      throw new Error(
        `bait bed file not converted to interval_list, run '${command}' first`
      );
    }
    if (!(await exists(targetIntervals))) {
      const command = `gatk BedToIntervalList -I ${target} -O ${targetIntervals} -SD ${refDict}`;
      throw new Error(
        `target bed file not converted to interval_list, run '${command}' first`
      );
    }

    const metrics = inputBam.replace(/\.bam$/, ".hs-metrics.txt");
    const report = inputBam.replace(/\.bam$/, ".hs-report.txt");
    await GATKCollectHsMetrics(inputBam, metrics, {
      ref,
      baitIntervals,
      targetIntervals,
    });

    // get two lines after "## METRICS CLASS" and transpose table to list
    await $`rg -A2 '^## METRICS CLASS' ${metrics} \
  | tail -n+2 \
  | xsv select -d'\\t' 'BAIT_SET,MEAN_BAIT_COVERAGE,MEAN_TARGET_COVERAGE,46-55' \
  | awk -F ',' '{ for(i=1; i<=NF; i++) { if (NR==1) { header[i]=$i } else { row[i]=$i } } } END { for(i=1; i<=NF; i++) { print header[i] ": " row[i] } }'\
  > ${report}`;

    console.info("END ALL ************************************* Bey");
  });
