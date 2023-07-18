import { Command, CompletionsCommand, HelpCommand } from "./deps.ts";
import exomiserCfg from "./exomiser-cfg.ts";
import inspectBamBatch from "./insp-bam-b.ts";
import inspectBam from "./insp-bam.ts";
import gtexPlot from "./gtex-plot.ts";

await new Command()
  .name("bioa")
  .version("0.4.0")
  .command("insp-bam", inspectBam)
  .command("insp-bam-batch", inspectBamBatch)
  .command("exomiser-cfg", exomiserCfg)
  .command("gtex-plot", gtexPlot)
  .command("help", new HelpCommand().global())
  .command("completions", new CompletionsCommand())
  .parse(Deno.args);
