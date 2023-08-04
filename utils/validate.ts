import { type, existsSync, ArgumentValue, ValidationError } from "@/deps.ts";

export const positiveIntStr = type(["parsedInteger", "=>", (n) => +n > 0]);

export const validBedPath = type([
  "string",
  "=>",
  (path) => path.endsWith(".bed") && existsSync(path),
]);

export function positiveIntType({ value }: ArgumentValue) {
  const { data, problems } = positiveIntStr(value);
  if (data !== undefined) return +data;
  throw new ValidationError(
    `value should be a positive integer: ${value}: ${problems}`
  );
}
