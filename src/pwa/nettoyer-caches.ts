/** Supprime les caches d'images lourdes des versions précédentes (leur nom change quand les images changent). */
export async function nettoyerCachesImages(courant: string, stockage: Pick<CacheStorage, 'keys' | 'delete'> | undefined = globalThis.caches): Promise<string[]> {
  if (!stockage) return [];
  const supprimes = (await stockage.keys()).filter(nom => nom.startsWith('images-lourdes') && nom !== courant);
  await Promise.all(supprimes.map(nom => stockage.delete(nom)));
  return supprimes;
}
