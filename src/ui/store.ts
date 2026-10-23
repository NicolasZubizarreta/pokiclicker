import { createStore } from 'zustand/vanilla';
import { creerHorlogeSysteme } from '../core/clock';
import type { Horloge } from '../core/clock';
import { avancerCombat, calculerClic, calculerDpsEquipe, cliquer, creerLimiteurClics,
  reprendreCombat, viderEvenements } from '../core/combat';
import type { EtatCombat } from '../core/combat';
import type { Ennemi } from '../core/ennemis';
import { creerBoucle } from '../core/loop';
import type { Zone } from '../core/monde';
import { kanto } from '../core/regions';
import { reglages } from '../core/reglages';
import { etatMondeDe, versMembreEquipe } from '../core/sauvegarde';
import type { DonneesRegion, PokemonPossede, Stockage } from '../core/sauvegarde';
import { detailErreur, ouvrirPartie } from './persistance';
import { creerStockageLocal } from './stockage-local';

export type Degat = { id: number; valeur: number };
export type CaseEquipe = { pokemon: PokemonPossede; dps: number } | null;
export type AffichageJeu = {
  zone: Zone | null; etape: number; ennemi: Omit<Ennemi, 'capture'> | null; pv: number;
  equipe: CaseEquipe[]; dps: number; finZone: string | null; erreur: string | null;
  erreurChargement: boolean; suite: { nom: string; raison: string } | null;
  evenementsDegats: Degat[];
  attaquer(): void; demarrer(): void; arreter(): void; fermer(): void; tick(): void;
};

export function creerStoreJeu({ horloge, stockage, alea, genererId }: {
  horloge: Horloge; stockage: Stockage; alea: () => number; genererId: () => string;
}) {
  let coeur: EtatCombat | undefined;
  let region: DonneesRegion;
  let persistance: ReturnType<typeof ouvrirPartie>;
  let boucle: ReturnType<typeof creerBoucle<null>> | undefined;
  let minuteur: ReturnType<typeof setInterval> | undefined;
  let sauvegarde: ReturnType<typeof setInterval> | undefined;
  let erreur: string | null = null;
  let finZone: string | null = null;
  let degats: Degat[] = [];
  let identifiantDegat = 0;
  const abonnesDegats = new Set<(degat: Degat) => void>();
  const limiteur = creerLimiteurClics(horloge);
  const enregistrer = () => {
    if (!coeur) return;
    try { persistance.enregistrer(region); } catch (cause) { erreur = detailErreur(cause); }
  };
  const traiter = () => {
    if (!coeur) return;
    region = { ...region, zoneId: coeur.zoneId, etape: coeur.etape };
    for (const evenement of coeur.evenements) {
      if (evenement.type === 'boss-vaincu' && !region.bossVaincus.includes(evenement.zoneId)) {
        region = { ...region, bossVaincus: [...region.bossVaincus, evenement.zoneId] };
        finZone = `${coeur.zone.nom} terminée !`;
        enregistrer();
      }
    }
    coeur = viderEvenements(coeur);
  };
  const afficher = () => {
    if (!coeur) return;
    const lien = kanto.liensDepuis(coeur.zoneId)[0];
    const passage = lien ? kanto.peutPasser(coeur.zoneId, lien.vers, etatMondeDe(region)) : null;
    const equipe: CaseEquipe[] = region.equipe.map(pokemon => ({ pokemon,
      dps: calculerDpsEquipe([versMembreEquipe(pokemon)], coeur!.ennemi) }));
    while (equipe.length < 6) equipe.push(null);
    const precedent = store.getState();
    const suite = lien ? { nom: kanto.zone(lien.vers).nom,
      raison: passage?.ok ? 'La suite arrive bientôt.' : passage?.raison ?? '' } : null;
    const { numero, niveau, pv, pvMax, boss, shiny } = coeur.ennemi;
    store.setState({ zone: coeur.zone, etape: coeur.etape, ennemi: { numero, niveau, pv, pvMax, boss, shiny }, pv,
      equipe: JSON.stringify(equipe) === JSON.stringify(precedent.equipe) ? precedent.equipe : equipe,
      dps: calculerDpsEquipe(coeur.equipe, coeur.ennemi), finZone, erreur,
      suite: JSON.stringify(suite) === JSON.stringify(precedent.suite) ? precedent.suite : suite,
      evenementsDegats: degats });
    degats = [];
  };
  const cacher = () => { if (document.visibilityState === 'hidden') enregistrer(); };
  const store = createStore<AffichageJeu>(() => ({
    zone: null, etape: 1, ennemi: null, pv: 0, equipe: [], dps: 0, finZone: null,
    erreur: null, erreurChargement: false, suite: null, evenementsDegats: [],
    attaquer() {
      if (!coeur || minuteur === undefined) return;
      const avant = coeur;
      coeur = cliquer(coeur, limiteur);
      if (avant === coeur) return;
      const degat = { id: ++identifiantDegat,
        valeur: Math.min(avant.ennemi.pv, calculerClic(calculerDpsEquipe(avant.equipe, avant.ennemi))) };
      degats.push(degat);
      abonnesDegats.forEach(abonne => abonne(degat));
      traiter();
    },
    demarrer() {
      if (minuteur !== undefined || store.getState().erreurChargement) return;
      try {
        if (!coeur) {
          persistance = ouvrirPartie({ stockage, horloge, genererId });
          region = persistance.region;
          coeur = reprendreCombat(kanto.zone(region.zoneId), region.equipe.map(versMembreEquipe), alea, region.etape);
          afficher();
        }
        boucle = creerBoucle({ horloge, etat: null, avancer: () => {
          coeur = avancerCombat(coeur!, reglages.boucle.pasMs);
          traiter();
          return null;
        } });
        boucle.abonner(afficher);
        minuteur = setInterval(() => boucle!.tick(), reglages.boucle.pasMs);
        sauvegarde = setInterval(enregistrer, reglages.interface.sauvegardeAutoMs);
        if (typeof window !== 'undefined') {
          window.addEventListener('pagehide', enregistrer);
          document.addEventListener('visibilitychange', cacher);
        }
      } catch (cause) {
        store.setState({ erreur: detailErreur(cause), erreurChargement: true });
      }
    },
    arreter() {
      clearInterval(minuteur);
      clearInterval(sauvegarde);
      minuteur = undefined;
      boucle = undefined;
      if (typeof window !== 'undefined') {
        window.removeEventListener('pagehide', enregistrer);
        document.removeEventListener('visibilitychange', cacher);
      }
    },
    fermer: enregistrer,
    tick: () => { boucle?.tick(); },
  }));
  return Object.assign(store, {
    abonnerDegats(abonne: (degat: Degat) => void) {
      abonnesDegats.add(abonne);
      return () => { abonnesDegats.delete(abonne); };
    },
  });
}

export type StoreJeu = ReturnType<typeof creerStoreJeu>;
export const storeJeu = creerStoreJeu({ horloge: creerHorlogeSysteme(), stockage: creerStockageLocal(),
  alea: Math.random, genererId: () => crypto.randomUUID() });
