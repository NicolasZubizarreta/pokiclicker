import donnees from '../../data/pantheon.json';

export type FichierPantheon = typeof donnees;

export function chargerPantheon(fichier: unknown): FichierPantheon {
  function verifier(ok: unknown, raison: string): asserts ok {
    if (!ok) throw new Error(`Panthéon invalide : ${raison}`);
  }
  const objet = (v: unknown) => v !== null && typeof v === 'object' && !Array.isArray(v);
  const fraction = (v: unknown) => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1;
  const positif = (v: unknown) => typeof v === 'number' && Number.isFinite(v) && v > 0;
  const texte = (v: unknown) => typeof v === 'string' && v.trim().length > 0;
  verifier(objet(fichier), 'fichier attendu.');
  const p = fichier as FichierPantheon;
  verifier(p.version === 1, 'version inconnue.');
  verifier(Array.isArray(p.socles) && p.socles.length === 6, 'six socles attendus.');
  for (const socle of p.socles) {
    verifier(objet(socle) && fraction(socle.x) && fraction(socle.y), 'coordonnées des socles invalides.');
  }
  verifier(objet(p.geometrie), 'géométrie attendue.');
  verifier(positif(p.geometrie.tailleSprite) && fraction(p.geometrie.tailleSprite)
    && fraction(p.geometrie.decalageBase) && fraction(p.geometrie.decalageNiveau)
    && typeof p.geometrie.departChute === 'number'
    && positif(-p.geometrie.departChute) && fraction(-p.geometrie.departChute), 'géométrie invalide.');
  verifier(objet(p.delais), 'délais attendus.');
  for (const cle of Object.keys(donnees.delais) as (keyof FichierPantheon['delais'])[]) {
    verifier(positif(p.delais[cle]) && Number.isInteger(p.delais[cle]), `délai ${cle} invalide.`);
  }
  verifier(objet(p.effets), 'effets attendus.');
  for (const cle of Object.keys(donnees.effets) as (keyof FichierPantheon['effets'])[]) {
    verifier(positif(p.effets[cle]) && Number.isInteger(p.effets[cle]) && p.effets[cle] <= 4000,
      `durée ${cle} invalide (maximum 4000 ms).`);
  }
  verifier(p.effets.confettiDureeMinMs <= p.effets.confettiDureeMaxMs
    && p.effets.confettiDureeMaxMs <= p.effets.confettiVieMs, 'durées des confettis incompatibles.');
  verifier(Array.isArray(p.dialogues) && p.dialogues.length === 3 && p.dialogues.every(texte),
    'trois dialogues non vides attendus.');
  verifier(texte(p.titre) && texte(p.boutonSortie), 'titre et libellé de sortie attendus.');
  return structuredClone(p);
}

const pantheon = chargerPantheon(donnees);

type Position = { index: number; x: number; y: number };
export type ActionPantheon =
  | { type: 'fondu-noir' | 'fondu-retour' | 'entree-chen' | 'sortie-chen' | 'masquer-chen' | 'fin' }
  | { type: 'dialogues'; lignes: string[]; instantane: boolean }
  | ({ type: 'chute'; taille: number; depart: number } & Position)
  | ({ type: 'poser'; taille: number } & Position)
  | ({ type: 'niveau' } & Position)
  | { type: 'titre'; anime: boolean }
  | { type: 'confettis' | 'feux'; periodeMs: number };
export type EtapePantheon = { tMs: number; action: ActionPantheon };

/** Temps depuis l'ouverture, suspendu pendant la lecture des dialogues.
 * L'action dialogues bloque la suite jusqu'à la validation des trois lignes.
 * Les effets démarrés au final continuent jusqu'à la sortie du Panthéon.
 */
export function calendrierPantheon(n: number, premiere: boolean, reduit: boolean): EtapePantheon[] {
  if (!Number.isInteger(n) || n < 0) throw new Error('Nombre de Pokémon invalide.');
  const nombre = Math.min(n, pantheon.socles.length);
  const d = pantheon.delais;
  const calendrier: EtapePantheon[] = [];
  const ajouter = (tMs: number, action: ActionPantheon) => calendrier.push({ tMs, action });
  ajouter(0, { type: 'fondu-noir' });
  ajouter(d.fonduNoirMs, { type: 'fondu-retour' });
  let debut = d.fonduNoirMs + d.fonduRetourMs;
  if (premiere) {
    ajouter(debut, { type: 'entree-chen' });
    debut += d.entreeChenMs;
    ajouter(debut, { type: 'dialogues', lignes: [...pantheon.dialogues], instantane: reduit });
    ajouter(debut, { type: 'sortie-chen' });
    debut += d.sortieChenMs;
    ajouter(debut, { type: 'masquer-chen' });
    debut += d.apresChenMs;
  }
  const g = pantheon.geometrie;
  pantheon.socles.slice(0, nombre).forEach((socle, index) => {
    const tMs = debut + (reduit ? 0 : index * d.entrePokemonMs);
    const position = { index, x: socle.x - g.tailleSprite / 2,
      y: socle.y - g.tailleSprite + g.decalageBase, taille: g.tailleSprite };
    ajouter(tMs, reduit ? { type: 'poser', ...position }
      : { type: 'chute', ...position, depart: g.departChute });
    ajouter(tMs + (reduit ? 0 : d.niveauMs),
      { type: 'niveau', index, x: socle.x, y: socle.y + g.decalageNiveau });
  });
  const final = debut + (reduit ? 0 : nombre * d.entrePokemonMs + d.finalApresEquipeMs);
  ajouter(final, { type: 'titre', anime: !reduit });
  if (!reduit) {
    ajouter(final, { type: 'confettis', periodeMs: pantheon.effets.confettiPeriodeMs });
    ajouter(final, { type: 'feux', periodeMs: pantheon.effets.feuPeriodeMs });
  }
  ajouter(final, { type: 'fin' });
  return calendrier.sort((a, b) => a.tMs - b.tMs);
}

/** couleur est une fraction destinée à sélectionner un jeton dans la palette de l'interface. */
export function tirerConfetti(alea: () => number) {
  const e = pantheon.effets;
  const duree = () => e.confettiDureeMinMs + alea() * (e.confettiDureeMaxMs - e.confettiDureeMinMs);
  return { x: alea(), couleur: alea(), rotationDepart: alea() * 360,
    dureeChuteMs: duree(), dureeRotationMs: duree(), rotationFin: alea() * 720, vieMs: e.confettiVieMs };
}

export function tirerFeu(alea: () => number) {
  return { x: 0.1 + alea() * 0.8, y: 0.1 + alea() * 0.6, couleur: alea(),
    echelle: 10 + alea() * 15, vieMs: pantheon.effets.feuVieMs };
}

export function issueDuPantheon({ ligueGagnee, defiEnAttente }: {
  ligueGagnee: number; defiEnAttente: boolean;
}): { issue: 'defi-chen' | 'bourg-palette'; annonceJohto: boolean } {
  return { issue: defiEnAttente ? 'defi-chen' : 'bourg-palette',
    annonceJohto: !defiEnAttente && ligueGagnee === 1 };
}
