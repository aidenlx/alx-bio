import { normalizeVcfKey } from "@/utils/vcf-key.ts";
import { D, pipe, path, $ } from "@/deps.ts";

import {
  VcfAnnoAnnotConfig,
  VcfAnnoAnnotConfigCol,
  VcfAnnoAnnotConfigField,
} from "@/pipeline/module/vcfanno.ts";
import { annovarDataDir } from "@/pipeline/_res.ts";
import { CADDColumns, CADDCommonColumn } from "@/pipeline/_cadd_anno.ts";
import { assertNever } from "@/utils/assert-never.ts";

export const ClinVar = {
  hg19: "/cluster/home/jiyuan/res/hg19/clinvar_20230717.vcf.gz",
  hg38: "/cluster/home/jiyuan/res/hg38/clinvar_20230717.vcf.gz",
};

export const wbbcDatabase = {
  hs37: "/cluster/home/jiyuan/res/wbbc/WBBC.hs37.vcf.gz",
  hg38: "/cluster/home/jiyuan/res/wbbc/WBBC.hg38.vcf.gz",
};
export const localDatabase = {
  hs37: "/cluster/home/jiyuan/res/fjmun/fjmun-230822.hg19.vcf.gz",
};

export const dbnsfpSnpSift = {
  hg19: "/cluster/home/jiyuan/res/dbNSFP4.4a/dbNSFP4.4a_hg19.txt.gz",
  hg38: "/cluster/home/jiyuan/res/dbNSFP4.4a/dbNSFP4.4a.txt.gz",
};

const dbnsfpColumns = ColToDef([
  [17, "Uniprot_acc"],
  // [40, "SIFT_pred_float"],
  // [46, "Polyphen2_HDIV_pred_float"],
  // [49, "Polyphen2_HVAR_pred_float"],
  [52, "LRT_pred_float"],
  [56, "MutationTaster_pred_float"],
  [61, "MutationAssessor_pred_float"],
  [64, "FATHMM_pred_float"],
  [67, "PROVEAN_pred_float"],
  [72, "MetaSVM_pred_float"],
  // [165, "GERP++_NR"],
  // [166, "GERP++_RS"],
  [174, "phastCons100way_vertebrate"],
  [186, "1000Gp3_AF_float"],
  [194, "1000Gp3_EAS_AF_float"],
  [208, "ExAC_AF_float"],
  [216, "ExAC_EAS_AF_float"],
  [649, "ALFA_East_Asian_AF_float"],
  [676, "ALFA_Total_AF_float"],
  [686, "Interpro_domain"],
  [687, "GTEx_V8_gene"],
  [688, "GTEx_V8_tissue"],
] as [number, string, string?][]);

const gnomad211ExomeColumns = ColToDef([
  [6, "gnomad_e211_AF_float"],
  [14, "gnomad_e211_AF_eas_float"],
]);
const gnomad211GenomeColumns = ColToDef([
  [6, "gnomad_g211_AF_float"],
  [14, "gnomad_g211_AF_eas_float"],
]);
const gnomad312GenomeColumns = ColToDef([
  [6, "gnomad312_AF_float"],
  [16, "gnomad312_AF_eas_float"],
]);

const annovar = {
  hg19_gnomad211_exome: gnomad211ExomeColumns,
  hg19_gnomad211_genome: gnomad211GenomeColumns,
  hg38_gnomad211_exome: gnomad211ExomeColumns,
  hg38_gnomad312_genome: gnomad312GenomeColumns,
};

const CADD = {
  inclAnno: {
    hg19: "/cluster/home/jiyuan/res/CADD-scripts/data/prescored/GRCh37_v1.6/incl_anno/whole_genome_SNVs_inclAnno.tsv.gz",
    hg38: "/cluster/home/jiyuan/res/CADD-scripts/data/prescored/GRCh38_v1.6/incl_anno/whole_genome_SNVs_inclAnno.tsv.gz",
  },
  noAnno: {
    hg19: "/cluster/home/jiyuan/res/CADD-scripts/data/prescored/GRCh37_v1.6/no_anno/whole_genome_SNVs.tsv.gz",
    hg38: "/cluster/home/jiyuan/res/CADD-scripts/data/prescored/GRCh38_v1.6/no_anno/whole_genome_SNVs.tsv.gz",
  },
};

