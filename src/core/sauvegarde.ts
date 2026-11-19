import type { MembreEquipe } from './combat';
import type { Horloge } from './clock';
import type { EtatMonde } from './conditions';
import { reglages } from './reglages';
import { kanto } from './regions';
import catalogueMonde from '../../data/monde.json';
import { ERREUR_VERSION, VERSION_ACTUELLE } from './sauvegarde-types';
import type { DonneesCompte, DonneesPartie, DonneesRegion, Enveloppe, Niveau, PokemonPossede, Stockage } from './sauvegarde-types';
import { dateUtc, exiger, identifiant, objet, validerEnveloppe, NOM_PARTIE_MIN, NOM_PARTIE_MAX } from './sauvegarde-validation';

export * from './sauvegarde-types';
export { validerDonneesCompte, validerDonneesPartie, validerDonneesRegion, validerPokemonPossede } from './sauvegarde-validation';

export function compteInitial(): DonneesCompte {
  return { diamants: 0, succes: [], skins: [], preferences: {} };
}
export function partieInitiale(nom: string): DonneesPartie {
  return { nom, regionCourante: 'kanto', regionsDebloquees: ['kanto'], pokedexNational: [], vus: [],
    pcGlobal: [], drapeaux: [], statistiques: { victoires: 0, argentTotalGagne: 0 } };
}
export function regionInitiale(regionId: string, zoneDepart: string): DonneesRegion {
  return { regionId, zoneId: zoneDepart, etape: reglages.depart.etape, equipe: [], badges: [],
    bossVaincus: [], objetsCles: [], quetes: [], drapeaux: [], evenementsJoues: [],
    argent: reglages.depart.argent, inventaire: {}, ligueGagnee: 0,
    ...structuredClone(reglages.depart.region) };
}
export function versMembreEquipe(p: PokemonPossede): MembreEquipe {
  const { numero, niveau, shiny, bonheur, pierreEternelle, calcium } = p;
  return { numero, niveau, shiny, bonheur, pierreEternelle, calcium, ...(p.marqueEclosion ? { marqueEclosion: true } : {}),
    // Un œuf ne compte jamais dans le DPS (ni le sien ni celui de l'équipe) : sinon il trahit l'espèce cachée.
    ...(p.oeuf ? { oeuf: true } : {}) };
}
export function etatMondeDe(region: DonneesRegion): EtatMonde {
  return { badges: [...region.badges], bossVaincus: [...region.bossVaincus], objets: [...region.objetsCles],
    quetes: [...region.quetes], drapeaux: [...region.drapeaux] };
}
export function creerStockageMemoire(): Stockage {
  const valeurs = new Map<string, string>();
  return { lire: cle => valeurs.get(cle) ?? null, ecrire: (cle, valeur) => { valeurs.set(cle, valeur); },
    supprimer: cle => { valeurs.delete(cle); }, cles: () => [...valeurs.keys()] };
}

type OptionsEcriture = { revisionAttendue?: number };
export const TAILLE_IMPORT_MAX = 5_000_000;
export class ErreurSauvegarde extends Error {
  constructor(public code: string, public detail: unknown, message: string) { super(message); }
}
export class ErreurStockage extends Error {
  readonly code: 'stockage-plein' | 'stockage-indisponible';
  constructor(public cause: unknown) {
    const plein = cause instanceof Error && /quota/i.test(cause.name);
    super(plein ? 'Stockage plein.' : 'Stockage indisponible.');
    this.code = plein ? 'stockage-plein' : 'stockage-indisponible';
  }
}
function nomValide(nom: string) {
  nom = nom.trim();
  exiger(nom.length >= NOM_PARTIE_MIN && nom.length <= NOM_PARTIE_MAX, 'Nom invalide');
  return nom;
}
function uidsDistincts(partie: Enveloppe<DonneesPartie>, regions: Enveloppe<DonneesRegion>[]) {
  const pokemon = [...partie.donnees.pcGlobal, ...regions.flatMap(({ donnees: r }) =>
    [...r.equipe, ...r.pc, ...r.pension.parents, ...r.pension.oeufs])];
  if (new Set(pokemon.map(p => p.uid)).size !== pokemon.length)
    erreurSure('Uid dupliqué', 'Cette sauvegarde est illisible');
}
const cleCompte = 'pokiclicker:compte:local';
const cleCourante = 'pokiclicker:courante';
function clePartie(id: string) { identifiant(id); return `pokiclicker:partie:${id}`; }
function prefixeRegions(id: string) { identifiant(id); return `pokiclicker:region:${id}:`; }
function cleRegion(id: string, region: string) { identifiant(region); return `${prefixeRegions(id)}${region}`; }
function lireJson(texte: string): unknown {
  try { return JSON.parse(texte); } catch { throw new Error('JSON invalide'); }
}
function erreurSure(erreur: unknown, prefixe: string): never {
  if (erreur instanceof Error && erreur.message === ERREUR_VERSION) throw erreur;
  if (erreur instanceof ErreurStockage) throw erreur;
  throw new ErreurSauvegarde('donnees-invalides', erreur, `${prefixe}.`);
}

