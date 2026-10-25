import { createStore } from 'zustand/vanilla';
import { creerHorlogeSysteme } from '../core/clock';
import type { Horloge } from '../core/clock';
import { avancerCombat, calculerClic, calculerDpsEquipe, cliquer, creerCombat, creerLimiteurClics,
  multiplicateurType, reprendreCombat, viderEvenements, lancerCapture, basculerAutoAttaque, basculerAutoClic, suspendreDps,
  faucher as faucherCombat, invoquerBoss } from '../core/combat';
import { acheter, chargerObjets } from '../core/boutique';
import { blocage, commandeCourante, declencher, etapeTerminee, type CatalogueEvenements, type Commande, type Declencheur } from '../core/evenements';
import { evenementsKanto } from '../core/evenements-kanto';
import { choisirStarter, creerStarter, tirerStarters } from '../core/starter';
import { accorderBadge, accorderJalons, actifsDe } from '../core/progression';
import { zoneDeLigue, estZoneDeLigue, messageDefaite, messageEnchainement, nomAdversaire, enregistrerVictoireLigue } from '../core/ligue';
import { nomAffiche } from './affichage-pokemon';
import { clicsAutomatiques } from '../core/clics';
import { utiliserSurPokemon, poserStase, retirerStase, utiliserJetonShiny } from '../core/objets-equipe';
import { clesActives, utiliserTemporise, refusPoupee, utiliserPoupee, declencherRecharge } from '../core/objets-actifs';
import { evoluer as evoluerEquipe, evoluerParPierre, evolutionDisponible } from '../core/evolution';
import { appliquerCapture, chanceCapture, retirerBalle } from '../core/capture';
import type { EtatCombat } from '../core/combat';
import type { Ennemi } from '../core/ennemis';
import * as equipe from '../core/equipe';
import { creerBoucle } from '../core/loop';
import { chargerPokemon } from '../core/pokemon';
import { accesPc } from '../core/pc';
import * as pension from '../core/pension';
import { ajouterAuPokedex, completerPokedex, pokedexDeKanto } from '../core/pokedex';
import { appliquerVictoire, calculerMaxXp, delaiEnnemiSuivant } from '../core/recompenses';
import type { FormeCarte, Zone, ZoneMonde } from '../core/monde';
import { kanto } from '../core/regions';
import { reglages } from '../core/reglages';
import { etatMondeDe, versMembreEquipe } from '../core/sauvegarde';
import type { DonneesRegion, PokemonPossede, Stockage } from '../core/sauvegarde';
import type { PreferencesCombat, ReglagesArret } from '../core/sauvegarde-types';
import { afficherCapture, annonceCapture, conditionCapture, type AffichageCapture } from './store-capture';
import { afficherEvolution, type EvolutionAffichee } from './store-evolution';
import { afficherProgression, phaseObtention, type AffichageProgression, type PhaseObtention } from './store-progression';
import { afficherEffets, afficherFauchage, type EffetsAffiches, type FauchageAffiche } from './store-objets';
import { afficherBoutique, afficherSac, type AffichageBoutique, type AffichageSac } from './store-boutique';
import { detailErreur, ouvrirPartie } from './persistance';
import { creerStockageLocal } from './stockage-local';
import { genererIdentifiant } from './identifiants';
import { equipeDeDepart } from './equipe-de-depart';
import { imageConnue } from './Image';
import { cheminDecor, precharger, prechargerZone } from './precharger';

