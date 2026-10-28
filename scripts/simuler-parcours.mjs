// Simulateur de parcours de Kanto (ticket AB).
//
// Le script charge `src/core` sans DOM (Vite en mode SSR, aucun serveur ouvert) et fait tourner la vraie boucle de jeu :
// `creerBoucle` (loop.ts) avec une horloge simulée, `avancerCombat`, `cliquer`, `appliquerVictoire`, `appliquerCapture`,
// `accorderBadge`, `accorderJalons`, `acheter`, `utiliserTemporise`, `evoluer`… Il ne recopie aucune formule du jeu.
// Ce qu'il invente est la politique du joueur (capturer, acheter, régler l'équipe), décrite en tête de `jouerParcours`.
// Elle est volontairement simple et déterministe : ce n'est pas l'équipe réelle d'un joueur, voir docs/projet/equilibrage-28-10.md.
//
// Usage : node scripts/simuler-parcours.mjs [--clics N] [--sans-bonus [zone]] [--avant] [--starter 1|4|7] [--graine N]
//   [--pokedex reel|theorique] [--candidat zone=valeur]… [--jusqua zone] [--temps-max-zone minutes] [--json]
//   [--debut] [--frequences [N]] [--comparer]
// Le fichier ne vérifie pas ses types : les modules du jeu arrivent par chargement dynamique et n'ont pas de types ici.
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const RACINE = fileURLToPath(new URL('../', import.meta.url));
const MODULES = {
  combat: 'combat', clics: 'clics', loop: 'loop', clock: 'clock', recompenses: 'recompenses', capture: 'capture',
  progression: 'progression', boutique: 'boutique', objetsActifs: 'objets-actifs', evolution: 'evolution',
  pokedex: 'pokedex', regions: 'regions', sauvegarde: 'sauvegarde', starter: 'starter', ligue: 'ligue',
  reglages: 'reglages', pokemon: 'pokemon', ennemis: 'ennemis', stats: 'stats',
};
// Améliorations que la politique achète (par prix croissant). Le Poké-Radar et le Fauchage sont exclus : le simulateur
// ne sait pas s'en servir (pas de recherche ciblée, pas de capture à 1 PV).
const AMELIORATIONS_ACHETEES = ['runningShoes', 'amuletCoin', 'protein', 'expShare', 'hardStone', 'bicycle', 'luckyEgg', 'leftovers'];
const BALLES_PAR_PRIORITE = ['hyperball', 'superball', 'pokeball'];
const BOOSTERS = ['xAttack', 'xSpecial'];

/** Charge les modules du cœur via Vite SSR. À fermer avec `fermer()`. */
export async function chargerCoeur() {
  const { createServer } = await import('vite');
  const serveur = await createServer({
    root: RACINE, configFile: false, appType: 'custom', logLevel: 'silent',
    server: { middlewareMode: true, hmr: false, watch: null }, optimizeDeps: { noDiscovery: true, include: [] },
  });
  const M = {};
  for (const [nom, fichier] of Object.entries(MODULES)) M[nom] = await serveur.ssrLoadModule(`/src/core/${fichier}.ts`);
  return { M, fermer: () => serveur.close() };
}

