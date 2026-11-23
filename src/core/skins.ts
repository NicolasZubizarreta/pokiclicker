import donnees from '../../data/skins.json';
import type { DonneesCompte } from './sauvegarde-types';

/**
 * Boutique de skins (ticket F, F-j2-02) : cosmétiques payés en diamants du compte, aucun effet sur le jeu.
 * Le catalogue est dans `data/skins.json` ; chaque skin donne la variable de couleur du design (`jeton`) que l'interface applique.
 */
export type CategorieSkin = { id: string; nom: string; ou: string };
export type DefinitionSkin = { id: string; categorie: string; nom: string; description: string; prix: number; jeton: string };
export type FichierSkins = { version: 1; categories: CategorieSkin[]; skins: DefinitionSkin[] };

const texteNonVide = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;

export function chargerSkins(fichier: unknown): FichierSkins {
  const f = fichier as FichierSkins | null;
  const ok = !!f && f.version === 1 && Array.isArray(f.categories) && f.categories.length > 0 && Array.isArray(f.skins) && f.skins.length > 0
    && f.categories.every(c => texteNonVide(c.id) && texteNonVide(c.nom) && texteNonVide(c.ou))
    && new Set(f.categories.map(c => c.id)).size === f.categories.length
    && f.skins.every(s => texteNonVide(s.id) && !s.id.includes(':') && texteNonVide(s.nom) && texteNonVide(s.description)
      && Number.isInteger(s.prix) && s.prix > 0 && texteNonVide(s.jeton) && s.jeton.startsWith('--')
      && f.categories.some(c => c.id === s.categorie))
    && new Set(f.skins.map(s => s.id)).size === f.skins.length;
  if (!ok) throw new Error('Catalogue de skins invalide.');
  return structuredClone(f);
}

const catalogue = chargerSkins(donnees);
export const CATEGORIES_SKINS = catalogue.categories;
export const SKINS = catalogue.skins;
export const skinParId = (id: string): DefinitionSkin | undefined => SKINS.find(s => s.id === id);

/** Les skins équipés qui existent encore, appartiennent au compte et vont à leur catégorie : le reste est ignoré. */
export function skinsEquipes(compte: Pick<DonneesCompte, 'skins' | 'skinsEquipes'>): Record<string, DefinitionSkin> {
  const resultat: Record<string, DefinitionSkin> = {};
  for (const [categorie, id] of Object.entries(compte.skinsEquipes ?? {})) {
    const skin = typeof id === 'string' ? skinParId(id) : undefined;
    if (skin && skin.categorie === categorie && compte.skins.includes(id)) resultat[categorie] = skin;
  }
  return resultat;
}

export type ResultatSkin = { ok: true; compte: DonneesCompte } | { ok: false; raison: string };

/** Achète un skin : les diamants baissent du prix, le skin est équipé tout de suite si sa catégorie était vide. */
export function acheterSkin(compte: DonneesCompte, id: string): ResultatSkin {
  const skin = skinParId(id);
  if (!skin) return { ok: false, raison: 'Ce skin n’existe pas.' };
  if (compte.skins.includes(id)) return { ok: false, raison: 'Tu as déjà ce skin.' };
  if (compte.diamants < skin.prix) return { ok: false, raison: `Il te manque ${skin.prix - compte.diamants} diamants.` };
  const equipes = compte.skinsEquipes ?? {};
  return { ok: true, compte: { ...compte, diamants: compte.diamants - skin.prix, skins: [...compte.skins, id],
    skinsEquipes: equipes[skin.categorie] ? equipes : { ...equipes, [skin.categorie]: id } } };
}

/** Équipe un skin possédé dans sa catégorie, ou retire celui de la catégorie quand `id` est null. */
export function equiperSkin(compte: DonneesCompte, categorie: string, id: string | null): ResultatSkin {
  if (!CATEGORIES_SKINS.some(c => c.id === categorie)) return { ok: false, raison: 'Catégorie inconnue.' };
  const equipes = { ...(compte.skinsEquipes ?? {}) };
  if (id === null) delete equipes[categorie];
  else {
    const skin = skinParId(id);
    if (!skin || skin.categorie !== categorie) return { ok: false, raison: 'Ce skin ne va pas dans cette catégorie.' };
    if (!compte.skins.includes(id)) return { ok: false, raison: 'Tu n’as pas ce skin.' };
    equipes[categorie] = id;
  }
  const { skinsEquipes: _anciens, ...reste } = compte;
  return { ok: true, compte: Object.keys(equipes).length ? { ...reste, skinsEquipes: equipes } : reste };
}
