import { Command, csvStringify, join } from "@/deps.ts";
import {
  getMergedName,
  getFound,
  flatFounds,
  isFoundYamlPed,
  defaultMergeDir,
} from "./utils.ts";
import { handleNonAscii, numToFixedLength } from "@/utils/ascii.ts";

export default new Command()
  .name("pl.gen")
  .description("Generate batch task list")
  .arguments("<found...>")
  .option("--skip-check", "skip file existence check")
  .env("PL_MERGE_OUT_DIR=<dir:string>", "output directory", {
    prefix: "PL_",
  })
  .action(async ({ skipCheck, mergeOutDir = defaultMergeDir }, ...cfgFiles) => {
    const files = (await Promise.all(cfgFiles.map(getFound)))
      .flatMap((yml) => (isFoundYamlPed(yml) ? flatFounds(yml) : [yml]))
      .flatMap((yml) => Object.entries(yml));

    const fileList = files.map(
      ([id, files], i, arr): [number, string, string, string] => {
        let R1: string, R2: string;
        if (files.length > 1) {
          R1 = join(mergeOutDir, getMergedName(id, 0));
          R2 = join(mergeOutDir, getMergedName(id, 1));
        } else {
          [R1, R2] = files[0];
        }
        const name = `${numToFixedLength(
          i + 1,
          arr.length > 10 ? arr.length : 11
        )}-${handleNonAscii(id)}`;
        return [i + 1, name, R1, R2];
      }
    );

    // if (
    //   new Set(fileList.map(([, id]) => id)).size !==
    //   fileList.map(([, id]) => id).length
    // ) {
    //   throw new Error("Duplicate sample ID found");
    // }

    if (!skipCheck) {
      const fileCheckResults = await Promise.all(
        fileList
          .flatMap(([, , R1, R2]) => [R1, R2])
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
      if (fileCheckResults.some((vaild) => !vaild)) {
        Deno.exit(1);
      }
    }
    console.log(
      csvStringify(fileList, { separator: "\t", crlf: false }).trim()
    );
  });

function fsStat(file: string) {
  return Deno.stat(file).catch((err) => {
    if (err instanceof Deno.errors.NotFound) {
      return null;
    } else {
      throw err;
    }
  });
}