/** Générateur pseudo-aléatoire déterministe. */
export function graineAlea(graine) {
  let a = graine >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Multiplicateurs de PV de la V1 (fixture extraite du vrai code V1), par numéro de zone d'origine. */
function multiplicateursV1() {
  const fixture = JSON.parse(readFileSync(new URL('../tests/fixtures/v1-zones.json', import.meta.url), 'utf8'));
  return new Map(fixture.multiplicateurs);
}

/**
 * Joue Kanto de la Route 1 à la Ligue (ou jusqu'à `jusquA`) avec la vraie boucle de jeu.
 *
 * Politique du joueur simulé :
 * - équipe : le starter choisi au niveau 5 et 5 Poké Balls (cadeau de Chen) ; les six meilleurs DPS (sans type) parmi
 *   l'équipe et le PC sont placés en équipe à chaque capture, évolution et changement de zone ;
 * - capture : jusqu'à trois lancers par ennemi dès son apparition, avec la meilleure balle possédée, pour toute espèce
 *   absente du Pokédex (le simulateur ne sait pas attendre qu'un ennemi soit affaibli, il sous-estime donc les captures) ;
 * - évolution par niveau dès qu'elle est possible ; pas de pierre, pas de Pension, pas d'œufs, pas de Casino ;
 * - achats (sauf `sansBonus`) : balles (stock de 10 de la meilleure vendue), puis la moins chère des améliorations utiles
 *   (Chaussures, Pièce Rune, Protéine, Multi Exp, Pierre Dure, Bicyclette, Œuf Chance, Restes), puis Attaque + et Attaque Spé +
 *   dès qu'un boss a déjà été raté dans la zone (utilisés à chaque essai suivant) ;
 * - clics : `clics` par seconde (plafonné à 12 par le limiteur du jeu), Restes activés dès qu'ils sont achetés ;
 * - un boss raté se rejoue après l'étape 9, comme dans le jeu ; le joueur ne retourne jamais dans une zone précédente ;
 * - les événements scénarisés (rival, Ronflex, Pokéflûte) ne sont pas joués, aucune zone n'est bloquée par eux.
 * `sansBonus` : aucun palier de Pokédex et aucun achat hors balles (critère 4 du ticket). Avec `sansBonusDepuis` (id de
 * zone), le joueur joue normalement jusque-là, puis perd améliorations, paliers et boosters à l'entrée de cette zone.
 * `pokedex: 'theorique'` : le Pokédex compte toutes les espèces rencontrables dans les zones visitées et leurs évolutions
 * par niveau (cas d'un joueur qui complète son Pokédex ; borne haute, indiquée comme telle dans les rapports).
 * `avant` : valeurs de la V1 (PV des zones et argent ×1) pour mesurer le changement du ticket.
 */
export function jouerParcours(M, options = {}) {
  const o = {
    clics: 7, sansBonus: false, graine: 1, starter: 1, pokedex: 'reel', avant: false, candidats: {},
    jusquA: null, tempsMaxZoneMs: 2 * 3600e3, ...options,
  };
  const { reglages } = M.reglages;
  const { kanto } = M.regions;
  const catalogue = M.pokemon.chargerPokemon();
  const objets = M.boutique.chargerObjets();
  const v1 = multiplicateursV1();
  const alea = graineAlea(o.graine);
  let sequenceId = 0;
  const genererId = () => `sim-${++sequenceId}`;
  const horloge = M.clock.creerHorlogeSimulee();
  const limiteur = M.combat.creerLimiteurClics(horloge);
  const pasMs = reglages.boucle.pasMs;

  const multiplicateurOrInitial = reglages.recompenses.or.multiplicateur;
  if (o.avant) reglages.recompenses.or.multiplicateur = 1;
  try {
    const zoneDeJeu = (id) => {
      const base = M.ligue.zoneDeLigue(kanto.zoneDeCombat(id), o.starter);
      let multiplicateurPv = base.multiplicateurPv;
      if (o.avant) multiplicateurPv = v1.get(base.ancienId) ?? multiplicateurPv;
      if (o.candidats[id] !== undefined) multiplicateurPv = o.candidats[id];
      return { ...base, multiplicateurPv };
    };
    const equipeDe = (region) => region.equipe.map(M.sauvegarde.versMembreEquipe);
    const actifsDe = (region) => [...M.progression.actifsDe(region), ...M.objetsActifs.clesActives(region.chronos, horloge.maintenant())];
    const niveauMoyen = (region) => {
      const vivants = region.equipe.filter((p) => !p.oeuf);
      return vivants.reduce((somme, p) => somme + p.niveau, 0) / Math.max(1, vivants.length);
    };
    const nouveauStat = (zone) => ({
      id: zone.id, nom: zone.nom, niveaux: zone.niveaux, multiplicateurPv: zone.multiplicateurPv, ligue: zone.type === 'ligue',
      entreeMs: horloge.maintenant(), sortieMs: null, premierBossMs: null, premierEchecMs: null,
      tentatives: 0, echecs: 0, premierEssai: null, premierEssaiDureeMs: null, victoire: false,
      gagne: 0, depense: 0, lancers: 0, captures: 0, nouvellesEspeces: 0,
      niveauMoyenEntree: 0, niveauMoyenBoss: null, niveauMoyenSortie: null, pokedexEntree: 0, pokedexSortie: null,
      pvBoss: null, dpsBoss: null, degats30sSansClic: null, degats30sAvecClics: null,
      margeSansClic: null, margeAvecClics: null, margeMax: null, boosters: 0,
    });

    // --- état de la simulation -------------------------------------------------------------------------------
    const depart = M.starter.creerStarter(o.starter, false, alea, genererId);
    let region = M.sauvegarde.regionInitiale('kanto', kanto.premierCombat);
    region = { ...region, equipe: [depart], starterId: o.starter, inventaire: { pokeball: 5 } };
    const S = {
      region, pokedex: [o.starter], combat: null, stat: null, zones: [], fini: false, raison: 'Ligue gagnée',
      captures: new Set([o.starter]), bonusCoupes: o.sansBonus && !o.sansBonusDepuis, enBoss: false, dernierAchatMs: -1000, compteurEnnemis: 0, lancersEnnemi: 0, resteClic: 0, resteAutoClic: 0, dernierBossTentative: 0,
    };

    const synchroniser = () => { S.combat = { ...S.combat, equipe: equipeDe(S.region), pokedex: S.pokedex, actifs: actifsDe(S.region) }; };
    const entrerDansZone = (id) => {
      const zone = zoneDeJeu(id);
      if (o.sansBonus && o.sansBonusDepuis === id && !S.bonusCoupes) {
        // Le joueur perd ses améliorations, ses paliers de Pokédex et ses boosters à l'entrée de cette zone.
        S.bonusCoupes = true;
        const inventaire = { ...S.region.inventaire };
        for (const cle of BOOSTERS) delete inventaire[cle];
        S.region = { ...S.region, ameliorations: [], jalonsRecus: [], inventaire };
      }
      S.stat = nouveauStat(zone);
      S.stat.niveauMoyenEntree = niveauMoyen(S.region);
      S.zones.push(S.stat);
      S.region = { ...S.region, zoneId: id, etape: 1 };
      if (o.pokedex === 'theorique') ajouterEspecesDeLaZone(zone);
      optimiserEquipe();
      S.combat = M.combat.creerCombat(zone, equipeDe(S.region), alea, actifsDe(S.region),
        { autoAttaque: true, arret: null, pokedex: S.pokedex, autoClic: S.combat?.autoClic ?? false });
      S.stat.pokedexEntree = S.pokedex.length;
      S.enBoss = false;
    };
    const noterEspece = (numero) => {
      const avant = S.pokedex.length;
      S.pokedex = M.pokedex.ajouterAuPokedex(S.pokedex, numero);
      if (S.stat && S.pokedex.length > avant) S.stat.nouvellesEspeces += 1;
      if (!S.bonusCoupes) {
        const avantArgent = S.region.argent;
        S.region = M.progression.accorderJalons(S.region, M.pokedex.pokedexDeKanto(S.pokedex, catalogue).nombre).region;
        S.stat.gagne += S.region.argent - avantArgent;
      }
    };
    const evolutionsParNiveau = (numero) => {
      const suite = M.evolution.chargerEvolutions().niveau.filter((ligne) => ligne.de === numero).map((ligne) => ligne.vers);
      return suite.flatMap((vers) => [vers, ...evolutionsParNiveau(vers)]);
    };
    function ajouterEspecesDeLaZone(zone) {
      for (const sauvage of zone.sauvages) {
        for (const numero of [sauvage.pokemon, ...evolutionsParNiveau(sauvage.pokemon)]) {
          if (!S.pokedex.includes(numero)) noterEspece(numero);
        }
      }
    }
    function optimiserEquipe() {
      const score = (p) => M.stats.calculerDps({ ...M.sauvegarde.versMembreEquipe(p), multiplicateurType: 1 });
      const tous = [...S.region.equipe, ...S.region.pc].filter((p) => !p.oeuf);
      const ordre = [...tous].sort((a, b) => score(b) - score(a) || a.uid.localeCompare(b.uid));
      const equipe = ordre.slice(0, reglages.equipe.taille);
      S.region = { ...S.region, equipe, pc: ordre.slice(reglages.equipe.taille) };
    }
    const evoluerSiPossible = () => {
      for (const membre of S.region.equipe) {
        if (M.evolution.evolutionDisponible(membre) === null) continue;
        const resultat = M.evolution.evoluer(S.region, membre.uid);
        if (!resultat.ok) continue;
        S.region = resultat.region;
        noterEspece(resultat.evolution.vers);
        S.combat = M.combat.suspendreDps(S.combat, Math.max(S.combat.pauseDpsMs, reglages.evolution.animationMs));
        optimiserEquipe();
      }
    };

    // --- politique : achats, boosters, captures --------------------------------------------------------------
    const prixDe = (objet) => M.boutique.prixObjet(objet, {
      badges: S.region.badges.length, palier: S.region.jalonsRecus.includes(reglages.boutique.palierRemise),
    });
    const catalogueOuvert = () => {
      const etat = M.sauvegarde.etatMondeDe(S.region);
      return [...M.boutique.objetsDuShop(objets, kanto, etat), ...M.boutique.objetsDuCentre(objets, kanto, etat)];
    };
    const acheterObjet = (objet, quantite) => {
      const prix = prixDe(objet);
      const resultat = M.boutique.acheter(S.region, objet, quantite, prix);
      if (!resultat.ok) return false;
      S.region = resultat.region;
      S.stat.depense += prix * quantite;
      return true;
    };
    const acheterSelonPolitique = () => {
      const ouvert = catalogueOuvert();
      if (ouvert.length === 0) return;
      const balle = BALLES_PAR_PRIORITE.map((id) => ouvert.find((objet) => objet.id === id)).find(Boolean);
      if (balle && (S.region.inventaire[balle.inventaire] ?? 0) < 5) {
        const manque = 10 - (S.region.inventaire[balle.inventaire] ?? 0);
        const possible = Math.min(manque, Math.floor(S.region.argent / prixDe(balle)));
        if (possible > 0) acheterObjet(balle, possible);
      }
      if (S.bonusCoupes) return;
      const aAcheter = ouvert.filter((objet) => objet.type === 'amelioration' && !S.region.ameliorations.includes(objet.id)
        && AMELIORATIONS_ACHETEES.includes(objet.id)).sort((a, b) => a.prix - b.prix)[0];
      if (aAcheter && S.region.argent >= prixDe(aAcheter)) {
        acheterObjet(aAcheter, 1);
        synchroniser();
      }
    };
    const utiliserBoosters = () => {
      if (S.bonusCoupes) return;
      const ouvert = catalogueOuvert();
      for (const id of BOOSTERS) {
        const objet = ouvert.find((entree) => entree.id === id);
        if (S.stat.echecs > 0 && objet && (S.region.inventaire[id] ?? 0) === 0 && S.region.argent >= prixDe(objet)) acheterObjet(objet, 1);
        if ((S.region.inventaire[id] ?? 0) <= 0) continue;
        const resultat = M.objetsActifs.utiliserTemporise(S.region, id, horloge.maintenant());
        if (resultat.ok) { S.region = resultat.region; S.stat.boosters += 1; }
      }
      synchroniser();
    };
    const debutBoss = () => {
      S.enBoss = true;
      utiliserBoosters();
      const c = S.combat;
      const dps = M.combat.calculerDpsEquipe(c.equipe, c.ennemi, c.actifs);
      const clic = M.combat.calculerClic(dps, c.actifs);
      const auto = c.autoClic ? 1000 / reglages.combat.autoClicIntervalleMs : 0;
      const parSeconde = Math.min(reglages.combat.clicsMaxParSeconde, o.clics + auto);
      const sansClic = 30 * dps;
      const avecClics = 30 * (dps + parSeconde * clic);
      const stat = S.stat;
      stat.tentatives += 1;
      const marge = c.ennemi.pvMax / avecClics;
      stat.margeMax = Math.max(stat.margeMax ?? 0, marge);
      if (stat.tentatives === 1) {
        Object.assign(stat, {
          premierBossMs: horloge.maintenant(), niveauMoyenBoss: niveauMoyen(S.region), pvBoss: c.ennemi.pvMax, dpsBoss: dps,
          degats30sSansClic: sansClic, degats30sAvecClics: avecClics,
          margeSansClic: c.ennemi.pvMax / sansClic, margeAvecClics: marge,
        });
      }
      S.debutBossMs = horloge.maintenant();
    };
    const lancerCapturesSiUtile = () => {
      const c = S.combat;
      const e = c.ennemi;
      if (e.boss || e.capture === 0 || e.pv <= 0 || c.attenteMs > 0 || c.capture || c.attenteCapture) return;
      if (S.captures.has(e.numero) || S.lancersEnnemi >= 3) return;
      const cle = BALLES_PAR_PRIORITE.find((id) => (S.region.inventaire[id] ?? 0) > 0);
      if (!cle) return;
      const verification = M.capture.verifierLancer({ ennemi: e, attenteMs: c.attenteMs, captureEnCours: false }, S.region.inventaire, cle);
      if (!verification.ok) return;
      const chance = M.capture.chanceCapture(e, cle, c.actifs);
      S.region = { ...S.region, inventaire: M.capture.retirerBalle(S.region.inventaire, cle) };
      S.combat = M.combat.lancerCapture(c, chance);
      S.lancersEnnemi += 1;
      S.stat.lancers += 1;
    };

    // --- traitement des événements du cœur (équivalent de `traiter` dans le store de l'interface) -------------
    const nouvelEnnemi = () => { S.compteurEnnemis += 1; S.lancersEnnemi = 0; S.enBoss = false; };
    const traiter = () => {
      let zoneVaincue = null;
      for (const ev of S.combat.evenements) {
        if (ev.type === 'capture-reussie') {
          const avant = S.region.argent;
          const resultat = M.capture.appliquerCapture(S.region, ev, S.combat.actifs, alea, genererId);
          S.region = resultat.region;
          S.stat.gagne += S.region.argent - avant;
          S.stat.captures += 1;
          S.captures.add(ev.numero);
          noterEspece(ev.numero);
          optimiserEquipe();
          nouvelEnnemi();
        } else if (ev.type === 'ennemi-vaincu') {
          const avant = S.region.argent;
          S.region = M.recompenses.appliquerVictoire(S.region, ev, S.combat.actifs).region;
          S.stat.gagne += S.region.argent - avant;
          if (ev.boss && S.stat.premierEssai === null && !S.stat.ligue) {
            S.stat.premierEssai = 'victoire';
            S.stat.premierEssaiDureeMs = horloge.maintenant() - S.debutBossMs;
          }
          evoluerSiPossible();
          nouvelEnnemi();
        } else if (ev.type === 'boss-vaincu') {
          zoneVaincue = ev.zoneId;
        } else if (ev.type === 'boss-echoue') {
          S.stat.echecs += 1;
          if (S.stat.premierEchecMs === null) S.stat.premierEchecMs = horloge.maintenant();
          if (S.stat.premierEssai === null) { S.stat.premierEssai = 'échec'; S.stat.premierEssaiDureeMs = null; }
          nouvelEnnemi();
        }
      }
      S.combat = M.combat.viderEvenements(S.combat);
      synchroniser();
      if (zoneVaincue === null) return;
      const resultat = M.progression.accorderBadge(S.region, zoneVaincue);
      S.region = resultat.region;
      if (!S.region.bossVaincus.includes(zoneVaincue)) S.region = { ...S.region, bossVaincus: [...S.region.bossVaincus, zoneVaincue] };
      const stat = S.stat;
      Object.assign(stat, {
        victoire: true, sortieMs: horloge.maintenant(), niveauMoyenSortie: niveauMoyen(S.region), pokedexSortie: S.pokedex.length,
      });
      const suivant = kanto.liensDepuis(zoneVaincue)[0]?.vers;
      if (!suivant || zoneVaincue === o.jusquA) { S.fini = true; S.raison = zoneVaincue === o.jusquA ? `Arrêt voulu après ${zoneVaincue}` : 'Ligue gagnée'; return; }
      entrerDansZone(suivant);
    };

    // --- un pas de la boucle de jeu ---------------------------------------------------------------------------
    const cliquerEtTraiter = () => {
      S.combat = M.combat.cliquer(S.combat, limiteur);
      if (S.combat.evenements.length > 0) traiter();
    };
    const avancer = (etat, pas) => {
      if (S.fini) return etat;
      if (horloge.maintenant() - S.stat.entreeMs > o.tempsMaxZoneMs) {
        S.fini = true; S.raison = `Bloqué dans ${S.stat.id} après ${Math.round(o.tempsMaxZoneMs / 60000)} min`;
        return etat;
      }
      synchroniser();
      if (horloge.maintenant() - S.dernierAchatMs >= 1000) { S.dernierAchatMs = horloge.maintenant(); acheterSelonPolitique(); }
      if (S.region.ameliorations.includes('leftovers') && !S.combat.autoClic) S.combat = M.combat.basculerAutoClic(S.combat, true);
      if (S.combat.ennemi.boss && S.combat.attenteMs === 0 && S.combat.minuteurMs !== null && !S.enBoss) debutBoss();
      lancerCapturesSiUtile();
      S.resteClic += o.clics * pas / 1000;
      const n = Math.floor(S.resteClic);
      S.resteClic -= n;
      for (let i = 0; i < n && !S.fini; i++) cliquerEtTraiter();
      if (S.fini) return etat;
      if (S.combat.autoClic && S.combat.attenteMs === 0) {
        const auto = M.clics.clicsAutomatiques(S.resteAutoClic, pas, reglages.combat.autoClicIntervalleMs);
        S.resteAutoClic = auto.resteMs;
        for (let i = 0; i < auto.clics && !S.fini; i++) cliquerEtTraiter();
      } else S.resteAutoClic = 0;
      if (S.fini) return etat;
      S.combat = M.combat.avancerCombat(S.combat, pas);
      if (S.combat.evenements.length > 0) traiter();
      return etat;
    };

    entrerDansZone(kanto.premierCombat);
    const boucle = M.loop.creerBoucle({ horloge, etat: S, avancer });
    while (!S.fini) { horloge.avancer(pasMs); boucle.tick(); }

    const dernier = S.zones.at(-1);
    if (!dernier.victoire) Object.assign(dernier, { sortieMs: horloge.maintenant(), niveauMoyenSortie: niveauMoyen(S.region), pokedexSortie: S.pokedex.length });
    return {
      options: o, fin: S.raison, tempsMs: horloge.maintenant(), zones: S.zones, pokedex: S.pokedex.length,
      argentFinal: S.region.argent, badges: S.region.badges.length, ameliorations: S.region.ameliorations,
      equipe: S.region.equipe.map((p) => ({ numero: p.numero, nom: catalogue.parNumero(p.numero).nom, niveau: p.niveau })),
      totalGagne: S.zones.reduce((s, z) => s + z.gagne, 0), totalDepense: S.zones.reduce((s, z) => s + z.depense, 0),
    };
  } finally {
    reglages.recompenses.or.multiplicateur = multiplicateurOrInitial;
  }
}

/** Fréquence de chaque légendaire sur `rencontres` apparitions par zone, comparée aux données. */
export function frequencesLegendaires(M, { rencontres = 10000, graine = 1 } = {}) {
  const { kanto } = M.regions;
  const { reglages } = M.reglages;
  const lignes = [];
  kanto.zones.forEach((zone, indice) => {
    if (zone.sansCombat) return;
    const combat = kanto.zoneDeCombat(zone.id);
    const legendaires = combat.sauvages.filter((sauvage) => sauvage.rarete === 'legendaire');
    if (legendaires.length === 0) return;
    const alea = graineAlea(graine * 1000 + indice);
    const comptes = new Map();
    for (let i = 0; i < rencontres; i++) {
      const ennemi = M.ennemis.creerEnnemi(combat, (i % (reglages.combat.etapeBoss - 1)) + 1, alea, reglages.combat, []);
      comptes.set(ennemi.numero, (comptes.get(ennemi.numero) ?? 0) + 1);
    }
    for (const sauvage of legendaires) {
      const p = sauvage.apparition;
      const observe = (comptes.get(sauvage.pokemon) ?? 0) / rencontres;
      const sigma = Math.sqrt(p * (1 - p) / rencontres);
      lignes.push({
        zone: zone.id, nom: zone.nom, pokemon: sauvage.pokemon, rencontres, attendu: p, observe,
        sigma, ecartSigma: (observe - p) / sigma, dansLaStatistique: Math.abs(observe - p) <= 3 * sigma,
      });
    }
  });
  return lignes;
}

// --- affichage ------------------------------------------------------------------------------------------------
const minutes = (ms) => (ms / 60000).toFixed(1).replace('.', ',');
const entier = (n) => Math.round(n).toLocaleString('fr-FR');
const pct = (n, d = 1) => `${(n * 100).toFixed(d).replace('.', ',')} %`;
const virgule = (n, d = 2) => n === null ? '–' : n.toFixed(d).replace('.', ',');

export function tableauParcours(resultat, M) {
  const catalogue = M.pokemon.chargerPokemon();
  const lignes = ['| Zone | Temps (min) | dont après un échec | Niveau moyen au boss | Argent gagné | Argent dépensé | Espèces (Pokédex) | Marge 1er essai | Boss |',
    '|---|---:|---:|---:|---:|---:|---:|---:|---|'];
  for (const z of resultat.zones) {
    const duree = (z.sortieMs ?? resultat.tempsMs) - z.entreeMs;
    const apresEchec = z.premierEchecMs === null ? 0 : (z.sortieMs ?? resultat.tempsMs) - z.premierEchecMs;
    const issue = z.ligue ? (z.victoire ? 'victoire' : 'non terminé')
      : z.premierEssai === null ? 'non atteint'
        : z.premierEssai === 'victoire' ? 'victoire au 1er essai'
          : z.victoire ? `victoire à l’essai ${z.echecs + 1}` : `échec (${z.echecs} essais)`;
    lignes.push(`| ${z.nom} | ${minutes(duree)} | ${minutes(apresEchec)} | ${z.niveauMoyenBoss === null ? '–' : z.niveauMoyenBoss.toFixed(1).replace('.', ',')} `
      + `| ${entier(z.gagne)} | ${entier(z.depense)} | ${z.pokedexSortie ?? '–'} | ${virgule(z.margeAvecClics)} | ${issue} |`);
  }
  const equipe = resultat.equipe.map((p) => `${p.nom} ${p.niveau}`).join(', ');
  return [...lignes, '',
    `Fin : ${resultat.fin}. Durée de jeu : ${minutes(resultat.tempsMs)} min. Argent gagné : ${entier(resultat.totalGagne)}, dépensé : ${entier(resultat.totalDepense)}, `
    + `en caisse : ${entier(resultat.argentFinal)}. Espèces au Pokédex : ${resultat.pokedex}/${catalogue.liste.length}. Badges : ${resultat.badges}. `
    + `Améliorations : ${resultat.ameliorations.join(', ') || 'aucune'}. Équipe finale : ${equipe}.`].join('\n');
}

export function tableauFrequences(lignes, M) {
  const catalogue = M.pokemon.chargerPokemon();
  return ['| Zone | Légendaire | Rencontres | Attendu (données) | Observé | Écart (σ) | Dans la statistique (±3 σ) |', '|---|---|---:|---:|---:|---:|---|',
    ...lignes.map((l) => `| ${l.nom} | ${catalogue.parNumero(l.pokemon).nom} (n° ${l.pokemon}) | ${entier(l.rencontres)} | ${pct(l.attendu)} | ${pct(l.observe, 2)} `
      + `| ${l.ecartSigma >= 0 ? '+' : ''}${virgule(l.ecartSigma)} | ${l.dansLaStatistique ? 'oui' : 'NON'} |`)].join('\n');
}

/** Comparaison avant/après du ticket : même parcours, valeurs de la V1 puis valeurs actuelles. */
export function tableauComparaison(avant, apres) {
  // « À équipe égale » : les dégâts de l'équipe « après » face aux PV « avant » ; seul le changement de PV joue.
  const lignes = ['| Zone | PV du boss avant | PV du boss après | Marge avant (PV ÷ dégâts 30 s) | Marge après | Variation des deux parties | Marge de l\'équipe « après » avec les PV d\'avant | Variation à équipe égale |',
    '|---|---:|---:|---:|---:|---:|---:|---:|'];
  const signe = (x) => (x >= 0 ? '+' : '') + pct(x, 0);
  apres.zones.forEach((z, i) => {
    const a = avant.zones[i];
    if (!a || z.margeAvecClics === null || a.margeAvecClics === null) return;
    const egale = a.pvBoss / z.pvBoss * z.margeAvecClics;
    lignes.push(`| ${z.nom} | ${entier(a.pvBoss)} | ${entier(z.pvBoss)} | ${virgule(a.margeAvecClics)} | ${virgule(z.margeAvecClics)} `
      + `| ${signe(z.margeAvecClics / a.margeAvecClics - 1)} | ${virgule(egale)} | ${signe(z.margeAvecClics / egale - 1)} |`);
  });
  return lignes.join('\n');
}

// --- ligne de commande -----------------------------------------------------------------------------------------
function lireArguments(argv) {
  const o = { candidats: {} };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const suivant = () => argv[++i];
    if (a === '--clics') o.clics = Number(suivant());
    else if (a === '--sans-bonus') { o.sansBonus = true; if (argv[i + 1] && !argv[i + 1].startsWith('--')) { const z = argv[++i]; o.sansBonusDepuis = z.includes('.') ? z : `kanto.${z}`; } }
    else if (a === '--avant') o.avant = true;
    else if (a === '--starter') o.starter = Number(suivant());
    else if (a === '--graine') o.graine = Number(suivant());
    else if (a === '--pokedex') o.pokedex = suivant();
    else if (a === '--jusqua') o.jusquA = suivant();
    else if (a === '--temps-max-zone') o.tempsMaxZoneMs = Number(suivant()) * 60000;
    else if (a === '--candidat') { const [zone, valeur] = suivant().split('='); o.candidats[zone.includes('.') ? zone : `kanto.${zone}`] = Number(valeur); }
    else if (a === '--json') o.json = true;
    else if (a === '--debut') o.debut = true;
    else if (a === '--comparer') o.comparer = true;
    else if (a === '--frequences') { o.frequences = true; if (argv[i + 1] && /^\d+$/.test(argv[i + 1])) o.rencontres = Number(argv[++i]); }
    else { console.error(`Option inconnue : ${a}`); process.exit(2); }
  }
  if (o.clics !== undefined && !(o.clics >= 0)) { console.error('--clics attend un nombre positif ou nul.'); process.exit(2); }
  return o;
}

