import { type VcfAnnoPostAnnotConfig } from "@/pipeline/module/vcfanno.ts";

export const freqSource = {
  global: [
    "gnomad_e211_AF",
    "gnomad_g211_AF",
    "_1000Gp3_AF",
    "ExAC_AF",
    "ALFA_Total_AF",
  ],
  eas: [
    "gnomad_e211_AF_eas",
    "gnomad_g211_AF_eas",
    "WBBC_AF",
    "WBBC_South_AF",
    "_1000Gp3_EAS_AF",
    "ExAC_EAS_AF",
    "ALFA_East_Asian_AF",
  ],
};

export const popmaxPostAnnot = (["global", "eas"] as const).map(
  (type): VcfAnnoPostAnnotConfig => ({
    name: `${type}_popmax_AF`,
    fields: freqSource[type],
    op: `max`,
    type: "Float",
  })
);
