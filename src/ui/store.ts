import { createStore } from 'zustand/vanilla';
import { creerHorlogeSysteme } from '../core/clock';
import type { Horloge } from '../core/clock';
import { avancerCombat, calculerClic, calculerDpsEquipe, cliquer, creerCombat, creerLimiteurClics,
  reprendreCombat, viderEvenements } from '../core/combat';
import type { EtatCombat } from '../core/combat';
import type { Ennemi } from '../core/ennemis';
import { creerBoucle } from '../core/loop';
import { chargerPokemon } from '../core/pokemon';
import { appliquerVictoire, calculerMaxXp } from '../core/recompenses';
import type { FormeCarte, Zone, ZoneMonde } from '../core/monde';
import { kanto } from '../core/regions';
import { reglages } from '../core/reglages';
import { etatMondeDe, versMembreEquipe } from '../core/sauvegarde';
import type { DonneesRegion, PokemonPossede, Stockage } from '../core/sauvegarde';
import { detailErreur, ouvrirPartie } from './persistance';
import { creerStockageLocal } from './stockage-local';
import { genererIdentifiant } from './identifiants';
import { imageConnue } from './Image';
import { cheminDecor, precharger, prechargerZone } from './precharger';

export type Degat = { id: number; valeur: number };
export type CaseEquipe = { pokemon: PokemonPossede; dps: number; xpMax: number } | null;
export type Destination = { id: string; nom: string; ouverte: boolean; raison: string | null };
export type EtatForme = {
  forme: FormeCarte; zone: string | null; nom: string; numero: number | null;
  ouverte: boolean; actuelle: boolean; raison: string | null;
};
export type AffichageJeu = {
  lieu: ZoneMonde | null; zone: Zone | null; etape: number; ennemi: Omit<Ennemi, 'capture'> | null; pv: number;
  equipe: CaseEquipe[]; dps: number; erreur: string | null;
  erreurChargement: boolean; zonePrecedente: Destination | null; zoneSuivante: Destination | null;
  minuteur: { restantMs: number; totalMs: number } | null;
  evenementsDegats: Degat[];
  argent: number; enRecherche: boolean; annonce: string | null;
  carte: { formes: EtatForme[]; badges: { obtenus: number; total: number }; nouvelles: string[]; tutorielRoute1: boolean };
  voirCarte(): void;
  allerVers(zoneId: string): void; attaquer(): void; demarrer(): void; arreter(): void; fermer(): void; tick(): void;
};

