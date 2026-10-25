/** Mulberry32 : même graine, même suite de tirages.
 * @param {number} valeur */
export function graine(valeur) {
  let etat = valeur >>> 0;
  return () => {
    etat = (etat + 0x6D2B79F5) >>> 0;
    let n = Math.imul(etat ^ (etat >>> 15), 1 | etat);
    n ^= n + Math.imul(n ^ (n >>> 7), 61 | n);
    return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
  };
}
