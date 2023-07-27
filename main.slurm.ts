import arrSubmit from "@/batch/submit.ts";
import { Command, CompletionsCommand, HelpCommand } from "@/deps.ts";
import gen from "@/batch/gen.ts";
import snvFinal from "@/pipeline/snv-final.ts";
import strAnnot from "@/pipeline/str-annot.ts";
import merge from "@/batch/merge.ts";
import hsStat from "@/pipeline/hs-stat.ts";
import c from "@/utils/sub-cmd.ts";

await new Command()
  .name("bioa")
  .version("0.4.0")
  .command(...c(arrSubmit))
  .command(...c(gen))
  .command(...c(merge))
  .command(...c(hsStat))
  .command(...c(snvFinal))
  .command(...c(strAnnot))
  .command("help", new HelpCommand().global())
  .command("completions", new CompletionsCommand())
  .parse(Deno.args);
