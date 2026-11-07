import type { Horloge } from '../core/clock';
import { creerGestionnaire, creerStockageMemoire, type DonneesCompte, type DonneesPartie, type DonneesRegion, type Enveloppe, type Stockage } from '../core/sauvegarde';
import { creerPartieNommee } from './persistance';
import { genererIdentifiant } from './identifiants';

export type EtatSynchro = 'inactif' | 'ok' | 'hors-ligne' | 'refuse' | 'ailleurs' | 'divergence';
export type PartieListee = { id: string; nom: string; regionCourante: string; zoneId: string; tempsJeuMs: number | null;
  ecritLe: string; surServeur: boolean; courante: boolean };
type Revision = { serveur: number; local: number };
export type Memoire = { version: 1; compte?: Revision; parties: Record<string, Revision>; regions: Record<string, Revision> };
type Version = { compte?: Enveloppe<DonneesCompte> | null; partie: Enveloppe<DonneesPartie> | null; regions: Enveloppe<DonneesRegion>[] };
type VersionServeur = Version & { partie: Enveloppe<DonneesPartie> };
export type Resume = { regionId: string; zoneId: string; ecritLe: string; tempsJeuMs: number | null };
type Unite = 'compte' | 'partie';
type Verdict = 'rien' | 'charger' | 'envoyer' | 'diverge';
export function decider(local: Version, serveur: Version | null, memoire: Memoire): Record<Unite, Verdict> {
  const verdict = (sc: boolean, lc: boolean): Verdict => sc ? lc ? 'diverge' : 'charger' : lc ? 'envoyer' : 'rien';
  const changePartie = (v: Version | null, cote: keyof Revision) => !!v && !!(
    (v.partie && v.partie.revision !== memoire.parties[v.partie.id]?.[cote])
    || v.regions.some(r => r.revision !== memoire.regions[`${v.partie?.id}:${r.id}`]?.[cote]));
  return {
    compte: verdict(!!serveur?.compte && serveur.compte.revision !== memoire.compte?.serveur,
      !!local.compte && local.compte.revision !== memoire.compte?.local),
    partie: local.partie && serveur?.partie && local.partie.id !== serveur.partie.id ? 'diverge'
      : verdict(changePartie(serveur, 'serveur'), changePartie(local, 'local')),
  };
}

function resumer(version: Version): Resume {
  const partie = version.partie;
  const statistiques = partie?.donnees.statistiques;
  return { regionId: partie?.donnees.regionCourante ?? '',
    zoneId: version.regions.find(r => r.id === partie?.donnees.regionCourante)?.donnees.zoneId ?? '',
    ecritLe: partie?.ecritLe ?? '',
    tempsJeuMs: statistiques && 'tempsJeuMs' in statistiques && typeof statistiques.tempsJeuMs === 'number' ? statistiques.tempsJeuMs : null };
}
const cle = 'pokiclicker:synchro';

