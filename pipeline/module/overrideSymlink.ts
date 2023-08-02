import { assert } from "@/modules/parse.ts";

export async function overrideSymlink(...outputs: string[]) {
  await Promise.all(
    outputs.map(async (output) => {
      if(!(await Deno.lstat(output)
        .then((s) => s.isSymlink)
        .catch((e) => assert(e instanceof Deno.errors.NotFound))))
        return;
      await Deno.remove(output);
    })
  );
}
