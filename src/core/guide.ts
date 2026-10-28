import donnees from '../../data/guide.json';
import defi from '../../data/defi-chen.json';
import ligue from '../../data/ligue.json';
import objets from '../../data/objets.json';
import pokemon from '../../data/pokemon.json';
import zonesKanto from '../../data/regions/kanto/zones.json';
import { reglages } from './reglages';

export type SectionGuide = { id: string; titre: string; paragraphes: string[] };
export type FichierGuide = { version: number; titre: string; sections: SectionGuide[] };

type SourcesGuide = {
  /** Fichiers lus par les marqueurs « chemin » (`reglages.combat.etapeBoss`, `ligue.combats`…). */
  fichiers: Record<string, unknown>;
  objets: readonly { id: string; zone: string | null }[];
  zones: readonly { id: string; ancienId?: number; liens?: readonly { vers: string }[] }[];
  lieux: readonly { lieu: string; si?: { zone: string } }[];
};

export const sourcesParDefaut: SourcesGuide = {
  fichiers: { reglages, ligue, defi, pokemon },
  objets,
  zones: zonesKanto.zones,
  lieux: zonesKanto.lieux,
};

const format = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 });

function lire(sources: SourcesGuide, chemin: string): unknown {
  let valeur: unknown = sources.fichiers;
  for (const cle of chemin.split('.')) {
    if (valeur === null || typeof valeur !== 'object' || !(cle in valeur)) {
      throw new Error(`Guide : la donnée « ${chemin} » n'existe pas.`);
    }
    valeur = (valeur as Record<string, unknown>)[cle];
  }
  return valeur;
}

function nombre(sources: SourcesGuide, chemin: string): number {
  const valeur = lire(sources, chemin);
  if (typeof valeur !== 'number' || !Number.isFinite(valeur)) {
    throw new Error(`Guide : « ${chemin} » n'est pas un nombre.`);
  }
  return valeur;
}

/** Numéro de zone tel que le joueur le voit (Carte et V1 : `ancienId`). */
function numeroDeZone(sources: SourcesGuide, id: string): number {
  const zone = sources.zones.find(candidate => candidate.id === id);
  if (zone?.ancienId === undefined) throw new Error(`Guide : la zone « ${id} » n'a pas de numéro.`);
  return zone.ancienId;
}

function zoneDeLObjet(sources: SourcesGuide, id: string): number {
  const objet = sources.objets.find(candidate => candidate.id === id);
  if (!objet?.zone) throw new Error(`Guide : l'objet « ${id} » n'a pas de zone d'ouverture.`);
  return numeroDeZone(sources, objet.zone);
}

/** Un lieu s'ouvre quand le boss de sa zone est battu : on cite la zone qui s'ouvre alors (la première suite). */
function zoneDuLieu(sources: SourcesGuide, id: string): number {
  const lieu = sources.lieux.find(candidate => candidate.lieu === id);
  const zone = lieu?.si && sources.zones.find(candidate => candidate.id === lieu.si!.zone);
  const suite = zone?.liens?.[0]?.vers;
  if (!suite) throw new Error(`Guide : le lieu « ${id} » n'a pas de zone d'ouverture.`);
  return numeroDeZone(sources, suite);
}

const marqueur = /\{([a-zA-Z0-9]+):([^{}]+)\}/g;

/** Remplace chaque `{genre:cible}` par la valeur lue dans les données du jeu. */
export function remplirMarqueurs(texte: string, sources: SourcesGuide = sourcesParDefaut): string {
  return texte.replace(marqueur, (_, genre: string, cible: string) => {
    switch (genre) {
      case 'nombre': return format.format(nombre(sources, cible));
      case 'moins1': return format.format(nombre(sources, cible) - 1);
      case 'secondes': return format.format(nombre(sources, cible) / 1000);
      case 'pourcent': return format.format(Math.round(nombre(sources, cible) * 10000) / 100);
      case 'surplus': return format.format(Math.round((nombre(sources, cible) - 1) * 10000) / 100);
      case 'compte': {
        const liste = lire(sources, cible);
        if (!Array.isArray(liste)) throw new Error(`Guide : « ${cible} » n'est pas une liste.`);
        return String(liste.length);
      }
      case 'zoneObjet': return String(zoneDeLObjet(sources, cible));
      case 'zoneLieu': return String(zoneDuLieu(sources, cible));
      case 'zoneReglage': {
        const id = lire(sources, cible);
        if (typeof id !== 'string') throw new Error(`Guide : « ${cible} » n'est pas une zone.`);
        return String(numeroDeZone(sources, id));
      }
      default: throw new Error(`Guide : marqueur « ${genre} » inconnu.`);
    }
  });
}

export function chargerGuide(fichier: unknown = donnees, sources: SourcesGuide = sourcesParDefaut): FichierGuide {
  function verifier(ok: unknown, raison: string): asserts ok {
    if (!ok) throw new Error(`Guide invalide : ${raison}`);
  }
  verifier(fichier && typeof fichier === 'object', 'fichier attendu.');
  const guide = fichier as FichierGuide;
  verifier(guide.version === 1, 'version inconnue.');
  verifier(typeof guide.titre === 'string' && guide.titre.trim(), 'titre attendu.');
  verifier(Array.isArray(guide.sections) && guide.sections.length > 0, 'sections attendues.');
  const ids = new Set<string>();
  for (const section of guide.sections) {
    verifier(section && typeof section.id === 'string' && !ids.has(section.id), 'identifiant de section absent ou en double.');
    ids.add(section.id);
    verifier(typeof section.titre === 'string' && section.titre.trim(), `titre absent (${section.id}).`);
    verifier(Array.isArray(section.paragraphes) && section.paragraphes.length > 0
      && section.paragraphes.every(texte => typeof texte === 'string' && texte.trim()), `paragraphes absents (${section.id}).`);
  }
  return {
    ...guide,
    sections: guide.sections.map(section => ({
      ...section,
      paragraphes: section.paragraphes.map(texte => remplirMarqueurs(texte, sources)),
    })),
  };
}

export const guide = chargerGuide();