export function creerStoreJeu({ horloge, stockage, alea, genererId }: {
  horloge: Horloge; stockage: Stockage; alea: () => number; genererId: () => string;
}) {
  let coeur: EtatCombat | null = null;
  let initialise = false;
  let zonesVues = new Set<string>();
  const totalBadges = kanto.zones.filter(zone => !zone.sansCombat && zone.type === 'arene').length;
  let region: DonneesRegion;
  let persistance: ReturnType<typeof ouvrirPartie>;
  let boucle: ReturnType<typeof creerBoucle<null>> | undefined;
  let minuteur: ReturnType<typeof setInterval> | undefined;
  let sauvegarde: ReturnType<typeof setInterval> | undefined;
  let erreur: string | null = null;
  let degats: Degat[] = [];
  let identifiantDegat = 0;
  const catalogue = chargerPokemon();
  let annonce: string | null = null;
  let finAnnonceMs = 0;
  // Temps effectivement simulé par la boucle utilisant l'horloge injectée.
  let tempsJeuMs = 0;
  const abonnesDegats = new Set<(degat: Degat) => void>();
  const limiteur = creerLimiteurClics(horloge);
  const enregistrer = () => {
    if (!initialise) return;
    try { persistance.enregistrer(region); } catch (cause) { erreur = detailErreur(cause); }
  };
  const traiter = () => {
    if (!coeur) return;
    region = { ...region, zoneId: coeur.zoneId, etape: coeur.etape };
    let sauvegarder = false;
    for (const evenement of coeur.evenements) {
      if (evenement.type === 'ennemi-vaincu') {
        const r = appliquerVictoire(region, evenement, coeur.actifs);
        region = r.region;
        const messages: string[] = [];
        if (r.montees.length === 1) {
          const montee = r.montees[0]!;
          const pokemon = region.equipe.find(p => p.uid === montee.uid)!;
          messages.push(`${pokemon.surnom ?? catalogue.parNumero(pokemon.numero).nom} passe au niveau ${montee.niveau} !`);
        } else if (r.montees.length > 1) messages.push(`${r.montees.length} Pokémon montent de niveau !`);
        if (evenement.shiny) messages.push(`Chromatique ! +${r.bonbons} Bonbons`);
        if (messages.length > 0) {
          annonce = messages.join(' · ');
          finAnnonceMs = tempsJeuMs + reglages.interface.annonceMs;
        }
      }
      if (evenement.type === 'boss-vaincu') {
        if (!region.bossVaincus.includes(evenement.zoneId)) {
          region = { ...region, bossVaincus: [...region.bossVaincus, evenement.zoneId] };
          if (kanto.liensDepuis(evenement.zoneId).length > 0) {
            annonce = 'Zone débloquée !';
            finAnnonceMs = tempsJeuMs + reglages.interface.annonceMs;
          }
        }
        sauvegarder = true;
      }
      if (evenement.type === 'boss-echoue') {
        annonce = 'Temps écoulé !';
        finAnnonceMs = tempsJeuMs + reglages.interface.annonceMs;
      }
    }
    coeur = { ...coeur, equipe: region.equipe.map(versMembreEquipe) };
    coeur = viderEvenements(coeur);
    if (sauvegarder) enregistrer();
  };
  const afficher = () => {
    if (!initialise) return;
    const lieu = kanto.zone(region.zoneId);
    const lien = lieu.liens[0];
    const destination = (zone: ZoneMonde | undefined): Destination | null => {
      if (!zone) return null;
      const acces = kanto.accesZone(zone.id, etatMondeDe(region));
      return { id: zone.id, nom: zone.nom, ouverte: acces.ok, raison: acces.ok ? null : acces.raison ?? null };
    };
    const equipe: CaseEquipe[] = region.equipe.map(pokemon => ({ pokemon,
      xpMax: calculerMaxXp(pokemon.numero, pokemon.niveau),
      dps: coeur ? calculerDpsEquipe([versMembreEquipe(pokemon)], coeur.ennemi) : 0 }));
    while (equipe.length < 6) equipe.push(null);
    const precedent = store.getState();
    const etatMonde = etatMondeDe(region);
    const ouvertes = new Set(kanto.zonesOuvertes(etatMonde).map(zone => zone.id));
    const carte: AffichageJeu['carte'] = {
      formes: kanto.carte.formes.map(forme => {
        const ouverte = forme.zone !== null && ouvertes.has(forme.zone);
        const acces = forme.zone !== null && !ouverte ? kanto.accesZone(forme.zone, etatMonde) : null;
        return { forme, zone: forme.zone, nom: forme.nom,
          numero: forme.zone === null ? null : kanto.zone(forme.zone).ancienId,
          ouverte, actuelle: forme.zone === region.zoneId,
          raison: acces && !acces.ok ? acces.raison ?? null : null };
      }),
      badges: { obtenus: region.badges.length, total: totalBadges },
      nouvelles: [...ouvertes].filter(id => !zonesVues.has(id)),
      tutorielRoute1: region.zoneId === kanto.depart && region.bossVaincus.length === 0,
    };
    const zonePrecedente = destination(kanto.zonePrecedente(lieu.id));
    const zoneSuivante = destination(lien ? kanto.zone(lien.vers) : undefined);
    const ennemi = coeur ? (({ numero, niveau, pv, pvMax, boss, shiny, rarete }) => ({ numero, niveau, pv, pvMax, boss, shiny, rarete }))(coeur.ennemi) : null;
    store.setState({ lieu, zone: coeur?.zone ?? null, etape: region.etape, ennemi, pv: ennemi?.pv ?? 0,
      carte: JSON.stringify(carte) === JSON.stringify(precedent.carte) ? precedent.carte : carte,
      equipe: JSON.stringify(equipe) === JSON.stringify(precedent.equipe) ? precedent.equipe : equipe,
      dps: coeur ? calculerDpsEquipe(coeur.equipe, coeur.ennemi) : 0, erreur,
      argent: region.argent, enRecherche: (coeur?.attenteMs ?? 0) > 0, annonce,
      minuteur: coeur && coeur.attenteMs === 0 && coeur.minuteurMs !== null
        ? { restantMs: coeur.minuteurMs, totalMs: reglages.combat.minuteurBossMs } : null,
      zonePrecedente: JSON.stringify(zonePrecedente) === JSON.stringify(precedent.zonePrecedente) ? precedent.zonePrecedente : zonePrecedente,
      zoneSuivante: JSON.stringify(zoneSuivante) === JSON.stringify(precedent.zoneSuivante) ? precedent.zoneSuivante : zoneSuivante,
      evenementsDegats: degats });
    degats = [];
  };
  const prechargerLieu = () => {
    const lieu = kanto.zone(region.zoneId);
    if (imageConnue(cheminDecor(lieu))) void precharger([cheminDecor(lieu)]);
    if (!lieu.sansCombat) void prechargerZone(lieu);
  };
  const cacher = () => { if (document.visibilityState === 'hidden') enregistrer(); };
  const store = createStore<AffichageJeu>(() => ({
    lieu: null, zone: null, etape: 1, ennemi: null, pv: 0, equipe: [], dps: 0, minuteur: null,
    erreur: null, erreurChargement: false, zonePrecedente: null, zoneSuivante: null, evenementsDegats: [],
    argent: 0, enRecherche: false, annonce: null,
    carte: { formes: [], badges: { obtenus: 0, total: totalBadges }, nouvelles: [], tutorielRoute1: false },
    voirCarte() {
      if (!initialise) return;
      zonesVues = new Set(kanto.zonesOuvertes(etatMondeDe(region)).map(zone => zone.id));
      afficher();
    },
    allerVers(zoneId) {
      if (!initialise || !kanto.accesZone(zoneId, etatMondeDe(region)).ok) return;
      const lieu = kanto.zone(zoneId);
      coeur = lieu.sansCombat ? null : creerCombat(lieu, region.equipe.map(versMembreEquipe), alea);
      region = { ...region, zoneId, etape: 1 };
      annonce = null;
      degats = [];
      prechargerLieu();
      enregistrer();
      afficher();
    },
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
        if (!initialise) {
          persistance = ouvrirPartie({ stockage, horloge, genererId });
          region = persistance.region;
          zonesVues = new Set(kanto.zonesOuvertes(etatMondeDe(region)).map(zone => zone.id));
          const lieu = kanto.zone(region.zoneId);
          coeur = lieu.sansCombat ? null : reprendreCombat(lieu, region.equipe.map(versMembreEquipe), alea, region.etape);
          initialise = true;
          prechargerLieu();
          afficher();
        }
        boucle = creerBoucle({ horloge, etat: null, avancer: () => {
          tempsJeuMs += reglages.boucle.pasMs;
          if (annonce !== null && tempsJeuMs >= finAnnonceMs) annonce = null;
          if (coeur) coeur = avancerCombat(coeur, reglages.boucle.pasMs);
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
  alea: Math.random, genererId: genererIdentifiant });
