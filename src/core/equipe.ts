import { reglages } from './reglages';
import type { DonneesRegion, PokemonPossede } from './sauvegarde-types';
import { cleStock, facteurObjetTenuDe } from './objets-tenus';
import { calculerDps } from './stats';

export type ResultatEquipe =
  | { ok: true; region: DonneesRegion; echangeRequis?: true }
  | { ok: false; raison: string };

const dernier = "C'est ton dernier Pokémon : garde-le dans l'équipe.";
const actif = "Il faut au moins 1 Pokémon actif dans l'équipe.";
const absent = { ok: false, raison: 'Ce Pokémon est introuvable.' } as const;
const refusFavori = (pokemon: PokemonPossede) => pokemon.favori
  ? { ok: false, raison: "Les favoris ne se relâchent pas : retire d'abord le favori." } as const : undefined;

function listeDuPokemon(region: DonneesRegion, uid: string) {
  return (['equipe', 'pc'] as const).find((liste) => region[liste].some((p) => p.uid === uid));
}

function modifier(region: DonneesRegion, uid: string, changement: Partial<PokemonPossede>): ResultatEquipe {
  const liste = listeDuPokemon(region, uid);
  if (!liste) return absent;
  return {
    ok: true,
    region: { ...region, [liste]: region[liste].map((p) => p.uid === uid ? { ...p, ...changement } : p) },
  };
}

function dernierActif(region: DonneesRegion, pokemon: PokemonPossede) {
  return !pokemon.oeuf && region.equipe.filter((p) => !p.oeuf).length <= 1;
}

export function renommer(region: DonneesRegion, uid: string, texte: string): ResultatEquipe {
  const surnom = texte.trim();
  if (!surnom || surnom.length > reglages.equipe.surnomMax) {
    return { ok: false, raison: `Entre un nom de 1 à ${reglages.equipe.surnomMax} caractères.` };
  }
  return modifier(region, uid, { surnom });
}

export function basculerFavori(region: DonneesRegion, uid: string): ResultatEquipe {
  const liste = listeDuPokemon(region, uid);
  if (!liste) return absent;
  const pokemon = region[liste].find((p) => p.uid === uid)!;
  return modifier(region, uid, { favori: !pokemon.favori });
}

export function relacher(region: DonneesRegion, uid: string): ResultatEquipe {
  const liste = listeDuPokemon(region, uid);
  if (!liste) return absent;
  const pokemon = region[liste].find((p) => p.uid === uid)!;
  const refus = refusFavori(pokemon);
  if (refus) return refus;
  if (liste === 'equipe') {
    if (region.equipe.length <= 1) return { ok: false, raison: dernier };
    if (dernierActif(region, pokemon)) return { ok: false, raison: actif };
  }
  return { ok: true, region: { ...region, [liste]: region[liste].filter((p) => p.uid !== uid) } };
}

export function relacherPokemon(region: DonneesRegion, uid: string): ResultatEquipe {
  const resultat = relacher(region, uid);
  if (!resultat.ok) return resultat;
  const liste = listeDuPokemon(region, uid)!;
  const pokemon = region[liste].find(p => p.uid === uid);
  // Les objets tenus retournent dans l'inventaire : relâcher ne fait rien perdre.
  const rendus: Record<string, number> = {};
  if (pokemon?.pierreEternelle) rendus.everstone = 1;
  if (pokemon?.objetTenu) rendus[cleStock(pokemon.objetTenu)] = 1;
  if (!Object.keys(rendus).length) return resultat;
  return { ok: true, region: { ...resultat.region, inventaire: ajouter(region.inventaire, rendus) } };
}

export function relacherLot(region: DonneesRegion, uids: readonly string[]): ResultatEquipe {
  const uniques = new Set(uids);
  if (!uniques.size) return { ok: false, raison: 'Aucun Pokémon sélectionné.' };
  const selection = region.pc.filter(p => uniques.has(p.uid));
  if (selection.length !== uniques.size) return absent;
  for (const pokemon of selection) {
    const refus = refusFavori(pokemon);
    if (refus) return refus;
  }
  const rendus: Record<string, number> = {};
  for (const p of selection) {
    if (p.pierreEternelle === true) rendus.everstone = (rendus.everstone ?? 0) + 1;
    if (p.objetTenu) rendus[cleStock(p.objetTenu)] = (rendus[cleStock(p.objetTenu)] ?? 0) + 1;
  }
  return { ok: true, region: { ...region, pc: region.pc.filter(p => !uniques.has(p.uid)),
    inventaire: ajouter(region.inventaire, rendus) } };
}

const ajouter = (inventaire: DonneesRegion['inventaire'], ajout: Record<string, number>): DonneesRegion['inventaire'] =>
  Object.keys(ajout).length ? Object.fromEntries([...Object.entries(inventaire),
    ...Object.entries(ajout).map(([cle, n]) => [cle, (inventaire[cle] ?? 0) + n] as const)]) : inventaire;

export function envoyerAuPc(region: DonneesRegion, uid: string): ResultatEquipe {
  const pokemon = region.equipe.find((p) => p.uid === uid);
  if (!pokemon) return absent;
  if (region.equipe.length <= 1) return { ok: false, raison: dernier };
  if (dernierActif(region, pokemon)) return { ok: false, raison: actif };
  return {
    ok: true,
    region: { ...region, equipe: region.equipe.filter((p) => p.uid !== uid), pc: [...region.pc, pokemon] },
  };
}

export function placerDansEquipe(region: DonneesRegion, uidPc: string): ResultatEquipe {
  const pokemon = region.pc.find((p) => p.uid === uidPc);
  if (!pokemon) return absent;
  if (region.equipe.length >= reglages.equipe.taille) return { ok: true, echangeRequis: true, region };
  return {
    ok: true,
    region: { ...region, equipe: [...region.equipe, pokemon], pc: region.pc.filter((p) => p.uid !== uidPc) },
  };
}

export function echanger(region: DonneesRegion, uidPc: string, uidEquipe: string): ResultatEquipe {
  const entrant = region.pc.find((p) => p.uid === uidPc);
  const sortant = region.equipe.find((p) => p.uid === uidEquipe);
  if (!entrant || !sortant) return absent;
  if (entrant.oeuf && dernierActif(region, sortant)) return { ok: false, raison: actif };
  return {
    ok: true,
    region: {
      ...region,
      equipe: region.equipe.map((p) => p.uid === uidEquipe ? entrant : p),
      pc: region.pc.map((p) => p.uid === uidPc ? sortant : p),
    },
  };
}

export function detailDps(pokemon: PokemonPossede, multiplicateurType: number) {
  const bonus = reglages.degats;
  return {
    base: calculerDps({ numero: pokemon.numero, niveau: pokemon.niveau }),
    multiplicateurType,
    shiny: pokemon.shiny ? bonus.shiny : 1,
    bonheur: 1 + pokemon.bonheur * bonus.bonheurParPoint,
    pierreEternelle: pokemon.pierreEternelle ? bonus.pierreEternelle : 1,
    calcium: 1 + pokemon.calcium * bonus.calciumParBoost,
    marqueEclosion: 1 + (pokemon.marqueEclosion ? reglages.pension.marqueEclosion : 0),
    objetTenu: facteurObjetTenuDe(pokemon),
  };
}