export async function getVcfannoCADDCfg(
  ref: keyof typeof CADD,
  inclAnno?: boolean
): Promise<VcfAnnoAnnotConfigCol>;
export async function getVcfannoCADDCfg(
  file: string,
  inclAnno?: boolean
): Promise<VcfAnnoAnnotConfigCol>;
export async function getVcfannoCADDCfg(
  fileOrRef: string,
  inclAnno = false
): Promise<VcfAnnoAnnotConfigCol> {
  const database = CADD[inclAnno ? "inclAnno" : "noAnno"];
  let version: keyof typeof CADDColumns;
  let file: string;
  if (!(fileOrRef in database)) {
    file = fileOrRef;
    const versionLine = (
      await $`zcat ${file} | grep -m1 '^##' | head -1`.nothrow()
    ).stdout;
    if (versionLine.includes("GRCh37-v1.6")) {
      version = "GRCh37_v1_6";
    } else if (versionLine.includes("GRCh38-v1.6")) {
      version = "GRCh38_v1_6";
    } else {
      throw new Error("CADD version not found in " + fileOrRef);
    }
  } else {
    const ref = fileOrRef as keyof typeof database;
    version =
      ref === "hg19"
        ? "GRCh37_v1_6"
        : ref === "hg38"
        ? "GRCh38_v1_6"
        : assertNever(ref);
    file = database[ref];
  }
  if (!inclAnno) {
    return {
      file,
      ...ColToDef([[6, "CADD_PHRED_float"]]),
    };
  } else {
    return {
      file,
      ...CADDToDef(
        version,
        ["PHRED", "CADD_PHRED"],
        "SIFTcat",
        "SIFTval",
        "PolyPhenCat",
        "PolyPhenVal",
        "mirSVR-Score",
        "mirSVR-E",
        "mirSVR-Aln",
        "SpliceAI-acc-gain",
        "SpliceAI-acc-loss",
        "SpliceAI-don-gain",
        "SpliceAI-don-loss",
        "dbscSNV-ada_score",
        "dbscSNV-rf_score",
        "Grantham",
        "GerpRS",
        "GerpRSpval",
        "GerpN",
        "GerpS"
      ),
    };
  }
}

// tabix -f -b 2 -e 2 -s 1
const AlphaMissense = {
  hg19: "/cluster/home/jiyuan/res/alphamissense/AlphaMissense_hg19.tsv.gz",
  hg38: "/cluster/home/jiyuan/res/alphamissense/AlphaMissense_hg38.tsv.gz",
};

export const localAC = `FJMUN_AC`,
  localAF = `FJMUN_AF`,
  localNumHomAlt = `FJMUN_nhomalt`;

export const vcfannoLocal = D.fromPairs(
  (["hg19", "hg38"] as const).map((ref) => [
    ref,
    ref === "hg19" && {
      file: localDatabase.hs37,
      ...FieldsToDef([
        ["AC", localAC],
        ["AF", localAF],
        ["nhomalt", localNumHomAlt],
      ]),
    },
  ])
);

export const vcfannoCfg = D.fromPairs(
  (["hg19", "hg38"] as const).map((ref) => {
    const cfg: VcfAnnoAnnotConfig[] = [
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
        file: AlphaMissense[ref],
        names: ["AM_PATHOGENICITY_float", "AM_CLASS"],
        ops: ["self", "self"],
        columns: [9, 10],
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

export function ColToDef<T extends VcfAnnotColumn[]>(
  inputs: T,
  toName?: (name: string) => string
) {
  return inputs.reduce(
    (out, [column, name, op]) => {
      out.columns.push(column);
      out.names.push(normalizeVcfKey(toName ? toName(name) : name));
      out.ops.push(op ?? "self");
      return out;
    },
    { columns: [], names: [], ops: [] } as Omit<VcfAnnoAnnotConfigCol, "file">
  );
}

export function CADDToDef(
  version: keyof typeof CADDColumns,
  ...keys: (CADDCommonColumn | [key: CADDCommonColumn, name?: string])[]
) {
  return ColToDef(
    keys.map((def) => {
      const key = typeof def === "string" ? def : def[0];
      const altName = typeof def === "string" ? undefined : def[1];
      const { id, name, type } = CADDColumns[version][key];
      const typeDef =
        type === "float" ? "_float" : type === "integer" ? "_int" : "";
      return [id, `${altName ?? name}${typeDef}`, "self"];
    })
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
    { fields: [], names: [], ops: [] } as Omit<VcfAnnoAnnotConfigField, "file">
  );
}
