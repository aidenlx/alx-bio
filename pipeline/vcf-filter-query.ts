import { Command, EnumType } from "@/deps.ts";
import { outputQuery, getFilterQuery } from "./module/filter.ts";

export default new Command()
  .name("vcf.filter-q")
  .option(
    "-f, --frequency-required <threshold:number>",
    "freq threshold for filter",
    { default: 0.0001 }
  )
  .type("query", new EnumType(outputQuery))
  .option("-o, --output <mode:query>", "output query instead of full query", {
    default: "all" as const,
  })
  .action((opts) => {
    if (opts.frequencyRequired > 1 || opts.frequencyRequired < 0) {
      throw new Error(
        "frequencyRequired must be a vaild frequency, got " +
          opts.frequencyRequired
      );
    }
    console.log(getFilterQuery(opts.output, opts.frequencyRequired));
  });
