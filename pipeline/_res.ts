// deno-lint-ignore-file no-explicit-any
export type SupportAssembly = "hg38" | "hs37" | "hg19";

const resDir = Deno.env.get("ALXBIO_RES") ?? "/cluster/home/jiyuan/res";

import { D, join, path } from "@/deps.ts";
import { validBedPath } from "@/utils/validate.ts";

export const getMarkDupBam = (sample: string, assembly: string) =>
  `${sample}.markdup.${assembly}.bam`;
export const getBqsrBam = (sample: string, assembly: string) =>
  `${sample}.bqsr.${assembly}.bam`;
export const getGVcfGz = (sample: string, assembly: string) =>
  `${sample}.g.${assembly}.vcf.gz`;

// conda create -y -c conda-forge -c bioconda -n hs37-WGS fastqc trim-galore bwa-mem2 samtools gatk4 ncurses
export const Res = {
  hg38: {
    // https://lh3.github.io/2017/11/13/which-human-reference-genome-to-use
    refFa: join(resDir, "hg38/GCA_000001405.15_GRCh38_no_alt_analysis_set.fa"),
    dbsnp: join(resDir, "dbsnp/dbsnp156.hg38.vcf.gz"),
  },
  /** hs37 (1-22,X,Y) vs hg19 (chr1-chr22,chrX,chrY) */
  hs37: {
    refFa: join(resDir, "hg19/hs37d5.fa"),
    dbsnp: join(resDir, "dbsnp/dbsnp156.hs37.vcf.gz"),
  },
  hg19: {
    refFa: "/cluster/apps/humandb/hg19/hg19.chr.fa",
    dbsnp: join(resDir, "dbsnp/dbsnp156.hg19.vcf.gz"),
  },
} satisfies Record<SupportAssembly, any>;

/**
 * @prop Target - A bed file which holds the wishlist (based on a genome, e.g. GRCh38)
 * of what you wish to capture from your DNA, can be referred to as "primary target" (NimbleGen),
 *  "empirical target" (MedExome) or "regions" by Agilent. If you are using GATK4's
 * CollectHsMetrics, this will correspond to --TARGET_INTERVALS parameter.
 * @prop Bait - The file which holds the actual probes that are thought to capture
 * the primary target regions can be called "capture target" (NimbleGen, MedExome) or
 * "covered" (Agilent). In e.g. aforementioned CollectHsMetrics, this corresponds to
 * --BAIT_INTERVALS parameter.
 * @see https://www.biostars.org/p/220939/
 */
const _Interval = {
  Bait: {
    AgilentV6r2: {
      hg19: "AgilentV6_Exon_r2.covered.hg19.bed",
      hg38: "AgilentV6_Exon_r2.covered.hg38.bed",
      hs37: "AgilentV6_Exon_r2.covered.hs37.bed",
    },
    EZ_Exome_v2: {
      hg19: "SeqCap_EZ_Exome_v2_tiled_regions.hg19.bed",
      hs37: "SeqCap_EZ_Exome_v2_tiled_regions.hs37.bed",
    },
    MedExome: {
      hg19: "Exome-MedExome_capture_targets.hg19.bed",
      hg38: "Exome-MedExome_capture_targets.hg38.bed",
      hs37: "Exome-MedExome_capture_targets.hs37.bed",
    },
    IDT_v1: {
      hg19: "xgen-exome-research-panel-probes.hg19.bed",
      hs37: "xgen-exome-research-panel-probes.hs37.bed",
    },
    IDT_v2: {
      hg19: "xgen-exome-hyb-panel-v2-probes.hg19.bed",
      hs37: "xgen-exome-hyb-panel-v2-probes.hs37.bed",
      hg38: "xgen-exome-hyb-panel-v2-probes.hg38.bed",
    },
    KAPA_HyperExome_v1: {
      hg19: "KAPA_HyperExome_hg19_capture_targets.bed",
      hs37: "KAPA_HyperExome_hs37_capture_targets.bed",
      hg38: "KAPA_HyperExome_hg38_capture_targets.bed",
    },
  },
  Target: {
    AgilentV6r2: {
      hg19: "AgilentV6_Exon_r2.regions.hg19.bed",
      hs37: "AgilentV6_Exon_r2.regions.hs37.bed",
      hg38: "AgilentV6_Exon_r2.regions.hg38.bed",
    },
    EZ_Exome_v2: {
      hg19: "SeqCap_EZ_Exome_v2_target_regions.hg19.bed",
      hs37: "SeqCap_EZ_Exome_v2_target_regions.hs37.bed",
    },
    MedExome: {
      hg19: "Exome-MedExome_empirical_targets.hg19.bed",
      hg38: "Exome-MedExome_empirical_targets.hg38.bed",
      hs37: "Exome-MedExome_empirical_targets.hs37.bed",
    },
    IDT_v1: {
      hg19: "xgen-exome-research-panel-targets.hg19.bed",
      hs37: "xgen-exome-research-panel-targets.hs37.bed",
    },
    IDT_v2: {
      hg19: "xgen-exome-hyb-panel-v2-targets.hg19.bed",
      hs37: "xgen-exome-hyb-panel-v2-targets.hs37.bed",
      hg38: "xgen-exome-hyb-panel-v2-targets.hg38.bed",
    },
    KAPA_HyperExome_v1: {
      hg19: "KAPA_HyperExome_hg19_primary_targets.bed",
      hs37: "KAPA_HyperExome_hs37_primary_targets.bed",
      hg38: "KAPA_HyperExome_hg38_primary_targets.bed",
    },
  },
} satisfies Record<
  "Bait" | "Target",
  Record<string, Partial<Record<SupportAssembly, string>>>
