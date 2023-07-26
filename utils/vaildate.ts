import { type, existsSync } from "@/deps.ts";

export const positiveInt = type(["integer", "=>", (n) => n > 0]);

export const vaildBedPath = type([
  "string",
  "=>",
  (path) => path.endsWith(".bed") && existsSync(path),
]);