export type Degat = { id: number; valeur: number };
export type CaseEquipe = { pokemon: PokemonPossede; dps: number; xpMax: number; multiplicateur: number; evolution?: number | null } | null;
export type Destination = { id: string; nom: string; ouverte: boolean; raison: string | null };
export type EtatForme = {
  forme: FormeCarte; zone: string | null; nom: string; numero: number | null;
  ouverte: boolean; actuelle: boolean; raison: string | null;
};
export type AffichageJeu = {
  intro: { enCours: boolean; premiereLigneVue: boolean; choixStarter: boolean;
    sacOuvert: boolean; carteOuverte: boolean; starters: { numero: number; nom: string; shiny: boolean }[] };
  choisirStarter(numero: number): string | null;
  evenement: Commande | null;
  terminerEtape(): void;
  progression: AffichageProgression;
  obtentionBadge: { id: string; phase: PhaseObtention } | null;
  fermerBoiteBadges(): void;
  effets: EffetsAffiches; fauchage: FauchageAffiche; radar: boolean;
  utiliserObjetActif(id: string): string | null;
  faucher(): string | null;
  poserStase(uid: string): string | null;
  retirerStase(uid: string): string | null;
  utiliserJeton(uid: string): string | null;
  boutique: AffichageBoutique; sac: AffichageSac; autoClic: { possede: boolean; actif: boolean };
  acheter(id: string, quantite: number): string | null;
  utiliserObjet(type: 'bonbon' | 'calcium', uid: string, n: number): string | null;
  evoluer(uid: string): string | null;
  utiliserPierre(uid: string, pierre: string): string | null;
  evolution: EvolutionAffichee | null;
  basculerAutoClic(): void;
  capture: AffichageCapture; autoAttaque: boolean; arretAuto: ReglagesArret;
  capturer(cle: string): void; basculerAutoAttaque(): void; reglerArretAuto(partiel: Partial<ReglagesArret>): void;
  lieu: ZoneMonde | null; zone: Zone | null; etape: number; ennemi: Omit<Ennemi, 'capture'> | null; pv: number;
  nomAdversaire: string | null; ligueGagnee: number;
  equipe: CaseEquipe[]; dps: number; erreur: string | null;
  pc: PokemonPossede[]; pokedex: readonly number[];
  accesPc: { ouvert: boolean; raison: string | null };
  pension: {
    acces: { ouvert: boolean; raison: string | null }; parents: PokemonPossede[]; oeufs: PokemonPossede[];
    emplacements: number; emplacementsMax: number; chance: number;
    prochainEmplacement: { prix: number; raison: string | null } | null;
  };
  deposerParent(uid: string): string | null;
  retirerParent(uid: string): string | null;
  prendreOeuf(uid: string): string | null;
  acheterEmplacementOeuf(): string | null;
  noterEspece(numero: number): void;
  erreurChargement: boolean; zonePrecedente: Destination | null; zoneSuivante: Destination | null;
  minuteur: { restantMs: number; totalMs: number } | null;
  evenementsDegats: Degat[];
  argent: number; enRecherche: boolean; cache: boolean; annonce: string | null;
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

function actifsCourants(region: DonneesRegion, maintenant: number): string[] {
  return [...actifsDe(region), ...clesActives(region.chronos, maintenant)];
}

export function creerStoreJeu({ horloge, stockage, alea, genererId, evenements = evenementsKanto,
  nouvellePartie = 'equipe-de-depart' }: {
  horloge: Horloge; stockage: Stockage; alea: () => number; genererId: () => string;
  evenements?: CatalogueEvenements;
  nouvellePartie?: 'equipe-de-depart' | 'intro';
}) {
  let coeur: EtatCombat | null = null;
  let initialise = false;
  let zonesVues = new Set<string>();
  const totalBadges = kanto.zones.filter(zone => !zone.sansCombat && zone.type === 'arene').length;
  let region: DonneesRegion;
  let starters: ReturnType<typeof tirerStarters> | undefined;
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
  let resteAutoClicMs = 0;
  let evolutionEnCours: EvolutionAffichee | null = null;
  let finEvolutionMs = 0;
  let obtentionBadge: { id: string; debutMs: number } | null = null;
  const objets = chargerObjets();
  const abonnesDegats = new Set<(degat: Degat) => void>();
  const limiteur = creerLimiteurClics(horloge);
  const actualiserActifs = () => {
    if (!coeur) return;
    const actifs = actifsCourants(region, horloge.maintenant());
    if (JSON.stringify(actifs) !== JSON.stringify(coeur.actifs)) coeur = { ...coeur, actifs };
  };
  const enregistrer = () => {
    if (!initialise) return;
    try { persistance.enregistrer(region, pokedex); persistance.enregistrerPreferences(preferences); }
    catch (cause) { erreur = detailErreur(cause); }
  };
  const noterDansPokedex = (numero?: number, messages?: string[]) => {
    const precedent = numero === undefined ? persistance.pokedex : pokedex;
    if (numero !== undefined) pokedex = ajouterAuPokedex(pokedex, numero);
    const resultat = accorderJalons(region, pokedexDeKanto(pokedex, catalogue).nombre);
    region = resultat.region;
    const paliers = resultat.recus.map(jalon => `Palier ${jalon.palier} : ${jalon.titre}`);
    if (messages) messages.push(...paliers);
    else if (paliers.length) {
      annonce = [annonce, ...paliers].filter(Boolean).join(' · ');
      finAnnonceMs = tempsJeuMs + reglages.interface.annonceMs;
    }
    if (coeur) coeur = { ...coeur, pokedex };
    actualiserActifs();
    if (pokedex !== precedent || paliers.length > 0) enregistrer();
  };
  const acces = (zoneId: string) => {
    const resultat = blocage(evenements, region, zoneId);
    return resultat.ok ? kanto.accesZone(zoneId, etatMondeDe(region)) : resultat;
  };
  const traiter = (): void => {
    if (!coeur) return;
    region = { ...region, zoneId: coeur.zoneId, etape: coeur.etape };
    let sauvegarder = false;
    const bossBattus: string[] = [];
    const messagesCapture: string[] = [];
    for (const evenement of coeur.evenements) {
      const message = annonceCapture(evenement, coeur.ennemi.numero);
      if (message) { messagesCapture.push(message); sauvegarder = true; }
      if (evenement.type === 'capture-reussie') {
        const resultat = appliquerCapture(region, evenement, coeur.actifs, alea, genererId);
        region = resultat.region;
        noterDansPokedex(evenement.numero, messagesCapture);
        if (resultat.destination === 'pc') messagesCapture.push(`${catalogue.parNumero(evenement.numero).nom} est envoyé au PC.`);
        if (resultat.bonbons > 0) messagesCapture.push(`Chromatique ! +${resultat.bonbons} Bonbons`);
      }
      if (evenement.type === 'ennemi-vaincu') {
        if (region.equipe.some(p => p.oeuf)) sauvegarder = true;
        const r = appliquerVictoire(region, evenement, coeur.actifs);
        region = r.region;
        if (pension.accesPension(kanto, etatMondeDe(region)).ouvert) {
          const suivante = pension.pondre(region, alea, genererId);
          if (suivante !== region) sauvegarder = true;
          region = suivante;
        }
        const messages: string[] = [];
        for (const eclosion of r.eclosions) {
          noterDansPokedex(eclosion.numero, messages);
          messages.push(reglages.pension.messages.eclosion.replace('{nom}', catalogue.parNumero(eclosion.numero).nom));
        }
        if (r.montees.length === 1) {
          const montee = r.montees[0]!;
          const pokemon = region.equipe.find(p => p.uid === montee.uid)!;
          messages.push(`${nomAffiche(pokemon)} passe au niveau ${montee.niveau} !`);
        } else if (r.montees.length > 1) messages.push(`${r.montees.length} Pokémon montent de niveau !`);
        if (evenement.shiny) messages.push(`Chromatique ! +${r.bonbons} Bonbons`);
        if (evenement.boss && estZoneDeLigue(coeur.zone)) {
          const message = messageEnchainement(coeur.zone, evenement.etape);
          if (message) messages.push(message);
          sauvegarder = true;
        }
        messagesCapture.push(...messages);
      }
      if (evenement.type === 'boss-vaincu') {
        const pensionOuverte = pension.accesPension(kanto, etatMondeDe(region)).ouvert;
        if (estZoneDeLigue(coeur.zone)) region = enregistrerVictoireLigue(region);
        const resultat = accorderBadge(region, evenement.zoneId);
        region = resultat.region;
        if (resultat.badge) {
          messagesCapture.push(`Badge ${resultat.badge.nom} obtenu !`);
          obtentionBadge = { id: resultat.badge.id, debutMs: tempsJeuMs };
          actualiserActifs();
          if (coeur.attenteMs > 0 && !coeur.attenteCapture) {
            coeur = { ...coeur, attenteMs: delaiEnnemiSuivant(coeur.actifs) };
          }
        }
        if (!region.bossVaincus.includes(evenement.zoneId)) {
          region = { ...region, bossVaincus: [...region.bossVaincus, evenement.zoneId] };
          if (!pensionOuverte && pension.accesPension(kanto, etatMondeDe(region)).ouvert) {
            messagesCapture.push(reglages.pension.messages.debloquee);
          }
          if (kanto.liensDepuis(evenement.zoneId).length > 0) {
            messagesCapture.push('Zone débloquée !');
          }
        }
        sauvegarder = true;
        bossBattus.push(evenement.zoneId);
      }
      if (evenement.type === 'boss-echoue') {
        messagesCapture.push(messageDefaite(coeur.zone, coeur.etape) ?? 'Temps écoulé !');
        if (estZoneDeLigue(coeur.zone)) sauvegarder = true;
      }
    }
    if (messagesCapture.length) { annonce = messagesCapture.join(' · '); finAnnonceMs = tempsJeuMs + reglages.interface.annonceMs; }
    if (coeur) {
      if (preferences.autoAttaque !== coeur.autoAttaque) { preferences = { ...preferences, autoAttaque: coeur.autoAttaque }; sauvegarder = true; }
      coeur = { ...coeur, equipe: region.equipe.map(versMembreEquipe), pokedex };
      coeur = viderEvenements(coeur);
    }
    if (sauvegarder) enregistrer();
    for (const zone of bossBattus) executer({ type: 'boss-vaincu', zone });
  };
  const afficher = () => {
    if (!initialise) return;
    const maintenant = horloge.maintenant();
    const actifs = actifsCourants(region, maintenant);
    const lieu = kanto.zone(region.zoneId);
    const lien = lieu.liens[0];
    const destination = (zone: ZoneMonde | undefined): Destination | null => {
      if (!zone) return null;
      const resultat = acces(zone.id);
      return { id: zone.id, nom: zone.nom, ouverte: resultat.ok, raison: resultat.ok ? null : resultat.raison ?? null };
    };
    const equipe: CaseEquipe[] = region.equipe.map(pokemon => ({ pokemon, evolution: evolutionDisponible(pokemon),
      xpMax: calculerMaxXp(pokemon.numero, pokemon.niveau),
      multiplicateur: coeur ? multiplicateurType(catalogue.parNumero(pokemon.numero).types,
        catalogue.parNumero(coeur.ennemi.numero).types) : 1,
      dps: coeur ? calculerDpsEquipe([versMembreEquipe(pokemon)], coeur.ennemi, actifs) : 0 }));
    while (equipe.length < 6) equipe.push(null);
    const precedent = store.getState();
    const etatMonde = etatMondeDe(region);
    const conditionPc = accesPc(kanto, etatMonde);
    const accesAuPc = { ouvert: conditionPc.ok, raison: conditionPc.ok ? null : conditionPc.raison ?? null };
    const accesPension = pension.accesPension(kanto, etatMonde);
    const prix = pension.prixEmplacementOeuf(region);
    const affichagePension: AffichageJeu['pension'] = {
      acces: { ouvert: accesPension.ouvert, raison: accesPension.raison ?? null },
      parents: region.pension.parents, oeufs: region.pension.oeufs,
      emplacements: region.pension.emplacementsOeuf, emplacementsMax: reglages.pension.emplacementsMax,
      chance: pension.chancePonte(region.pension.parents),
      prochainEmplacement: prix === null ? null : { prix, raison: region.argent < prix ? "Pas assez d'argent." : null },
    };
    const ouvertes = new Set(kanto.zonesOuvertes(etatMonde).filter(zone => blocage(evenements, region, zone.id).ok).map(zone => zone.id));
    const carte: AffichageJeu['carte'] = {
      formes: kanto.carte.formes.map(forme => {
        const ouverte = forme.zone !== null && ouvertes.has(forme.zone);
        const resultat = forme.zone !== null && !ouverte ? acces(forme.zone) : null;
        return { forme, zone: forme.zone, nom: forme.nom,
          numero: forme.zone === null ? null : kanto.zone(forme.zone).ancienId,
          ouverte, actuelle: forme.zone === region.zoneId,
          raison: resultat && !resultat.ok ? resultat.raison ?? null : null };
      }),
      badges: { obtenus: region.badges.length, total: totalBadges },
      nouvelles: [...ouvertes].filter(id => !zonesVues.has(id)),
      tutorielRoute1: region.zoneId === kanto.depart && region.bossVaincus.length === 0,
    };
    const zonePrecedente = destination(kanto.zonePrecedente(lieu.id));
    const zoneSuivante = destination(lien ? kanto.zone(lien.vers) : undefined);
    const evenement = commandeCourante(evenements, region);
    const enCours = region.evenementEnCours?.id === 'kanto.intro';
    const introJouee = region.evenementsJoues.includes('kanto.intro');
    const choixStarter = introJouee && region.starterId === null;
    if (choixStarter && !starters) starters = tirerStarters(alea, reglages.combat.chanceShiny);
    const sac = afficherSac(region, precedent.sac);
    const intro: AffichageJeu['intro'] = {
      enCours, choixStarter,
      premiereLigneVue: introJouee || (enCours && region.evenementEnCours!.etape
        > evenements.parId('kanto.intro').etapes.findIndex(etape => etape.type === 'dialogue')),
      sacOuvert: sac.acces.ouvert,
      carteOuverte: (!enCours && !choixStarter) || region.drapeaux.includes('carte-ouverte'),
      starters: choixStarter ? ([1, 4, 7] as const).map(numero => ({
        numero, nom: catalogue.parNumero(numero).nom, shiny: starters![numero],
      })) : [],
    };
    const ennemi = coeur ? (({ numero, niveau, pv, pvMax, boss, shiny, rarete }) => ({ numero, niveau, pv, pvMax, boss, shiny, rarete }))(coeur.ennemi) : null;
    store.setState({ lieu, zone: coeur?.zone ?? null, etape: region.etape, ennemi, pv: ennemi?.pv ?? 0,
      nomAdversaire: coeur ? nomAdversaire(coeur.zone, coeur.etape) : null, ligueGagnee: region.ligueGagnee,
      intro: JSON.stringify(intro) === JSON.stringify(precedent.intro) ? precedent.intro : intro,
      evenement: JSON.stringify(evenement) === JSON.stringify(precedent.evenement) ? precedent.evenement : evenement,
      progression: afficherProgression(region, pokedex),
      obtentionBadge: obtentionBadge ? { id: obtentionBadge.id,
        phase: phaseObtention(obtentionBadge.debutMs, tempsJeuMs) } : null,
      effets: afficherEffets(region, maintenant, precedent.effets),
      fauchage: afficherFauchage(region, coeur, maintenant, precedent.fauchage),
      radar: region.ameliorations.includes('pokeradar'),
      capture: afficherCapture(coeur, region.inventaire, precedent.capture),
      boutique: afficherBoutique(region, precedent.boutique), sac,
      autoClic: precedent.autoClic.possede === region.ameliorations.includes('leftovers')
        && precedent.autoClic.actif === (coeur?.autoClic ?? false) ? precedent.autoClic
        : { possede: region.ameliorations.includes('leftovers'), actif: coeur?.autoClic ?? false },
      autoAttaque: preferences.autoAttaque, arretAuto: preferences.arretAuto,
      pc: region.pc, pokedex,
      pension: JSON.stringify(affichagePension) === JSON.stringify(precedent.pension) ? precedent.pension : affichagePension,
      accesPc: accesAuPc.ouvert === precedent.accesPc.ouvert && accesAuPc.raison === precedent.accesPc.raison
        ? precedent.accesPc : accesAuPc,
      carte: JSON.stringify(carte) === JSON.stringify(precedent.carte) ? precedent.carte : carte,
      equipe: JSON.stringify(equipe) === JSON.stringify(precedent.equipe) ? precedent.equipe : equipe,
      dps: coeur ? calculerDpsEquipe(coeur.equipe, coeur.ennemi, actifs) : 0, erreur,
      evolution: afficherEvolution(evolutionEnCours, finEvolutionMs, tempsJeuMs),
      argent: region.argent, enRecherche: (coeur?.attenteMs ?? 0) > 0 && !coeur?.attenteCapture, cache: (coeur?.attenteMs ?? 0) > 0, annonce, echange,
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
    if (!lieu.sansCombat) void prechargerZone(zoneDeLigue(lieu, region.starterId));
  };
  const changerDeZone = (zoneId: string): void => {
    const lieu = kanto.zone(zoneId);
    const autoClic = coeur?.autoClic ?? false;
    coeur = lieu.sansCombat ? null : creerCombat(zoneDeLigue(lieu, region.starterId), region.equipe.map(versMembreEquipe), alea, actifsCourants(region, horloge.maintenant()), { ...optionsCombat(), autoClic });
    resteAutoClicMs = 0;
    if (coeur && tempsJeuMs < finEvolutionMs) coeur = suspendreDps(coeur, finEvolutionMs - tempsJeuMs);
    region = { ...region, zoneId, etape: 1 };
    annonce = null;
    traiter();
    degats = [];
    prechargerLieu();
  };
  const appliquerEvenement = (suivante: DonneesRegion): void => {
    if (suivante === region) return;
    const ancienneZone = region.zoneId;
    const ancienneEtape = region.etape;
    region = suivante;
    if (region.zoneId !== ancienneZone || region.etape !== ancienneEtape) changerDeZone(region.zoneId);
    enregistrer();
  };
  const executer = (fait: Declencheur): void => {
    if (evenements.liste.length === 0 && !region.evenementEnCours) return;
    appliquerEvenement(declencher(evenements, region, fait));
  };
  const cacher = () => { if (document.visibilityState === 'hidden') enregistrer(); };
  const demarrerEvolution = (evolution: { uid: string; de: number; vers: number }) => {
    evolutionEnCours = { uid: evolution.uid, ancien: evolution.de, nouveau: evolution.vers };
    finEvolutionMs = tempsJeuMs + reglages.evolution.animationMs;
    if (coeur) coeur = suspendreDps(coeur, reglages.evolution.animationMs);
    annonce = 'Évolution !';
    finAnnonceMs = tempsJeuMs + reglages.interface.annonceMs;
    noterDansPokedex(evolution.vers);
  };
  const modifierEquipe = (action: (region: DonneesRegion) => equipe.ResultatEquipe & {
    evolution?: { uid: string; de: number; vers: number };
  },
    uidPc?: string, fermerEchange = false): string | null => {
    if (!initialise) return 'La partie n’est pas démarrée.';
    const resultat = action(region);
    if (!resultat.ok) return resultat.raison;
    if (resultat.echangeRequis && uidPc !== undefined) {
      const pokemon = region.pc.find(p => p.uid === uidPc)!;
      echange = { uid: uidPc, nom: nomAffiche(pokemon) };
    } else {
      region = resultat.region;
      if (resultat.evolution) demarrerEvolution(resultat.evolution);
      if (coeur) coeur = { ...coeur, equipe: region.equipe.map(versMembreEquipe) };
      if (fermerEchange) echange = null;
      enregistrer();
    }
    afficher();
    return null;
  };
  const modifierPension = (action: (region: DonneesRegion) => equipe.ResultatEquipe & {
    destination?: 'equipe' | 'pc'; numero?: number;
  }, noter = false): string | null => modifierEquipe(courante => {
    const acces = pension.accesPension(kanto, etatMondeDe(courante));
    if (!acces.ouvert) return { ok: false, raison: acces.raison! };
    const resultat = action(courante);
    if (resultat.ok) {
      if (resultat.destination === 'pc') {
        annonce = reglages.pension.messages.envoyePc.replace('{nom}', nomAffiche(resultat.region.pc.at(-1)!));
        finAnnonceMs = tempsJeuMs + reglages.interface.annonceMs;
      }
      // Le Pokédex doit être enregistré avec la région après le retrait.
      if (noter && resultat.numero !== undefined) {
        region = resultat.region;
        noterDansPokedex(resultat.numero);
        return { ...resultat, region };
      }
    }
    return resultat;
  });
  const store = createStore<AffichageJeu>(() => ({
    intro: { enCours: false, premiereLigneVue: false, choixStarter: false,
      sacOuvert: false, carteOuverte: true, starters: [] },
    choisirStarter(numero) {
      if (!initialise || !store.getState().intro.choixStarter) return 'Le choix du starter n’est pas disponible.';
      if (numero !== 1 && numero !== 4 && numero !== 7) return 'Starter inconnu.';
      region = choisirStarter(region, creerStarter(numero, starters![numero], alea, genererId));
      if (coeur) coeur = { ...coeur, equipe: region.equipe.map(versMembreEquipe) };
      noterDansPokedex(numero);
      enregistrer(); afficher();
      return null;
    },
    evenement: null,
    terminerEtape() {
      if (!initialise) return;
      const commande = commandeCourante(evenements, region);
      if (!commande) return;
      appliquerEvenement(etapeTerminee(evenements, region, commande));
      afficher();
    },
    progression: afficherProgression({ badges: [], jalonsRecus: [] }, []),
    obtentionBadge: null,
    fermerBoiteBadges() { obtentionBadge = null; afficher(); },
    effets: [], fauchage: { possede: false, disponible: false, raison: 'Nécessite la CT Fauchage.', rechargeS: 0, actif: false }, radar: false,
    utiliserObjetActif(id) {
      if (!initialise) return 'La partie n’est pas démarrée.';
      if (id === 'pokeDoll') {
        if (!coeur) return 'Aucun boss ici.';
        const raison = refusPoupee(region, coeur.zoneId);
        if (raison) return raison;
      }
      const resultat = id === 'pokeDoll' ? utiliserPoupee(region, coeur!.zoneId)
        : utiliserTemporise(region, id, horloge.maintenant());
      if (!resultat.ok) return resultat.raison;
      region = resultat.region;
      actualiserActifs();
      if (id === 'pokeDoll' && coeur) {
        coeur = invoquerBoss(coeur);
        region = { ...region, etape: reglages.combat.etapeBoss };
        traiter();
      }
      annonce = resultat.message;
      finAnnonceMs = tempsJeuMs + reglages.interface.annonceMs;
      enregistrer(); afficher();
      return null;
    },
    faucher() {
      if (!initialise) return 'La partie n’est pas démarrée.';
      const etat = afficherFauchage(region, coeur, horloge.maintenant(), null);
      if (etat.raison) return etat.raison;
      if (!coeur) return 'Aucun Pokémon ici.';
      coeur = faucherCombat(coeur);
      region = declencherRecharge(region, horloge.maintenant());
      annonce = 'Fauchage actif !';
      finAnnonceMs = tempsJeuMs + reglages.interface.annonceMs;
      enregistrer(); afficher();
      return null;
    },
    poserStase: uid => modifierEquipe(region => {
      const resultat = poserStase(region, uid);
      if (resultat.ok) { annonce = resultat.message; finAnnonceMs = tempsJeuMs + reglages.interface.annonceMs; }
      return resultat;
    }),
    retirerStase: uid => modifierEquipe(region => {
      const resultat = retirerStase(region, uid);
      if (resultat.ok) { annonce = resultat.message; finAnnonceMs = tempsJeuMs + reglages.interface.annonceMs; }
      return resultat;
    }),
    utiliserJeton: uid => modifierEquipe(region => {
      const resultat = utiliserJetonShiny(region, uid);
      if (resultat.ok) { annonce = resultat.message; finAnnonceMs = tempsJeuMs + reglages.interface.annonceMs; }
      return resultat;
    }),
    boutique: { acces: { ouvert: false, raison: reglages.shop.raison }, objets: [] },
    sac: { acces: { ouvert: false, raison: reglages.sac.raison }, entrees: [] },
    autoClic: { possede: false, actif: false },
    acheter(id, quantite) {
      if (!initialise) return 'La partie n’est pas démarrée.';
      const disponible = afficherBoutique(region, null).objets.find(objet => objet.id === id);
      if (!disponible) return 'Objet indisponible.';
      const objet = objets.find(objet => objet.id === id)!;
      const resultat = acheter(region, objet, quantite, disponible.prix);
      if (!resultat.ok) return resultat.raison;
      region = resultat.region;
      actualiserActifs();
      annonce = `${objet.nom} ×${quantite} acheté. ${(disponible.prix * quantite).toLocaleString('fr-FR')} pièces dépensées.`;
      finAnnonceMs = tempsJeuMs + reglages.interface.annonceMs;
      enregistrer(); afficher();
      return null;
    },
    utiliserObjet(type, uid, n) {
      return modifierEquipe(region => {
        const resultat = utiliserSurPokemon(region, type, type, uid, n);
        if (resultat.ok) { annonce = resultat.message; finAnnonceMs = tempsJeuMs + reglages.interface.annonceMs; }
        return resultat;
      });
    },
    evoluer(uid) {
      return modifierEquipe(region => evoluerEquipe(region, uid));
    },
    utiliserPierre(uid, pierre) {
      return modifierEquipe(region => evoluerParPierre(region, uid, pierre));
    },
    basculerAutoClic() {
      if (!coeur || !region.ameliorations.includes('leftovers')) return;
      coeur = basculerAutoClic(coeur, !coeur.autoClic);
      resteAutoClicMs = 0;
      afficher();
    },
    capture: { balles: [], possible: false, raison: 'Aucun Pokémon à capturer.', enCours: false },
    autoAttaque: preferences.autoAttaque, arretAuto: preferences.arretAuto,
    capturer(cle) {
      if (!initialise || minuteur === undefined) return;
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
    nomAdversaire: null, ligueGagnee: 0,
    erreur: null, erreurChargement: false, zonePrecedente: null, zoneSuivante: null, evenementsDegats: [],
    evolution: null, argent: 0, enRecherche: false, cache: false, annonce: null, echange: null,
    pc: [], pokedex, accesPc: { ouvert: false, raison: reglages.pc.raison },
    pension: { acces: { ouvert: false, raison: null }, parents: [], oeufs: [],
      emplacements: reglages.depart.region.pension.emplacementsOeuf, emplacementsMax: reglages.pension.emplacementsMax,
      chance: 0, prochainEmplacement: null },
    deposerParent: uid => modifierPension(region => pension.deposerParent(region, uid)),
    retirerParent: uid => modifierPension(region => pension.retirerParent(region, uid)),
    prendreOeuf: uid => modifierPension(region => pension.prendreOeuf(region, uid), true),
    acheterEmplacementOeuf: () => modifierPension(pension.acheterEmplacementOeuf),
    noterEspece(numero) {
      if (!initialise || !Number.isSafeInteger(numero) || numero <= 0) return;
      if (pokedex.includes(numero)) return;
      noterDansPokedex(numero);
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
      if (!initialise || !acces(zoneId).ok) return;
      changerDeZone(zoneId);
      executer({ type: 'entree-zone', zone: zoneId });
      enregistrer();
      afficher();
    },
    attaquer() {
      if (!coeur || minuteur === undefined) return;
      actualiserActifs();
      const avant = coeur;
      coeur = cliquer(coeur, limiteur);
      if (avant === coeur) return;
      const degat = { id: ++identifiantDegat,
        valeur: Math.min(avant.ennemi.pv, calculerClic(calculerDpsEquipe(avant.equipe, avant.ennemi, avant.actifs), avant.actifs)) };
      degats.push(degat);
      abonnesDegats.forEach(abonne => abonne(degat));
      traiter();
    },
    demarrer() {
      if (minuteur !== undefined || store.getState().erreurChargement) return;
      try {
        if (!initialise) {
          persistance = ouvrirPartie({ stockage, horloge, genererId }, nouvellePartie === 'intro'
            ? { equipe: [], drapeaux: ['nouvelle-partie'] } : { equipe: equipeDeDepart(), drapeaux: [] });
          region = persistance.region;
          preferences = persistance.preferences;
          pokedex = completerPokedex(persistance.pokedex, region);
          zonesVues = new Set(kanto.zonesOuvertes(etatMondeDe(region)).map(zone => zone.id));
          const lieu = kanto.zone(region.zoneId);
          coeur = lieu.sansCombat ? null : reprendreCombat(zoneDeLigue(lieu, region.starterId), region.equipe.map(versMembreEquipe), alea, region.etape, actifsCourants(region, horloge.maintenant()), optionsCombat());
          initialise = true;
          noterDansPokedex();
          traiter();
          prechargerLieu();
        }
        executer({ type: 'debut-partie' });
        afficher();
        boucle = creerBoucle({ horloge, etat: null, avancer: () => {
          tempsJeuMs += reglages.boucle.pasMs;
          if (annonce !== null && tempsJeuMs >= finAnnonceMs) annonce = null;
          actualiserActifs();
          if (coeur?.autoClic && coeur.attenteMs === 0) {
            const resultat = clicsAutomatiques(resteAutoClicMs, reglages.boucle.pasMs, reglages.combat.autoClicIntervalleMs);
            resteAutoClicMs = resultat.resteMs;
            for (let i = 0; i < resultat.clics; i++) store.getState().attaquer();
          } else resteAutoClicMs = 0;
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
  alea: Math.random, genererId: genererIdentifiant,
  nouvellePartie: import.meta.env.MODE === 'test' || equipeDeDeveloppement() ? 'equipe-de-depart' : 'intro' });

function equipeDeDeveloppement(): boolean {
  try { return typeof localStorage !== 'undefined' && localStorage.getItem('pokiclicker-dev:equipe-de-depart') !== null; }
  catch { return false; }
}
