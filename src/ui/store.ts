import { createStore } from 'zustand/vanilla';
import { creerHorlogeSysteme } from '../core/clock';
import type { Horloge } from '../core/clock';
import { avancerCombat, calculerClic, calculerDpsEquipe, cliquer, creerCombat, creerLimiteurClics,
  multiplicateurType, reprendreCombat, viderEvenements, lancerCapture, basculerAutoAttaque, basculerAutoClic, suspendreDps,
  faucher as faucherCombat, invoquerBoss } from '../core/combat';
import { acheter, chargerObjets } from '../core/boutique';
import { blocage, commandeCourante, declencher, etapeTerminee, type CatalogueEvenements, type Commande, type Declencheur } from '../core/evenements';
import { evenementsKanto } from '../core/evenements-kanto';
import { peutLancer, zoneDuDefi, echec as echecDefi, victoire as victoireDefi } from '../core/defi-chen';
import { nomAdversaireEvenement, zoneDeCombatEvenement, zoneDuCombat } from '../core/combat-evenement';
import { choisirStarter, creerStarter, tirerStarters } from '../core/starter';
import { accorderBadge, accorderJalons, actifsDe } from '../core/progression';
import { zoneDeLigue, estZoneDeLigue, messageDefaite, messageEnchainement, nomAdversaire, enregistrerVictoireLigue } from '../core/ligue';
import { nomAffiche } from './affichage-pokemon';
import { issueDuPantheon } from '../core/pantheon';
import donneesPantheon from '../../data/pantheon.json';
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
import * as casino from '../core/casino';
import { ajouterAuPokedex, completerPokedex, pokedexDeKanto } from '../core/pokedex';
import { appliquerVictoire, calculerMaxXp, delaiEnnemiSuivant } from '../core/recompenses';
import type { FormeCarte, Zone, ZoneMonde } from '../core/monde';
import { kanto } from '../core/regions';
import { reglages, type Ton } from '../core/reglages';
import { etatMondeDe, versMembreEquipe } from '../core/sauvegarde';
import type { DonneesRegion, PokemonPossede, Stockage } from '../core/sauvegarde';
import type { PreferencesCombat, ReglagesArret } from '../core/sauvegarde-types';
import { afficherCapture, annonceCapture, banniereArret, conditionCapture, type AffichageCapture } from './store-capture';
import { afficherEvolution, type EvolutionAffichee } from './store-evolution';
import { afficherProgression, phaseObtention, type AffichageProgression, type PhaseObtention } from './store-progression';
import { afficherEffets, afficherFauchage, type EffetsAffiches, type FauchageAffiche } from './store-objets';
import { afficherBoutique, afficherCentre, afficherSac, type AffichageBoutique, type AffichageSac } from './store-boutique';
import { afficherCasino, type ActionsCasino, type AffichageCasino } from './store-casino';
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
export type AffichageJeu = ActionsCasino & {
  pantheon: { ouvert: boolean; premiereVictoire: boolean; equipe: PokemonPossede[]; defiChenEnAttente: boolean } | null;
  quitterPantheon(): void;
  lancerDefiChen(): void;
  fin: { diplome: { nom: string; date: string } | null; credits: boolean };
  fermerCredits(): void;
  casino: AffichageCasino;
  intro: { enCours: boolean; premiereLigneVue: boolean; choixStarter: boolean;
    sacOuvert: boolean; carteOuverte: boolean; starters: { numero: number; nom: string; shiny: boolean }[] };
  choisirStarter(numero: number): string | null;
  evenement: Commande | null;
  objetsCles: string[];
  utiliserObjetCle(id: string): string | null;
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
  boutique: AffichageBoutique; centre: AffichageBoutique; sac: AffichageSac; autoClic: { possede: boolean; actif: boolean };
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
  argent: number; enRecherche: boolean; cache: boolean; annonce: string | null; banniere: string | null;
  sonActive: boolean; basculerSon(): void;
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
  allerVers(zoneId: string): void; attaquer(): boolean; demarrer(): void; arreter(): void; fermer(): void; tick(): void;
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
  const lieuDe = (id: string): ZoneMonde => {
    if (id !== 'kanto.labo') return kanto.zone(id);
    const labo = kanto.lieu('labo');
    return { id, nom: labo.nom, decor: labo.decor, ancienId: labo.ancienId,
      sansCombat: true, liens: [{ vers: labo.depuis }] };
  };
  const defiEnCombat = () => region.zoneId === 'kanto.labo'
    && region.drapeaux.includes('defi-chen-actif') && region.drapeaux.includes('defi-chen-intro-vue')
    && !region.drapeaux.includes('defi-chen-gagne') && !commandeCourante(evenements, region);
  let boucle: ReturnType<typeof creerBoucle<null>> | undefined;
  let minuteur: ReturnType<typeof setInterval> | undefined;
  let sauvegarde: ReturnType<typeof setInterval> | undefined;
  let erreur: string | null = null;
  let degats: Degat[] = [];
  let identifiantDegat = 0;
  const catalogue = chargerPokemon();
  let annonce: string | null = null;
  let banniere: string | null = null;
  let finBanniereMs = 0;
  let sonActive = reglages.sons.actifParDefaut;
  let echange: AffichageJeu['echange'] = null;
  let finAnnonceMs = 0;
  // Temps effectivement simulé par la boucle utilisant l'horloge injectée.
  let tempsJeuMs = 0;
  let resteAutoClicMs = 0;
  let evolutionEnCours: EvolutionAffichee | null = null;
  let finEvolutionMs = 0;
  let obtentionBadge: { id: string; debutMs: number } | null = null;
  let pantheon: AffichageJeu['pantheon'] = null;
  let debutDefiChenMs: number | null = null;
  let traitementEnCours = false;
  let finPokedexEnAttente = false;
  const objets = chargerObjets();
  const abonnesDegats = new Set<(degat: Degat) => void>();
  const abonnesSons = new Set<(ton: Ton) => void>();
  const emettreSon = (ton: Ton) => { abonnesSons.forEach(abonne => abonne(ton)); };
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
    if (pokedexDeKanto(pokedex, catalogue).nombre >= 151) {
      if (traitementEnCours) finPokedexEnAttente = true;
      else executer({ type: 'palier-pokedex', palier: 151 });
    }
    if (pokedex !== precedent || paliers.length > 0) enregistrer();
  };
  const acces = (zoneId: string) => {
    const resultat = blocage(evenements, region, zoneId);
    return resultat.ok ? kanto.accesZone(zoneId, etatMondeDe(region)) : resultat;
  };
  const traiter = (): void => {
    if (!coeur) return;
    traitementEnCours = true;
    try {
    const commande = commandeCourante(evenements, region);
    const combatEvenement = commande?.type === 'combat' && zoneDuCombat(evenements, region) === region.zoneId;
    if (!combatEvenement) region = { ...region, zoneId: coeur.zoneId, etape: coeur.etape };
    let sauvegarder = false;
    let terminerCombatEvenement = false;
    let ouvrirPantheon = false;
    const bossBattus: string[] = [];
    const messagesCapture: string[] = [];
    for (const evenement of coeur.evenements) {
      if (evenement.type === 'arret-auto') {
        banniere = banniereArret(evenement.motif);
        finBanniereMs = tempsJeuMs + reglages.animations.banniereMs;
      }
      const message = annonceCapture(evenement, coeur.ennemi.numero);
      if (message) { messagesCapture.push(message); sauvegarder = true; }
      if (evenement.type === 'capture-reussie') {
        emettreSon('catch');
        const resultat = appliquerCapture(region, evenement, coeur.actifs, alea, genererId);
        region = resultat.region;
        noterDansPokedex(evenement.numero, messagesCapture);
        if (resultat.destination === 'pc') messagesCapture.push(`${catalogue.parNumero(evenement.numero).nom} est envoyé au PC.`);
        if (resultat.bonbons > 0) messagesCapture.push(`Chromatique ! +${resultat.bonbons} Bonbons`);
      }
      if (evenement.type === 'ennemi-vaincu') {
        emettreSon('coin');
        if (region.equipe.some(p => p.oeuf)) sauvegarder = true;
        const r = appliquerVictoire(region, evenement, coeur.actifs);
        region = r.region;
        if (r.montees.length > 0) emettreSon('up');
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
        if (combatEvenement) sauvegarder = true;
        if (!combatEvenement && evenement.boss && estZoneDeLigue(coeur.zone)) {
          const message = messageEnchainement(coeur.zone, evenement.etape);
          if (message) messages.push(message);
          sauvegarder = true;
        }
        messagesCapture.push(...messages);
      }
      if (evenement.type === 'boss-vaincu') {
        if (coeur.zone.id === 'kanto.labo') {
          region = victoireDefi({ ...region, etape: coeur.zone.etapes });
          coeur = null;
          executer({ type: 'boss-vaincu', zone: 'kanto.labo' });
          enregistrer();
          return;
        }
        if (combatEvenement) {
          terminerCombatEvenement = true;
          sauvegarder = true;
          continue;
        }
        const pensionOuverte = pension.accesPension(kanto, etatMondeDe(region)).ouvert;
        if (coeur.zone.id === 'kanto.ligue-pokemon' && evenement.zoneId === 'kanto.ligue-pokemon') {
          region = enregistrerVictoireLigue(region);
          ouvrirPantheon = true;
        }
        const resultat = accorderBadge(region, evenement.zoneId);
        region = resultat.region;
        if (resultat.badge) {
          emettreSon('up');
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
        if (coeur.zone.id === 'kanto.labo') {
          const resultat = echecDefi(region);
          region = resultat.region;
          changerDeZone(region.zoneId);
          annonce = resultat.message;
          finAnnonceMs = tempsJeuMs + reglages.interface.annonceMs;
          enregistrer();
          return;
        }
        messagesCapture.push(combatEvenement
          ? `Temps écoulé ! ${'dresseur' in commande ? commande.dresseur : commande.nom ?? catalogue.parNumero(commande.pokemon).nom} reprend avec son premier Pokémon.`
          : messageDefaite(coeur.zone, coeur.etape) ?? 'Temps écoulé !');
        if (estZoneDeLigue(coeur.zone)) sauvegarder = true;
      }
    }
    if (messagesCapture.length) { annonce = messagesCapture.join(' · '); finAnnonceMs = tempsJeuMs + reglages.interface.annonceMs; }
    if (coeur) {
      if (preferences.autoAttaque !== coeur.autoAttaque) { preferences = { ...preferences, autoAttaque: coeur.autoAttaque }; sauvegarder = true; }
      coeur = { ...coeur, equipe: region.equipe.map(versMembreEquipe), pokedex };
      coeur = viderEvenements(coeur);
    }
    if (ouvrirPantheon) {
      pantheon = { ouvert: true, premiereVictoire: region.ligueGagnee === 1,
        equipe: structuredClone(region.equipe), defiChenEnAttente: false };
      region = { ...region, zoneId: 'kanto.bourg-palette', etape: 1 };
      coeur = null;
      resteAutoClicMs = 0;
      prechargerLieu();
    }
    if (sauvegarder) enregistrer();
    if (terminerCombatEvenement && commande) appliquerEvenement(etapeTerminee(evenements, region, commande));
    for (const zone of bossBattus) executer({ type: 'boss-vaincu', zone });
    } finally {
      traitementEnCours = false;
      if (finPokedexEnAttente) {
        finPokedexEnAttente = false;
        executer({ type: 'palier-pokedex', palier: 151 });
      }
    }
  };
  const afficher = () => {
    if (!initialise) return;
    const maintenant = horloge.maintenant();
    const actifs = actifsCourants(region, maintenant);
    const lieu = lieuDe(region.zoneId);
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
    const zonePrecedente = destination(lieu.id === 'kanto.labo' ? kanto.zone(kanto.lieu('labo').depuis) : kanto.zonePrecedente(lieu.id));
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
    const fin: AffichageJeu['fin'] = {
      diplome: region.ameliorations.includes('diploma') && region.diplomeLe
        ? { nom: persistance.nom, date: region.diplomeLe } : null,
      credits: region.drapeaux.includes('credits-disponibles') && !region.drapeaux.includes('credits-vus'),
    };
    store.setState({ pantheon, fin: JSON.stringify(fin) === JSON.stringify(precedent.fin) ? precedent.fin : fin,
      lieu, zone: coeur?.zone ?? null, etape: region.etape, ennemi, pv: ennemi?.pv ?? 0,
      nomAdversaire: coeur ? evenement?.type === 'combat' && zoneDuCombat(evenements, region) === region.zoneId
        ? nomAdversaireEvenement(evenement, region.starterId, coeur.etape)
        : nomAdversaire(coeur.zone, coeur.etape) : null, ligueGagnee: region.ligueGagnee,
      objetsCles: region.objetsCles,
      intro: JSON.stringify(intro) === JSON.stringify(precedent.intro) ? precedent.intro : intro,
      evenement: JSON.stringify(evenement) === JSON.stringify(precedent.evenement) ? precedent.evenement : evenement,
      progression: afficherProgression(region, pokedex),
      obtentionBadge: obtentionBadge ? { id: obtentionBadge.id,
        phase: phaseObtention(obtentionBadge.debutMs, tempsJeuMs) } : null,
      effets: afficherEffets(region, maintenant, precedent.effets),
      fauchage: afficherFauchage(region, coeur, maintenant, precedent.fauchage),
      radar: region.ameliorations.includes('pokeradar'),
      capture: afficherCapture(coeur, region.inventaire, precedent.capture),
      boutique: afficherBoutique(region, precedent.boutique), centre: afficherCentre(region, precedent.centre), sac,
      casino: afficherCasino(region, precedent.casino),
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
      argent: region.argent, enRecherche: (coeur?.attenteMs ?? 0) > 0 && !coeur?.attenteCapture, cache: (coeur?.attenteMs ?? 0) > 0, annonce, banniere, sonActive, echange,
      minuteur: coeur && coeur.attenteMs === 0 && coeur.minuteurMs !== null
        ? { restantMs: coeur.minuteurMs, totalMs: reglages.combat.minuteurBossMs } : null,
      zonePrecedente: JSON.stringify(zonePrecedente) === JSON.stringify(precedent.zonePrecedente) ? precedent.zonePrecedente : zonePrecedente,
      zoneSuivante: JSON.stringify(zoneSuivante) === JSON.stringify(precedent.zoneSuivante) ? precedent.zoneSuivante : zoneSuivante,
      evenementsDegats: degats });
    degats = [];
  };
  const prechargerLieu = () => {
    const lieu = lieuDe(region.zoneId);
    if (imageConnue(cheminDecor(lieu))) void precharger([cheminDecor(lieu)]);
    if (!lieu.sansCombat) void prechargerZone(zoneDeLigue(lieu, region.starterId));
    else if (defiEnCombat()) void prechargerZone(zoneDuDefi(region.starterId));
  };
  const synchroniserCombatEvenement = () => {
    const commande = commandeCourante(evenements, region);
    const lieu = lieuDe(region.zoneId);
    if (region.zoneId === 'kanto.labo') {
      if (defiEnCombat()) {
        if (coeur?.zone.id === 'kanto.labo') return;
        coeur = reprendreCombat(zoneDuDefi(region.starterId), region.equipe.map(versMembreEquipe), alea,
          region.etape, actifsCourants(region, horloge.maintenant()), optionsCombat());
      } else coeur = null;
      resteAutoClicMs = 0;
      return;
    }
    const combatEvenement = commande?.type === 'combat' && zoneDuCombat(evenements, region) === region.zoneId;
    if (combatEvenement && !lieu.sansCombat) {
      const zone = zoneDeCombatEvenement(commande, lieu, region.starterId);
      if (coeur?.zone.id === zone.id) return;
      coeur = creerCombat(zone, region.equipe.map(versMembreEquipe), alea,
        actifsCourants(region, horloge.maintenant()), { ...optionsCombat(), autoClic: coeur?.autoClic ?? false });
    } else if (coeur?.zone.id.startsWith('evenement:')) {
      coeur = lieu.sansCombat ? null : reprendreCombat(zoneDeLigue(lieu, region.starterId),
        region.equipe.map(versMembreEquipe), alea, region.etape,
        actifsCourants(region, horloge.maintenant()), { ...optionsCombat(), autoClic: coeur.autoClic });
    } else return;
    resteAutoClicMs = 0;
    if (coeur && tempsJeuMs < finEvolutionMs) coeur = suspendreDps(coeur, finEvolutionMs - tempsJeuMs);
  };
  const changerDeZone = (zoneId: string): void => {
    const lieu = lieuDe(zoneId);
    const autoClic = coeur?.autoClic ?? false;
    coeur = lieu.sansCombat ? null : creerCombat(zoneDeLigue(lieu, region.starterId), region.equipe.map(versMembreEquipe), alea, actifsCourants(region, horloge.maintenant()), { ...optionsCombat(), autoClic });
    resteAutoClicMs = 0;
    if (coeur && tempsJeuMs < finEvolutionMs) coeur = suspendreDps(coeur, finEvolutionMs - tempsJeuMs);
    region = { ...region, zoneId, etape: 1 };
    synchroniserCombatEvenement();
    annonce = null;
    traiter();
    degats = [];
    prechargerLieu();
  };
  const appliquerEvenement = (suivante: DonneesRegion): void => {
    if (suivante === region) return;
    const ancienneZone = region.zoneId;
    const ancienneEtape = region.etape;
    const ancienneAnnonce = annonce;
    region = suivante;
    if (region.ameliorations.includes('diploma') && !region.diplomeLe) {
      region = { ...region, diplomeLe: new Date(horloge.maintenant()).toISOString() };
    }
    if (region.zoneId !== ancienneZone || region.etape !== ancienneEtape) {
      changerDeZone(region.zoneId);
      annonce = ancienneAnnonce;
    }
    synchroniserCombatEvenement();
    enregistrer();
  };
  const executer = (fait: Declencheur): void => {
    if (evenements.liste.length === 0 && !region.evenementEnCours) return;
    appliquerEvenement(declencher(evenements, region, fait));
  };
  const cacher = () => { if (document.visibilityState === 'hidden') enregistrer(); };
  const demarrerEvolution = (evolution: { uid: string; de: number; vers: number }) => {
    emettreSon('up');
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
    uidPc?: string, fermerEchange = false, ton?: Ton): string | null => {
    if (!initialise) return 'La partie n’est pas démarrée.';
    const resultat = action(region);
    if (!resultat.ok) return resultat.raison;
    if (resultat.echangeRequis && uidPc !== undefined) {
      const pokemon = region.pc.find(p => p.uid === uidPc)!;
      echange = { uid: uidPc, nom: nomAffiche(pokemon) };
    } else {
      region = resultat.region;
      if (ton) emettreSon(ton);
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
  const modifierCasino = <T extends ReturnType<typeof casino.acheterAuCasino<DonneesRegion>>>(
    action: (region: DonneesRegion) => T): T | { ok: false; raison: string } => {
    if (!initialise) return { ok: false, raison: 'La partie n’est pas démarrée.' };
    const acces = casino.accesCasino(kanto, etatMondeDe(region));
    if (!acces.ok) return { ok: false, raison: acces.raison! };
    const resultat = action(region);
    if (!resultat.ok) return resultat;
    region = resultat.region;
    annonce = resultat.message;
    finAnnonceMs = tempsJeuMs + reglages.interface.annonceMs;
    if (resultat.numero !== undefined) noterDansPokedex(resultat.numero);
    if (coeur) coeur = { ...coeur, equipe: region.equipe.map(versMembreEquipe) };
    actualiserActifs();
    enregistrer(); afficher();
    return { ...resultat, region };
  };
  const frapper = (): boolean => {
    if (!coeur || minuteur === undefined) return false;
    actualiserActifs();
    const avant = coeur;
    coeur = cliquer(coeur, limiteur);
    if (avant === coeur) return false;
    const degat = { id: ++identifiantDegat,
      valeur: Math.min(avant.ennemi.pv, calculerClic(calculerDpsEquipe(avant.equipe, avant.ennemi, avant.actifs), avant.actifs)) };
    degats.push(degat);
    abonnesDegats.forEach(abonne => abonne(degat));
    traiter();
    return true;
  };
  const store = createStore<AffichageJeu>(() => ({
    pantheon: null,
    fin: { diplome: null, credits: false },
    fermerCredits() {
      if (!initialise || !store.getState().fin.credits) return;
      region = { ...region, drapeaux: [...region.drapeaux, 'credits-vus'] };
      enregistrer(); afficher();
    },
    lancerDefiChen() {
      if (!initialise || region.evenementEnCours || defiEnCombat()
        || !peutLancer(region, pokedexDeKanto(pokedex, catalogue).nombre,
          region.evenementsJoues.includes('kanto.fin-pokedex'))) return;
      region = { ...region, drapeaux: [...new Set([...region.drapeaux, 'defi-chen-actif'])] };
      changerDeZone('kanto.labo');
      executer({ type: 'entree-zone', zone: 'kanto.labo' });
      enregistrer(); afficher();
    },
    quitterPantheon() {
      const courant = store.getState().pantheon;
      if (!initialise || !courant?.ouvert) return;
      const sortie = issueDuPantheon({ ligueGagnee: region.ligueGagnee,
        defiEnAttente: courant.defiChenEnAttente });
      pantheon = null;
      annonce = sortie.annonceJohto ? 'Johto arrive bientôt !' : null;
      finAnnonceMs = tempsJeuMs + reglages.interface.annonceMs;
      if (sortie.issue === 'defi-chen') debutDefiChenMs = horloge.maintenant() + donneesPantheon.delais.defiChenMs;
      afficher();
    },
    casino: { acces: { ouvert: false, raison: casino.chargerCasino().acces.raison },
      jetons: 0, blackjackEnCours: null, objets: [] },
    acheterJetons: () => modifierCasino(casino.acheterJetons),
    echangerJetons: () => modifierCasino(casino.echangerJetons),
    jouerMachine: mise => modifierCasino(region => casino.jouerMachine(region, mise, alea)),
    jouerPileOuFace: (mise, choix) => modifierCasino(region => casino.jouerPileOuFace(region, mise, choix, alea)),
    distribuerBlackjack: mise => modifierCasino(region => casino.distribuer(region, mise, alea)),
    tirerBlackjack: () => modifierCasino(region => casino.tirerCarte(region, alea)),
    resterBlackjack: () => modifierCasino(region => casino.rester(region, alea)),
    acheterAuCasino: id => modifierCasino(region => casino.acheterAuCasino(region, id, alea, genererId)),
    sonActive,
    basculerSon() {
      if (!initialise) return;
      const suivant = !sonActive;
      try { persistance.enregistrerSon(suivant); sonActive = suivant; }
      catch (cause) { erreur = detailErreur(cause); }
      afficher();
    },
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
    objetsCles: [],
    utiliserObjetCle(id) {
      if (!initialise) return 'La partie n’est pas démarrée.';
      if (!region.objetsCles.includes(id)) return 'Objet clé non possédé.';
      const suivante = declencher(evenements, region, { type: 'objet-utilise', objet: id, zone: region.zoneId });
      if (suivante === region) return "Ce n'est pas le moment d'utiliser ça !";
      appliquerEvenement(suivante);
      afficher();
      return null;
    },
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
    }, undefined, false, 'up'),
    boutique: { acces: { ouvert: false, raison: reglages.shop.raison }, objets: [] },
    centre: { acces: { ouvert: false, raison: null }, objets: [] },
    sac: { acces: { ouvert: false, raison: reglages.sac.raison }, entrees: [] },
    autoClic: { possede: false, actif: false },
    acheter(id, quantite) {
      if (!initialise) return 'La partie n’est pas démarrée.';
      const disponible = afficherBoutique(region, null).objets.find(objet => objet.id === id)
        ?? afficherCentre(region, null).objets.find(objet => objet.id === id);
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
      }, undefined, false, type === 'bonbon' ? 'up' : undefined);
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
    evolution: null, argent: 0, enRecherche: false, cache: false, annonce: null, banniere: null, echange: null,
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
    envoyerAuPc: uid => modifierEquipe(region => equipe.envoyerAuPc(region, uid), undefined, false, 'pc'),
    placerDansEquipe: uid => modifierEquipe(region => equipe.placerDansEquipe(region, uid), uid, false, 'pc'),
    echanger: (uidPc, uidEquipe) => modifierEquipe(region => equipe.echanger(region, uidPc, uidEquipe), undefined, true, 'pc'),
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
      return frapper();
    },
    demarrer() {
      if (minuteur !== undefined || store.getState().erreurChargement) return;
      try {
        if (!initialise) {
          persistance = ouvrirPartie({ stockage, horloge, genererId }, nouvellePartie === 'intro'
            ? { equipe: [], drapeaux: ['nouvelle-partie'] } : { equipe: equipeDeDepart(), drapeaux: [] });
          region = persistance.region;
          preferences = persistance.preferences;
          sonActive = persistance.sonActive;
          pokedex = completerPokedex(persistance.pokedex, region);
          zonesVues = new Set(kanto.zonesOuvertes(etatMondeDe(region)).map(zone => zone.id));
          const lieu = lieuDe(region.zoneId);
          coeur = lieu.sansCombat ? null : reprendreCombat(zoneDeLigue(lieu, region.starterId), region.equipe.map(versMembreEquipe), alea, region.etape, actifsCourants(region, horloge.maintenant()), optionsCombat());
          synchroniserCombatEvenement();
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
          if (banniere !== null && tempsJeuMs >= finBanniereMs) banniere = null;
          actualiserActifs();
          if (coeur?.autoClic && coeur.attenteMs === 0) {
            const resultat = clicsAutomatiques(resteAutoClicMs, reglages.boucle.pasMs, reglages.combat.autoClicIntervalleMs);
            resteAutoClicMs = resultat.resteMs;
            for (let i = 0; i < resultat.clics; i++) frapper();
          } else resteAutoClicMs = 0;
          if (coeur) coeur = avancerCombat(coeur, reglages.boucle.pasMs);
          traiter();
          return null;
        } });
        boucle.abonner(afficher);
        minuteur = setInterval(() => store.getState().tick(), reglages.boucle.pasMs);
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
      debutDefiChenMs = null;
      if (typeof window !== 'undefined') {
        window.removeEventListener('pagehide', enregistrer);
        document.removeEventListener('visibilitychange', cacher);
      }
    },
    fermer: enregistrer,
    tick: () => {
      if (boucle && debutDefiChenMs !== null && horloge.maintenant() >= debutDefiChenMs) {
        debutDefiChenMs = null;
        store.getState().lancerDefiChen?.();
      }
      boucle?.tick();
    },
  }));
  return Object.assign(store, {
    abonnerSons(abonne: (ton: Ton) => void) {
      abonnesSons.add(abonne);
      return () => { abonnesSons.delete(abonne); };
    },
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
