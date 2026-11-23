/** Copie de l'objet sans la clé donnée (retire un champ facultatif d'une région ou d'un compte). */
export function sansCle<T extends object, K extends keyof T>(objet: T, cle: K): Omit<T, K> {
  const copie = { ...objet };
  delete copie[cle];
  return copie;
}
