import { assert } from "https://deno.land/std@0.192.0/_util/asserts.ts";

function parsePos(input: string) {
  input = input.replaceAll(",", "");
  if(Number.isInteger(+input) && +input > 0) {
    return +input;
  } else {
    return NaN;
  }
}
export function parseSegmentQuery(query: string) {
  const [chr, _range] = query.split(":");
  const range = _range?.replaceAll(",", "");
  assert(range, `No range provided in query: ${query}`);
  switch(range.split("-").length) {
    case 2: {
      const [start, _end] = range.split("-");
      const [end, offset] = _end.split("^");
      return toRange(chr, start, end, offset);
    }
    case 1: {
      const [pos, offset] = range.split("^");
      if(offset) {
        return toRange(chr, pos, pos, offset);
      } else {
        return toRange(chr, pos, pos, "1000");
      }
    }
    default:
      throw new Error(`Invalid range: ${range}`);
  }
}
function toRange(chr: string, _start: string, _end: string, _offset: string) {
  let start = parsePos(_start), end = parsePos(_end);
  const offset = _offset ? parsePos(_offset) : 0;
  assert(
    [start, end, offset].every((x) => !Number.isNaN(x)),
    `Invalid range, must be in format: (pos)-(pos)[^offset]`
  );
  if(start < end) {
    console.warn(`Range start < end, swapping`);
    [start, end] = [end, start];
  }
  start = start - offset >= 0 ? start - offset : 1;
  end = end + offset;
  return `${chr}:${start}-${end}`;
}
