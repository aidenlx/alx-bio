import { $ } from "@/deps.ts";

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
  output = output.replace(/\.gz$/, "");
  const final = (await intermediate).at(-1);
  if (!final) throw new Error("no final output");
  if (final.endsWith(".gz")) {
    output = output + ".gz";
    await $`ln -sf ${final} ${output}`;
    await $`[ -f "${final}.tbi" ] && ln -sf ${final}.tbi ${output}.tbi || true`;
  }
  return output;
}
