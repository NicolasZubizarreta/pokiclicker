import type { Horloge } from '../core/clock';
import { creerGestionnaire, type Stockage } from '../core/sauvegarde';

export type EtatSynchro = 'inactif' | 'ok' | 'hors-ligne' | 'conflit' | 'refuse';
type Revision = { serveur: number; local: number };
type Memoire = { version: 1; compte?: Revision; parties: Record<string, Revision>; regions: Record<string, Revision> };
const cle = 'pokiclicker:synchro';

export function creerSynchro(options: {
  stockage: Stockage; horloge: Horloge; urlApi: string; jeton: () => string | null;
  fetch?: typeof fetch; intervalleMs?: number; delaiMiniMs?: number;
}) {
  const { stockage, horloge } = options;
  const gestionnaire = creerGestionnaire({ stockage, horloge, genererId: () => 'x' });
  let memoire: Memoire = { version: 1, parties: {}, regions: {} };
  try {
    const valeur: unknown = JSON.parse(stockage.lire(cle) ?? 'null');
    const revisionValide = (r: unknown): r is Revision => !!r && typeof r === 'object'
      && 'serveur' in r && Number.isSafeInteger(r.serveur) && Number(r.serveur) >= 0
      && 'local' in r && Number.isSafeInteger(r.local) && Number(r.local) >= 0;
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

  async function envoyer(fermeture = false): Promise<void> {
    if (arrete || bloque) return;
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
        else if (reponse.status === 409) { statut = 'conflit'; bloque = true; }
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
  const enLigne = () => { void envoyer(); };
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
    demarrer() {
      if (intervalle !== undefined) return;
      if (arrete) bloque = false;
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
