import arrSubmit from "@/batch/submit.ts";
import { Command, CompletionsCommand, HelpCommand } from "@/deps.ts";
import gen from "@/batch/gen.ts";
import snvFinal from "@/pipeline/snv-final.ts";
import strAnnot from "@/pipeline/str-annot.ts";
import merge from "@/batch/merge.ts";
import hsStat from "@/pipeline/hs-stat.ts";
import c from "@/utils/sub-cmd.ts";
import snvAnnotM from "@/pipeline/snv-annot-m.ts";
import snvAnnotS from "@/pipeline/snv-annot-s.ts";

await new Command()
  .name("bioa")
  .version("0.4.0")
  .command(...c(arrSubmit))
  .command(...c(gen))
  .command(...c(merge))
  .command(...c(hsStat))
  .command(...c(snvFinal))
  .command(...c(strAnnot))
  .command(...c(snvAnnotM))
  .command(...c(snvAnnotS))
  .command("help", new HelpCommand().global())
  .command("completions", new CompletionsCommand())
  .parse(Deno.args);
