const chrom = [...Array.from({ length: 23 }, (_, i) => `${i + 1}`), "X", "Y"];

export default function getChrList(prefix = false) {
  if (prefix) return chrom.map((chr) => `chr${chr}`);

  return chrom;
}
