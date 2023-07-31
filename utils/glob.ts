import {
  type WalkOptions,
  walk,
  WalkEntry,
} from "https://deno.land/std@0.194.0/fs/walk.ts";
import {
  globToRegExp,
  type GlobOptions,
} from "https://deno.land/std@0.194.0/path/mod.ts";

export default async function glob(
  pattern: string,
  {
    extended,
    globstar,
    caseInsensitive,
    os,
    ...walkOptions
  }: GlobOptions & WalkOptions = {}
) {
  const matches: WalkEntry[] = [];
  for await (const entry of walk(".", {
    ...walkOptions,
    match: [
      globToRegExp(pattern, {
        extended,
        globstar,
        caseInsensitive,
        os,
      }),
    ],
  })) {
    matches.push(entry);
  }
  return matches;
}
