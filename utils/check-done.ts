import { D, exists, path, type } from "@/deps.ts";

async function checkDoneV1(output: string) {
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

export function noDupDot(input: string) {
  return input.split(".").filter(Boolean).join(".");
}

const date = type("parsedDate");
const object = type("object");

function parseMtimeDone(data: string) {
  try {
    const map = JSON.parse(data) as unknown;
    if (!object.allows(map) || Object.values(map).some((v) => !date.allows(v)))
      return null;
    return D.map(map, (v) => new Date(v)) as Record<string, Date>;
  } catch (error) {
    console.error("Failed to parse mtime done: ", error);
    return null;
  }
}

export async function checkDone(
  name: string,
  _input: string | string[],
  v1Output: string | true = true
) {
  const doneFile = path.resolve(noDupDot(`${name}.done`));
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
      inputs.map(async (path) => {
        const stat = await Deno.stat(path).catch((err) => {
          if (err instanceof Deno.errors.NotFound) return null;
          throw err;
        });
        if (!stat) {
          console.log(`${path} not found, assume done`);
          return true;
        }
        if (!mtimeDone[path]) {
          console.log(`mtimeDone[${path}] not found, assume not done`);
          return false;
        }
        if (!stat.mtime) throw new Error(`Cannot get mtime of ${name}`);
        return stat.mtime.getTime() <= mtimeDone[path].getTime();
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
        inputs.map(async (path) => {
          const { mtime } = await Deno.stat(path);
          if (!mtime) {
            throw new Error(`Cannot get mtime of ${name}`);
          }
          return [path, mtime.toISOString()] as const;
        })
      );

      await Deno.writeTextFile(
        doneFile,
        JSON.stringify(Object.fromEntries(stats))
      );
    },
  };
}
