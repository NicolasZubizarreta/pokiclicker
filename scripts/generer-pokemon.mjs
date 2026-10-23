import { writeFile } from 'node:fs/promises';
import { setTimeout as pause } from 'node:timers/promises';
import { construireEntree } from './lib/pokeapi.mjs';

/** @param {string[]} argumentsCli */
function lireOptions(argumentsCli) {
  const options = { de: '1', a: '151', sortie: 'data/pokemon.json' };
  for (let i = 0; i < argumentsCli.length; i += 2) {
    const cle = argumentsCli[i]?.slice(2);
    const valeur = argumentsCli[i + 1];
    if (!argumentsCli[i]?.startsWith('--') || (cle !== 'de' && cle !== 'a' && cle !== 'sortie')
      || !valeur || valeur.startsWith('--')) {
      throw new Error('Usage : node scripts/generer-pokemon.mjs [--de 1] [--a 151] [--sortie data/pokemon.json]');
    }
    options[cle] = valeur;
  }
  const de = Number(options.de);
  const a = Number(options.a);
  if (!Number.isSafeInteger(de) || !Number.isSafeInteger(a) || de <= 0 || a < de) {
    throw new Error('Intervalle de numéros Pokémon invalide');
  }
  return { de, a, sortie: options.sortie };
}

/** @param {string} ressource @param {number} numero */
async function lireReponse(ressource, numero) {
  for (let essai = 1; essai <= 3; essai++) {
    try {
      const reponse = await fetch(`https://pokeapi.co/api/v2/${ressource}/${numero}`, {
        signal: AbortSignal.timeout(15000),
      });
      if (!reponse.ok) throw new Error(`HTTP ${reponse.status}`);
      return await reponse.json();
    } catch {
      if (essai === 3) throw new Error(`Réponse indisponible ou invalide pour le Pokémon n°${numero} (${ressource}) après 3 essais`);
      await pause(250);
    }
  }
}

try {
  const { de, a, sortie } = lireOptions(process.argv.slice(2));
  const pokemon = [];
  for (let numero = de; numero <= a; numero++) {
    const donnees = /** @type {import('./lib/pokeapi.mjs').ReponsePokemon} */ (await lireReponse('pokemon', numero));
    const espece = /** @type {import('./lib/pokeapi.mjs').ReponseEspece} */ (await lireReponse('pokemon-species', numero));
    if (donnees?.id !== numero || espece?.id !== numero) {
      throw new Error(`Réponse invalide pour le Pokémon n°${numero}`);
    }
    try {
      pokemon.push(construireEntree(donnees, espece));
    } catch (erreur) {
      if (erreur instanceof Error && erreur.message.includes(`n°${numero}`)) throw erreur;
      throw new Error(`Réponse invalide pour le Pokémon n°${numero}`);
    }
  }
  // Aucune écriture avant la validation de l'ensemble de l'intervalle.
  await writeFile(sortie, JSON.stringify({ version: 1, pokemon }, null, 2) + '\n');
} catch (erreur) {
  console.error(erreur instanceof Error ? erreur.message : 'Échec de génération des Pokémon');
  process.exitCode = 1;
}
