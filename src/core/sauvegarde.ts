import type { MembreEquipe } from './combat';
import type { Horloge } from './clock';
import type { EtatMonde } from './conditions';
import { reglages } from './reglages';
import { ERREUR_VERSION, VERSION_ACTUELLE } from './sauvegarde-types';
import type { DonneesCompte, DonneesPartie, DonneesRegion, Enveloppe, Niveau, PokemonPossede, Stockage } from './sauvegarde-types';
import { dateUtc, exiger, identifiant, objet, validerEnveloppe } from './sauvegarde-validation';

export * from './sauvegarde-types';
export { validerDonneesCompte, validerDonneesPartie, validerDonneesRegion, validerPokemonPossede } from './sauvegarde-validation';

export function compteInitial(): DonneesCompte {
  return { diamants: 0, succes: [], skins: [], preferences: {} };
}
export function partieInitiale(nom: string): DonneesPartie {
  return { nom, regionCourante: 'kanto', regionsDebloquees: ['kanto'], pokedexNational: [],
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
  return { numero, niveau, shiny, bonheur, pierreEternelle, calcium };
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
const cleCompte = 'pokiclicker:compte:local';
function clePartie(id: string) { identifiant(id); return `pokiclicker:partie:${id}`; }
function prefixeRegions(id: string) { identifiant(id); return `pokiclicker:region:${id}:`; }
function cleRegion(id: string, region: string) { identifiant(region); return `${prefixeRegions(id)}${region}`; }
function lireJson(texte: string): unknown {
  try { return JSON.parse(texte); } catch { throw new Error('JSON invalide'); }
}
function erreurSure(erreur: unknown, prefixe: string): never {
  if (erreur instanceof Error && erreur.message === ERREUR_VERSION) throw erreur;
  throw new Error(`${prefixe} : ${erreur instanceof Error ? erreur.message.replace(/\.$/, '') : 'Données invalides'}.`);
}

export function creerGestionnaire({ stockage, horloge, genererId }: {
  stockage: Stockage; horloge: Horloge; genererId: () => string;
}) {
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
    const avant = charger<D>(cle, niveau, id);
    if (options?.revisionAttendue !== undefined && options.revisionAttendue !== (avant?.revision ?? 0)) {
      throw new Error('Conflit : cette sauvegarde a changé depuis ta dernière lecture.');
    }
    const enveloppe = preparer(niveau, id, donnees, (avant?.revision ?? 0) + 1);
    if (niveau === 'region') exiger((donnees as DonneesRegion).regionId === id, 'Région incohérente');
    stockage.ecrire(cle, JSON.stringify(enveloppe));
    return enveloppe;
  }
  const chargerPartie = (id: string) => charger<DonneesPartie>(clePartie(id), 'partie', id);
  const chargerRegion = (id: string, region: string) => charger<DonneesRegion>(cleRegion(id, region), 'region', region);
  function regionsDe(id: string) {
    return stockage.cles().filter(cle => cle.startsWith(prefixeRegions(id))).map(cle => {
      const region = chargerRegion(id, cle.slice(prefixeRegions(id).length));
      exiger(region, 'Région introuvable');
      return region;
    });
  }
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
    chargerRegion,
    creerPartie(nom: string, zoneDepart = 'kanto.route-1') {
      const id = nouvelId();
      const partie = preparer('partie', id, partieInitiale(nom));
      const region = preparer('region', 'kanto', regionInitiale('kanto', zoneDepart));
      stockage.ecrire(cleRegion(id, 'kanto'), JSON.stringify(region));
      stockage.ecrire(clePartie(id), JSON.stringify(partie));
      return partie;
    },
    ecrirePartie: (id: string, donnees: DonneesPartie, options?: OptionsEcriture) =>
      ecrire(clePartie(id), 'partie', id, donnees, options),
    ecrireRegion: (id: string, region: string, donnees: DonneesRegion, options?: OptionsEcriture) =>
      ecrire(cleRegion(id, region), 'region', region, donnees, options),
    listerParties() {
      return stockage.cles().filter(cle => cle.startsWith('pokiclicker:partie:')).map(cle => {
        const partie = chargerPartie(cle.slice('pokiclicker:partie:'.length));
        exiger(partie, 'Partie introuvable');
        return { id: partie.id, nom: partie.donnees.nom, regionCourante: partie.donnees.regionCourante, ecritLe: partie.ecritLe };
      }).sort((a, b) => Date.parse(b.ecritLe) - Date.parse(a.ecritLe));
    },
    supprimerPartie(id: string) {
      for (const cle of stockage.cles().filter(cle => cle.startsWith(prefixeRegions(id)))) stockage.supprimer(cle);
      stockage.supprimer(clePartie(id));
    },
    exporterPartie(id: string): string {
      const partie = chargerPartie(id);
      exiger(partie, 'Partie introuvable');
      return JSON.stringify({ format: 'pokiclicker-partie', version: VERSION_ACTUELLE,
        exporteLe: maintenant(), partie, regions: regionsDe(id) });
    },
    importerPartie(texte: string): { id: string } {
      let partie: Enveloppe<DonneesPartie>;
      let regions: Enveloppe<DonneesRegion>[];
      try {
        const fichier = lireJson(texte);
        objet(fichier);
        exiger(fichier.format === 'pokiclicker-partie', 'Format inconnu');
        exiger(Number.isSafeInteger(fichier.version) && (fichier.version as number) >= 0, 'Version invalide');
        if ((fichier.version as number) > VERSION_ACTUELLE) throw new Error(ERREUR_VERSION);
        exiger(Object.keys(fichier).every(cle => ['format', 'version', 'exporteLe', 'partie', 'regions'].includes(cle)), 'Champ inconnu');
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
      } catch (erreur) { erreurSure(erreur, "Ce fichier n'est pas une sauvegarde de partie valide"); }
      const id = nouvelId();
      const nouvelle = preparer('partie', id, partie.donnees);
      const nouvellesRegions = regions.map(region => preparer('region', region.id, region.donnees));
      for (const region of nouvellesRegions) stockage.ecrire(cleRegion(id, region.id), JSON.stringify(region));
      stockage.ecrire(clePartie(id), JSON.stringify(nouvelle));
      return { id };
    },
  };
}