>;

export const Interval = D.map(
  _Interval,
  (types) =>
    D.map(types, (intervalFiles) =>
      D.map(intervalFiles, (file) =>
        path.join(
          "/",
          ...join(resDir, "probes").split("/").filter(Boolean),
          file,
        ))),
) as typeof _Interval;

export const KnownSites = {
  hg38: [
    "/cluster/apps/humandb/GATK4/hg38/1000G_phase1.snps.high_confidence.hg38.vcf",
    "/cluster/apps/humandb/GATK4/hg38/Mills_and_1000G_gold_standard.indels.hg38.vcf",
    Res.hg38.dbsnp,
  ],
  hs37: [
    "/genetics/home/shiyan/bin/Database/gnomad/gnomad.exomes.r2.1.1.sites.vcf.gz",
    Res.hs37.dbsnp,
  ],
  hg19: [
    "/cluster/apps/humandb/GATK4/hg19/1000G_phase1.snps.high_confidence.hg19.sites.vcf",
    "/cluster/apps/humandb/GATK4/hg19/Mills_and_1000G_gold_standard.indels.hg19.sites.vcf",
    Res.hg19.dbsnp,
  ],
} satisfies Record<SupportAssembly, string[]>;

export type AnnovarProtocol = "gene" | "region" | "filter";
export const annovarDatabase: Record<
  "hg19" | "hg38",
  Record<AnnovarProtocol, string[]>
> = {
  hg19: {
    gene: ["refGene", "knownGene", "ensGene"],
    region: ["genomicSuperDups"],
    filter: [],
  },
  hg38: {
    gene: ["refGene", "knownGene", "ensGene"],
    region: ["genomicSuperDups"],
    filter: [],
  },
};

export const snpeff_assembly = {
  hg19: "GRCh37.75",
  hg38: "GRCh38.105",
};

export function parseFastqOption({
  fq1,
  fq2,
}: {
  fq1?: string | true;
  fq2?: string | true;
}): [string, string] {
  const { resolve } = path;
  if (fq1 === true || fq2 === true) {
    throw new Error("Must specify both fq1 and fq2");
  }
  if (fq1 && fq2) {
    return [resolve(fq1), resolve(fq2)];
  }
  if (!fq1 && !fq2) {
    console.info(
      "No fastq input specified, using 1.fq.gz and 2.fq.gz in outDir",
    );
    return ["1.fq.gz", "2.fq.gz"];
  }
  throw new Error("Must specify both fq1 and fq2");
}

export const annovarDataDir = join(resDir, "annovar_data/");

export const CueDir = join(resDir, "cue/"),
  CueModelCfg = {
    model_path: path.join(CueDir, "data/models/cue.v2.pt"),
  };

export const CanvasRes = {
  resDir: {
    hg38: join(resDir, "canvas/GRCh38/"),
    hg19: join(resDir, "canvas/hg19/"),
    // no res without chr prefix (hs37) yet
  },
  populationBAlleleVcf: {
    hg38: join(resDir, "hg38/somatic-hg38_af-only-gnomad.10p.hg38.vcf"),
    // no res with chr prefix (hg19) yet
    hs37: join(resDir, "hg19/af-only-gnomad.raw.sites.10p.vcf"),
  },
  dockerImage: join(resDir, "canvas/image.tar"),
};

export const readGroupNGS = (sample: string) =>
  `@RG\\tID:${sample}\\tSM:${sample}\\tPL:ILLUMINA`;

export const readGroupONT = (sample: string) =>
  `@RG\\tID:${sample}\\tSM:${sample}\\tPL:PACBIO`;

export function parseIntevals(
  intervalsOpt: true | string | undefined,
  assembly: SupportAssembly,
  baitOrTarget: "Bait" | "Target",
): [path: string | null, bultiIn: boolean] {
  if (intervalsOpt === undefined) return [null, false];
  if (intervalsOpt === true) {
    return [Interval[baitOrTarget].AgilentV6r2[assembly], true];
  }
  if (Object.keys(Interval[baitOrTarget]).includes(intervalsOpt)) {
    type BaitKey = keyof (typeof Interval)["Bait"];
    const baits = Interval[baitOrTarget][intervalsOpt as BaitKey];
    const bait = (baits as any)[assembly] as string | undefined;
    if (!bait) {
      throw new Error(
        `Bait Intervals of ${intervalsOpt} not found for ${assembly}`,
      );
    }
    return [bait, true];
  }
  if (!validBedPath.allows(intervalsOpt)) {
    throw new Error(`Bait Intervals file ${intervalsOpt} not found`);
  }
  return [intervalsOpt, false];
}
