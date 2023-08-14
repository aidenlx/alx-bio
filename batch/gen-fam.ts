import { Command, csvStringify, ensureDir, join } from "@/deps.ts";
import {
  getMergedName,
  getFound,
  isFoundYamlPed,
  getSampleId,
  getFamFounds,
  defaultMergeDir,
} from "./utils.ts";
import { genomeAssemblyHs37 } from "@/modules/common.ts";
import { handleNonAscii } from "@/utils/ascii.ts";
import { emptyDir } from "https://deno.land/std@0.194.0/fs/empty_dir.ts";
import { getGVcfGz } from "@/pipeline/_res.ts";

export const gvcfDirName = "_gvcfs";
export const famTxt = "fam.txt";

export default new Command()
  .name("pl.gen.fam")
  .description("Generate batch task list for pedgree analysis")
  .arguments("<found...>")
  .type("genomeAssembly", genomeAssemblyHs37)
  .option("-r, --ref <ref:genomeAssembly>", "reference genome", {
    required: true,
  })
  .option("-o, --out-dir <dir:string>", "output directory", { default: "." })
  .option("--skip-check", "skip file existence check")
  .env("PL_MERGE_OUT_DIR=<dir:string>", "output directory", {
    prefix: "PL_",
  })
  .action(
    async (
      { ref, outDir, skipCheck, mergeOutDir = defaultMergeDir },
      ...cfgFiles
    ) => {
      const pedYmls = (await Promise.all(cfgFiles.map(getFound)))
        .map((yml, i) => {
          if (!isFoundYamlPed(yml))
            throw new Error(
              `${cfgFiles[i]} is not a vaild found.yaml with pedgree`
            );
          return yml;
        })
        .flatMap((pedYml) => getFamFounds(pedYml))
        .map(({ famId, members }, i, arr) => {
          const famDir = join(outDir, getSampleId(famId, i, arr.length));
          return {
            famId: handleNonAscii(famId),
            members: members.map(({ fastq, indId }, i, arr) => ({
              fastq,
              indId: handleNonAscii(indId),
              internalIndId: getSampleId(indId, i, arr.length),
            })),
            dir: famDir,
          };
        });

      // file.txt gen
      const fileList = pedYmls.map(({ members, dir }) => ({
        dir,
        files: members.map(({ indId, fastq }, i, arr) => {
          let R1: string, R2: string;
          if (fastq.length > 1) {
            R1 = join(mergeOutDir, getMergedName(indId, 0));
            R2 = join(mergeOutDir, getMergedName(indId, 1));
          } else {
            [R1, R2] = fastq[0];
          }
          const name = getSampleId(indId, i, arr.length);
          return [i + 1, name, R1, R2] as [number, string, string, string];
        }),
      }));

      if (!skipCheck) {
        const fileCheckResults = await Promise.all(
          fileList
            .flatMap(({ files }) => files.flatMap(([, , R1, R2]) => [R1, R2]))
            .map(async (file): Promise<boolean> => {
              const stat = await fsStat(file);
              if (!stat) {
                console.error("File not found: ", file);
                return false;
              } else if (stat.size === 0) {
                console.error("File empty: ", file);
                return false;
              }
              return true;
            })
        );
        if (fileCheckResults.some((valid) => !valid)) {
          Deno.exit(1);
        }
      }
      // write file.txt for each family
      await Promise.all(
        fileList.map(async ({ files, dir }) => {
          await ensureDir(dir);
          await Deno.writeTextFile(
            join(dir, "file.txt"),
            csvStringify(files, { separator: "\t", crlf: false }).trimStart()
          );
        })
      );

      // symlink gvcf
      await Promise.all(
        pedYmls.map(async ({ members, dir }) => {
          const gvcfDir = join(dir, gvcfDirName);
          await emptyDir(gvcfDir);
          await Promise.all(
            members.map(({ internalIndId }) => {
              const gvcf = getGVcfGz(internalIndId, ref);
              Deno.symlink(
                join("..", internalIndId, "vcf", gvcf),
                join(gvcfDir, gvcf)
              );
            })
          );
        })
      );
      // write fam.txt
      await Promise.all(
        pedYmls.map(async ({ famId, dir }) => {
          await Deno.writeTextFile(
            join(dir, famTxt),
            csvStringify([[1, `${famId}-g`]], {
              crlf: false,
              separator: "\t",
            }).trimStart()
          );
        })
      );
    }
  );

function fsStat(file: string) {
  return Deno.stat(file).catch((err) => {
    if (err instanceof Deno.errors.NotFound) {
      return null;
    } else {
      throw err;
    }
  });
}
