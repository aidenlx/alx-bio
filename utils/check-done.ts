import { D, exists, path, type } from "@/deps.ts";

async function checkDoneV1(output: string) {
  const doneFile = path.resolve(noTrailingDots(`${output}.done`));
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

export function noTrailingDots(input: string) {
  return input.replace(/\.+$/, "");
}

const date = type("parsedDate");
const object = type("object");

function parseMtimeDone(data: string) {
  try {
    if (!data) return null;
    const map = JSON.parse(data) as unknown;
    if (!object.allows(map) || Object.values(map).some((v) => !date.allows(v)))
      return null;
    return D.map(map, (v) => new Date(v)) as Record<string, Date>;
  } catch (error) {
    console.warn("Failed to parse mtime done: " + error.message, data);
    return null;
  }
}

export async function checkDone(
  name: string,
  _input: string | string[],
  v1Output: string | true = true
) {
  const doneFile = path.resolve(noTrailingDots(`${name}.done`));
  const done = {
    done: true,
    finish: () => Promise.resolve(),
  };
  const inputs = Array.isArray(_input) ? _input : [_input];

  const mtimeDoneFile = await Deno.readTextFile(doneFile).catch((err) => {
    if (err instanceof Deno.errors.NotFound) return null;
    throw err;
  });
  if (mtimeDoneFile === null) {
    if (v1Output) {
      const result = await checkDoneV1(v1Output === true ? name : v1Output);
      if (result.done) return done;
    }
    console.debug(`continue, done file not found: ${doneFile}`);
  } else {
    const mtimeDone = parseMtimeDone(mtimeDoneFile);
    // if parse failed or from previous version, assume done
    if (mtimeDone === null) return done;

    const results = await Promise.all(
      inputs.map(async (inputPath) => {
        const stat = await Deno.stat(inputPath).catch((err) => {
          if (err instanceof Deno.errors.NotFound) return null;
          throw err;
        });
        if (!stat) {
          console.log(`${inputPath} not found, assume done`);
          return true;
        }
        const prevMtime =
          mtimeDone[path.resolve(inputPath)] ?? mtimeDone[inputPath];
        if (!prevMtime) {
          console.log(`mtimeDone[${inputPath}] not found, assume not done`);
          return false;
        }
        if (!stat.mtime) throw new Error(`Cannot get mtime of ${name}`);
        return stat.mtime.getTime() <= prevMtime.getTime();
      })
    );
    if (results.every((v) => v)) {
      return done;
    } else {
      results.forEach((v, i) => v || console.log(`${inputs[i]} not done`));
    }
  }

  return {
    done: false,
    finish: async () => {
      const stats = await Promise.all(
        inputs.map(async (inputPath) => {
          inputPath = path.resolve(inputPath);
          const { mtime } = await Deno.stat(inputPath);
          if (!mtime) {
            throw new Error(`Cannot get mtime of ${name}`);
          }
          return [inputPath, mtime.toISOString()] as const;
        })
      );

      await Deno.writeTextFile(
        doneFile,
        JSON.stringify(Object.fromEntries(stats))
      );
    },
  };
}
