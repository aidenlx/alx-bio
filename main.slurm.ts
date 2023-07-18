import arrSumbit from "./arr-sumbit.ts";
import { Command, CompletionsCommand, HelpCommand } from "./deps.ts";

await new Command()
  .name("bioa")
  .version("0.4.0")
  .command("arr-submit", arrSumbit)
  .command("help", new HelpCommand().global())
  .command("completions", new CompletionsCommand())
  .parse(Deno.args);
