import donnees from '../../data/casino-jeux.json';

/**
 * Trois jeux du casino (ticket C) : roulette, plus ou moins, carte à gratter.
 * Chaque jeu est un coup atomique : la mise est débitée, l'aléa est tiré, le gain total
 * (mise comprise) est crédité. Aucun état à sauvegarder. Fonctions pures, entrée jamais modifiée.
 * Toutes les valeurs viennent de `data/casino-jeux.json`.
 */

export type JeuxCasino = typeof donnees;
export type Alea = () => number;
type RegionJetons = { readonly jetons: number };
type Resultat<R, T = object> = ({ ok: true; region: R; message: string } & T) | { ok: false; raison: string };

function validerForme(valeur: unknown, modele: unknown): void {
  if (Array.isArray(modele)) {
    if (!Array.isArray(valeur) || valeur.length !== modele.length) throw new Error('Liste casino invalide');
    modele.forEach((entree, i) => validerForme(valeur[i], entree));
  } else if (modele !== null && typeof modele === 'object') {
    if (!valeur || typeof valeur !== 'object') throw new Error('Données casino invalides');
    for (const [cle, entree] of Object.entries(modele)) validerForme((valeur as Record<string, unknown>)[cle], entree);
  } else if (typeof modele === 'number') {
    if (typeof valeur !== 'number' || !Number.isSafeInteger(valeur) || valeur <= 0) throw new Error('Nombre casino invalide');
  } else if (typeof valeur !== 'string' || !valeur.trim()) throw new Error('Texte casino invalide');
}

export function chargerJeuxCasino(source: unknown = donnees): JeuxCasino {
  validerForme(source, donnees);
  const jeux = structuredClone(source) as JeuxCasino;
  const { roulette, plusOuMoins, gratter } = jeux;
  const rouges = new Set(roulette.rouges);
  if (jeux.version !== 1 || rouges.size !== roulette.rouges.length || roulette.cases < 2
    || roulette.rouges.some(n => n < 1 || n >= roulette.cases)
    || plusOuMoins.rendementPourCent > 100
    || gratter.minimumIdentiques < 1 || gratter.minimumIdentiques > gratter.cases
    || new Set(gratter.symboles.map(s => s.id)).size !== gratter.symboles.length
    || gratter.symboles.some(s => s.gains.length !== gratter.cases - gratter.minimumIdentiques + 1)) {
    throw new Error('Règles casino invalides');
  }
  return jeux;
}

const jeux = chargerJeuxCasino();
const { roulette, plusOuMoins, gratter: regleGratter, messages } = jeux;

const rouges = new Set(roulette.rouges);
const remplir = (modele: string, valeurs: Record<string, string | number>) =>
  modele.replace(/\{(\w+)\}/g, (_, cle: string) => String(valeurs[cle] ?? ''));

function debiter<R extends RegionJetons>(region: R, mise: number): { ok: true; region: R } | { ok: false; raison: string } {
  if (!Number.isInteger(mise) || mise < 1) return { ok: false, raison: messages.miseInvalide };
  if (region.jetons < mise) return { ok: false, raison: messages.jetonsInsuffisants };
  return { ok: true, region: { ...region, jetons: region.jetons - mise } };
}

// ───────────────────────── Roulette ─────────────────────────

export type CouleurRoulette = 'rouge' | 'noir' | 'vert';
export type PariRoulette =
  | { type: 'couleur'; couleur: 'rouge' | 'noir' }
  | { type: 'parite'; parite: 'pair' | 'impair' }
  | { type: 'numero'; numero: number };

export function couleurRoulette(numero: number): CouleurRoulette {
  return numero === 0 ? 'vert' : rouges.has(numero) ? 'rouge' : 'noir';
}

/** Multiplicateur (gain total / mise) d'un pari gagnant, ou 0 si le pari est invalide. */
export function multiplicateurRoulette(pari: PariRoulette): number {
  if (!pari || typeof pari !== 'object') return 0;
  if (pari.type === 'couleur') return pari.couleur === 'rouge' || pari.couleur === 'noir' ? roulette.gains.couleur : 0;
  if (pari.type === 'parite') return pari.parite === 'pair' || pari.parite === 'impair' ? roulette.gains.parite : 0;
  if (pari.type === 'numero') {
    return Number.isInteger(pari.numero) && pari.numero >= 0 && pari.numero < roulette.cases ? roulette.gains.numero : 0;
  }
  return 0;
}

/** Vrai si le pari gagne pour ce numéro (le 0 perd les paris couleur et parité). */
export function pariGagnant(pari: PariRoulette, numero: number): boolean {
  if (pari.type === 'couleur') return couleurRoulette(numero) === pari.couleur;
  if (pari.type === 'parite') return numero !== 0 && (numero % 2 === 0) === (pari.parite === 'pair');
  return numero === pari.numero;
}

