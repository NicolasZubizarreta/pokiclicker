/**
 * @typedef {{ source: string, destination: string }} Ressource
 * @typedef {{ hote: string, base: string, fixes: Ressource[], sprites: Ressource & { taille: number } }} Ressources
 * @typedef {{ url: string, destination: string }} Telechargement
 */

/**
 * Prépare les fichiers manquants sans accès réseau ni écriture.
 * @param {{ ressources: Ressources, numeros: number[], existe: (destination: string) => boolean }} options
 * @returns {Telechargement[]}
 */
export function planifier({ ressources, numeros, existe }) {
  const fichiers = [...ressources.fixes, ...numeros.map((numero) => ({
    source: ressources.sprites.source.replaceAll('{id}', String(numero)),
    destination: ressources.sprites.destination.replaceAll('{id}', String(numero)),
  }))];
  return fichiers.map(({ source, destination }) => {
    let url;
    try {
      url = new URL(source, ressources.base);
    } catch {
      throw new Error(`URL invalide : ${source}`);
    }
    if (url.protocol !== 'https:' || url.hostname !== ressources.hote) {
      throw new Error(`Hôte ou protocole interdit : ${url.href}`);
    }
    if (!destination || /(^[/\\])|(^[a-z]:)|(^|[/\\])\.\.([/\\]|$)/i.test(destination)) {
      throw new Error(`Destination interdite : ${destination}`);
    }
    return { url: url.href, destination };
  }).filter(({ destination }) => !existe(destination));
}

/**
 * Télécharge séquentiellement et conserve tous les refus pour le bilan final.
 * @param {{ plan: Telechargement[], fetch: (url: string) => Promise<{ ok: boolean, status: number, arrayBuffer: () => Promise<ArrayBuffer> }>, ecrire: (destination: string, octets: Uint8Array) => Promise<void>, mesurer: (octets: Uint8Array) => Promise<{ largeur: number | undefined, hauteur: number | undefined }>, tailleSprite: number }} options
 * @returns {Promise<void>}
 */
export async function telecharger({ plan, fetch, ecrire, mesurer, tailleSprite }) {
  const erreurs = [];
  for (const { url, destination } of plan) {
    try {
      const reponse = await fetch(url);
      if (!reponse.ok) throw new Error(`Réponse HTTP ${reponse.status} pour ${url}`);
      const octets = new Uint8Array(await reponse.arrayBuffer());
      const { largeur, hauteur } = await mesurer(octets);
      if (/^sprites[/\\]/.test(destination) && (largeur !== tailleSprite || hauteur !== tailleSprite)) {
        throw new Error(`Dimensions refusées pour ${destination} : ${largeur} × ${hauteur}, attendu ${tailleSprite} × ${tailleSprite}`);
      }
      await ecrire(destination, octets);
    } catch (erreur) {
      erreurs.push(new Error(`${destination} (${url}) : ${erreur instanceof Error ? erreur.message : String(erreur)}`));
    }
  }
  if (erreurs.length) {
    throw new AggregateError(erreurs, erreurs.map((erreur) => erreur.message).join('\n'));
  }
}
