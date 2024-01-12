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
import vcfFilterQuery from "@/pipeline/vcf-filter-query.ts";
import snvMerge from "@/pipeline/snv-merge.ts";
import snvAlign from "@/pipeline/ngs-call/snv-align.ts";
import snvMarkdup from "@/pipeline/ngs-call/snv-markdup.ts";
import snvBamSort from "./pipeline/ngs-call/snv-markdup-post.ts";
import snvBqsrRun from "@/pipeline/ngs-call/snv-bqsr-run.ts";
import snvBqsrApply from "@/pipeline/ngs-call/snv-bqsr-apply.ts";
import snvHapSplilt from "./pipeline/ngs-call/snv-interval-split.ts";
import snvHapCaller from "@/pipeline/ngs-call/snv-hap-caller.ts";
import snvHapMerge from "@/pipeline/ngs-call/snv-hap-merge.ts";
import tsvFilter from "@/pipeline/tsv-filter.ts";
import snvExtract from "@/pipeline/snv-extract.ts";
import merlin from "@/pipeline/merlin/merlin.ts";
import genPed from "@/batch/gen-ped.ts";
import genFam from "@/batch/gen-fam.ts";
import famCheck from "@/batch/fam-check.ts";
import _3gsMap from "./pipeline/3GS/3gs-map.ts";
import svAnnot from "@/pipeline/3GS/sv-annot.ts";
import svCall from "@/pipeline/3GS/sv-call.ts";
import canvas from "@/pipeline/3GS/canvas.ts";

await new Command()
  .name("bioa")
  .version("0.4.0")
  .command(...c(arrSubmit))
  .command(...c(gen))
  .command(...c(genPed))
  .command(...c(genFam))
  .command(...c(famCheck))
  .command(...c(merge))
  .command(...c(hsStat))
  .command(...c(snvAlign))
  .command(...c(snvMarkdup))
  .command(...c(snvBamSort))
  .command(...c(snvBqsrRun))
  .command(...c(snvBqsrApply))
  .command(...c(snvHapSplilt))
  .command(...c(snvHapCaller))
  .command(...c(snvHapMerge))
  .command(...c(snvMerge))
  .command(...c(snvAnnotM))
  .command(...c(snvAnnotS))
  .command(...c(snvFinal))
  .command(...c(snvExtract))
  .command(...c(strAnnot))
  .command(...c(tsvFilter))
  .command(...c(merlin))
  .command(...c(vcfFilterQuery))
  .command(...c(_3gsMap))
  .command(...c(svCall))
  .command(...c(svAnnot))
  .command(...c(canvas))
  .command("help", new HelpCommand().global())
  .command("completions", new CompletionsCommand())
  .parse(Deno.args);