/** Un seul tirage d'aléa : le numéro sorti, de 0 à 36. */
export const tirerNumeroRoulette = (alea: Alea): number =>
  Math.min(roulette.cases - 1, Math.max(0, Math.floor(alea() * roulette.cases)));

export function jouerRoulette<R extends RegionJetons>(region: R, mise: number, pari: PariRoulette, alea: Alea):
  Resultat<R, { numero: number; couleur: CouleurRoulette; gain: number }> {
  const multiplicateur = multiplicateurRoulette(pari);
  if (multiplicateur === 0) return { ok: false, raison: messages.choixInvalide };
  const debit = debiter(region, mise);
  if (!debit.ok) return debit;
  const numero = tirerNumeroRoulette(alea);
  const couleur = couleurRoulette(numero);
  const gain = pariGagnant(pari, numero) ? mise * multiplicateur : 0;
  const sortie = { numero, couleur: roulette.couleurs[couleur].toLowerCase() };
  return { ok: true, region: { ...debit.region, jetons: debit.region.jetons + gain }, numero, couleur, gain,
    message: gain === 0 ? `${remplir(messages.rouletteSortie, sortie)} ${messages.perdu}`
      : remplir(messages.rouletteGagne, { ...sortie, multiplicateur }) };
}

// ───────────────────────── Plus ou moins ─────────────────────────

export type ChoixPlusOuMoins = 'plus' | 'moins';

/** Nom d'un rang pour l'affichage : As, 2 à 10, Valet, Dame, Roi. */
export function nomCarte(rang: number): string {
  const { noms, rangs } = plusOuMoins;
  return rang === 1 ? noms.as : rang === rangs - 2 ? noms.valet : rang === rangs - 1 ? noms.dame : rang === rangs ? noms.roi : String(rang);
}

const rangValide = (rang: number) => Number.isInteger(rang) && rang >= 1 && rang <= plusOuMoins.rangs;

/** Un seul tirage d'aléa : un rang de 1 (as) à 13 (roi), chaque rang équiprobable. */
export const tirerCarteVisible = (alea: Alea): number =>
  Math.min(plusOuMoins.rangs, Math.max(1, Math.floor(alea() * plusOuMoins.rangs) + 1));

/** Nombre de rangs gagnants pour ce choix (l'égalité perd). */
export function rangsGagnants(carteVisible: number, choix: ChoixPlusOuMoins): number {
  if (!rangValide(carteVisible)) return 0;
  if (choix === 'plus') return plusOuMoins.rangs - carteVisible;
  if (choix === 'moins') return carteVisible - 1;
  return 0;
}

/** Gain total (mise comprise) d'un choix gagnant : floor(mise × 0,96 × 13 / rangs gagnants), en entiers. */
export function gainPlusOuMoins(mise: number, carteVisible: number, choix: ChoixPlusOuMoins): number {
  const gagnants = rangsGagnants(carteVisible, choix);
  if (gagnants === 0) return 0;
  return Math.floor(mise * plusOuMoins.rendementPourCent * plusOuMoins.rangs / (100 * gagnants));
}

/** Multiplicateur affichable avant de jouer (0,96 × 13 / rangs gagnants), 0 si le choix est refusé. */
export function multiplicateurPlusOuMoins(carteVisible: number, choix: ChoixPlusOuMoins): number {
  const gagnants = rangsGagnants(carteVisible, choix);
  return gagnants === 0 ? 0 : plusOuMoins.rendementPourCent * plusOuMoins.rangs / (100 * gagnants);
}

export function jouerPlusOuMoins<R extends RegionJetons>(region: R, mise: number, carteVisible: number,
  choix: ChoixPlusOuMoins, alea: Alea): Resultat<R, { carteVisible: number; nouvelleCarte: number; gain: number }> {
  if (rangsGagnants(carteVisible, choix) === 0) return { ok: false, raison: messages.choixInvalide };
  const debit = debiter(region, mise);
  if (!debit.ok) return debit;
  const nouvelleCarte = tirerCarteVisible(alea);
  const gagne = choix === 'plus' ? nouvelleCarte > carteVisible : nouvelleCarte < carteVisible;
  const gain = gagne ? gainPlusOuMoins(mise, carteVisible, choix) : 0;
  const cartes = { visible: nomCarte(carteVisible), nouvelle: nomCarte(nouvelleCarte), gain };
  return { ok: true, region: { ...debit.region, jetons: debit.region.jetons + gain }, carteVisible, nouvelleCarte, gain,
    message: remplir(gagne ? messages.plusOuMoinsGagne : nouvelleCarte === carteVisible
      ? messages.plusOuMoinsEgalite : messages.plusOuMoinsPerdu, cartes) };
}

