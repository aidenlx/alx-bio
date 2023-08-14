import { type, existsSync, ArgumentValue, ValidationError } from "@/deps.ts";

export const validBedPath = type([
  "string",
  "=>",
  (path) => path.endsWith(".bed") && existsSync(path),
]);

export function PositiveInt({ value, name, label }: ArgumentValue) {
  const { data, problems } = type("integer>0")(+value);
  if (data !== undefined) return data;
  throw new ValidationError(`[${label}]: "${name}" ${problems}, got ${value}`);
}
export function NonNegativeInt({ value, name, label }: ArgumentValue) {
  const { data, problems } = type("integer>=0")(+value);
  if (data !== undefined) return data;
  throw new ValidationError(`[${label}]: "${name}" ${problems}, got ${value}`);
}
