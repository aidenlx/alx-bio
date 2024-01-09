import { type VcfAnnoPostAnnotConfig } from "@/pipeline/module/vcfanno.ts";

export const aggregatedFreq = ["global_popmax_AF", "eas_popmax_AF"];

export const getFreqSource = (assembly: "hg19" | "hg38") => {
  const gnomadVer = assembly === "hg19" ? "211" : "4";
  return ({
    global: [
      `gnomad_e${gnomadVer}_AF`,
      `gnomad_g${gnomadVer}_AF`,
      "_1000Gp3_AF",
      "ExAC_AF",
      "ALFA_Total_AF",
    ],
    eas: [
      `gnomad_e${gnomadVer}_AF_eas`,
      `gnomad_g${gnomadVer}_AF_eas`,
      "WBBC_AF",
      "WBBC_South_AF",
      "_1000Gp3_EAS_AF",
      "ExAC_EAS_AF",
      "ALFA_East_Asian_AF",
    ],
  });
};

export const popmaxPostAnnot = (assembly: "hg19" | "hg38") =>
  (["global", "eas"] as const).map(
    (type): VcfAnnoPostAnnotConfig => ({
      name: `${type}_popmax_AF`,
      fields: getFreqSource(assembly)[type],
      op: `max`,
      type: "Float",
    }),
  );
