import { type } from "npm:arktype";
import { scope } from "npm:arktype";

export const extraColPrepend = [
  "DiseaseSymbol",
  "Allele1-GT",
  "Allele2-GT",
  "Inheritance",
  "IsMainRegion",
  "Gene",
  "GeneRegion",
  "GeneId",
  "RepeatUnit",
  "PathogenicMotif",
] as const;

export const enum Genotype {
  Normal = "NORMAL",
  Pathogenic = "PATHOG",
  Intermediate = "INTER",
  Missing = "-",
  NotPathogenic = "NOT_PATHOG",
}

export const extraColAppend = [
  "DiseaseName",
  "DiseaseOMIM",
  "NormalMax",
  "PathogenicMin",
  "IntermediateRange",
] as const;

export interface RepeatCatalogDisease {
  LocusId: string;
  LocusStructure: string;
  ReferenceRegion: string[] | string;
  RepeatUnit?: string;
  VariantType: RepeatType[] | RepeatType;
  Gene: string;
  Inheritance: Inheritance;
  GeneRegion: string;
  GeneId: string;
  DiscoveryMethod?: string;
  DiscoveryYear?: number;
  Diseases: Disease[];
  MainReferenceRegion: string;
  VariantId?: string[];
  PathogenicMotif?: string;
}

export interface Disease {
  Symbol: string;
  Name: string;
  Inheritance: Inheritance;
  OMIM: string;
  NormalMax?: number;
  PathogenicMin: number;
  IntermediateRange?: string;
  Note?: string;
}

export const enum Inheritance {
  Ad = "AD",
  Ar = "AR",
  Xd = "XD",
  Xr = "XR",
}

export const enum RepeatType {
  RareRepeat = "RareRepeat",
  Repeat = "Repeat",
}

// Source: https://github.com/Illumina/RepeatCatalogs
export const RCSingle = type(
    {
      LocusId: "string",
      LocusStructure: "string",
      ReferenceRegion: "string",
      "VariantId?": "string",
      VariantType: '"Repeat"|"RareRepeat"',
      "OfftargetRegions?": "string[]",
    },
    { keys: "strict" }
  ),
  RCMultiple = type(
    {
      LocusId: "string",
      LocusStructure: "string",
      // one-to-one mapping between ReferenceRegion,
      // VariantType and VariantId (if present)
      ReferenceRegion: "string[]",
      "VariantId?": "string[]",
      VariantType: '("Repeat"|"RareRepeat")[]',
      "OfftargetRegions?": "string[]",
    },
    { keys: "strict" }
  );
export const { RepeatCatalogs } = scope(
  {
    RepeatCatalog: "single | multiple",
    RepeatCatalogs: "RepeatCatalog[]",
  },
  { keys: "loose", imports: [{ single: RCSingle, multiple: RCMultiple }] }
).compile();
