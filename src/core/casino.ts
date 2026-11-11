import donnees from '../../data/casino.json';
import objets from '../../data/objets.json';
import { evaluer } from './conditions';
import type { EtatMonde, ResultatCondition } from './conditions';
import type { chargerMonde } from './monde';
import type { DonneesRegion, PokemonPossede } from './sauvegarde-types';
import { reglages } from './reglages';
import { tirerSexe } from './sexe';

export type Casino = typeof donnees;
export type Face = keyof Casino['pileOuFace']['faces'];
export type Triplet = readonly [string, string, string];
type RegionCasino = { readonly jetons: number };
type Resultat<R, T = object> = ({ ok: true; region: R; message: string } & T) | { ok: false; raison: string };

// Le document fournit aussi la forme attendue : champs requis, tableaux complets,
// chaînes non vides et constantes numériques finies et positives.
function validerForme(valeur: unknown, modele: unknown): void {
  if (modele === null) {
    if (valeur !== null && (typeof valeur !== 'string' || !valeur.trim())) throw new Error('Image casino invalide');
  } else if (Array.isArray(modele)) {
    if (!Array.isArray(valeur) || valeur.length !== modele.length) throw new Error('Liste casino invalide');
    modele.forEach((entree, i) => validerForme(valeur[i], entree));
  } else if (typeof modele === 'object') {
    if (!valeur || typeof valeur !== 'object') throw new Error('Données casino invalides');
    for (const [cle, entree] of Object.entries(modele)) {
      validerForme((valeur as Record<string, unknown>)[cle], entree);
    }
  } else if (typeof modele === 'number') {
    if (typeof valeur !== 'number' || !Number.isFinite(valeur) || valeur <= 0) throw new Error('Nombre casino invalide');
  } else if (typeof valeur !== 'string' || !valeur.trim()) throw new Error('Texte casino invalide');
}

export function chargerCasino(source: unknown = donnees): Casino {
  validerForme(source, donnees);
  const casino = structuredClone(source) as Casino;
  if (casino.version !== 1 || casino.symboles.reduce((s, symbole) => s + symbole.poids, 0) !== 100
    || new Set(casino.symboles.map(s => s.id)).size !== casino.symboles.length
    || new Set(casino.boutique.map(o => o.key)).size !== casino.boutique.length
    || !casino.symboles.some(s => s.id === casino.deuxBaies.symbole)
    || casino.deuxBaies.nombre !== 2 || casino.pileOuFace.seuilFace >= 1
    || casino.blackjack.remelangeSous >= 1 || casino.blackjack.coutAssurance > 1 || casino.blackjack.retourAbandon > 1) {
    throw new Error('Règles casino invalides');
  }
  for (const nombre of [casino.jetons.achat.cost, casino.jetons.achat.tokens,
    casino.jetons.rachat.tokens, casino.jetons.rachat.money,
    ...casino.symboles.flatMap(s => [s.poids, s.gain]), ...casino.boutique.map(o => o.price),
    casino.blackjack.paquets, casino.blackjack.maxMains, casino.blackjack.seuilCroupier, casino.blackjack.retourAssurance]) {
    if (!Number.isSafeInteger(nombre)) throw new Error('Entier casino invalide');
  }
  return casino;
}

const casino = chargerCasino();

type RegionBoutiqueCasino = Pick<DonneesRegion, 'jetons' | 'equipe' | 'pc' | 'inventaire' | 'ameliorations'>;

export function objetsDuCasino(region: RegionBoutiqueCasino) {
  return casino.boutique.map(article => {
    const inventaire = objets.find(o => o.id === article.itemKey)?.inventaire;
    const possede = article.type === 'upgrade' ? region.ameliorations.includes(article.key)
      : article.type === 'pokemon' ? [...region.equipe, ...region.pc].some(p => p.numero === article.id)
        : inventaire != null && (region.inventaire[inventaire] ?? 0) > 0;
    const raison = article.type === 'upgrade' && possede ? casino.messages.dejaAcquis
      : region.jetons < article.price ? casino.messages.jetonsInsuffisants : null;
    return { id: article.key, nom: article.name, prix: article.price, possede, abordable: raison === null, raison };
  });
}

export function acheterAuCasino<R extends RegionBoutiqueCasino>(region: R, id: string,
  alea: () => number, genererId: () => string): Resultat<R, { numero?: number }> {
  const article = casino.boutique.find(o => o.key === id);
  if (!article) return { ok: false, raison: 'Objet inconnu.' };
  const ligne = objetsDuCasino(region).find(o => o.id === id)!;
  if (ligne.raison !== null) return { ok: false, raison: ligne.raison };
  const copie = { ...region, jetons: region.jetons - article.price };
  if (article.type === 'pokemon') {
    const numero = article.id!;
    const sexe = tirerSexe(numero, alea);
    const pokemon: PokemonPossede = {
      uid: genererId(), numero, niveau: 25, shiny: false, sexe, xp: 0, bonheur: 0,
      calcium: 0, pierreEternelle: false, favori: false,
    };
    const destination = region.equipe.length < reglages.equipe.taille ? 'equipe' : 'pc';
    return { ok: true, region: { ...copie, [destination]: [...region[destination], pokemon] }, numero,
      message: casino.messages.achat.replace('{nom}', article.name) };
  }
  if (article.type === 'upgrade') {
    return { ok: true, region: { ...copie, ameliorations: [...region.ameliorations, article.key] },
      message: casino.messages.achat.replace('{nom}', casino.noms.ctJackpot) };
  }
  const cle = objets.find(o => o.id === article.itemKey)!.inventaire!;
  return { ok: true, region: { ...copie, inventaire: { ...region.inventaire, [cle]: (region.inventaire[cle] ?? 0) + 1 } },
    message: casino.messages.achat.replace('{nom}', objets.find(o => o.id === article.itemKey)!.nom) };
}

