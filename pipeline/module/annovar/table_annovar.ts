import {
  AnnovarProtocol,
  annovarDataDir,
  annovarDatabase,
} from "@/pipeline/_res.ts";
import { checkDone, noTrailingDots } from "@/utils/check-done.ts";
import { $, repeat } from "@/deps.ts";

export default async function tableAnnovar(
  input: string,
  outBase: string,
  options: {
    assembly: keyof typeof annovarDatabase;
    threads: number;
    args?: string[];
  }
) {
  const database = annovarDatabase[options.assembly];
  const output = {
    vcf: `${noTrailingDots(outBase)}.${options.assembly}_multianno.vcf`,
    tsv: `${noTrailingDots(outBase)}.${options.assembly}_multianno.txt`,
    avinput: `${noTrailingDots(outBase)}.avinput`,
    fields: database,
  };
  const { done, finish } = await checkDone(output.vcf + ".gz", input, outBase);

  console.info("annovar output: " + outBase);

  if (done) {
    console.error("Skipping annovar");
    return output;
  }

  let cleanup: (() => Promise<void>) | undefined;
  if (input.endsWith(".gz")) {
    const tempVcf = await Deno.makeTempFile({ suffix: ".vcf" });
    await $`zcat ${input} > ${tempVcf}`;
    input = tempVcf;
    cleanup = async () => {
      await Deno.remove(tempVcf);
    };
  }

  try {
    const args = [
      ...[input, annovarDataDir],
      ...(options.args ?? []),
      ...["--vcfinput", "-outfile", outBase.replace(/\.+$/, "")],
      ...["-nastring", "."],
      ...["-remove", "-dot2underline", "-thread", options.threads],
      ...toAnnovarArgs(options.assembly, database),
    ];
    await $`table_annovar.pl ${args}`;
    await Promise.all([
      $`bgzip -f ${output.vcf} && tabix -f -p vcf ${output.vcf}.gz`,
      $`bgzip -f ${output.tsv}`,
      $`bgzip -f ${output.avinput}`,
    ]);
    await finish();
    return {
      avinput: output.avinput + ".gz",
      vcf: output.vcf + ".gz",
      tsv: output.tsv + ".gz",
      fields: output.fields,
    } satisfies typeof output;
  } finally {
    cleanup?.();
  }
}

function toAnnovarArgs(
  assembly: string,
  database: Record<AnnovarProtocol, string[]>
) {
  const inputs = Object.entries(database) as [
    op: AnnovarProtocol,
    names: string[]
  ][];
  const protocols = inputs.flatMap(([, names]) => names).join(",");
  /**
   * @example g,g,g,g,r,f,f,f,f...
   */
  const operations = inputs
    // first letter of operation
    .flatMap(([op, names]) => repeat(names.length, op.substring(0, 1)))
    .join(",");
  return [
    "-protocol",
    protocols,
    "-operation",
    operations,
    "-buildver",
    assembly,
  ];
}
