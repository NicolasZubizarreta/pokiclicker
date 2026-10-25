import { chargerObjets } from './boutique';
import { evaluer, valider, type Condition, type ResultatCondition } from './conditions';
import type { chargerMonde } from './monde';
import { chargerPokemon } from './pokemon';
import { reglages } from './reglages';
import { chaine, exiger, forme, identifiant, objet } from './sauvegarde-validation';
import { etatMondeDe } from './sauvegarde';
import type { DonneesRegion } from './sauvegarde-types';

export type Declencheur =
  | { type: 'debut-partie' }
  | { type: 'entree-zone'; zone: string }
  | { type: 'boss-vaincu'; zone: string }
  | { type: 'objet-utilise'; objet: string; zone?: string };

export type Etape =
  | { type: 'dialogue'; locuteur: string; texte: string; pose?: string }
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

function eligible(evenement: Evenement, region: DonneesRegion): boolean {
  return (evenement.repetable || !region.evenementsJoues.includes(evenement.id))
    && (!evenement.si || evaluer(evenement.si, etatMondeDe(region)).ok);
}

function correspond(declencheur: Declencheur, fait: Declencheur): boolean {
  if (declencheur.type !== fait.type) return false;
  switch (declencheur.type) {
    case 'debut-partie': return true;
    case 'entree-zone':
    case 'boss-vaincu': return 'zone' in fait && declencheur.zone === fait.zone;
    case 'objet-utilise': return fait.type === 'objet-utilise' && declencheur.objet === fait.objet
      && (declencheur.zone === undefined || declencheur.zone === fait.zone);
  }
}

// Travaille uniquement sur la copie de région créée par l'appelant.
function avancer(cat: CatalogueEvenements, region: DonneesRegion): DonneesRegion {
  while (region.evenementEnCours) {
    const courant = region.evenementEnCours;
    const evenement = cat.liste.find(e => e.id === courant.id);
    const etape = evenement?.etapes[courant.etape];
    if (!evenement || !etape) {
      if (evenement && !evenement.repetable && !region.evenementsJoues.includes(evenement.id)) {
        region.evenementsJoues.push(evenement.id);
      }
      delete region.evenementEnCours;
      while (courant.file.length) {
        const id = courant.file.shift()!;
        const suivant = cat.liste.find(e => e.id === id);
        if (suivant && eligible(suivant, region)) {
          region.evenementEnCours = { id, etape: 0, file: courant.file };
          break;
        }
      }
      continue;
    }
    switch (etape.type) {
      case 'dialogue':
      case 'combat': return region;
      case 'donner':
        if ('objetCle' in etape) {
          if (!region.objetsCles.includes(etape.objetCle)) region.objetsCles.push(etape.objetCle);
        } else {
          region.inventaire[etape.objet] = (region.inventaire[etape.objet] ?? 0) + etape.quantite;
        }
        break;
      case 'poser-drapeau':
        if (!region.drapeaux.includes(etape.id)) region.drapeaux.push(etape.id);
        break;
      case 'deplacer':
        region.zoneId = etape.zone;
        region.etape = 1;
        break;
      case 'bloquer': break; // Son activation est déduite de l'index avancé.
    }
    courant.etape++;
  }
  return region;
}

export function declencher(cat: CatalogueEvenements, region: DonneesRegion, fait: Declencheur): DonneesRegion {
  const courant = region.evenementEnCours;
  const dejaEnFile = new Set(courant ? [courant.id, ...courant.file] : []);
  const nouveaux = cat.liste.filter(e => !dejaEnFile.has(e.id)
    && correspond(e.declencheur, fait) && eligible(e, region))
    .sort((a, b) => b.priorite - a.priorite || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    .map(e => e.id);
  if (!nouveaux.length && (!courant || commandeCourante(cat, region))) return region;
  const copie = structuredClone(region);
  if (copie.evenementEnCours) copie.evenementEnCours.file.push(...nouveaux);
  else if (nouveaux.length) copie.evenementEnCours = { id: nouveaux[0]!, etape: 0, file: nouveaux.slice(1) };
  return avancer(cat, copie);
}

export function commandeCourante(cat: CatalogueEvenements, region: DonneesRegion): Commande | null {
  const courant = region.evenementEnCours;
  if (!courant) return null;
  const etape = cat.liste.find(e => e.id === courant.id)?.etapes[courant.etape];
  return etape && (etape.type === 'dialogue' || etape.type === 'combat')
    ? { ...etape, evenement: courant.id, etape: courant.etape } : null;
}

export function etapeTerminee(
  cat: CatalogueEvenements, region: DonneesRegion, ref: { evenement: string; etape: number },
): DonneesRegion {
  const commande = commandeCourante(cat, region);
  if (!commande || commande.evenement !== ref.evenement || commande.etape !== ref.etape) return region;
  const copie = structuredClone(region);
  copie.evenementEnCours!.etape++;
  return avancer(cat, copie);
}

export function blocage(cat: CatalogueEvenements, region: DonneesRegion, zoneId: string): ResultatCondition {
  for (const evenement of cat.liste) {
    for (const [index, etape] of evenement.etapes.entries()) {
      if (etape.type === 'bloquer' && etape.zone === zoneId && !region.drapeaux.includes(etape.sauf)
        && (region.evenementsJoues.includes(evenement.id)
          || (region.evenementEnCours?.id === evenement.id && region.evenementEnCours.etape > index))) {
        return { ok: false, raison: etape.raison };
      }
    }
  }
  return { ok: true };
}

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
      case 'dialogue': forme(v, { type: chaine, locuteur: chaine, texte: chaine }, { pose: identifiant }); break;
      case 'donner':
        if (Object.hasOwn(v, 'objetCle')) forme(v, { type: chaine, objetCle: identifiant });
        else forme(v, { type: chaine, objet: objetInventaire, quantite: positif });
        break;
      case 'poser-drapeau': forme(v, { type: chaine, id: identifiant }); break;
      case 'bloquer': forme(v, { type: chaine, zone, sauf: identifiant, raison: chaine }); break;
      case 'deplacer': forme(v, { type: chaine, zone }); break;
      case 'combat':
        forme(v, { type: chaine, pokemon: numeroPokemon, niveau: n => {
          positif(n);
          exiger((n as number) <= reglages.recompenses.niveauMax, 'Niveau supérieur au maximum');
        } }, {
          // Même échelle que le taux de capture du combat (capture / 255).
          capture: n => exiger(typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 255, 'Capture invalide'),
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