export function creerGestionnaire({ stockage, horloge, genererId }: {
  stockage: Stockage; horloge: Horloge; genererId: () => string;
}) {
  const brut = stockage;
  let instantane: Map<string, string | null> | undefined;
  function acceder<T>(action: () => T): T {
    try { return action(); } catch (cause) { throw new ErreurStockage(cause); }
  }
  function memoriser(cle: string) {
    if (instantane && !instantane.has(cle)) instantane.set(cle, acceder(() => brut.lire(cle)));
  }
  stockage = { lire: cle => acceder(() => brut.lire(cle)),
    ecrire: (cle, valeur) => { memoriser(cle); acceder(() => brut.ecrire(cle, valeur)); },
    supprimer: cle => { memoriser(cle); acceder(() => brut.supprimer(cle)); }, cles: () => acceder(() => brut.cles()) };
  function atomique<T>(action: () => T): T {
    const avant = new Map<string, string | null>();
    instantane = avant;
    try { return action(); } catch (erreur) {
      instantane = undefined;
      for (const cle of [...avant.keys()].reverse()) {
        try {
          const valeur = avant.get(cle);
          if (valeur == null) stockage.supprimer(cle); else stockage.ecrire(cle, valeur);
        } catch { /* Ne pas masquer l'erreur initiale. */ }
      }
      throw erreur;
    } finally { instantane = undefined; }
  }
  const maintenant = () => new Date(horloge.maintenant()).toISOString();
  function charger<D>(cle: string, niveau: Niveau, id: string): Enveloppe<D> | null {
    const texte = stockage.lire(cle);
    if (texte === null) return null;
    try {
      const enveloppe = validerEnveloppe(lireJson(texte), niveau);
      exiger(enveloppe.id === id, 'Identifiant incohérent');
      if (niveau === 'region') exiger((enveloppe.donnees as DonneesRegion).regionId === id, 'Région incohérente');
      return enveloppe as Enveloppe<D>;
    } catch (erreur) { erreurSure(erreur, 'Cette sauvegarde est illisible'); }
  }
  function preparer<D>(niveau: Niveau, id: string, donnees: D, revision = 1): Enveloppe<D> {
    const enveloppe = { version: VERSION_ACTUELLE, niveau, id, revision, ecritLe: maintenant(), donnees };
    return validerEnveloppe(enveloppe, niveau) as Enveloppe<D>;
  }
  function ecrire<D>(cle: string, niveau: Niveau, id: string, donnees: D, options?: OptionsEcriture) {
    let revision = 0;
    let invalide = false;
    const texte = stockage.lire(cle);
    try { revision = charger<D>(cle, niveau, id)?.revision ?? 0; }
    catch (erreur) {
      if (erreur instanceof ErreurStockage || (erreur instanceof Error && erreur.message === ERREUR_VERSION)) throw erreur;
      invalide = true;
      try { const valeur = JSON.parse(texte!); if (Number.isSafeInteger(valeur?.revision)) revision = valeur.revision; } catch { /* JSON illisible. */ }
    }
    if (options?.revisionAttendue !== undefined && options.revisionAttendue !== revision) {
      throw new Error('Conflit : cette sauvegarde a changé depuis ta dernière lecture.');
    }
    const enveloppe = preparer(niveau, id, donnees, revision + 1);
    if (niveau === 'region') exiger((donnees as DonneesRegion).regionId === id, 'Région incohérente');
    if (invalide && texte !== null) stockage.ecrire(`pokiclicker:corrompue:${cle}`, texte);
    stockage.ecrire(cle, JSON.stringify(enveloppe));
    return enveloppe;
  }
  const chargerPartie = (id: string) => charger<DonneesPartie>(clePartie(id), 'partie', id);
  const chargerRegion = (id: string, region: string) => charger<DonneesRegion>(cleRegion(id, region), 'region', region);
  function nouvelId() {
    const id = genererId();
    identifiant(id);
    exiger(stockage.lire(clePartie(id)) === null && !stockage.cles().some(cle => cle.startsWith(prefixeRegions(id))),
      'Identifiant de partie déjà utilisé');
    return id;
  }
  return {
    chargerCompte: () => charger<DonneesCompte>(cleCompte, 'compte', 'local'),
    ecrireCompte: (donnees: DonneesCompte) => ecrire(cleCompte, 'compte', 'local', donnees),
    chargerPartie,
    renommerPartie(id: string, nom: string, options?: OptionsEcriture) {
      const partie = chargerPartie(id);
      exiger(partie, 'Partie introuvable');
      return ecrire(clePartie(id), 'partie', id, { ...partie.donnees, nom: nomValide(nom) }, options);
    },
    chargerRegion,
    installerVersion({ compte, partie, regions }: {
      compte?: Enveloppe<DonneesCompte> | null; partie?: Enveloppe<DonneesPartie>; regions: Enveloppe<DonneesRegion>[];
    }) {
      return atomique(() => {
      if (partie) validerEnveloppe(partie, 'partie');
      if (compte) {
        validerEnveloppe(compte, 'compte');
        exiger(compte.id === 'local', 'Identifiant de compte incohérent');
      }
      if (!partie) {
        exiger(regions.length === 0, 'Partie absente');
        if (compte) stockage.ecrire(cleCompte, JSON.stringify(compte));
        return;
      }
      const ids = regions.map(region => {
        validerEnveloppe(region, 'region');
        exiger(region.id === region.donnees.regionId && partie.donnees.regionsDebloquees.includes(region.id), 'Région incohérente');
        return region.id;
      });
      exiger(new Set(ids).size === ids.length, 'Région en double');
      exiger(ids.includes(partie.donnees.regionCourante), 'Région courante absente');
      uidsDistincts(partie, regions);
      for (const region of regions) stockage.ecrire(cleRegion(partie.id, region.id), JSON.stringify(region));
      stockage.ecrire(clePartie(partie.id), JSON.stringify(partie));
      if (compte) stockage.ecrire(cleCompte, JSON.stringify(compte));
      for (const cle of stockage.cles().filter(cle => cle.startsWith(prefixeRegions(partie.id)))) {
        if (!ids.includes(cle.slice(prefixeRegions(partie.id).length))) stockage.supprimer(cle);
      }
      });
    },
    creerPartie(nom: string, zoneDepart = kanto.premierCombat) {
      return atomique(() => {
      const id = nouvelId();
      const partie = preparer('partie', id, partieInitiale(nomValide(nom)));
      const region = preparer('region', 'kanto', regionInitiale('kanto', zoneDepart));
      stockage.ecrire(cleRegion(id, 'kanto'), JSON.stringify(region));
      stockage.ecrire(clePartie(id), JSON.stringify(partie));
      return partie;
      });
    },
    ecrirePartie: (id: string, donnees: DonneesPartie, options?: OptionsEcriture) =>
      ecrire(clePartie(id), 'partie', id, donnees, options),
    ecrireRegion: (id: string, region: string, donnees: DonneesRegion, options?: OptionsEcriture) =>
      ecrire(cleRegion(id, region), 'region', region, donnees, options),
    listerParties() {
      return stockage.cles().filter(cle => cle.startsWith('pokiclicker:partie:')).flatMap(cle => {
        try {
        const partie = chargerPartie(cle.slice('pokiclicker:partie:'.length));
        exiger(partie, 'Partie introuvable');
        return [{ id: partie.id, nom: partie.donnees.nom, regionCourante: partie.donnees.regionCourante, ecritLe: partie.ecritLe }];
        } catch (erreur) { if (erreur instanceof ErreurStockage) throw erreur; return []; }
      }).sort((a, b) => Date.parse(b.ecritLe) - Date.parse(a.ecritLe));
    },
    listerPartiesIllisibles(): { id: string; raison: string }[] {
      return stockage.cles().filter(cle => cle.startsWith('pokiclicker:partie:')).flatMap(cle => {
        const id = cle.slice('pokiclicker:partie:'.length);
        try { chargerPartie(id); return []; }
        catch (erreur) { if (erreur instanceof ErreurStockage) throw erreur; return [{ id, raison: 'donnees-invalides' }]; }
      });
    },
    partieCourante(): string | null {
      try {
        const id = stockage.lire(cleCourante);
        if (id && chargerPartie(id)) return id;
      } catch (erreur) { if (erreur instanceof ErreurStockage) throw erreur; }
      return this.listerParties()[0]?.id ?? null;
    },
    choisirPartie(id: string) {
      exiger(chargerPartie(id), 'Partie introuvable');
      stockage.ecrire(cleCourante, id);
    },
    supprimerPartie(id: string) {
      for (const cle of stockage.cles().filter(cle => cle === `pokiclicker:corrompue:${clePartie(id)}` || cle.startsWith(`pokiclicker:corrompue:${prefixeRegions(id)}`))) stockage.supprimer(cle);
      for (const cle of stockage.cles().filter(cle => cle.startsWith(prefixeRegions(id)))) stockage.supprimer(cle);
      stockage.supprimer(clePartie(id));
      if (stockage.lire(cleCourante) === id) stockage.supprimer(cleCourante);
    },
    exporterPartie(id: string): string {
      const partie = chargerPartie(id);
      exiger(partie, 'Partie introuvable');
      const illisibles: string[] = [];
      const regions = stockage.cles().filter(cle => cle.startsWith(prefixeRegions(id))).map(cle => {
        const region = cle.slice(prefixeRegions(id).length);
        try { return chargerRegion(id, region); } catch (erreur) {
          if (erreur instanceof ErreurStockage) throw erreur;
          illisibles.push(region);
          const texte = stockage.lire(cle);
          try { return JSON.parse(texte!); } catch { return texte; }
        }
      });
      return JSON.stringify({ format: 'pokiclicker-partie', version: VERSION_ACTUELLE,
        exporteLe: maintenant(), partie, regions, illisibles });
    },
    exporterCompte(): string {
      const texte = stockage.lire(cleCompte);
      if (texte === null) return 'null';
      try { return JSON.stringify(charger<DonneesCompte>(cleCompte, 'compte', 'local')); }
      catch (erreur) { if (erreur instanceof ErreurStockage) throw erreur; return texte; }
    },
    importerPartie(texte: string): { id: string } {
      let partie: Enveloppe<DonneesPartie>;
      let regions: Enveloppe<DonneesRegion>[];
      try {
        exiger(texte.length <= TAILLE_IMPORT_MAX, 'Fichier trop grand');
        const fichier = lireJson(texte);
        objet(fichier);
        exiger(fichier.format === 'pokiclicker-partie', 'Format inconnu');
        exiger(Number.isSafeInteger(fichier.version) && (fichier.version as number) >= 0, 'Version invalide');
        if ((fichier.version as number) > VERSION_ACTUELLE) throw new Error(ERREUR_VERSION);
        exiger(Object.keys(fichier).every(cle => ['format', 'version', 'exporteLe', 'partie', 'regions', 'illisibles'].includes(cle)), 'Champ inconnu');
        exiger(Array.isArray(fichier.regions) && fichier.regions.length <= 1 + catalogueMonde.regionsVerrouillees.length, 'Trop de régions');
        dateUtc(fichier.exporteLe);
        partie = validerEnveloppe(fichier.partie, 'partie') as Enveloppe<DonneesPartie>;
        exiger(Array.isArray(fichier.regions), 'Régions absentes');
        regions = fichier.regions.map(region => validerEnveloppe(region, 'region') as Enveloppe<DonneesRegion>);
        const ids = regions.map(region => region.id);
        exiger(new Set(ids).size === ids.length, 'Région en double');
        exiger(ids.includes(partie.donnees.regionCourante), 'Région courante absente');
        for (const region of regions) {
          exiger(region.id === region.donnees.regionId && partie.donnees.regionsDebloquees.includes(region.id), 'Région incohérente');
        }
        uidsDistincts(partie, regions);
      } catch (erreur) { erreurSure(erreur, "Ce fichier n'est pas une sauvegarde de partie valide"); }
      return atomique(() => {
      const id = nouvelId();
      const nouvelle = preparer('partie', id, partie.donnees);
      const nouvellesRegions = regions.map(region => preparer('region', region.id, region.donnees));
      for (const region of nouvellesRegions) stockage.ecrire(cleRegion(id, region.id), JSON.stringify(region));
      stockage.ecrire(clePartie(id), JSON.stringify(nouvelle));
      return { id };
      });
    },
  };
}
