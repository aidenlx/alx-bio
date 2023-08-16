import { normalizeVcfKey } from "@/utils/vcf-key.ts";
import { D, pipe, path } from "@/deps.ts";

import {
  VcfAnnoConfig,
  VcfAnnoConfigCol,
  VcfAnnoConfigField,
} from "@/pipeline/module/vcfanno.ts";
import { annovarDataDir } from "@/pipeline/_res.ts";

export const ClinVar = {
  hg19: "/cluster/home/jiyuan/res/hg19/clinvar_20230717.vcf.gz",
  hg38: "/cluster/home/jiyuan/res/hg38/clinvar_20230717.vcf.gz",
};

export const wbbcDatabase = {
  hs37: "/cluster/home/jiyuan/res/wbbc/WBBC.hs37.vcf.gz",
  hg38: "/cluster/home/jiyuan/res/wbbc/WBBC.hg38.vcf.gz",
};
export const localDatabase = {
  hs37: "/cluster/home/jiyuan/res/fjmun/fjmun-230802.hg19.vcf.gz",
};

export const dbnsfpSnpSift = {
  hg19: "/cluster/home/jiyuan/res/dbNSFP4.4a/dbNSFP4.4a_hg19.txt.gz",
  hg38: "/cluster/home/jiyuan/res/dbNSFP4.4a/dbNSFP4.4a.txt.gz",
};

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

export function getVcfannoCADDCfg(ref: keyof typeof CADD): VcfAnnoConfigCol;
export function getVcfannoCADDCfg(file: string): VcfAnnoConfigCol;
export function getVcfannoCADDCfg(fileOrRef: string): VcfAnnoConfigCol {
  return {
    file: fileOrRef in CADD ? CADD[fileOrRef as keyof typeof CADD] : fileOrRef,
    names: ["CADD_PHRED"],
    ops: ["mean"],
    columns: [6],
  };
}

export const localAC = `FJMUN_AC`,
  localAF = `FJMUN_AF`;

export const vcfannoLocal = D.fromPairs(
  (["hg19", "hg38"] as const).map((ref) => [
    ref,
    ref === "hg19" && {
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
          ["ID", "CLN_VARID"],
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
    { columns: [], names: [], ops: [] } as Omit<VcfAnnoConfigCol, "file">
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
    { fields: [], names: [], ops: [] } as Omit<VcfAnnoConfigField, "file">
  );
}
