// deno-lint-ignore-file no-explicit-any
import type { Command } from "@/deps.ts";

export default function cmd<
  T extends Command<any, any, any, any, any, any, any, any>
>(cmd: T) {
  return [cmd.getName(), cmd] as const;
}
