import { Pedigree } from "@/batch/ped.ts";

type PedigreeType = typeof Pedigree.infer;
// find all parents recursively using patId and matId, starting from individuals in relavantPed,
// all individuals in the pedigree is stored in fullPed,
// return a list of all individuals that are parents, grandparents, ...etc of individuals in relavantPed
export const findParents = (
  relavantPed: PedigreeType[],
  fullPed: PedigreeType[]
) => {
  const individuals = new Set<string>(relavantPed.map((v) => v.indId));
  const visited = new Set<string>();
  const findParentsRecursively = (ped: PedigreeType) => {
    if (visited.has(ped.indId)) {
      return;
    }
    visited.add(ped.indId);
    if (ped.patId) {
      individuals.add(ped.patId);
      const pat = fullPed.find((v) => v.indId === ped.patId);
      if (pat) findParentsRecursively(pat);
    }
    if (ped.matId) {
      individuals.add(ped.matId);
      const mat = fullPed.find((v) => v.indId === ped.matId);
      if (mat) findParentsRecursively(mat);
    }
  };
  relavantPed.forEach(findParentsRecursively);
  return fullPed.filter((v) => individuals.has(v.indId));
};
