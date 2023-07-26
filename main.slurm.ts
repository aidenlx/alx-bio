import arrSumbit from "@/batch/sumbit.ts";
import { Command, CompletionsCommand, HelpCommand } from "@/deps.ts";
import gen from "@/batch/gen.ts";
import snvFinal from "@/snv-final.ts";
import strAnnot from "@/str-annot.ts";
import merge from "@/batch/merge.ts";

await new Command()
  .name("bioa")
  .version("0.4.0")
  .command("pl.submit", arrSumbit)
  .command("pl.gen", gen)
  .command("pl.merge", merge)
  .command("snv.final", snvFinal)
  .command("str.annot", strAnnot)
  .command("help", new HelpCommand().global())
  .command("completions", new CompletionsCommand())
  .parse(Deno.args);
