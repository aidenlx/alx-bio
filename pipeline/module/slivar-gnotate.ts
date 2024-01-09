import { $ } from "@/deps.ts";
import { checkDone } from "@/utils/check-done.ts";

export default async function slivarGnotate(
  input: string,
  output: string,
  options: {
    threads: number;
    databases: string[];
    ref: string;
    args?: string[];
  },
) {
  const { done, finish } = await checkDone(
    output,
    input,
    output.replace(/\.gz$/, ""),
  );
  if (done) {
    console.error("Skipping slivar gnotate");
    return output;
  }

  const gnotateDbOpts = options.databases.flatMap(
    (file) => ["--gnotate", file],
  );

  await $`pslivar expr --vcf ${input} --fasta ${options.ref} --processes ${options.threads} ${gnotateDbOpts} | bgzip > ${output}`;
  await finish();
  return output;
}
