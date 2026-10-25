import { verifierLancer } from '../core/capture';
import type { EtatCombat, EvenementCombat } from '../core/combat';
import { chargerPokemon } from '../core/pokemon';
import { reglages } from '../core/reglages';

export type AffichageCapture = {
  balles: { cle: string; nom: string; image: string; quantite: number }[];
  possible: boolean; raison: string | null; enCours: boolean;
};

export function conditionCapture(coeur: EtatCombat | null, inventaire: Record<string, number>, cle: string) {
  return verifierLancer({ ennemi: coeur?.ennemi ?? null, attenteMs: coeur?.attenteMs ?? 0,
    captureEnCours: coeur?.capture != null }, inventaire, cle);
}

export function afficherCapture(coeur: EtatCombat | null, inventaire: Record<string, number>, precedent: AffichageCapture): AffichageCapture {
  const balles = reglages.capture.balles.filter(b => (inventaire[b.cle] ?? 0) > 0)
    .map(({ cle, nom, image }) => ({ cle, nom, image, quantite: inventaire[cle]! }));
  const condition = conditionCapture(coeur, inventaire, balles[0]?.cle ?? '');
  const capture = { balles, possible: condition.ok, raison: condition.ok ? null : condition.raison ?? null,
    enCours: coeur?.capture != null };
  return JSON.stringify(capture) === JSON.stringify(precedent) ? precedent : capture;
}

const motifs = { shiny: 'Chromatique en vue', nouveau: 'Nouveau Pokémon', commun: 'Commun en vue',
  'peu-commun': 'Peu commun en vue', rare: 'Rare en vue', 'tres-rare': 'Très rare en vue', legendaire: 'Légendaire en vue' };
export function annonceCapture(evenement: EvenementCombat, numero: number): string | null {
  if (evenement.type === 'arret-auto') return `${motifs[evenement.motif]} ! Auto-attaque arrêtée.`;
  if (evenement.type === 'reprise-auto') return 'Auto-attaque reprise.';
  if (evenement.type === 'capture-reussie') return `${chargerPokemon().parNumero(evenement.numero).nom} est capturé !`;
  if (evenement.type === 'capture-echouee') return `${chargerPokemon().parNumero(numero).nom} s'est échappé !`;
  return null;
}
