import { Command, CompletionsCommand, HelpCommand } from "./deps.ts";
import inspectBam from "./inspect-bam.ts";

await new Command()
  .name("bioa")
  .version("0.1.0")
  .command("inspect-bam", inspectBam)
  .command("help", new HelpCommand().global())
  .command("completions", new CompletionsCommand())
  .parse(Deno.args);
