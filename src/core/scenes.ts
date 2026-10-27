import donnees from '../../data/regions/kanto/scenes.json';
import type { FormeCarte } from './monde';
import { exiger, forme, identifiant, objet } from './sauvegarde-validation';

export type FormeScene = Exclude<FormeCarte, { forme: 'cercle' }>;
type Rectangle = { x: number; y: number; l: number; h: number };
/** Télé cachée (easter egg) : écran où joue la vidéo, bouton qui l'allume, en fractions de la scène. */
export type TeleScene = { video: string; ecran: Rectangle; bouton: Rectangle };
export type Scene = {
  id: string;
  image: string;
  ratio: [number, number];
  formes: FormeScene[];
  bulle?: string;
  tele?: TeleScene;
};

function texte(v: unknown): asserts v is string {
  exiger(typeof v === 'string' && v.trim().length > 0, 'Texte non vide attendu');
}

function fraction(v: unknown): asserts v is number {
  exiger(typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1,
    'Fraction entre 0 et 1 attendue');
}

function ratio(v: unknown) {
  exiger(Array.isArray(v) && v.length === 2 && v.every(n => typeof n === 'number' && Number.isFinite(n) && n > 0),
    'Ratio positif à deux composantes attendu');
}

function validerForme(v: unknown) {
  objet(v);
  const communs = {
    zone: (zone: unknown) => { if (zone !== null) identifiant(zone); },
    nom: texte,
    teinte: texte,
    forme: (type: unknown) => exiger(type === 'rect' || type === 'polygone', 'Forme inconnue'),
  };
  if (v.forme === 'rect') {
    forme(v, { ...communs, x: fraction, y: fraction, l: fraction, h: fraction });
    const rect = v as Extract<FormeScene, { forme: 'rect' }>;
    exiger(rect.l > 0 && rect.h > 0 && rect.x + rect.l <= 1 && rect.y + rect.h <= 1,
      'Rectangle vide ou hors de la scène');
  } else {
    forme(v, {
      ...communs,
      points: points => {
        exiger(Array.isArray(points) && points.length >= 3, 'Au moins trois sommets attendus');
        for (const point of points) {
          exiger(Array.isArray(point) && point.length === 2, 'Sommet à deux coordonnées attendu');
          point.forEach(fraction);
        }
      },
    });
  }
}

function validerRectangle(v: unknown) {
  forme(v, { x: fraction, y: fraction, l: fraction, h: fraction });
  const r = v as Rectangle;
  exiger(r.l > 0 && r.h > 0 && r.x + r.l <= 1 && r.y + r.h <= 1, 'Rectangle vide ou hors de la scène');
}

function validerTele(v: unknown) {
  forme(v, { video: texte, ecran: validerRectangle, bouton: validerRectangle });
}

/** Charge et copie les scènes sans conserver de référence aux données fournies. */
export function chargerScenes(fichier: unknown = donnees): Scene[] {
  let id = 'fichier';
  try {
    forme(fichier, {
      version: v => exiger(v === 1, 'Version inconnue'),
      scenes: v => exiger(Array.isArray(v), 'Tableau de scènes attendu'),
    });
    const scenes = (fichier as { scenes: unknown[] }).scenes;
    const ids = new Set<string>();
    for (const scene of scenes) {
      id = 'inconnue';
      objet(scene);
      if (typeof scene.id === 'string') id = scene.id;
      forme(scene, {
        id: identifiant,
        image: texte,
        ratio,
        formes: v => {
          exiger(Array.isArray(v), 'Tableau de formes attendu');
          v.forEach(validerForme);
        },
      }, { bulle: texte, tele: validerTele });
      exiger(!ids.has(id), 'Identifiant dupliqué');
      ids.add(id);
    }
    return structuredClone(scenes) as Scene[];
  } catch (erreur) {
    throw new Error(`Scène invalide (${id}) : ${erreur instanceof Error ? erreur.message : String(erreur)}`);
  }
}
