import { checkDone } from "@/utils/check-done.ts";
import { $ } from "@/deps.ts";
import { getTempDir } from "@/utils/tmp-dir.ts";

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
  const { done, finish } = await checkDone(
    output,
    inputs,
    output.replace(/\.gz$/, "")
  );
  if (done) {
    console.error("Skipping mergeVCF");
    return;
  }
  const isGzipped = output.endsWith(".gz");
  await $`(
zcat -f ${hcOutputs[0]} | rg "^#"
zcat -f ${hcOutputs} | rg -v "^#"
) \
| bcftools sort - ${isGzipped ? "-Oz" : "-Ov"} -o ${output} --max-mem ${
    options.memory ?? "4G"
  } --temp-dir ${getTempDir()}`;
  await finish();
}
