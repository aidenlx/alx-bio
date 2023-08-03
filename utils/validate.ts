import { type, existsSync, ArgumentValue, ValidationError } from "@/deps.ts";

export const positiveInt = type(["integer", "=>", (n) => n > 0]);

export const validBedPath = type([
  "string",
  "=>",
  (path) => path.endsWith(".bed") && existsSync(path),
]);

export function positiveIntType({ value }: ArgumentValue) {
  const num = +value;
  if (!positiveInt.allows(num)) return num;
  throw new ValidationError(`value should be a positive integer: ${num}`);
}
