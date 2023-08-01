import { checkDone } from "@/utils/check-done.ts";
import { $ } from "@/deps.ts";

export default async function gatherVCF(
  inputs: string[],
  output: string,
  options: {
    memory?: string;
  } = {}
) {
  if (inputs.length === 0) {
    throw new Error("No inputs provided to gatherVCF");
  }
  const hcOutputs = inputs;
  const gVcf = output;
  const { done, finish } = await checkDone(gVcf, inputs);
  if (done) {
    console.info("Skipping mergeVCF");
    return;
  }
  const isGzipped = output.endsWith(".gz");
  await $`(
zcat -f ${hcOutputs[0]} | rg "^#"
zcat -f ${hcOutputs} | rg -v "^#"
) \
| bcftools sort - ${isGzipped ? "-Oz" : "-Ov"} -o ${output} --max-mem ${
    options.memory ?? "4G"
  }`;
  await finish();
}
