import { pokedexDeKanto } from '../core/pokedex';
import { chargerPokemon } from '../core/pokemon';
import { chargerBadges, chargerJalons, prochainJalon } from '../core/progression';
import { kanto } from '../core/regions';
import { reglages } from '../core/reglages';
import type { DonneesRegion } from '../core/sauvegarde';

export type PhaseObtention = 'message' | 'boite' | 'claque' | 'fin';

export function phaseObtention(debutMs: number, tempsJeuMs: number): PhaseObtention {
  const duree = tempsJeuMs - debutMs;
  const { ouvertureMs, claqueDelaiMs, claqueMs } = reglages.badges;
  return duree < ouvertureMs ? 'message' : duree < ouvertureMs + claqueDelaiMs ? 'boite'
    : duree < ouvertureMs + claqueDelaiMs + claqueMs ? 'claque' : 'fin';
}

function progressionDe(region: Pick<DonneesRegion, 'badges' | 'jalonsRecus'>, pokedex: readonly number[]) {
  const { nombre, total } = pokedexDeKanto(pokedex, chargerPokemon());
  const prochain = prochainJalon(nombre);
  const badges = chargerBadges().map(badge => ({ id: badge.id, nom: badge.nom,
    description: badge.description, image: badge.image, arene: kanto.zone(badge.zone).nom,
    obtenu: region.badges.includes(badge.id) }));
  return { badges, obtenus: badges.filter(badge => badge.obtenu).length, total: badges.length,
    pokedex: { nombre, total },
    paliers: chargerJalons().map(jalon => ({ palier: jalon.palier, titre: jalon.titre,
      description: jalon.description, recu: region.jalonsRecus.includes(jalon.palier) })),
    prochain: prochain ? { palier: prochain.jalon.palier, titre: prochain.jalon.titre,
      restantes: prochain.restantes } : null };
}

export type AffichageProgression = ReturnType<typeof progressionDe>;
let precedent: AffichageProgression | undefined;
let clePrecedente: string | undefined;

export function afficherProgression(region: Pick<DonneesRegion, 'badges' | 'jalonsRecus'>,
  pokedex: readonly number[]): AffichageProgression {
  const progression = progressionDe(region, pokedex);
  const cle = JSON.stringify(progression);
  if (cle === clePrecedente) return precedent!;
  clePrecedente = cle;
  precedent = progression;
  return progression;
}
