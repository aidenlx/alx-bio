// deno-lint-ignore-file no-explicit-any
export type SupportAssembly = "hg38" | "hs37" | "hg19";

import { normalizeVcfKey } from "@/utils/vcf-key.ts";
import { D, pipe, path } from "@/deps.ts";
import { vaildBedPath } from "@/utils/vaildate.ts";
import { VcfAnnoConfig } from "@/pipeline/module/vcfanno.ts";

export const getMarkDupBam = (sample: string, assembly: string) =>
  `${sample}.markdup.${assembly}.bam`;
export const getBqsrBam = (sample: string, assembly: string) =>
  `${sample}.bqsr.${assembly}.bam`;

// conda create -y -c conda-forge -c bioconda -n hs37-WGS fastqc trim-galore bwa-mem2 samtools gatk4 ncurses
export const Res = {
  hg38: {
    // https://lh3.github.io/2017/11/13/which-human-reference-genome-to-use
    refFa:
      "/cluster/home/jiyuan/res/hg38/GCA_000001405.15_GRCh38_no_alt_analysis_set.fa",
    dbsnp:
      "/huawei-genetics/project/shiyan/Call_snp_data/database/dbsnp_146.hg38.vcf",
  },
  /** hs37 (1-22,X,Y) vs hg19 (chr1-chr22,chrX,chrY) */
  hs37: {
    refFa: "/cluster/home/jiyuan/res/hg19/hs37d5.fa",
    dbsnp:
      "/genetics/home/shiyan/bin/Database/hg19/db/GRCh37/dbSnp/dbSnp_v149.20161122.vcf.gz",
  },
  hg19: {
    refFa: "/cluster/apps/humandb/hg19/hg19.chr.fa",
    dbsnp: "/cluster/apps/humandb/GATK4/hg19/dbsnp_138.hg19.vcf",
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
  },
} satisfies Record<
  "Bait" | "Target",
  Record<string, Partial<Record<SupportAssembly, string>>>
>;

export const Interval = D.map(_Interval, (types) =>
  D.map(types, (intervalFiles) =>
    D.map(intervalFiles, (file) =>
      path.join(
        "/",
        ..."/cluster/home/jiyuan/res/probes/".split("/").filter(Boolean),
        file
      )
    )
  )
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

export const wbbcDatabase = {
  hs37: "/cluster/home/jiyuan/res/wbbc/WBBC.hs37.vcf.gz",
  hg38: "/cluster/home/jiyuan/res/wbbc/WBBC.hg38.vcf.gz",
};
export const localDatabase = {
  hs37: "/cluster/home/jiyuan/res/fjmun/fjmun-230802.hg19.vcf.gz",
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
      "No fastq input specified, using 1.fq.gz and 2.fq.gz in outDir"
    );
    return ["1.fq.gz", "2.fq.gz"];
  }
  throw new Error("Must specify both fq1 and fq2");
}

export const annovarDataDir = "/cluster/home/jiyuan/res/annovar_data/";
export const dbnsfpSnpSift = {
  hg19: "/cluster/home/jiyuan/res/dbNSFP4.4a/dbNSFP4.4a_hg19.txt.gz",
  hg38: "/cluster/home/jiyuan/res/dbNSFP4.4a/dbNSFP4.4a.txt.gz",
};
export const CueDir = "/cluster/home/jiyuan/res/cue/",
  CueModelCfg = {
    model_path: path.join(CueDir, "data/models/cue.v2.pt"),
  };

export const CanvasRes = {
  resDir: {
    hg38: "/cluster/home/jiyuan/res/canvas/GRCh38/",
    hg19: "/cluster/home/jiyuan/res/canvas/hg19/",
    // no res without chr prefix (hs37) yet
  },
  populationBAlleleVcf: {
    hg38: "/cluster/home/jiyuan/res/hg38/somatic-hg38_af-only-gnomad.10p.hg38.vcf",
    // no res with chr prefix (hg19) yet
    hs37: "/cluster/home/jiyuan/res/hg19/af-only-gnomad.raw.sites.10p.vcf",
  },
  dockerImage: "/cluster/home/jiyuan/res/canvas/image.tar",
};

export const ClinVar = {
  hg19: "/cluster/home/jiyuan/res/hg19/clinvar_20230717.vcf.gz",
  hg38: "/cluster/home/jiyuan/res/hg38/clinvar_20230717.vcf.gz",
};

export const readGroupNGS = (sample: string) =>
  `@RG\\tID:${sample}\\tSM:${sample}\\tPL:ILLUMINA`;

export const readGroupONT = (sample: string) =>
  `@RG\\tID:${sample}\\tSM:${sample}\\tPL:PACBIO`;

const dbnsfpColumns = ColToDef([
  [17, "Uniprot_acc"],
  [40, "SIFT_pred"],
  [46, "Polyphen2_HDIV_pred"],
  [49, "Polyphen2_HVAR_pred"],
  [52, "LRT_pred"],
  [56, "MutationTaster_pred"],
  [61, "MutationAssessor_pred"],
  [64, "FATHMM_pred"],
  [67, "PROVEAN_pred"],
  [72, "MetaSVM_pred"],
  [165, "GERP++_NR"],
  [166, "GERP++_RS"],
  [174, "phastCons100way_vertebrate"],
  [186, "1000Gp3_AF"],
  [194, "1000Gp3_EAS_AF"],
  [208, "ExAC_AF"],
  [216, "ExAC_EAS_AF"],
  [649, "ALFA_East_Asian_AF"],
  [676, "ALFA_Total_AF"],
  [686, "Interpro_domain"],
  [687, "GTEx_V8_gene"],
  [688, "GTEx_V8_tissue"],
] as [number, string, string?][]);