export function creerSynchro(options: {
  stockage: Stockage; horloge: Horloge; urlApi: string; jeton: () => string | null;
  fetch?: typeof fetch; intervalleMs?: number; delaiMiniMs?: number; quandChange?: () => void;
  enPause?: () => boolean;
  appareilId?: () => string | null; quandAilleurs?: () => void;
}) {
  const { stockage, horloge } = options;
  const gestionnaire = creerGestionnaire({ stockage, horloge, genererId: genererIdentifiant });
  let memoire: Memoire = { version: 1, parties: {}, regions: {} };
  try {
    const valeur: unknown = JSON.parse(stockage.lire(cle) ?? 'null');
    const revisionValide = (r: unknown): r is Revision => !!r && typeof r === 'object'
      && 'serveur' in r && Number.isSafeInteger(r.serveur) && Number(r.serveur) >= 0
      && 'local' in r && Number.isSafeInteger(r.local) && Number(r.local) >= -1;
    if (valeur && typeof valeur === 'object' && 'version' in valeur && valeur.version === 1
      && 'parties' in valeur && valeur.parties && typeof valeur.parties === 'object'
      && 'regions' in valeur && valeur.regions && typeof valeur.regions === 'object'
      && !Array.isArray(valeur.parties) && !Array.isArray(valeur.regions)
      && Object.values(valeur.parties).every(revisionValide) && Object.values(valeur.regions).every(revisionValide)
      && (!('compte' in valeur) || revisionValide(valeur.compte))) memoire = valeur as Memoire;
  } catch { /* Une mémoire illisible ne bloque pas le jeu. */ }
  let statut: EtatSynchro = 'inactif';
  let arrete = false;
  let bloque = false;
  let suppressionCourante = false;
  let intervalle: ReturnType<typeof setInterval> | undefined;
  let rattrapage: ReturnType<typeof setTimeout> | undefined;
  let enCours: Promise<void> | undefined;
  let suivant = false;
  let fermetureSuivante = false;
  let dernier = -Infinity;
  let suppressionEnAttente: { id: string; local: Resume } | null = null;
  let resolution: Promise<'charge' | 'rien' | 'echec'> | undefined;
  function lireLocal(): Version {
    const id = gestionnaire.partieCourante();
    const partie = id ? gestionnaire.chargerPartie(id) : null;
    const regions = partie ? stockage.cles().filter(c => c.startsWith(`pokiclicker:region:${partie.id}:`))
      .map(c => gestionnaire.chargerRegion(partie.id, c.slice(`pokiclicker:region:${partie.id}:`.length))!) : [];
    return { compte: gestionnaire.chargerCompte(), partie, regions };
  }
  function requete(chemin: string, method = 'GET', corps?: unknown) {
    return (options.fetch ?? globalThis.fetch)(`${options.urlApi.replace(/\/+$/, '')}/api/sauvegarde${chemin}`, {
      method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${options.jeton()}` },
      credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer', signal: AbortSignal.timeout(8000),
      ...(corps !== undefined && { body: JSON.stringify(corps) }),
    });
  }
  async function listerServeur(): Promise<Omit<PartieListee, 'surServeur' | 'courante'>[]> {
    const liste = await requete('/parties');
    if (!liste.ok) throw new Error('Lecture impossible');
    const contenu = await liste.json();
    if (!contenu || !Array.isArray(contenu.parties)) throw new Error('Liste invalide');
    return contenu.parties.map((p: Record<string, unknown> | null) => {
      if (!p || typeof p.id !== 'string' || typeof p.nom !== 'string'
        || !Number.isSafeInteger(p.revision) || typeof p.ecritLe !== 'string') throw new Error('Partie invalide');
      return { id: p.id, nom: p.nom, ecritLe: p.ecritLe,
        regionCourante: typeof p.regionCourante === 'string' ? p.regionCourante : '',
        zoneId: typeof p.zoneId === 'string' ? p.zoneId : '',
        tempsJeuMs: typeof p.tempsJeuMs === 'number' && Number.isFinite(p.tempsJeuMs) ? p.tempsJeuMs : null };
    });
  }
  async function lireServeur(voulue: string | null): Promise<VersionServeur | null> {
    const parties = await listerServeur();
    const partie = voulue === null ? parties[0] : parties.find(p => p.id === voulue);
    return partie ? lireVersion(partie.id) : null;
  }
  async function lireVersion(id: string): Promise<VersionServeur> {
    const [detail, compte] = await Promise.all([requete(`/parties/${encodeURIComponent(id)}`), requete('/compte')]);
    if (!detail.ok || (!compte.ok && compte.status !== 404)) throw new Error('Lecture impossible');
    const donnees = await detail.json();
    const enveloppe = compte.status === 404 ? null : (await compte.json())?.enveloppe;
    if (!donnees || !Array.isArray(donnees.regions) || donnees.partie?.id !== id
      || (compte.status !== 404 && !enveloppe)) throw new Error('Version invalide');
    const version: VersionServeur = { compte: enveloppe, partie: donnees.partie, regions: donnees.regions };
    // La même validation que l'installation, dans un stockage isolé, avant tout choix ou archivage.
    creerGestionnaire({ stockage: creerStockageMemoire(), horloge, genererId: () => 'x' }).installerVersion(version);
    return version;
  }
  function memoriserVersion(version: VersionServeur, unite: Unite) {
    const revision = (e: Enveloppe<unknown>) => ({ serveur: e.revision, local: e.revision });
    if (unite === 'compte') {
      if (version.compte) memoire.compte = revision(version.compte);
    } else {
      memoire.parties[version.partie.id] = revision(version.partie);
      for (const id of Object.keys(memoire.regions)) if (id.startsWith(`${version.partie.id}:`)) delete memoire.regions[id];
      for (const r of version.regions) memoire.regions[`${version.partie.id}:${r.id}`] = revision(r);
    }
    stockage.ecrire(cle, JSON.stringify(memoire));
  }
  function retenirSuppression(id: string) {
    bloque = true;
    statut = 'divergence';
    suppressionEnAttente = { id, local: resumer(lireLocal()) };
    options.quandChange?.();
  }
  async function appliquer(): Promise<'charge' | 'rien' | 'echec'> {
    try {
      const local = lireLocal();
      const serveur = await lireServeur(local.partie?.id ?? null);
      if (arrete || options.enPause?.() || suppressionEnAttente) return 'echec';
      const plan = decider(local, serveur, memoire);
      const divergence = plan.compte === 'diverge' || plan.partie === 'diverge';
      if (divergence) { bloque = true; statut = 'divergence'; }
      const archiver = async (niveau: string, objetId: string, enveloppe: Enveloppe<unknown>) => {
        const reponse = await requete('/versions', 'POST', { niveau, objetId, enveloppe });
        if (!reponse.ok || arrete) throw new Error('Archivage impossible');
      };
      if (plan.compte === 'diverge' && local.compte) await archiver('compte', 'local', local.compte);
      if (plan.partie === 'diverge' && local.partie) {
        await archiver('partie', local.partie.id, local.partie);
        for (const r of local.regions) await archiver('region', `${local.partie.id}:${r.id}`, r);
      }
      if (arrete || options.enPause?.()) return 'echec';
      let charge = false;
      for (const unite of ['compte', 'partie'] as const) {
        if (!serveur || !['charger', 'diverge'].includes(plan[unite])) continue;
        gestionnaire.installerVersion(unite === 'compte' ? { compte: serveur.compte, regions: [] }
          : { partie: serveur.partie, regions: serveur.regions });
        memoriserVersion(serveur, unite);
        charge = true;
      }
      if (divergence) {
        try { stockage.ecrire('pokiclicker:synchro-avis', JSON.stringify({ divergence: true })); } catch { /* Avis facultatif. */ }
      }
      bloque = false;
      statut = 'inactif';
      options.quandChange?.();
      return charge ? 'charge' : 'rien';
    } catch {
      if (statut !== 'divergence') statut = 'hors-ligne';
      options.quandChange?.();
      return 'echec';
    }
  }
  async function resoudre(): Promise<'charge' | 'rien' | 'echec'> {
    if (statut === 'ailleurs' || options.enPause?.() || suppressionEnAttente || !options.jeton()) return 'echec';
    if (!resolution) resolution = appliquer().finally(() => { resolution = undefined; });
    return resolution;
  }
  async function ouvrir(): Promise<'rien' | 'charge' | 'hors-ligne'> {
    arrete = false;
    if (options.enPause?.()) return 'rien';
    if (statut !== 'divergence') {
      bloque = false;
      statut = 'inactif';
    }
    if (!options.jeton()) return 'rien';
    const resultat = await resoudre();
    return resultat === 'echec' ? 'hors-ligne' : resultat;
  }
  async function resoudreSuppression(cote: 'garder' | 'abandonner'): Promise<'ok' | 'echec'> {
    if (!suppressionEnAttente || arrete) return 'echec';
    try {
      const { id } = suppressionEnAttente;
      if (cote === 'abandonner') {
        gestionnaire.supprimerPartie(id);
        delete memoire.parties[id];
        for (const r of Object.keys(memoire.regions)) if (r.startsWith(`${id}:`)) delete memoire.regions[r];
        suppressionCourante = true;
      } else {
        memoire.parties[id] = { serveur: 0, local: -1 };
        for (const r of Object.keys(memoire.regions)) if (r.startsWith(`${id}:`)) memoire.regions[r] = { serveur: 0, local: -1 };
      }
      stockage.ecrire(cle, JSON.stringify(memoire));
      suppressionEnAttente = null;
      bloque = false;
      statut = 'inactif';
      options.quandChange?.();
      if (cote === 'garder') await envoyer();
      return bloque || (statut as EtatSynchro) === 'hors-ligne' ? 'echec' : 'ok';
    } catch { return 'echec'; }
  }
  function modifications() {
    const compte = gestionnaire.chargerCompte();
    const id = gestionnaire.partieCourante();
    const partie = id ? gestionnaire.chargerPartie(id) : null;
    const region = partie ? gestionnaire.chargerRegion(partie.id, partie.donnees.regionCourante) : null;
    return { compte, partie, region,
      compteModifie: compte && compte.revision !== memoire.compte?.local,
      partieModifiee: partie && partie.revision !== memoire.parties[partie.id]?.local,
      regionModifiee: region && region.revision !== memoire.regions[`${partie?.id}:${region.id}`]?.local };
  }
  async function envoyer(fermeture = false): Promise<void> {
    if (arrete || bloque || suppressionCourante) return;
    if (options.enPause?.()) return;
    if (enCours) {
      suivant = true;
      fermetureSuivante ||= fermeture;
      return enCours;
    }
    const effectuer = async () => {
      try {
        const jeton = options.jeton();
        if (!jeton) return;
        const m = modifications();
        const { compte, partie, region } = m;
        const compteModifie = compte && m.compteModifie;
        const partieModifiee = partie && m.partieModifiee;
        const regionModifiee = region && m.regionModifiee;
        // Une partie neuve (ou recréée) part avec toutes ses régions locales encore inconnues du serveur, plus la région courante si elle a changé.
        const regions = partieModifiee && !(memoire.parties[partie.id]?.serveur ?? 0)
          ? lireLocal().regions.filter(r => (r.id === region?.id && regionModifiee) || !(memoire.regions[`${partie.id}:${r.id}`]?.serveur ?? 0))
          : regionModifiee ? [region] : [];
        if (!compteModifie && !partieModifiee && !regionModifiee) return;
        const appareilId = options.appareilId?.();
        const corps = JSON.stringify({
          ...((partieModifiee || regionModifiee) && appareilId != null && { appareilId }),
          ...(compteModifie && { compte: { revisionBase: memoire.compte?.serveur ?? 0, enveloppe: compte } }),
          ...((partieModifiee || regionModifiee) && { partieId: partie?.id }),
          ...(partieModifiee && { partie: { revisionBase: memoire.parties[partie.id]?.serveur ?? 0, enveloppe: partie } }),
          ...(regions.length > 0 && { regions: regions.map(r => ({ revisionBase: memoire.regions[`${partie!.id}:${r.id}`]?.serveur ?? 0, enveloppe: r })) }),
        });
        dernier = horloge.maintenant();
        const reponse = await (options.fetch ?? globalThis.fetch)(`${options.urlApi.replace(/\/+$/, '')}/api/sauvegarde`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jeton}` },
          credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer', signal: AbortSignal.timeout(8000),
          ...(fermeture && new TextEncoder().encode(corps).length <= 60_000 && { keepalive: true }), body: corps,
        });
        // Un envoi accepté par le serveur est toujours mémorisé, même si la synchro a été arrêtée entre-temps (sinon la révision de départ serait périmée).
        if (reponse.status === 200) {
          const resultat = await reponse.json() as { compte?: { revision: number }; partie?: { id: string; revision: number }; regions?: { id: string; revision: number }[] };
          if (compteModifie && resultat.compte) memoire.compte = { serveur: resultat.compte.revision, local: compte.revision };
          if (partieModifiee && resultat.partie?.id === partie.id) memoire.parties[partie.id] = { serveur: resultat.partie.revision, local: partie.revision };
          for (const region of regions) {
            const retourRegion = resultat.regions?.find(r => r.id === region.id);
            if (retourRegion) memoire.regions[`${partie!.id}:${region.id}`] = { serveur: retourRegion.revision, local: region.revision };
          }
          try { stockage.ecrire(cle, JSON.stringify(memoire)); } catch { /* Mémoire facultative. */ }
          if (!arrete) statut = 'ok';
        } else if (arrete) return;
        else if (reponse.status === 409) {
          const corps = await reponse.json().catch(() => null);
          if (corps?.code === 'ailleurs') {
            statut = 'ailleurs'; bloque = true; options.quandAilleurs?.(); options.quandChange?.(); return;
          }
          const supprimee = partie && (memoire.parties[partie.id]?.serveur ?? 0) > 0 && Array.isArray(corps?.conflits)
            && corps.conflits.some((c: { niveau?: unknown; id?: unknown; revisionServeur?: unknown } | null) =>
              c?.niveau === 'partie' && c.id === partie.id && c.revisionServeur === 0);
          if (supprimee) retenirSuppression(partie.id);
          else { statut = 'divergence'; bloque = true; options.quandChange?.(); }
        }
        else if (reponse.status === 404 && partie && !partieModifiee && regions.length > 0
          && (memoire.parties[partie.id]?.serveur ?? 0) > 0) retenirSuppression(partie.id);
        else if (reponse.status >= 400 && reponse.status < 500 && ![408, 429].includes(reponse.status)) { statut = 'refuse'; bloque = true; }
        else statut = 'hors-ligne';
      } catch { if (!arrete) statut = 'hors-ligne'; }
    };
    enCours = effectuer();
    await enCours;
    enCours = undefined;
    if (suivant) {
      const fermeture = fermetureSuivante;
      suivant = false;
      fermetureSuivante = false;
      await envoyer(fermeture);
    }
  }
  const enLigne = () => { if (statut === 'divergence' && !suppressionEnAttente) void resoudre(); else void envoyer(); };
  function arreter() {
    arrete = true;
    clearInterval(intervalle);
    clearTimeout(rattrapage);
    intervalle = undefined;
    rattrapage = undefined;
    suivant = false;
    fermetureSuivante = false;
    if (typeof window !== 'undefined') window.removeEventListener('online', enLigne);
  }
  async function lister(): Promise<{ parties: PartieListee[]; horsConnexion: boolean }> {
    const courante = gestionnaire.partieCourante();
    let parties: PartieListee[] = [];
    let horsConnexion = false;
    try {
      if (!options.jeton()) throw new Error('Sans connexion');
      parties = (await listerServeur()).map(p => ({ ...p, surServeur: true, courante: p.id === courante }));
    } catch { horsConnexion = true; }
    for (const p of gestionnaire.listerParties()) {
      if (parties.some(serveur => serveur.id === p.id)) continue;
      const partie = gestionnaire.chargerPartie(p.id)!;
      const region = gestionnaire.chargerRegion(p.id, p.regionCourante);
      parties.push({ ...p, zoneId: region?.donnees.zoneId ?? '', tempsJeuMs: partie.donnees.statistiques.tempsJeuMs ?? null,
        surServeur: false, courante: p.id === courante });
    }
    parties.sort((a, b) => Date.parse(b.ecritLe) - Date.parse(a.ecritLe));
    return { parties, horsConnexion };
  }
  async function ouvrirPartie(id: string): Promise<'ok' | 'echec'> {
    try {
      await envoyer();
      if (!gestionnaire.chargerPartie(id)) {
        // Sans le compte : une copie locale non envoyée ne doit jamais être écrasée en changeant de partie.
        const version = { ...await lireVersion(id), compte: null };
        gestionnaire.installerVersion(version);
        memoriserVersion(version, 'partie');
      }
      gestionnaire.choisirPartie(id);
      return 'ok';
    } catch { return 'echec'; }
  }
  async function creerPartie(nom: string, depart: Pick<DonneesRegion, 'equipe' | 'drapeaux'>): Promise<'ok' | 'echec' | 'plein' | 'nom-invalide'> {
    nom = nom.trim();
    if (!nom.length || nom.length > 100) return 'nom-invalide';
    try {
      if ((await lister()).parties.length >= 20) return 'plein';
      await envoyer(); // les dernières modifications de la partie quittée partent avant le changement
      creerPartieNommee({ stockage, horloge, genererId: genererIdentifiant }, nom, depart);
      await envoyer();
      return 'ok';
    } catch { return 'echec'; }
  }
  async function supprimerPartie(id: string): Promise<'ok' | 'echec'> {
    const courante = gestionnaire.partieCourante() === id;
    if (courante) suppressionCourante = true;
    let succes = false;
    try {
      if (courante) await enCours;
      try {
        const reponse = await requete(`/parties/${encodeURIComponent(id)}`, 'DELETE');
        if (reponse.status !== 200 && reponse.status !== 404) throw new Error('Suppression impossible');
      } catch (erreur) {
        // L'échec n'est toléré que pour une partie purement locale, jamais envoyée.
        if (!gestionnaire.chargerPartie(id) || (memoire.parties[id]?.serveur ?? 0) > 0) throw erreur;
      }
      gestionnaire.supprimerPartie(id);
      delete memoire.parties[id];
      for (const region of Object.keys(memoire.regions)) if (region === id || region.startsWith(`${id}:`)) delete memoire.regions[region];
      stockage.ecrire(cle, JSON.stringify(memoire));
      succes = true;
      return 'ok';
    } catch { return 'echec'; }
    finally { if (courante && !succes) suppressionCourante = false; }
  }
  return {
    ouvrir,
    lister,
    ouvrirPartie,
    creerPartie,
    supprimerPartie,
    suppression: () => suppressionEnAttente,
    resoudreSuppression,
    resoudre,
    enAttente: () => {
      if (statut === 'ailleurs') return false;
      const m = modifications();
      return !!(m.compteModifie || m.partieModifiee || m.regionModifiee);
    },
    lireAvis(): string | null {
      try {
        const avis = stockage.lire('pokiclicker:synchro-avis');
        stockage.supprimer('pokiclicker:synchro-avis');
        return avis && JSON.parse(avis)?.divergence
          ? 'Cette partie a avancé sur un autre appareil. Nous avons repris la sauvegarde la plus récente ; ce que tu avais joué ici est gardé en secours sur le serveur.'
          : null;
      } catch { return null; }
    },
    demarrer() {
      if (intervalle !== undefined) return;
      if (arrete && statut !== 'divergence' && statut !== 'ailleurs') bloque = false;
      arrete = false;
      intervalle = setInterval(enLigne, options.intervalleMs ?? 45_000);
      if (typeof window !== 'undefined') window.addEventListener('online', enLigne);
    },
    arreter,
    envoyerMaintenant({ fermeture = false }: { fermeture?: boolean } = {}): Promise<void> {
      if (arrete || bloque) return Promise.resolve();
      if (fermeture || enCours) {
        clearTimeout(rattrapage);
        rattrapage = undefined;
        return envoyer(fermeture);
      }
      const reste = (options.delaiMiniMs ?? 2000) - (horloge.maintenant() - dernier);
      if (reste <= 0) return envoyer();
      if (rattrapage === undefined) rattrapage = setTimeout(() => {
        rattrapage = undefined;
        void envoyer();
      }, reste);
      return Promise.resolve();
    },
    etat: () => statut,
  };
}
