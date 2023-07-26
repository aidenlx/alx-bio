import { exists, path } from "@/deps.ts";

export async function checkDone(output: string) {
  const doneFile = path.resolve(noDupDot(`${output}.done`));
  if (await exists(doneFile)) {
    console.debug(`skipping, found ${doneFile}`);
    return {
      done: true,
      finish: () => void 0,
    };
  }
  console.debug(`continue, not found ${doneFile}`);
  return {
    done: false,
    finish: () => Deno.writeFile(doneFile, new Uint8Array()),
  };
}

function noDupDot(input: string) {
  return input.split(".").filter(Boolean).join(".");
}
