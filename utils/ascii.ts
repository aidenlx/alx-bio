// deno-lint-ignore no-control-regex
export const nonAscii = /[^\x00-\x7F]/;

import { pinyin } from "https://esm.sh/pinyin@3.0.0-alpha.5/esm/pinyin-web.js";

export function handleNonAscii(id: string) {
  const charList = [...id];
  const chs = charList
    .map((v, i) => [v, i] as const)
    .filter(([v]) => nonAscii.test(v));
  const chsString = chs.map(([v]) => v).join("");
  const firstLetters = new Map(
    pinyin(chsString).map(
      ([pinyin], i) => [chs[i][1], pinyin ? pinyin[0] : "_"] as const
    )
  );
  return charList
    .map((char, i) => (firstLetters.has(i) ? firstLetters.get(i) : char))
    .join("")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function numToFixedLength<T>(num: number, array: T[]) {
  const length = Math.ceil(Math.log10(array.length));
  return num.toString().padStart(length, "0"); // convert to string and pad with zeros
}
