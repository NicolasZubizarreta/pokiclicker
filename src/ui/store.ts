import { createStore } from 'zustand/vanilla';
import { creerHorlogeSysteme } from '../core/clock';
import type { Horloge } from '../core/clock';
import { avancerCombat, calculerClic, calculerDpsEquipe, cliquer, creerCombat, creerLimiteurClics,
  multiplicateurType, reprendreCombat, viderEvenements, lancerCapture, basculerAutoAttaque } from '../core/combat';
import { appliquerCapture, chanceCapture, retirerBalle } from '../core/capture';
import type { EtatCombat } from '../core/combat';
import type { Ennemi } from '../core/ennemis';
import * as equipe from '../core/equipe';
import { creerBoucle } from '../core/loop';
import { chargerPokemon } from '../core/pokemon';
import { accesPc } from '../core/pc';
import { ajouterAuPokedex, completerPokedex } from '../core/pokedex';
import { appliquerVictoire, calculerMaxXp } from '../core/recompenses';
import type { FormeCarte, Zone, ZoneMonde } from '../core/monde';
import { kanto } from '../core/regions';
import { reglages } from '../core/reglages';
import { etatMondeDe, versMembreEquipe } from '../core/sauvegarde';
import type { DonneesRegion, PokemonPossede, Stockage } from '../core/sauvegarde';
import type { PreferencesCombat, ReglagesArret } from '../core/sauvegarde-types';
import { afficherCapture, annonceCapture, conditionCapture, type AffichageCapture } from './store-capture';
import { detailErreur, ouvrirPartie } from './persistance';
import { creerStockageLocal } from './stockage-local';
import { genererIdentifiant } from './identifiants';
import { imageConnue } from './Image';
import { cheminDecor, precharger, prechargerZone } from './precharger';

