import { Command, CompletionsCommand, HelpCommand } from "./deps.ts";
import exomiserCfg from "./exomiser-cfg.ts";
import inspectBamBatch from "./insp-bam-b.ts";
import inspectBam from "./insp-bam.ts";
import gtexPlot from "./gtex-plot.ts";
import c from "@/utils/sub-cmd.ts";
import tsvFilter from "@/pipeline/tsv-filter.ts";

await new Command()
  .name("bioa")
  .version("0.4.0")
  .command(...c(inspectBam))
  .command(...c(inspectBamBatch))
  .command(...c(exomiserCfg))
  .command(...c(gtexPlot))
  .command(...c(tsvFilter))
  .command("help", new HelpCommand().global())
  .command("completions", new CompletionsCommand())
  .parse(Deno.args);
