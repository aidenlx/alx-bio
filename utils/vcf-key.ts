const vaildINFOKeyPattern = /^([A-Za-z ][0-9A-Za-z .]*|1000G)$/;
const leadingPattern = /^[A-Za-z ]/;
export function normalizeVcfKey(key: string) {
  if (vaildINFOKeyPattern.test(key)) return key;
  let leading = key[0];
  const rest = key.slice(1);
  if (!leadingPattern.test(leading)) {
    leading = "_" + leading;
  }
  return leading + rest.replace(/[^0-9A-Za-z .]/g, "_");
}
