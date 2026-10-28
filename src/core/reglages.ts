import donnees from '../../data/reglages.json';
import objets from '../../data/objets.json';
import type { DonneesRegion, NouveauxChampsRegion, PreferencesCombat } from './sauvegarde-types';
import type { Rarete } from './monde';

export type Bonus = { cle: string; x: number; arrondi?: boolean };

export type Ton = 'hit' | 'coin' | 'catch' | 'up' | 'pc';
export type ReglagesSons = {
  actifParDefaut: boolean;
  volumeDb: number;
  /** Curseur « Effets » d'une partie neuve, de 0 à 100. */
  volumeParDefaut: number;
  /** Deux tons identiques plus proches que cela n'en font qu'un (anti-bourdonnement). */
  antiRebondMs: number;
  oscillateur: 'sine' | 'square' | 'sawtooth' | 'triangle';
  enveloppe: { attaque: number; declin: number; maintien: number; relachement: number };
  tempo: number;
  tons: Record<Ton, { notes: string[]; duree: string }>;
};

export type ReglagesPension = {
  emplacementsMax: number; prixParEmplacement: number; pasEclosion: number;
  bonheurNaissance: number; metamorph: number; especesTirees: number;
  chances: { metamorph: number; memeEspece: number; typePartage: number };
  chanceShiny: number;
  messages: { pleine: string; envoyePc: string; eclosion: string };
};

export type ReglagesIntro = {
  flashMs: number; cadenasMs: number; chenEntreeMs: number;
  dialogueDelaiMs: number; caractereMs: number; poseDelaiMs: number; poseFonduMs: number;
  choixDelaiMs: number; voileMs: number; sceneDelaiMs: number; voileRetraitDelaiMs: number;
  laboDelaiMs: number; interfaceFonduMs: number; starterFonduMs: number;
  starterSurvol: number; starterChoisi: number;
};

export type ReglagesCapture = {
  balles: { cle: string; nom: string; image: string; multiplicateur: number }[];
  multiplicateurCertain: number; bonus: Bonus[];
  animationMs: number; reapparitionMs: number; raisonImpossible: string;
};

export type ReglagesRecompenses = {
  niveauMax: number;
  or: {
    coefNiveau: number; exposant: number; boss: number;
    rarete: Partial<Record<Rarete, number>>;
    bonusAvantArrondi: Bonus[]; bonus: Bonus[]; shiny: number;
  };
  xp: { coefPv: number; boss: number; minimum: number; bonus: Bonus[] };
  shiny: { objet: string; quantite: number };
  maxXp: {
    coef: number; exposant: number;
    faible: { sous: number; x: number }; fort: { dessus: number; x: number };
  };
  bonheur: { gain: number; max: number; ecartMax: number };
};

export type ReglagesDelais = {
  ennemiSuivantMs: number;
  remplacements: { cle: string; ms: number }[];
  reducteurs: ({ cle: string; diviseur: number } | { cle: string; x: number })[];
};

export const reglages: {
  pension: ReglagesPension;
  equipe: { taille: number; surnomMax: number };
  badges: { ouvertureMs: number; claqueDelaiMs: number; claqueMs: number };
  intro: ReglagesIntro;
  pc: { zone: string; raison: string };
  shop: { zone: string; raison: string };
  sac: { zone: string; raison: string };
  centre: { lieu: string; objets: string[] };
  boutique: { inflationParBadge: number; palierRemise: number; remise: number; quantiteMax: number; reportes: string[] };
  objetsActifs: {
    dureeMs: number;
    rechargeFauchageMs: number;
    temporises: Record<'xAttack' | 'xSpecial' | 'repel' | 'superRepel', {
      chrono: keyof DonneesRegion['chronos'];
      cle: string;
      message: string;
      pastille: string;
    }>;
    repousses: { cle: string; exclues: string[] }[];
    raretes: Record<Rarete | 'conseil-4' | 'maitre', string>;
  };
  interface: {
    sauvegardeAutoMs: number; annonceMs: number; annonceDeblocageMs: number;
    // Calendrier V1 : legacy/js/game/save.js L759-797.
    vol: { poseMs: number; delaiOuvertureMs: number; volMs: number; fermetureMs: number; imageMs: number; images: number; pisteMs: number; traitsMs: number; fonduReduitMs: number; changerReduitMs: number; tailleDresseurRatio: number };
  };
  carte: { zoomMax: number; deblocageMs: number; seuilGlissementPx: number; diviseurMolette: number; rayonCiblePx: number };
  depart: { argent: number; etape: number; region: NouveauxChampsRegion; preferences: PreferencesCombat };
  combat: {
    autoClicIntervalleMs: number;
    minuteurBossMs: number;
    clicBase: number; clicPartDps: number; pvParNiveau: number; pvBoss: number;
    chanceShiny: number; clicsMaxParSeconde: number; fenetreClicsMs: number; etapeBoss: number;
    shiny: { cle: string; x: number }[];
  };
  bonus: { dps: Bonus[]; clic: Bonus[] };
  recompenses: ReglagesRecompenses;
  capture: ReglagesCapture;
  evolution: { animationMs: number; alternanceMs: number };
  animations: { flottementMs: number; secousseMs: number; banniereMs: number };
  sons: ReglagesSons;
  delais: ReglagesDelais;
  boucle: { pasMs: number; rattrapageMaxMs: number; notificationMinMs: number };
  stats: {
    puissanceDiviseur: number;
    pv: { coefPv: number; coefDefense: number; coefDefenseSpe: number; constante: number };
  };
  degats: {
    calciumMax: number;
    diviseurNiveau: number;
    shiny: number;
    bonheurParPoint: number;
    pierreEternelle: number;
    calciumParBoost: number;
  };
} = donnees as typeof reglages;

