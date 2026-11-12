import { chargerPokemon } from '../core/pokemon';
import { reglages } from '../core/reglages';
import type { DonneesRegion, PokemonPossede } from '../core/sauvegarde';
import { registreSucces } from '../core/succes';

const catalogue = chargerPokemon();

/** Une éclosion à mettre en scène : tout ce que la fenêtre d'éclosion affiche, calculé au moment de la naissance. */
export type EclosionAffichee = {
  uid: string; numero: number; nom: string; shiny: boolean; sexe: PokemonPossede['sexe'];
  niveau: number; bonheur: number;
  /** Bonus de la marque d'éclosion en pourcentage de dégâts (5), lu dans `data/reglages.json`. */
  marquePourcent: number;
  /** Espèce jamais éclose avant celle-ci : elle entre dans la collection. */
  nouvelleEspece: boolean;
  /** Espèces écloses une fois cette éclosion comptée (x/151). */
  especesEcloses: number;
  /** Paliers de la collection (succès de la mesure `eclosions`) franchis par cette éclosion. */
  paliersGagnes: { id: string; nom: string; seuil: number; diamants: number }[];
};

const ecouteursPremiereEntree = new Set<() => void>();
/**
 * Crochet unique de la première entrée dans la pension, pour le mini-tuto (ticket E) : `surPremiereEntreePension(() => ouvrirTuto())`.
 * Appelé une seule fois par partie, quand le joueur entre dans la pension pour la première fois ; renvoie la fonction qui retire l'écouteur.
 */
export function surPremiereEntreePension(ecouteur: () => void): () => void {
  ecouteursPremiereEntree.add(ecouteur);
  return () => { ecouteursPremiereEntree.delete(ecouteur); };
}
export function signalerPremiereEntreePension(): void {
  for (const ecouteur of ecouteursPremiereEntree) {
    try { ecouteur(); } catch { /* un tuto en erreur ne doit pas gêner le jeu */ }
  }
}

/**
 * Prépare l'affichage des éclosions d'un combat gagné. `avant` : espèces écloses avant le combat ; `region` : la région après le combat
 * (le Pokémon éclos y est déjà, avec sa marque). Les éclosions d'un même combat se comptent dans l'ordre.
 */
export function construireEclosions(
  avant: readonly number[], region: Pick<DonneesRegion, 'equipe'>, eclosions: readonly { uid: string; numero: number }[],
): EclosionAffichee[] {
  const connues = new Set(avant);
  const paliers = registreSucces.filter(succes => succes.mesure === 'eclosions');
  const resultat: EclosionAffichee[] = [];
  for (const { uid, numero } of eclosions) {
    const pokemon = region.equipe.find(p => p.uid === uid);
    if (!pokemon) continue;
    const nombreAvant = connues.size;
    const nouvelleEspece = !connues.has(numero);
    connues.add(numero);
    resultat.push({
      uid, numero, nom: catalogue.parNumero(numero).nom, shiny: pokemon.shiny, sexe: pokemon.sexe,
      niveau: pokemon.niveau, bonheur: pokemon.bonheur,
      marquePourcent: Math.round(reglages.pension.marqueEclosion * 100),
      nouvelleEspece, especesEcloses: connues.size,
      paliersGagnes: paliers.filter(succes => nombreAvant < succes.seuil && connues.size >= succes.seuil)
        .map(({ id, nom, seuil, diamants }) => ({ id, nom, seuil, diamants })),
    });
  }
  return resultat;
}
