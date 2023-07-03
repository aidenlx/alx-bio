import { Command, CompletionsCommand, HelpCommand } from "./deps.ts";
import FetchBam from "./fetch-bam.ts";

await new Command()
  .name("bioa")
  .version("0.1.0")
  .command("fetch-bam", FetchBam)
  .command("help", new HelpCommand().global())
  .command("completions", new CompletionsCommand())
  .parse(Deno.args);
