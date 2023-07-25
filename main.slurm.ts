import arrSumbit from "./arr-sumbit.ts";
import { Command, CompletionsCommand, HelpCommand } from "./deps.ts";
import snvFinal from "./snv-final.ts";
import strAnnot from "./str-annot.ts";

await new Command()
  .name("bioa")
  .version("0.4.0")
  .command("arr-submit", arrSumbit)
  .command("snv.final", snvFinal)
  .command("str.annot", strAnnot)
  .command("help", new HelpCommand().global())
  .command("completions", new CompletionsCommand())
  .parse(Deno.args);
