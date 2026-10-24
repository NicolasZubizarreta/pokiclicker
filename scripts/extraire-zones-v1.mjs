import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { runInContext, createContext } from 'node:vm';

const racine = new URL('../', import.meta.url);
const contexte = createContext({});
for (const fichier of ['legacy/js/data/constants.js', 'legacy/js/regions/kanto.js']) {
  runInContext((await readFile(new URL(fichier, racine), 'utf8')).replace(/^\uFEFF/, ''), contexte);
}
const { ZONES, ZONE_MULT, BADGES } = runInContext('({ ZONES, ZONE_MULT, BADGES })', contexte);

const slugsAttendus = [
  'bourg-palette', 'route-1', 'foret-de-jade', 'arene-d-argenta',
  'mont-selenite', 'arene-d-azuria', 'pont-pepite', 'arene-de-carmin',
  'cave-taupiqueur', 'tunnel-rocheux', 'tour-pokemon', 'arene-de-celadopole',
  'centrale', 'arene-de-parmanie', 'sylphe-sarl', 'arene-de-safrania',
  'iles-ecume', 'arene-de-cramois-ile', 'arene-de-jadielle', 'caverne-azuree',
  'route-victoire', 'ligue-pokemon',
];
const slugs = Array.from(ZONES, zone => zone.name.normalize('NFD')
  .replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''));
if (JSON.stringify(slugs) !== JSON.stringify(slugsAttendus)) {
  throw new Error('Les identifiants des zones V1 ne correspondent pas à la liste attendue.');
}
const arenes = Array.from(BADGES, badge => badge.zoneIdx);
if (JSON.stringify(arenes) !== JSON.stringify([3, 5, 7, 11, 13, 15, 17, 18])) {
  throw new Error('Les zones des badges V1 ne correspondent pas aux arènes attendues.');
}
/** @type {Record<string, string>} */
const raretes = {
  'Commun': 'commun',
  'Peu Commun': 'peu-commun',
  'Rare': 'rare',
  'Très Rare': 'tres-rare',
  'Légendaire': 'legendaire',
};
/** @param {number} indice */
const identifiant = indice => `kanto.${slugs[indice]}`;
/** @param {number} indice */
const conditionBoss = indice => ({ type: 'boss', zone: identifiant(indice) });
/** @param {{ id: number, name: string, level: number, catchRate: number }} pokemon */
const adversaire = pokemon => ({
  pokemon: pokemon.id, nom: pokemon.name, niveau: pokemon.level, capture: pokemon.catchRate,
});
const zones = Array.from(ZONES, (zone, indice) => {
  const liens = indice === 21 ? [] : [{
    vers: identifiant(indice + 1),
    ...(indice === 0 ? {} : { si: conditionBoss(indice) }),
  }];
  const debut = { id: identifiant(indice), nom: zone.name };
  const decor = `kanto/${slugs[indice]}.webp`;
  if (indice === 0) {
    // Contenu supplémentaire propre à la V2, absent des données de la V1.
    const message = 'Pas de Pokémon sauvage ici. Va sur la Route 1 pour combattre.';
    return { ...debut, sansCombat: true, message, decor, liens, ancienId: zone.id };
  }
  return {
    ...debut,
    ...(arenes.includes(indice) ? { type: 'arene' } : indice === 21 ? { type: 'ligue' } : {}),
    decor,
    niveaux: [zone.minLevel, zone.maxLevel],
    etapes: 10,
    multiplicateurPv: ZONE_MULT[indice],
    sauvages: indice === 21 ? [] : Array.from(zone.pokemons, pokemon => {
      if (!Object.hasOwn(raretes, pokemon.rarity)) {
        throw new Error(`Rareté V1 inconnue dans la zone ${indice} : ${pokemon.rarity}`);
      }
      return {
        pokemon: pokemon.id, rarete: raretes[pokemon.rarity],
        apparition: pokemon.spawnRate, capture: pokemon.catchRate,
      };
    }),
    ...(indice === 21 ? { adversaires: Array.from(zone.pokemons, adversaire) } : {}),
    boss: adversaire(zone.boss),
    liens,
    ancienId: zone.id,
    ...(indice === 21 ? { fin: true } : {}),
  };
});
if (/** @type {{ adversaires?: unknown[] }} */ (zones[21]).adversaires?.length !== 9) {
  throw new Error('La Ligue V1 doit contenir neuf adversaires.');
}

// Seules les conditions d'accès des lieux proviennent de l'interface V1.
const accesLieux = [
  // combat.js L346–349 : zone 11 débloquée, donc boss de la zone 10 vaincu.
  { lieu: 'pension', depuis: 0, boss: 10 },
  // update.js L447–460 : accès depuis Bourg Palette sans condition.
  { lieu: 'labo', depuis: 0 },
  { lieu: 'chez-blue', depuis: 0 },
  { lieu: 'chez-maman', depuis: 0 },
  // combat.js L316–320 : accès après la victoire à la Ligue.
  { lieu: 'pantheon', depuis: 21, boss: 21 },
  // save.js L804, L848–850 : accès à Céladopole après le boss de la Tour Pokémon.
  { lieu: 'centre-commercial', depuis: 11, boss: 10 },
  { lieu: 'casino', depuis: 11, boss: 10 },
];
const lieux = accesLieux.map((acces, indice) => ({
  lieu: acces.lieu,
  nom: ZONES[-indice - 1].name,
  decor: `kanto/${acces.lieu}.webp`,
  ancienId: ZONES[-indice - 1].id,
  depuis: identifiant(acces.depuis),
  ...(acces.boss === undefined ? {} : { si: conditionBoss(acces.boss) }),
}));

// --verifier : compare la sortie aux fichiers versionnés sans rien écrire (échec si elle diffère).
const verifier = process.argv.includes('--verifier');
if (!verifier) {
  await mkdir(new URL('tests/fixtures/', racine), { recursive: true });
  await mkdir(new URL('data/regions/kanto/', racine), { recursive: true });
}
for (const [fichier, donnees] of [
  ['tests/fixtures/v1-zones.json', {
    zones: Array.from(ZONES),
    speciaux: Array.from({ length: 7 }, (_, indice) => ZONES[-indice - 1]),
    multiplicateurs: Object.entries(ZONE_MULT).map(([id, mult]) => [Number(id), mult])
      .sort(([a], [b]) => a - b),
    badges: BADGES,
  }],
  ['data/regions/kanto/zones.json', {
    version: 1, region: 'kanto', depart: identifiant(0), premierCombat: identifiant(1), zones, lieux,
  }],
]) {
  const texte = JSON.stringify(donnees, null, 2) + '\n';
  if (!verifier) await writeFile(new URL(String(fichier), racine), texte);
  else if ((await readFile(new URL(String(fichier), racine), 'utf8')) !== texte) {
    throw new Error(`${fichier} diffère de la V1 : relancer node scripts/extraire-zones-v1.mjs`);
  }
}