const sons = reglages.sons;
if (!sons || typeof sons.actifParDefaut !== 'boolean' || !Number.isFinite(sons.volumeDb)
  || !Number.isFinite(sons.volumeParDefaut) || sons.volumeParDefaut < 0 || sons.volumeParDefaut > 100
  || !Number.isFinite(sons.antiRebondMs) || sons.antiRebondMs < 0
  || !Number.isFinite(sons.tempo) || sons.tempo <= 0
  || !['sine', 'square', 'sawtooth', 'triangle'].includes(sons.oscillateur)
  || !sons.enveloppe
  || [sons.enveloppe.attaque, sons.enveloppe.declin, sons.enveloppe.relachement]
    .some(valeur => !Number.isFinite(valeur) || valeur <= 0)
  || !Number.isFinite(sons.enveloppe.maintien) || sons.enveloppe.maintien <= 0 || sons.enveloppe.maintien > 1
  || !sons.tons || ['hit', 'coin', 'catch', 'up', 'pc'].some(nom => {
    const ton = sons.tons[nom as Ton];
    return !ton || !Array.isArray(ton.notes) || !ton.notes.length
      || ton.notes.some(note => typeof note !== 'string' || !/^[A-G](?:#|b)?[0-8]$/.test(note))
      || typeof ton.duree !== 'string' || !/^[1-9]\d*n$/.test(ton.duree);
  })) {
  throw new Error('Réglages de sons invalides');
}
if (!reglages.animations || Object.values(reglages.animations).length !== 3
  || [reglages.animations.flottementMs, reglages.animations.secousseMs, reglages.animations.banniereMs]
    .some(valeur => !Number.isFinite(valeur) || valeur <= 0)) {
  throw new Error('Réglages d’animations invalides');
}

const pension = reglages.pension;
if ([pension.emplacementsMax, pension.prixParEmplacement, pension.pasEclosion,
  pension.metamorph, pension.especesTirees].some(valeur => !Number.isSafeInteger(valeur) || valeur <= 0)
  || !Number.isSafeInteger(pension.bonheurNaissance) || pension.bonheurNaissance < 0
  || [pension.chanceShiny, pension.chances.metamorph, pension.chances.memeEspece, pension.chances.typePartage]
    .some(valeur => !Number.isFinite(valeur) || valeur < 0 || valeur > 1)
  || [pension.messages.pleine, pension.messages.envoyePc, pension.messages.eclosion]
    .some(valeur => typeof valeur !== 'string' || !valeur.trim())) {
  throw new Error('Réglages de pension invalides');
}

for (const valeur of Object.values(reglages.equipe)) {
  if (!Number.isSafeInteger(valeur) || valeur <= 0) throw new Error('Réglages d’équipe invalides');
}

if (!reglages.pc.zone || !reglages.pc.raison) throw new Error('Réglages du PC invalides');

const centre = reglages.centre;
if (!centre || centre.lieu !== 'centre-commercial' || !Array.isArray(centre.objets)
  || new Set(centre.objets).size !== centre.objets.length
  || centre.objets.some(id => !objets.some(objet => objet.id === id && objet.boutique === 'mall'))
  || objets.some(objet => objet.boutique === 'mall' && !centre.objets.includes(objet.id))) {
  throw new Error('Réglages du Centre invalides : chaque objet du Centre doit être listé une seule fois.');
}

if (!Number.isFinite(reglages.combat.minuteurBossMs) || reglages.combat.minuteurBossMs <= 0) {
  throw new Error('Minuteur de boss invalide');
}

for (const valeur of Object.values(reglages.interface.vol)) {
  if (!Number.isFinite(valeur) || valeur <= 0) throw new Error('Réglages de vol invalides');
}
for (const valeur of Object.values(reglages.carte)) {
  if (!Number.isFinite(valeur) || valeur <= 0) throw new Error('Réglages de carte invalides');
}
for (const valeur of Object.values(reglages.intro)) {
  if (!Number.isFinite(valeur) || valeur <= 0) throw new Error('Réglages d’intro invalides');
}

const capture = reglages.capture;
if (!capture.raisonImpossible || !capture.balles.length
  || new Set(capture.balles.map((balle) => balle.cle)).size !== capture.balles.length
  || capture.balles.some((balle) => !balle.cle || !balle.nom || !balle.image
    || !Number.isFinite(balle.multiplicateur) || balle.multiplicateur <= 0)
  || [capture.multiplicateurCertain, capture.animationMs, capture.reapparitionMs]
    .some((valeur) => !Number.isFinite(valeur) || valeur <= 0)
  || capture.bonus.some((bonus) => !bonus.cle || !Number.isFinite(bonus.x) || bonus.x <= 0)) {
  throw new Error('Réglages de capture invalides');
}
if (typeof reglages.depart.preferences.autoAttaque !== 'boolean'
  || Object.values(reglages.depart.preferences.arretAuto).some((valeur) => typeof valeur !== 'boolean')) {
  throw new Error('Préférences de combat invalides');
}
