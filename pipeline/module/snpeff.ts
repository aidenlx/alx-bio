import { checkDone } from "@/utils/check-done.ts";
import { $ } from "@/deps.ts";

export const required = ["snpEff"];

export default async function snpEff(
  input: string,
  output: string,
  options: {
    memory: string;
    threads?: number;
    assembly: string;
    args?: string[];
    javaOptions?: string[];
  }
) {
  const { done, finish } = await checkDone(output);
  if (done) {
    console.info("Skipping snpEff");
    return;
  }

  const javaOptions = [...(options.javaOptions ?? []), `-Xmx${options.memory}`];
  const args = options.args ?? [
    ...(options.threads ? ["-t", options.threads] : []),
  ];

  await $`snpEff ${javaOptions} ${args} ${options.assembly} ${input} > ${output}`;
  await finish();
}
