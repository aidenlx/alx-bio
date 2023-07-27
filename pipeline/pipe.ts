import { exists, $ } from "@/deps.ts";

export async function pipe(
  input: string,
  ...steps: ((input: string) => Promise<string | string[]>)[]
) {
  const outputs: string[] = [];
  for (const step of steps) {
    let output = await step(input);
    if (typeof output === "string") output = [output];
    if (output.length === 0) throw new Error("no output for " + input);
    outputs.push(...output);
    input = output.pop()!;
  }
  if (outputs.length === 0) throw new Error("no steps");
  return outputs;
}

export async function toFinalOutput(
  intermediate: Promise<string[]> | string[],
  output: string
) {
  await Promise.all(
    (
      await intermediate
    ).map(async (file, i, arr) => {
      if (!(await exists(file))) return;
      if (i === arr.length - 1) {
        await $`bgzip -c ${file} > ${output}.gz && tabix -f -p vcf ${output}.gz`;
      }
      await $`bgzip -f ${file}`;
    })
  );
  return output;
}
