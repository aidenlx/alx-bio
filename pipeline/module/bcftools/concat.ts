import { checkDone, optOptional } from "@/utils/check-done.ts";
import { $ } from "@/deps.ts";
import { indexVcfGz } from "@/pipeline/module/gatk/_common.ts";

export { required } from "./_common.ts";

export default async function bcftoolsConcat(
  inputs: string[],
  output: string,
  options: {
    allowOverlaps?: boolean;
    naive?: boolean;
    args?: string[];
  } = {},
) {
  const { done, finish } = await checkDone(output, inputs);
  if (done) {
    console.error("Skipping bcftools concat");
    return output;
  }
  const args = [
    ...optOptional(options.naive, "--naive"),
    ...optOptional(options.allowOverlaps, "--allow-overlaps"),
    ...(options.args ?? []),
  ];
  if (!options.naive) {
    await indexVcfGz(...inputs);
  }
  if (output.endsWith(".gz")) {
    await $`bcftools concat ${args} ${inputs} -Oz -o ${output} && tabix -f -p vcf ${output}`;
  } else {
    await $`bcftools concat ${args} ${inputs} > ${output}`;
  }
  await finish();
  return output;
}
