import { ArgumentValue, Type, ValidationError } from "../deps.ts";

export function assert(expr: unknown, msg = ""): asserts expr {
  if (expr) return;
  throw new ValidationError(msg);
}

export const defaultOffset = "100";

export function portType({ value }: ArgumentValue) {
  const port = +value;
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new ValidationError("Invalid port: " + port);
  }
  return port;
}

// chr1 to chrY
const chrom = [
  ...Array.from({ length: 23 }, (_, i) => `${i + 1}`),
  "X",
  "Y",
].map((v) => `chr${v}:`);

export class RegionType extends Type<string> {
  complete(): string[] {
    return chrom;
  }

  parse({ value: query }: Pick<ArgumentValue, "value">): string {
    let [chr, region] = query.split(":");
    region = region?.replaceAll(",", "");

    assert(!!chr, `No chromosome provided in query: ${query}`);

    // IGV can handle chr-less regions, but samtools can't,
    // detect from bam header in remote
    chr = chr.replace(/^chr/, "");
    // support variant syntax (chr1-123-A-T)
    if (!region && chr.match(/^[0-9XY]{1,2}-\d+-[A-Z]+-[A-Z]+$/)) {
      [chr, region] = chr.split("-");
    } else if (region?.match(/^\d+-[A-Z]+-[A-Z]+$/)) {
      [region] = region.split("-");
    }
    assert(region, `No region provided in query: ${query}`);
    switch (region.split("-").length) {
      case 2: {
        const [start, _end] = region.split("-");
        const [end, offset] = _end.split("^");
        return toRange(chr, start, end, offset);
      }
      case 1: {
        const [pos, offset] = region.split("^");
        if (offset) {
          return toRange(chr, pos, pos, offset);
        } else {
          return toRange(chr, pos, pos, defaultOffset);
        }
      }
      default:
        throw new ValidationError(`Invalid region: ${region}`);
    }
  }
}

function parsePos(input: string) {
  input = input.replaceAll(",", "");
  if (Number.isInteger(+input) && +input > 0) {
    return +input;
  } else {
    return NaN;
  }
}

function toRange(chr: string, _start: string, _end: string, _offset: string) {
  let start = parsePos(_start),
    end = parsePos(_end);
  const offset = _offset ? parsePos(_offset) : 0;
  assert(
    [start, end, offset].every((x) => !Number.isNaN(x)),
    `Invalid region, must be in format: (pos)-(pos)[^offset]`
  );
  if (start < end) {
    console.warn(`Range start < end, swapping`);
    [start, end] = [end, start];
  }
  start = start - offset >= 0 ? start - offset : 1;
  end = end + offset;
  return `${chr}:${start}-${end}`;
}