async function tableauDebut(M, o) {
  const zones = ['kanto.route-1', 'kanto.foret-de-jade'];
  const grille = [1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 3, 4, 4.5, 5, 6];
  const sortie = [];
  for (const zone of zones) {
    sortie.push(`### ${zone}`, '', '| Starter | Multiplicateur de PV | PV du boss | Niveau au boss | Sans clic | 7 clics/s | Dégâts 30 s sans clic | Dégâts 30 s à 7 clics/s |', '|---|---:|---:|---:|---|---|---:|---:|');
    for (const starter of [1, 4, 7]) {
      const actuel = M.regions.kanto.zoneDeCombat(zone).multiplicateurPv;
      for (const valeur of [...new Set([actuel, ...grille])].sort((a, b) => a - b)) {
        const essais = [0, 7].map((clics) => {
          const r = jouerParcours(M, { ...o, starter, clics, jusquA: zone, candidats: { [zone]: valeur }, tempsMaxZoneMs: 20 * 60000 });
          return r.zones.find((z) => z.id === zone);
        });
        const texte = (z) => z.premierEssai === 'victoire' ? `tombe en ${(z.premierEssaiDureeMs / 1000).toFixed(0)} s` : 'pas battu en 30 s';
        sortie.push(`| ${M.pokemon.chargerPokemon().parNumero(starter).nom} | ${valeur}${valeur === actuel ? ' (actuel)' : ''} | ${entier(essais[0].pvBoss)} | ${essais[0].niveauMoyenBoss.toFixed(1).replace('.', ',')} `
          + `| ${texte(essais[0])} | ${texte(essais[1])} | ${entier(essais[0].degats30sSansClic)} | ${entier(essais[1].degats30sAvecClics)} |`);
      }
    }
    sortie.push('');
  }
  return sortie.join('\n');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const o = lireArguments(process.argv.slice(2));
  const { M, fermer } = await chargerCoeur();
  try {
    if (o.frequences) {
      console.log(tableauFrequences(frequencesLegendaires(M, { rencontres: o.rencontres ?? 10000, graine: o.graine ?? 1 }), M));
    } else if (o.debut) {
      console.log(await tableauDebut(M, o));
    } else if (o.comparer) {
      const avant = jouerParcours(M, { ...o, avant: true });
      const apres = jouerParcours(M, { ...o, avant: false });
      console.log('### Avant (valeurs de la V1)\n\n' + tableauParcours(avant, M) + '\n\n### Après (valeurs actuelles)\n\n' + tableauParcours(apres, M)
        + '\n\n### Marges\n\n' + tableauComparaison(avant, apres));
    } else {
      const resultat = jouerParcours(M, o);
      console.log(o.json ? JSON.stringify(resultat, null, 2) : tableauParcours(resultat, M));
    }
  } finally {
    await fermer();
  }
}
