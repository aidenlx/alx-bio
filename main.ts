import { Command, CompletionsCommand, HelpCommand } from "./deps.ts";
import inspectBamBatch from "./insp-bam-b.ts";
import inspectBam from "./insp-bam.ts";

await new Command()
  .name("bioa")
  .version("0.2.3")
  .command("insp-bam", inspectBam)
  .command("insp-bam-batch", inspectBamBatch)
  .command("help", new HelpCommand().global())
  .command("completions", new CompletionsCommand())
  .parse(Deno.args);
