import { ArgumentValue, Type, ValidationError } from "../deps.ts";

export function assert(expr: unknown, msg = ""): asserts expr {
  if (expr) return;
  throw new ValidationError(msg);
}

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

export class RangeType extends Type<string> {
  complete(): string[] {
    return chrom;
  }

  parse({ value: query }: ArgumentValue): string {
    let [chr, range] = query.split(":");
    range = range?.replaceAll(",", "");

    assert(!!chr, `No chromosome provided in query: ${query}`);

    // IGV can handle chr-less ranges, but samtools can't,
    // detect from bam header in remote
    chr = chr.replace(/^chr/, "");
    // support variant syntax (chr1-123-A-T)
    if (!range && chr.match(/^[0-9XY]{1,2}-\d+-[A-Z]+-[A-Z]+$/)) {
      [chr, range] = chr.split("-");
    } else if (range?.match(/^\d+-[A-Z]+-[A-Z]+$/)) {
      [range] = range.split("-");
    }
    assert(range, `No range provided in query: ${query}`);
    switch (range.split("-").length) {
      case 2: {
        const [start, _end] = range.split("-");
        const [end, offset] = _end.split("^");
        return toRange(chr, start, end, offset);
      }
      case 1: {
        const [pos, offset] = range.split("^");
        if (offset) {
          return toRange(chr, pos, pos, offset);
        } else {
          return toRange(chr, pos, pos, "1000");
        }
      }
      default:
        throw new ValidationError(`Invalid range: ${range}`);
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
    `Invalid range, must be in format: (pos)-(pos)[^offset]`
  );
  if (start < end) {
    console.warn(`Range start < end, swapping`);
    [start, end] = [end, start];
  }
  start = start - offset >= 0 ? start - offset : 1;
  end = end + offset;
  return `${chr}:${start}-${end}`;
}
