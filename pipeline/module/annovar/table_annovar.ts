import {
  AnnovarProtocol,
  annovarDataDir,
  annovarDatabase,
} from "@/pipeline/_res.ts";
import { checkDone, noDupDot } from "@/utils/check-done.ts";
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
  const { done, finish } = await checkDone(outBase);
  const database = annovarDatabase[options.assembly];
  const output = {
    vcf: noDupDot(`${outBase}.${options.assembly}_multianno.vcf`),
    tsv: noDupDot(`${outBase}.${options.assembly}_multianno.txt`),
    avinput: noDupDot(`${outBase}.avinput`),
    fields: database,
  };
  console.info("annovar output: " + outBase);

  if (done) {
    console.info("Skipping annovar");
    return output;
  }

  const args = [
    ...[input, annovarDataDir],
    ...(options.args ?? []),
    ...["--vcfinput", "-outfile", outBase.replace(/\.+$/, "")],
    ...["-nastring", "."],
    ...["-remove", "-dot2underline", "-thread", options.threads],
    ...toAnnovarArgs(options.assembly, database),
  ];
  await $`table_annovar.pl ${args}`;
  await finish();
  return output;
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