const gnomad211ExomeColumns = ColToDef([
  [6, "gnomad_e211_AF"],
  [14, "gnomad_e211_AF_eas"],
]);
const gnomad211GenomeColumns = ColToDef([
  [6, "gnomad_g211_AF"],
  [14, "gnomad_g211_AF_eas"],
]);
const gnomad312GenomeColumns = ColToDef([
  [6, "gnomad312_AF"],
  [16, "gnomad312_AF_eas"],
]);

const annovar = {
  hg19_gnomad211_exome: gnomad211ExomeColumns,
  hg19_gnomad211_genome: gnomad211GenomeColumns,
  hg38_gnomad211_exome: gnomad211ExomeColumns,
  hg38_gnomad312_genome: gnomad312GenomeColumns,
};

const CADD = {
  hg19: "/cluster/home/jiyuan/res/CADD-scripts/data/prescored/GRCh37_v1.6/no_anno/whole_genome_SNVs.tsv.gz",
  hg38: "/cluster/home/jiyuan/res/CADD-scripts/data/prescored/GRCh38_v1.6/no_anno/whole_genome_SNVs.tsv.gz",
};

export const vcfannoCADD = D.fromPairs(
  (["hg19", "hg38"] as const).map((ref) => [
    ref,
    { file: CADD[ref], names: ["CADD_PHRED"], ops: ["mean"], columns: [5] },
  ])
);

export const localAC = `FJMUN_AC`,
  localAF = `FJMUN_AF`;

export const vcfannoLocal = D.fromPairs(
  (["hg19", "hg38"] as const).map((ref) => [
    ref,
    ref === "hg38" && {
      file: localDatabase.hs37,
      ...FieldsToDef([[localAC], [localAF]]),
    },
  ])
);

export const vcfannoCfg = D.fromPairs(
  (["hg19", "hg38"] as const).map((ref) => {
    const cfg: VcfAnnoConfig[] = [
      {
        file: dbnsfpSnpSift[ref],
        ...dbnsfpColumns,
      },
      {
        file: ClinVar[ref],
        ...FieldsToDef([
          ["ALLELEID", "CLN_ALLELEID", "concat"],
          ["CLNSIG", "CLNSIG"],
          ["CLNDN", "CLNDN"],
          ["CLNREVSTAT", "CLNREVSTAT"],
          ["CLNHGVS", "CLNHGVS"],
          ["CLNVI", "CLNVI"],
          ["CLNDISDB", "CLNDISDB"],
        ] as [string, string, string?][]),
      },
      {
        file: wbbcDatabase[ref === "hg19" ? "hs37" : ref],
        ...FieldsToDef(
          [["AF"], ["North_AF"], ["Central_AF"], ["South_AF"], ["Lingnan_AF"]],
          (field) => `WBBC_${field}`
        ),
      },
      ...pipe(
        annovar,
        D.filterWithKey((k) => k.startsWith(`${ref}_`)),
        D.mapWithKey((k, v) => ({
          file: path.join(annovarDataDir, `${k}.txt.gz`),
          ...v!,
        })),
        D.values
      ),
    ];
    return [ref, cfg] as const;
  })
);

type VcfAnnotColumn = [number, string, string?];

function ColToDef<T extends VcfAnnotColumn[]>(
  inputs: T,
  toName?: (name: string) => string
) {
  return inputs.reduce(
    (out, [column, name, op]) => {
      out.columns.push(column);
      out.names.push(normalizeVcfKey(toName ? toName(name) : name));
      out.ops.push(op ?? "first");
      return out;
    },
    { columns: [] as number[], names: [] as string[], ops: [] as string[] }
  );
}

type VcfAnnotField = [string, string?, string?];

function FieldsToDef<T extends VcfAnnotField[]>(
  inputs: T,
  toName?: (name: string) => string
) {
  return inputs.reduce(
    (out, [field, name, op]) => {
      out.fields.push(field);
      if (!name) name = field;
      out.names.push(normalizeVcfKey(toName ? toName(name) : name));
      out.ops.push(op ?? "self");
      return out;
    },
    { fields: [] as string[], names: [] as string[], ops: [] as string[] }
  );
}

export function parseIntevals(
  intervalsOpt: true | string | undefined,
  assembly: SupportAssembly,
  baitOrTarget: "Bait" | "Target"
): [path: string | null, bultiIn: boolean] {
  if (intervalsOpt === undefined) return [null, false];
  if (intervalsOpt === true)
    return [Interval[baitOrTarget].AgilentV6r2[assembly], true];
  if (Object.keys(Interval[baitOrTarget]).includes(intervalsOpt)) {
    type BaitKey = keyof (typeof Interval)["Bait"];
    const baits = Interval[baitOrTarget][intervalsOpt as BaitKey];
    const bait = (baits as any)[assembly] as string | undefined;
    if (!bait)
      throw new Error(
        `Bait Intervals of ${intervalsOpt} not found for ${assembly}`
      );
    return [bait, true];
  }
  if (!vaildBedPath.allows(intervalsOpt)) {
    throw new Error(`Bait Intervals file ${intervalsOpt} not found`);
  }
  return [intervalsOpt, false];
}
