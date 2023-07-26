// https://stackoverflow.com/a/1917041/1293256
export default function sharedStart(...strings: string[]) {
  const A = strings.concat().sort(),
    a1 = A[0],
    a2 = A[A.length - 1],
    L = a1.length;
  let i = 0;
  while (i < L && a1.charAt(i) === a2.charAt(i)) i++;
  return a1.substring(0, i);
}