// ───────────────────────── Carte à gratter ─────────────────────────

export type SymboleGratter = (typeof regleGratter.symboles)[number];
export type CombinaisonGratter = { symbole: string; nombre: number; multiplicateur: number };

const poidsTotalGratter = regleGratter.symboles.reduce((s, symbole) => s + symbole.poids, 0);

/** Un tirage d'aléa : un symbole selon les poids de `data/casino-jeux.json`. */
export function tirerSymboleGratter(alea: Alea): string {
  let r = alea() * poidsTotalGratter;
  for (const symbole of regleGratter.symboles) {
    r -= symbole.poids;
    if (r < 0) return symbole.id;
  }
  return regleGratter.symboles[regleGratter.symboles.length - 1]!.id;
}

/** Table de gains d'un symbole pour `minimumIdentiques` … `cases` identiques (multiplicateurs entiers). */
export const gainsSymboleGratter = (id: string): readonly number[] =>
  regleGratter.symboles.find(s => s.id === id)?.gains ?? [];

/** Meilleure combinaison d'un ticket (celle qui paie le plus), ou null s'il n'y a pas de série gagnante. */
export function combinaisonGratter(symboles: readonly string[]): CombinaisonGratter | null {
  let meilleure: CombinaisonGratter | null = null;
  for (const { id, gains } of regleGratter.symboles) {
    const nombre = symboles.filter(s => s === id).length;
    if (nombre < regleGratter.minimumIdentiques) continue;
    const multiplicateur = gains[nombre - regleGratter.minimumIdentiques] ?? 0;
    if (!meilleure || multiplicateur > meilleure.multiplicateur) meilleure = { symbole: id, nombre, multiplicateur };
  }
  return meilleure;
}

/** Gain total d'un ticket (mise comprise). */
export const gainGratter = (symboles: readonly string[], mise: number): number =>
  mise * (combinaisonGratter(symboles)?.multiplicateur ?? 0);

/**
 * Calcul exact (loi multinomiale, entiers) du rendement et de la proportion de tickets gagnants.
 * `rendement = numerateur / denominateur`, `probabiliteGain = gagnants / denominateur`.
 */
export function analyserGratter(): { numerateur: bigint; gagnants: bigint; denominateur: bigint; rendement: number; probabiliteGain: number } {
  const { symboles, cases, minimumIdentiques } = regleGratter;
  const factorielle = (n: number) => { let f = 1n; for (let i = 2; i <= n; i++) f *= BigInt(i); return f; };
  const denominateur = BigInt(poidsTotalGratter) ** BigInt(cases);
  let numerateur = 0n;
  let gagnants = 0n;
  const compter = (indice: number, reste: number, comptes: number[]) => {
    if (indice === symboles.length - 1) {
      comptes[indice] = reste;
      let poids = factorielle(cases);
      let gain = 0;
      let serie = false;
      symboles.forEach((s, i) => {
        poids = poids / factorielle(comptes[i]!) * BigInt(s.poids) ** BigInt(comptes[i]!);
        if (comptes[i]! >= minimumIdentiques) {
          serie = true;
          gain = Math.max(gain, s.gains[comptes[i]! - minimumIdentiques]!);
        }
      });
      numerateur += poids * BigInt(gain);
      if (serie) gagnants += poids;
      return;
    }
    for (let c = 0; c <= reste; c++) { comptes[indice] = c; compter(indice + 1, reste - c, comptes); }
  };
  compter(0, cases, []);
  return { numerateur, gagnants, denominateur,
    rendement: Number(numerateur * 1_000_000_000n / denominateur) / 1e9,
    probabiliteGain: Number(gagnants * 1_000_000_000n / denominateur) / 1e9 };
}

export function gratter<R extends RegionJetons>(region: R, mise: number, alea: Alea):
  Resultat<R, { symboles: string[]; combinaison: CombinaisonGratter | null; gain: number }> {
  const debit = debiter(region, mise);
  if (!debit.ok) return debit;
  const symboles = Array.from({ length: regleGratter.cases }, () => tirerSymboleGratter(alea));
  const combinaison = combinaisonGratter(symboles);
  const gain = gainGratter(symboles, mise);
  const nom = regleGratter.symboles.find(s => s.id === combinaison?.symbole)?.nom ?? '';
  return { ok: true, region: { ...debit.region, jetons: debit.region.jetons + gain }, symboles, combinaison, gain,
    message: combinaison ? remplir(messages.gratterGagne, { nombre: combinaison.nombre, symbole: nom,
      multiplicateur: combinaison.multiplicateur }) : messages.gratterPerdu };
}