export type Degat = { id: number; valeur: number };
export type CaseEquipe = { pokemon: PokemonPossede; dps: number; xpMax: number; multiplicateur: number } | null;
export type Destination = { id: string; nom: string; ouverte: boolean; raison: string | null };
export type EtatForme = {
  forme: FormeCarte; zone: string | null; nom: string; numero: number | null;
  ouverte: boolean; actuelle: boolean; raison: string | null;
};
export type AffichageJeu = {
  capture: AffichageCapture; autoAttaque: boolean; arretAuto: ReglagesArret;
  capturer(cle: string): void; basculerAutoAttaque(): void; reglerArretAuto(partiel: Partial<ReglagesArret>): void;
  lieu: ZoneMonde | null; zone: Zone | null; etape: number; ennemi: Omit<Ennemi, 'capture'> | null; pv: number;
  equipe: CaseEquipe[]; dps: number; erreur: string | null;
  pc: PokemonPossede[]; pokedex: readonly number[];
  accesPc: { ouvert: boolean; raison: string | null };
  noterEspece(numero: number): void;
  erreurChargement: boolean; zonePrecedente: Destination | null; zoneSuivante: Destination | null;
  minuteur: { restantMs: number; totalMs: number } | null;
  evenementsDegats: Degat[];
  argent: number; enRecherche: boolean; annonce: string | null;
  echange: { uid: string; nom: string } | null;
  renommer(uid: string, texte: string): string | null;
  basculerFavori(uid: string): string | null;
  relacher(uid: string): string | null;
  envoyerAuPc(uid: string): string | null;
  placerDansEquipe(uidPc: string): string | null;
  echanger(uidPc: string, uidEquipe: string): string | null;
  annulerEchange(): void;
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
  let pokedex: readonly number[] = [];
  let persistance: ReturnType<typeof ouvrirPartie>;
  let preferences: PreferencesCombat = structuredClone(reglages.depart.preferences);
  const optionsCombat = () => ({ autoAttaque: preferences.autoAttaque, arret: preferences.arretAuto, pokedex });
  let boucle: ReturnType<typeof creerBoucle<null>> | undefined;
  let minuteur: ReturnType<typeof setInterval> | undefined;
  let sauvegarde: ReturnType<typeof setInterval> | undefined;
  let erreur: string | null = null;
  let degats: Degat[] = [];
  let identifiantDegat = 0;
  const catalogue = chargerPokemon();
  let annonce: string | null = null;
  let echange: AffichageJeu['echange'] = null;
  let finAnnonceMs = 0;
  // Temps effectivement simulé par la boucle utilisant l'horloge injectée.
  let tempsJeuMs = 0;
  const abonnesDegats = new Set<(degat: Degat) => void>();
  const limiteur = creerLimiteurClics(horloge);
  const enregistrer = () => {
    if (!initialise) return;
    try { persistance.enregistrer(region, pokedex); persistance.enregistrerPreferences(preferences); }
    catch (cause) { erreur = detailErreur(cause); }
  };
  const traiter = () => {
    if (!coeur) return;
    region = { ...region, zoneId: coeur.zoneId, etape: coeur.etape };
    let sauvegarder = false;
    const messagesCapture: string[] = [];
    for (const evenement of coeur.evenements) {
      const message = annonceCapture(evenement, coeur.ennemi.numero);
      if (message) { messagesCapture.push(message); sauvegarder = true; }
      if (evenement.type === 'capture-reussie') {
        const resultat = appliquerCapture(region, evenement, coeur.actifs, alea, genererId);
        region = resultat.region;
        pokedex = ajouterAuPokedex(pokedex, evenement.numero);
        if (resultat.destination === 'pc') messagesCapture.push(`${catalogue.parNumero(evenement.numero).nom} est envoyé au PC.`);
      }
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
    if (messagesCapture.length) { annonce = messagesCapture.join(' · '); finAnnonceMs = tempsJeuMs + reglages.interface.annonceMs; }
    if (preferences.autoAttaque !== coeur.autoAttaque) { preferences = { ...preferences, autoAttaque: coeur.autoAttaque }; sauvegarder = true; }
    coeur = { ...coeur, equipe: region.equipe.map(versMembreEquipe), pokedex };
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
      multiplicateur: coeur ? multiplicateurType(catalogue.parNumero(pokemon.numero).types,
        catalogue.parNumero(coeur.ennemi.numero).types) : 1,
      dps: coeur ? calculerDpsEquipe([versMembreEquipe(pokemon)], coeur.ennemi) : 0 }));
    while (equipe.length < 6) equipe.push(null);
    const precedent = store.getState();
    const etatMonde = etatMondeDe(region);
    const acces = accesPc(kanto, etatMonde);
    const accesAuPc = { ouvert: acces.ok, raison: acces.ok ? null : acces.raison ?? null };
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
      capture: afficherCapture(coeur, region.inventaire, precedent.capture),
      autoAttaque: preferences.autoAttaque, arretAuto: preferences.arretAuto,
      pc: region.pc, pokedex,
      accesPc: accesAuPc.ouvert === precedent.accesPc.ouvert && accesAuPc.raison === precedent.accesPc.raison
        ? precedent.accesPc : accesAuPc,
      carte: JSON.stringify(carte) === JSON.stringify(precedent.carte) ? precedent.carte : carte,
      equipe: JSON.stringify(equipe) === JSON.stringify(precedent.equipe) ? precedent.equipe : equipe,
      dps: coeur ? calculerDpsEquipe(coeur.equipe, coeur.ennemi) : 0, erreur,
      argent: region.argent, enRecherche: (coeur?.attenteMs ?? 0) > 0 && !coeur?.attenteCapture, annonce, echange,
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
  const modifierEquipe = (action: (region: DonneesRegion) => equipe.ResultatEquipe,
    uidPc?: string, fermerEchange = false): string | null => {
    if (!initialise) return 'La partie n’est pas démarrée.';
    const resultat = action(region);
    if (!resultat.ok) return resultat.raison;
    if (resultat.echangeRequis && uidPc !== undefined) {
      const pokemon = region.pc.find(p => p.uid === uidPc)!;
      echange = { uid: uidPc, nom: pokemon.surnom ?? catalogue.parNumero(pokemon.numero).nom };
    } else {
      region = resultat.region;
      if (coeur) coeur = { ...coeur, equipe: region.equipe.map(versMembreEquipe) };
      if (fermerEchange) echange = null;
      enregistrer();
    }
    afficher();
    return null;
  };
  const store = createStore<AffichageJeu>(() => ({
    capture: { balles: [], possible: false, raison: 'Aucun Pokémon à capturer.', enCours: false },
    autoAttaque: preferences.autoAttaque, arretAuto: preferences.arretAuto,
    capturer(cle) {
      if (!initialise) return;
      const condition = conditionCapture(coeur, region.inventaire, cle);
      if (!condition.ok) { annonce = condition.raison ?? null; finAnnonceMs = tempsJeuMs + reglages.interface.annonceMs; }
      else if (coeur) {
        const chance = chanceCapture(coeur.ennemi, cle, coeur.actifs);
        region = { ...region, inventaire: retirerBalle(region.inventaire, cle) };
        coeur = lancerCapture(coeur, chance);
        enregistrer();
      }
      afficher();
    },
    basculerAutoAttaque() {
      if (!initialise) return;
      preferences = { ...preferences, autoAttaque: !preferences.autoAttaque };
      if (coeur) coeur = basculerAutoAttaque(coeur, preferences.autoAttaque);
      enregistrer(); afficher();
    },
    reglerArretAuto(partiel) {
      if (!initialise) return;
      preferences = { ...preferences, arretAuto: { ...preferences.arretAuto, ...partiel } };
      if (coeur) coeur = { ...coeur, arret: preferences.arretAuto };
      enregistrer(); afficher();
    },
    lieu: null, zone: null, etape: 1, ennemi: null, pv: 0, equipe: [], dps: 0, minuteur: null,
    erreur: null, erreurChargement: false, zonePrecedente: null, zoneSuivante: null, evenementsDegats: [],
    argent: 0, enRecherche: false, annonce: null, echange: null,
    pc: [], pokedex, accesPc: { ouvert: false, raison: reglages.pc.raison },
    noterEspece(numero) {
      if (!initialise || !Number.isSafeInteger(numero) || numero <= 0) return;
      const suivant = ajouterAuPokedex(pokedex, numero);
      if (suivant === pokedex) return;
      pokedex = suivant;
      if (coeur) coeur = { ...coeur, pokedex };
      enregistrer();
      afficher();
    },
    renommer: (uid, texte) => modifierEquipe(region => equipe.renommer(region, uid, texte)),
    basculerFavori: uid => modifierEquipe(region => equipe.basculerFavori(region, uid)),
    relacher: uid => modifierEquipe(region => equipe.relacher(region, uid)),
    envoyerAuPc: uid => modifierEquipe(region => equipe.envoyerAuPc(region, uid)),
    placerDansEquipe: uid => modifierEquipe(region => equipe.placerDansEquipe(region, uid), uid),
    echanger: (uidPc, uidEquipe) => modifierEquipe(region => equipe.echanger(region, uidPc, uidEquipe), undefined, true),
    annulerEchange() { echange = null; afficher(); },
    carte: { formes: [], badges: { obtenus: 0, total: totalBadges }, nouvelles: [], tutorielRoute1: false },
    voirCarte() {
      if (!initialise) return;
      zonesVues = new Set(kanto.zonesOuvertes(etatMondeDe(region)).map(zone => zone.id));
      afficher();
    },
    allerVers(zoneId) {
      if (!initialise || !kanto.accesZone(zoneId, etatMondeDe(region)).ok) return;
      const lieu = kanto.zone(zoneId);
      coeur = lieu.sansCombat ? null : creerCombat(lieu, region.equipe.map(versMembreEquipe), alea, [], optionsCombat());
      region = { ...region, zoneId, etape: 1 };
      annonce = null;
      traiter();
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
          preferences = persistance.preferences;
          pokedex = completerPokedex(persistance.pokedex, region);
          zonesVues = new Set(kanto.zonesOuvertes(etatMondeDe(region)).map(zone => zone.id));
          const lieu = kanto.zone(region.zoneId);
          coeur = lieu.sansCombat ? null : reprendreCombat(lieu, region.equipe.map(versMembreEquipe), alea, region.etape, [], optionsCombat());
          initialise = true;
          traiter();
          if (pokedex !== persistance.pokedex) enregistrer();
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
