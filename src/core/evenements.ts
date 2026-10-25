import { chargerObjets } from './boutique';
import { valider, type Condition } from './conditions';
import type { chargerMonde } from './monde';
import { chargerPokemon } from './pokemon';
import { chaine, exiger, forme, identifiant, objet } from './sauvegarde-validation';

export type Declencheur =
  | { type: 'debut-partie' }
  | { type: 'entree-zone'; zone: string }
  | { type: 'boss-vaincu'; zone: string }
  | { type: 'objet-utilise'; objet: string; zone?: string };

export type Etape =
  | { type: 'dialogue'; locuteur: string; texte: string }
  | { type: 'donner'; objet: string; quantite: number }
  | { type: 'donner'; objetCle: string }
  | { type: 'poser-drapeau'; id: string }
  | { type: 'bloquer'; zone: string; sauf: string; raison: string }
  | { type: 'combat'; pokemon: number; niveau: number; capture?: number; nom?: string }
  | { type: 'deplacer'; zone: string };

export type Evenement = {
  id: string;
  declencheur: Declencheur;
  si?: Condition;
  priorite: number;
  repetable: boolean;
  etapes: Etape[];
};

export type Commande = (Extract<Etape, { type: 'dialogue' | 'combat' }>) & {
  evenement: string;
  etape: number;
};

export type CatalogueEvenements = {
  liste: Evenement[];
  parId(id: string): Evenement;
};

const entier = (v: unknown) => exiger(typeof v === 'number' && Number.isSafeInteger(v), 'Entier attendu');
const positif = (v: unknown) => {
  entier(v);
  exiger((v as number) > 0, 'Entier strictement positif attendu');
};
const booleen = (v: unknown) => exiger(typeof v === 'boolean', 'Booléen attendu');

function condition(v: unknown) {
  valider(v);
  if ('tous' in v || 'un_parmi' in v) {
    const cle = 'tous' in v ? 'tous' : 'un_parmi';
    forme(v, { [cle]: enfants => {
      exiger(Array.isArray(enfants), 'Liste de conditions invalide');
      enfants.forEach(condition);
    } });
  } else if ('non' in v) {
    forme(v, { non: condition });
  } else if (v.type === 'boss') {
    forme(v, { type: chaine, zone: chaine });
  } else {
    forme(v, { type: chaine, id: chaine }, v.type === 'drapeau' ? {} : { nom: chaine });
  }
}

export function chargerEvenements(
  fichiers: Record<string, unknown>,
  monde: Pick<ReturnType<typeof chargerMonde>, 'zone'>,
  objets = chargerObjets(),
  pokemon = chargerPokemon(),
): CatalogueEvenements {
  const index = new Map<string, Evenement>();
  const zone = (v: unknown) => { identifiant(v); monde.zone(v); };
  const objetInventaire = (v: unknown) => {
    identifiant(v);
    exiger(objets.some(o => o.inventaire === v), `Objet inconnu : ${v}`);
  };
  const numeroPokemon = (v: unknown) => {
    positif(v);
    exiger(pokemon.parNumero(v as number), `Pokémon inconnu : ${v}`);
  };
  function declencheur(v: unknown) {
    objet(v);
    switch (v.type) {
      case 'debut-partie': forme(v, { type: chaine }); break;
      case 'entree-zone':
      case 'boss-vaincu': forme(v, { type: chaine, zone }); break;
      case 'objet-utilise': forme(v, { type: chaine, objet: objetInventaire }, { zone }); break;
      default: throw new Error(`Déclencheur inconnu : ${String(v.type)}`);
    }
  }
  function etape(v: unknown) {
    objet(v);
    switch (v.type) {
      case 'dialogue': forme(v, { type: chaine, locuteur: chaine, texte: chaine }); break;
      case 'donner':
        if (Object.hasOwn(v, 'objetCle')) forme(v, { type: chaine, objetCle: identifiant });
        else forme(v, { type: chaine, objet: objetInventaire, quantite: positif });
        break;
      case 'poser-drapeau': forme(v, { type: chaine, id: identifiant }); break;
      case 'bloquer': forme(v, { type: chaine, zone, sauf: identifiant, raison: chaine }); break;
      case 'deplacer': forme(v, { type: chaine, zone }); break;
      case 'combat':
        forme(v, { type: chaine, pokemon: numeroPokemon, niveau: positif }, {
          capture: n => exiger(typeof n === 'number' && Number.isFinite(n) && n >= 0, 'Capture invalide'),
          nom: chaine,
        });
        break;
      default: throw new Error(`Étape inconnue : ${String(v.type)}`);
    }
  }
  function contextualiser(fichier: string, id: unknown, action: () => void) {
    try { action(); } catch (erreur) {
      throw new Error(`Événement invalide (${fichier}, ${String(id)}) : ${erreur instanceof Error ? erreur.message : String(erreur)}`);
    }
  }
  for (const [fichier, contenu] of Object.entries(fichiers)) {
    contextualiser(fichier, '?', () => {
      forme(contenu, {
        version: v => exiger(v === 1, 'Version inconnue'),
        evenements: v => exiger(Array.isArray(v), 'Tableau attendu'),
      });
    });
    for (const valeur of (contenu as { evenements: unknown[] }).evenements) {
      const id = valeur && typeof valeur === 'object' && 'id' in valeur ? valeur.id : '?';
      contextualiser(fichier, id, () => {
        forme(valeur, {
          id: identifiant,
          declencheur,
          etapes: v => { exiger(Array.isArray(v) && v.length > 0, 'Étapes attendues'); v.forEach(etape); },
        }, { si: condition, priorite: entier, repetable: booleen });
        const evenement = structuredClone(valeur) as Evenement;
        evenement.priorite ??= 0;
        evenement.repetable ??= false;
        exiger(!index.has(evenement.id), `Identifiant d'événement dupliqué : ${evenement.id}`);
        exiger(!evenement.repetable || !evenement.etapes.some(e => e.type === 'bloquer'),
          'bloquer interdit dans un événement répétable');
        index.set(evenement.id, evenement);
      });
    }
  }
  const liste = [...index.values()].sort((a, b) => b.priorite - a.priorite || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return { liste, parId(id) {
    const evenement = index.get(id);
    if (!evenement) throw new Error(`Événement inconnu : ${id}`);
    return evenement;
  } };
}
