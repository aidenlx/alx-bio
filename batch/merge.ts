import { $, Command, ensureDir, exists, join } from "@/deps.ts";
import {
  getMergedName,
  getFound,
  isFoundYamlPed,
  flatFounds,
  defaultMergeDir,
} from "./utils.ts";

export default new Command()
  .name("pl.merge")
  .description("Merge fastq files from different runs")
  .arguments("<found_file>")
  .env("PL_MERGE_OUT_DIR=<dir:string>", "output directory", {
    prefix: "PL_MERGE_",
  })
  .action(async ({ outDir = defaultMergeDir }, opt_found) => {
    const found = await getFound(opt_found);
    await ensureDir(outDir);

    const toMerge = (isFoundYamlPed(found) ? flatFounds(found) : [found])
      .flatMap((v) => Object.entries(v))
      .filter(([, files]) => files.length > 1);

    console.log(`${toMerge.length} files to merge`);
    for (const [id, files] of toMerge) {
      if (files.length < 2) return;
      console.log(`merge ${id}`);
      await Promise.all(
        [0, 1].map(async (i) => {
          const merged = join(outDir, getMergedName(id, i));
          if (await exists(merged + ".done")) {
            console.log(`${merged} exists, skip`);
            return;
          }
          const toMerge = files.map((pair) => pair[i]);
          // cat a b c > merged
          await $`cat ${toMerge} > ${merged} && touch ${merged}.done`;
          console.log(
            `done merging ${id}@${i}: ${toMerge.join(",")} > ${merged}`
          );
        })
      );
    }
  });
