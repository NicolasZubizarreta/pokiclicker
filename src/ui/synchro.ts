import type { Horloge } from '../core/clock';
import { creerGestionnaire, creerStockageMemoire, type DonneesCompte, type DonneesPartie, type DonneesRegion, type Enveloppe, type Stockage } from '../core/sauvegarde';

export type EtatSynchro = 'inactif' | 'ok' | 'hors-ligne' | 'conflit' | 'refuse';
type Revision = { serveur: number; local: number };
export type Memoire = { version: 1; compte?: Revision; parties: Record<string, Revision>; regions: Record<string, Revision> };
type Version = { compte?: Enveloppe<DonneesCompte> | null; partie: Enveloppe<DonneesPartie> | null; regions: Enveloppe<DonneesRegion>[] };
type VersionServeur = Version & { partie: Enveloppe<DonneesPartie> };
export type Resume = { regionId: string; zoneId: string; ecritLe: string; tempsJeuMs: number | null };
export function decider(local: Version, serveur: Version | null, memoire: Memoire): 'rien' | 'charger' | 'choisir' {
  if (!serveur?.partie) return 'rien';
  if (local.partie && local.partie.id !== serveur.partie.id) return 'choisir';
  const region = local.regions.find(r => r.id === local.partie?.donnees.regionCourante);
  const localChange = !!((local.compte && local.compte.revision !== memoire.compte?.local)
    || (local.partie && local.partie.revision !== memoire.parties[local.partie.id]?.local)
    || (region && region.revision !== memoire.regions[`${local.partie?.id}:${region.id}`]?.local));
  const serveurChange = !!((serveur.compte && serveur.compte.revision !== memoire.compte?.serveur)
    || serveur.partie.revision !== memoire.parties[serveur.partie.id]?.serveur
    || serveur.regions.some(r => r.revision !== memoire.regions[`${serveur.partie!.id}:${r.id}`]?.serveur));
  return !serveurChange ? 'rien' : !local.partie || !localChange ? 'charger' : 'choisir';
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
}) {
  const { stockage, horloge } = options;
  const gestionnaire = creerGestionnaire({ stockage, horloge, genererId: () => 'x' });
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
  let intervalle: ReturnType<typeof setInterval> | undefined;
  let rattrapage: ReturnType<typeof setTimeout> | undefined;
  let enCours: Promise<void> | undefined;
  let suivant = false;
  let fermetureSuivante = false;
  let dernier = -Infinity;
  let versionServeur: VersionServeur | null = null;
  let luLe = -Infinity;
  let choixEnAttente: { local: Resume; serveur: Resume } | null = null;
  let lecture: Promise<void> | undefined;
  let arbitrage = false;
  function changerChoix(choix: typeof choixEnAttente) {
    choixEnAttente = choix;
    options.quandChange?.();
  }
  function lireLocal(): Version {
    const recente = gestionnaire.listerParties()[0];
    const partie = recente ? gestionnaire.chargerPartie(recente.id) : null;
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
  async function lireServeur(): Promise<VersionServeur | null> {
    const liste = await requete('/parties');
    if (!liste.ok) throw new Error('Lecture impossible');
    const contenu = await liste.json();
    if (!contenu || !Array.isArray(contenu.parties)) throw new Error('Liste invalide');
    if (!contenu.parties.length) return null;
    const premiere = contenu.parties[0];
    if (!premiere || typeof premiere.id !== 'string' || typeof premiere.nom !== 'string'
      || !Number.isSafeInteger(premiere.revision) || typeof premiere.ecritLe !== 'string') throw new Error('Partie invalide');
    const [detail, compte] = await Promise.all([requete(`/parties/${encodeURIComponent(premiere.id)}`), requete('/compte')]);
    if (!detail.ok || (!compte.ok && compte.status !== 404)) throw new Error('Lecture impossible');
    const donnees = await detail.json();
    const enveloppe = compte.status === 404 ? null : (await compte.json())?.enveloppe;
    if (!donnees || !Array.isArray(donnees.regions) || donnees.partie?.id !== premiere.id
      || (compte.status !== 404 && !enveloppe)) throw new Error('Version invalide');
    const version: VersionServeur = { compte: enveloppe, partie: donnees.partie, regions: donnees.regions };
    // La même validation que l'installation, dans un stockage isolé, avant tout choix ou archivage.
    creerGestionnaire({ stockage: creerStockageMemoire(), horloge, genererId: () => 'x' }).installerVersion(version);
    return version;
  }
  function memoriserVersion(version: VersionServeur) {
    const revision = (enveloppe: Enveloppe<unknown>) => ({ serveur: enveloppe.revision, local: enveloppe.revision });
    if (version.compte) memoire.compte = revision(version.compte);
    memoire.parties[version.partie.id] = revision(version.partie);
    for (const id of Object.keys(memoire.regions)) if (id.startsWith(`${version.partie.id}:`)) delete memoire.regions[id];
    for (const region of version.regions) memoire.regions[`${version.partie.id}:${region.id}`] = revision(region);
    stockage.ecrire(cle, JSON.stringify(memoire));
  }
  function retenir(version: VersionServeur) {
    versionServeur = version;
    luLe = horloge.maintenant();
    bloque = true;
    statut = 'conflit';
    changerChoix({ local: resumer(lireLocal()), serveur: resumer(version) });
  }
  async function preparerChoix() {
    if (lecture || arrete) return lecture;
    lecture = (async () => {
      try {
        const version = await lireServeur();
        if (!arrete && version) retenir(version);
      } catch { /* Le conflit reste bloqué ; la prochaine connexion retentera la lecture. */ }
    })();
    await lecture;
    lecture = undefined;
  }
  async function ouvrir(): Promise<'rien' | 'charge' | 'choix' | 'hors-ligne'> {
    arrete = false;
    if (!options.jeton()) return 'rien';
    try {
      const serveur = await lireServeur();
      if (arrete) return 'hors-ligne';
      const decision = decider(lireLocal(), serveur, memoire);
      if (decision === 'charger' && serveur) {
        gestionnaire.installerVersion(serveur);
        memoriserVersion(serveur);
        return 'charge';
      }
      if (decision === 'choisir' && serveur) { retenir(serveur); return 'choix'; }
      return 'rien';
    } catch { return 'hors-ligne'; }
  }
  async function trancher(choix: 'local' | 'serveur'): Promise<'ok' | 'echec'> {
    if (arbitrage || !choixEnAttente || arrete) return 'echec';
    arbitrage = true;
    try {
      if (choix === 'serveur' && (!versionServeur || horloge.maintenant() - luLe > 60_000)) {
        const version = await lireServeur();
        if (!version || arrete) return 'echec';
        versionServeur = version;
        luLe = horloge.maintenant();
      }
      const serveur = versionServeur;
      if (!serveur) return 'echec';
      const local = lireLocal();
      if (choix === 'local') {
        if (local.compte) memoire.compte = { serveur: serveur.compte?.revision ?? 0, local: -1 };
        if (local.partie) {
          const memePartie = local.partie.id === serveur.partie.id;
          memoire.parties[local.partie.id] = { serveur: memePartie ? serveur.partie.revision : memoire.parties[local.partie.id]?.serveur ?? 0, local: -1 };
          const region = local.regions.find(r => r.id === local.partie!.donnees.regionCourante);
          if (region) memoire.regions[`${local.partie.id}:${region.id}`] = {
            serveur: memePartie ? serveur.regions.find(r => r.id === region.id)?.revision ?? 0
              : memoire.regions[`${local.partie.id}:${region.id}`]?.serveur ?? 0, local: -1,
          };
        }
        stockage.ecrire(cle, JSON.stringify(memoire));
        bloque = false;
        statut = 'inactif';
        changerChoix(null);
        await envoyer();
        return (['conflit', 'refuse'] as EtatSynchro[]).includes(statut) ? 'echec' : 'ok';
      }
      const archiver = async (niveau: 'compte' | 'partie' | 'region', objetId: string, enveloppe: Enveloppe<unknown>) => {
        const reponse = await requete('/versions', 'POST', { niveau, objetId, enveloppe });
        if (!reponse.ok || arrete) throw new Error('Archivage impossible');
      };
      if (local.compte) await archiver('compte', 'local', local.compte);
      if (local.partie) {
        await archiver('partie', local.partie.id, local.partie);
        for (const region of local.regions) await archiver('region', `${local.partie.id}:${region.id}`, region);
      }
      gestionnaire.installerVersion(serveur);
      if (local.partie && local.partie.id !== serveur.partie.id) {
        gestionnaire.supprimerPartie(local.partie.id);
        delete memoire.parties[local.partie.id];
        for (const id of Object.keys(memoire.regions)) if (id.startsWith(`${local.partie.id}:`)) delete memoire.regions[id];
      }
      memoriserVersion(serveur);
      bloque = false;
      statut = 'inactif';
      changerChoix(null);
      return 'ok';
    } catch { return 'echec'; }
    finally { arbitrage = false; }
  }

  async function envoyer(fermeture = false): Promise<void> {
    if (arrete || bloque) return;
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
        const compte = gestionnaire.chargerCompte();
        const recente = gestionnaire.listerParties()[0];
        const partie = recente ? gestionnaire.chargerPartie(recente.id) : null;
        const region = partie ? gestionnaire.chargerRegion(partie.id, partie.donnees.regionCourante) : null;
        const cleRegion = partie && region ? `${partie.id}:${region.id}` : '';
        const compteModifie = compte && compte.revision !== memoire.compte?.local;
        const partieModifiee = partie && partie.revision !== memoire.parties[partie.id]?.local;
        const regionModifiee = region && region.revision !== memoire.regions[cleRegion]?.local;
        if (!compteModifie && !partieModifiee && !regionModifiee) return;
        const corps = JSON.stringify({
          ...(compteModifie && { compte: { revisionBase: memoire.compte?.serveur ?? 0, enveloppe: compte } }),
          ...((partieModifiee || regionModifiee) && { partieId: partie?.id }),
          ...(partieModifiee && { partie: { revisionBase: memoire.parties[partie.id]?.serveur ?? 0, enveloppe: partie } }),
          ...(regionModifiee && { regions: [{ revisionBase: memoire.regions[cleRegion]?.serveur ?? 0, enveloppe: region }] }),
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
          const retourRegion = resultat.regions?.find(r => r.id === region?.id);
          if (regionModifiee && retourRegion) memoire.regions[cleRegion] = { serveur: retourRegion.revision, local: region.revision };
          try { stockage.ecrire(cle, JSON.stringify(memoire)); } catch { /* Mémoire facultative. */ }
          if (!arrete) statut = 'ok';
        } else if (arrete) return;
        else if (reponse.status === 409) { statut = 'conflit'; bloque = true; await preparerChoix(); }
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
  const enLigne = () => { if (statut === 'conflit' && !choixEnAttente) void preparerChoix(); else void envoyer(); };
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
  return {
    ouvrir,
    choix: () => choixEnAttente,
    trancher,
    demarrer() {
      if (intervalle !== undefined) return;
      if (arrete && statut !== 'conflit') bloque = false;
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
