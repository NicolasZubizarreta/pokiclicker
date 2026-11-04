import type { Horloge } from '../core/clock';
import { creerGestionnaire, type Stockage } from '../core/sauvegarde';
import { genererIdentifiant } from './identifiants';

export function creerAppareilActif(options: {
  stockage: Stockage; horloge: Horloge; urlApi: string; jeton: () => string | null;
  fetch?: typeof fetch; intervalleMs?: number; quandChange?: () => void;
}) {
  const { stockage, horloge } = options;
  let appareilId: string | null = null;
  try { appareilId = stockage.lire('pokiclicker:appareil'); } catch { /* Identifiant en mémoire si nécessaire. */ }
  if (!appareilId) {
    appareilId = genererIdentifiant();
    try { stockage.ecrire('pokiclicker:appareil', appareilId); } catch { /* La session conserve son identifiant. */ }
  }
  const gestionnaire = creerGestionnaire({ stockage, horloge, genererId: () => 'x' });
  let ailleurs = false;
  let ouvert = false;
  let enCours = false;
  let generation = 0; // une reprise rend caduc tout battement parti avant elle
  let intervalle: ReturnType<typeof setInterval> | undefined;
  function changer(valeur: boolean) {
    if (ailleurs === valeur) return;
    ailleurs = valeur;
    options.quandChange?.();
  }
  async function requete(reprendre = false): Promise<boolean | undefined> {
    try {
      const jeton = options.jeton();
      const partieId = gestionnaire.listerParties()[0]?.id;
      if (!jeton || !partieId) return;
      const reponse = await (options.fetch ?? globalThis.fetch)(`${options.urlApi.replace(/\/+$/, '')}/api/sauvegarde/parties/${encodeURIComponent(partieId)}/appareil`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jeton}` },
        credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer', signal: AbortSignal.timeout(8000),
        body: JSON.stringify({ appareilId, ...(reprendre && { reprendre: true }) }),
      });
      if (reponse.status !== 200) return;
      const corps: unknown = await reponse.json();
      if (corps && typeof corps === 'object' && 'actif' in corps && typeof corps.actif === 'boolean') return corps.actif;
    } catch { /* Sans réponse claire, conserver l'accès hors connexion. */ }
  }
  async function battre() {
    if (!ouvert || intervalle === undefined || enCours) return;
    enCours = true;
    const depart = generation;
    try {
      const actif = await requete();
      if (intervalle !== undefined && actif !== undefined && depart === generation) changer(!actif);
    } finally { enCours = false; }
  }
  return {
    async ouvrir(): Promise<'libre' | 'ailleurs'> {
      const actif = await requete();
      ouvert = true;
      changer(actif === false);
      return ailleurs ? 'ailleurs' : 'libre';
    },
    demarrer() {
      if (!ouvert || intervalle !== undefined) return;
      intervalle = setInterval(() => { void battre(); }, options.intervalleMs ?? 60_000);
      window.addEventListener('online', battre);
    },
    arreter() {
      clearInterval(intervalle);
      intervalle = undefined;
      window.removeEventListener('online', battre);
    },
    async reprendre(): Promise<'ok' | 'echec'> {
      generation++;
      const prise = await requete(true) === true;
      generation++;
      if (!prise) return 'echec';
      ailleurs = false;
      options.quandChange?.();
      return 'ok';
    },
    ailleurs: () => ailleurs,
  };
}
