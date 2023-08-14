import { globby } from "npm:globby";
import { exists, resolve, join, Command, csvParse } from "@/deps.ts";
import { getGVcfGz } from "@/pipeline/_res.ts";
import { gvcfDirName, famTxt } from "@/batch/gen-fam.ts";
import { genomeAssemblyHs37 } from "@/modules/common.ts";

export default new Command()
  .name("pl.fam-check")
  .description("Check before submitting pl.gen.fam")
  .type("genomeAssembly", genomeAssemblyHs37)
  .option("-r, --ref <ref:genomeAssembly>", "reference genome", {
    required: true,
  })
  .arguments("<array_file:file>")
  .action(async (opts, arrayFile) => {
    const fileTxt = csvParse(await Deno.readTextFile(arrayFile), {
      separator: "\t",
      skipFirstRow: false,
    });
    const gvcfs = await handleFamSubmit(fileTxt, opts.ref);
    gvcfs.forEach((v) => console.log(v));
  });

async function handleFamSubmit(fileTxt: string[][], ref: "hs37" | "hg38") {
  const gvcfDir = gvcfDirName;
  if (!exists(gvcfDir, { isDirectory: true })) {
    throw new Error(
      "GVCF directory not found, run pl.gen.fam first: " + resolve(gvcfDir)
    );
  }
  if (!exists(famTxt, { isFile: true })) {
    throw new Error(
      "fam.txt not found, run pl.gen.fam first: " + resolve("fam.txt")
    );
  }
  const gvcfs = await globby(join(gvcfDir, `*.g.${ref}.vcf.gz`), {
    onlyFiles: false,
  });

  // check if all gvcf symlinks for sample in file.txt exist
  const existingGVcf = fileTxt.map(([, id]) =>
    resolve(join(id, "vcf", getGVcfGz(id, ref)))
  );
  const gvcfsReal = await Promise.all(
    gvcfs.map((f) =>
      Deno.readLink(f).then((link) => resolve(join(gvcfDir, link)))
    )
  );
  const missingGVcf = existingGVcf.filter((f) => !gvcfsReal.includes(f));
  if (missingGVcf.length > 0) {
    // console.error(gvcfsReal);
    // console.error(gvcfs);
    // console.error("---");
    // console.error(existingGVcf);
    throw new Error(
      "GVCF symlink not found: " + missingGVcf.map((f) => resolve(f)).join(", ")
    );
  }
  return gvcfsReal;
}
