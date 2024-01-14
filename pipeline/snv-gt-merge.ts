import { Command } from "@/deps.ts";
import bcftoolsConcat from "@/pipeline/module/bcftools/concat.ts";

export default new Command()
  .name("snv.gt-merge")
  .description("")
  .option("-o, --output <name>", "Output file name", { required: true })
  .arguments("<inputs...>")
  .action(async (options, ...inputs) => {
    await bcftoolsConcat(inputs, options.output, { naive: true });
  });
