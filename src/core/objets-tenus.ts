import donnees from '../../data/objets-tenus.json';
import type { ResultatEquipe } from './equipe';
import { chargerPokemon } from './pokemon';
import type { DonneesRegion, PokemonPossede } from './sauvegarde-types';
import { reglages } from './reglages';
import { sansCle } from './sans-cle';

/** Objet tenu qui renforce les dégâts d'un Pokémon du même type (un par Pokémon, hors Pierre Stase). */
export type ObjetTenu = { id: string; nom: string; type: string };
type FichierObjetsTenus = { version: number; prix: number; bonus: number; objets: ObjetTenu[] };

export const cleStock = (id: string): string => `tenu-${id}`;

export function chargerObjetsTenus(fichier: FichierObjetsTenus = donnees): { prix: number; bonus: number; liste: readonly ObjetTenu[] } {
  const ids = new Set<string>();
  if (!Number.isInteger(fichier.version) || fichier.version <= 0 || !Number.isInteger(fichier.prix) || fichier.prix < 0
    || !Number.isFinite(fichier.bonus) || fichier.bonus < 0 || !Array.isArray(fichier.objets)) {
    throw new Error('Fichier des objets tenus invalide');
  }
  for (const objet of fichier.objets) {
    if (!objet.id || !objet.nom || !objet.type || ids.has(objet.id)) throw new Error(`Objet tenu invalide : ${objet.id}`);
    ids.add(objet.id);
  }
  return { prix: fichier.prix, bonus: fichier.bonus, liste: fichier.objets };
}

const objets = chargerObjetsTenus();
const catalogueParDefaut = chargerPokemon();
export const PRIX_OBJET_TENU = objets.prix;
export const BONUS_OBJET_TENU = objets.bonus;
export const OBJETS_TENUS: readonly ObjetTenu[] = objets.liste;

export const objetTenu = (id: string | undefined): ObjetTenu | undefined => OBJETS_TENUS.find(o => o.id === id);

/** Objets qui s'appliquent aux types donnés (ceux de l'espèce du Pokémon). */
export const objetsCompatibles = (types: readonly string[]): ObjetTenu[] => OBJETS_TENUS.filter(o => types.includes(o.type));

/** Facteur de dégâts : 1 + bonus seulement si l'objet est du type d'au moins un des types de l'espèce. Un id inconnu ne compte pas. */
export function facteurObjetTenu(id: string | undefined, types: readonly string[]): number {
  const objet = objetTenu(id);
  return objet && types.includes(objet.type) ? 1 + objets.bonus : 1;
}

export function facteurObjetTenuDe(pokemon: Pick<PokemonPossede, 'numero' | 'objetTenu'>, catalogue = catalogueParDefaut): number {
  return pokemon.objetTenu ? facteurObjetTenu(pokemon.objetTenu, catalogue.parNumero(pokemon.numero).types) : 1;
}

type Retour = ResultatEquipe & { message: string };
const refus = (raison: string): Retour => ({ ok: false, raison, message: raison });

const trouver = (region: DonneesRegion, uid: string) =>
  region.equipe.find(p => p.uid === uid) ?? region.pc.find(p => p.uid === uid);
const modifier = (region: DonneesRegion, uid: string, changer: (p: PokemonPossede) => PokemonPossede) => {
  const appliquer = (p: PokemonPossede) => p.uid === uid ? changer(p) : p;
  return { equipe: region.equipe.map(appliquer), pc: region.pc.map(appliquer) };
};

/** Donne l'objet pris dans le stock (l'achat se fait au Shop). Un seul objet par Pokémon, jamais avec la Pierre Stase. */
export function donnerObjetTenu(region: DonneesRegion, uid: string, id: string): Retour {
  const pokemon = trouver(region, uid);
  const objet = objetTenu(id);
  if (!pokemon || pokemon.oeuf) return refus('Pokémon invalide !');
  if (!objet) return refus('Objet inconnu !');
  if (pokemon.pierreEternelle) return refus('La Pierre Stase est déjà tenue !');
  if (pokemon.objetTenu) return refus('Retire d’abord l’objet tenu !');
  if (!catalogueParDefaut.parNumero(pokemon.numero).types.includes(objet.type)) return refus('Pokémon incompatible !');
  const stock = region.inventaire[cleStock(id)] ?? 0;
  if (stock <= 0) return refus('Tu n’as pas cet objet : achète-le au Shop.');
  return {
    ok: true, message: `${objet.nom} équipé !`,
    region: {
      ...region,
      inventaire: { ...region.inventaire, [cleStock(id)]: stock - 1 },
      ...modifier(region, uid, p => ({ ...p, objetTenu: id })),
    },
  };
}

/** Achat au Shop : au prix du fichier, sans inflation ni remise, dans le stock. */
export function acheterObjetTenu(region: DonneesRegion, id: string, quantite: number): Retour {
  const objet = objetTenu(id);
  if (!objet) return refus('Objet inconnu !');
  if (!Number.isInteger(quantite) || quantite < 1 || quantite > reglages.boutique.quantiteMax) return refus('Quantité invalide.');
  const cout = objets.prix * quantite;
  if (region.argent < cout) return refus('Pas assez d’argent !');
  return {
    ok: true, message: `${objet.nom} ×${quantite} acheté.`,
    region: { ...region, argent: region.argent - cout,
      inventaire: { ...region.inventaire, [cleStock(id)]: (region.inventaire[cleStock(id)] ?? 0) + quantite } },
  };
}

/** Retire l'objet : il retourne dans l'inventaire, rien n'est perdu ni remboursé. */
export function retirerObjetTenu(region: DonneesRegion, uid: string): Retour {
  const pokemon = trouver(region, uid);
  if (!pokemon) return refus('Pokémon invalide !');
  if (!pokemon.objetTenu) return refus('Aucun objet à retirer !');
  const cle = cleStock(pokemon.objetTenu);
  return {
    ok: true, message: 'Objet retiré !',
    region: {
      ...region,
      inventaire: { ...region.inventaire, [cle]: (region.inventaire[cle] ?? 0) + 1 },
      ...modifier(region, uid, (pokemon) => sansCle(pokemon, 'objetTenu')),
    },
  };
}