export function accesCasino(monde: Pick<ReturnType<typeof chargerMonde>, 'lieu'>, etat: EtatMonde): ResultatCondition {
  const condition = monde.lieu('casino').si;
  return !condition || evaluer(condition, etat).ok
    ? { ok: true } : { ok: false, raison: casino.acces.raison };
}

export function lireMise(valeur: string, jetons = Infinity): number {
  const mise = parseInt(valeur, 10);
  return Number.isFinite(mise) && mise >= 1 && mise <= jetons ? mise : 0;
}

const espaces = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

/** Prix d'un jeton à l'achat, en ₽ (1 000 ₽ pour 50 jetons = 20). */
export const prixJeton = () => casino.jetons.achat.cost / casino.jetons.achat.tokens;
/** Valeur d'un jeton au rachat, en ₽ (même taux : pas d'arbitrage). */
export const valeurJeton = () => casino.jetons.rachat.money / casino.jetons.rachat.tokens;

/** Achète `jetons` jetons (entier ≥ 1) ; sans argument, le lot de 50. */
export function acheterJetons<R extends RegionCasino & { argent: number }>(region: R, jetons: number = casino.jetons.achat.tokens): Resultat<R> {
  if (!Number.isInteger(jetons) || jetons < 1) return { ok: false, raison: casino.messages.miseInvalide };
  const cout = jetons * prixJeton();
  if (region.argent < cout) return { ok: false, raison: casino.messages.argentInsuffisant };
  return { ok: true, region: { ...region, argent: region.argent - cout, jetons: region.jetons + jetons },
    message: casino.messages.achatJetons.replace('{jetons}', espaces(jetons)) };
}

/** Rachète `jetons` jetons (entier ≥ 1) contre des ₽ ; sans argument, le lot de 50. */
export function echangerJetons<R extends RegionCasino & { argent: number }>(region: R, jetons: number = casino.jetons.rachat.tokens): Resultat<R> {
  if (!Number.isInteger(jetons) || jetons < 1) return { ok: false, raison: casino.messages.miseInvalide };
  if (region.jetons < jetons) return { ok: false, raison: casino.messages.jetonsInsuffisants };
  const argent = jetons * valeurJeton();
  return { ok: true, region: { ...region, argent: region.argent + argent, jetons: region.jetons - jetons },
    message: casino.messages.rachatJetons.replace('{argent}', espaces(argent)) };
}

export function tirerSymbole(alea: () => number): string {
  let r = alea() * 100;
  for (const symbole of casino.symboles) {
    r -= symbole.poids;
    if (r <= 0) return symbole.id;
  }
  return casino.symboles[casino.symboles.length - 1]!.id;
}

export function gainMachine(symboles: Triplet, mise: number): number {
  if (symboles[0] === symboles[1] && symboles[1] === symboles[2]) {
    return mise * (casino.symboles.find(s => s.id === symboles[0])?.gain ?? 0);
  }
  return symboles.filter(s => s === casino.deuxBaies.symbole).length === casino.deuxBaies.nombre
    ? mise * casino.deuxBaies.gain : 0;
}

function debiter<R extends RegionCasino>(region: R, mise: number): { ok: true; region: R } | { ok: false; raison: string } {
  if (!Number.isInteger(mise) || mise < 1) return { ok: false, raison: casino.messages.miseInvalide };
  if (region.jetons < mise) return { ok: false, raison: casino.messages.jetonsInsuffisants };
  return { ok: true, region: { ...region, jetons: region.jetons - mise } };
}

export function jouerMachine<R extends RegionCasino>(region: R, mise: number, alea: () => number): Resultat<R, { symboles: Triplet; gain: number }> {
  const debit = debiter(region, mise);
  if (!debit.ok) return debit;
  const symboles: Triplet = [tirerSymbole(alea), tirerSymbole(alea), tirerSymbole(alea)];
  const gain = gainMachine(symboles, mise);
  const deuxBaies = symboles.filter(s => s === casino.deuxBaies.symbole).length === casino.deuxBaies.nombre;
  return { ok: true, region: { ...debit.region, jetons: debit.region.jetons + gain }, symboles, gain,
    message: gain === 0 ? casino.messages.perdu : deuxBaies ? casino.messages.baies
      : casino.messages.gagne.replace('{gain}', String(gain / mise)) };
}

export function jouerPileOuFace<R extends RegionCasino>(region: R, mise: number, choix: Face, alea: () => number): Resultat<R, { resultat: Face; gain: number }> {
  if (choix !== 'face' && choix !== 'pile') return { ok: false, raison: casino.messages.choixInvalide };
  const debit = debiter(region, mise);
  if (!debit.ok) return debit;
  const resultat = alea() < casino.pileOuFace.seuilFace ? 'face' : 'pile';
  const gain = choix === resultat ? mise * casino.pileOuFace.gain : 0;
  return { ok: true, region: { ...debit.region, jetons: debit.region.jetons + gain }, resultat, gain,
    message: gain === 0 ? casino.messages.perdu : casino.messages.gagne.replace('{gain}', String(casino.pileOuFace.gain)) };
}

export { abandonner, actionsPossibles, assurer, construirePaquet, construireSabot, distribuer, doubler, paireSeparable,
  refuserAssurance, rester, separer, seuilRemelange, tirerCarte, valeurMain, vueBlackjack } from './blackjack';
export type { ActionsBlackjack, FinBlackjack, MainReglee, ResultatBlackjack, VueBlackjack } from './blackjack';
