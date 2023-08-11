import { Type, ArgumentValue, ValidationError } from "@/deps.ts";

export interface Threshold {
  field: (typeof thresholdFields)[number];
  value: number;
}

export class ThresholdType extends Type<Threshold> {
  complete() {
    return thresholdFields.map((v) => v + ":");
  }

  public parse({ label, name, value }: ArgumentValue): Threshold {
    if (!Number.isNaN(Number.parseFloat(value))) {
      return defaultThreshold;
    }
    const [field, valueStr] = value.split(":");
    if (!isThreshold(field)) {
      throw new ValidationError(
        `${label} "${name}" must be one of ${thresholdFields.join(
          ", "
        )}, but got "${field}"`
      );
    }
    const data = Number.parseFloat(valueStr);
    if (Number.isNaN(data)) {
      throw new ValidationError(
        `${label} "${name}" must be a number, but got "${valueStr}"`
      );
    }
    return { field, value: data };
  }
}
const thresholdFields = ["lod", "alpha", "hlod"] as const;

const isThreshold = (v: string): v is (typeof thresholdFields)[number] =>
  // deno-lint-ignore no-explicit-any
  thresholdFields.includes(v as any);

export const defaultThreshold: Threshold = {
  field: "lod",
  value: 1,
};
