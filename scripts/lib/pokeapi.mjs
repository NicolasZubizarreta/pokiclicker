/**
 * @typedef {{ id: number, stats: { base_stat: number, stat: { name: string } }[], types: { slot: number, type: { name: string } }[] }} ReponsePokemon
 * @typedef {{ id: number, names: { name: string, language: { name: string } }[], generation: { name: string } }} ReponseEspece
 */

/**
 * Transforme les seules données utiles de PokeAPI, sans accès réseau.
 * @param {ReponsePokemon} pokemonJson
 * @param {ReponseEspece} especeJson
 * @returns {import('../../src/core/pokemon').Pokemon}
 */
export function construireEntree(pokemonJson, especeJson) {
  const numero = pokemonJson?.id;
  const invalide = () => new Error(`Réponse invalide pour le Pokémon n°${numero}`);
  if (!Number.isInteger(numero) || numero <= 0 || especeJson?.id !== numero) throw invalide();
  if (!Array.isArray(especeJson.names)) throw invalide();
  const nom = especeJson.names.find((entree) => entree?.language?.name === 'fr')?.name;
  if (typeof nom !== 'string' || !nom.trim()) {
    throw new Error(`Pas de nom français pour le Pokémon n°${numero}`);
  }
  const generations = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix'];
  const generation = generations.findIndex((romain) => especeJson.generation?.name === `generation-${romain}`) + 1;
  if (!generation || !Array.isArray(pokemonJson.stats) || pokemonJson.stats.length !== 6
    || !Array.isArray(pokemonJson.types) || !pokemonJson.types.length) throw invalide();
  if (pokemonJson.types.some((entree) => !entree || !Number.isInteger(entree.slot))) throw invalide();

  /** @param {string} nomStat */
  function lireStat(nomStat) {
    const valeur = pokemonJson.stats.find((entree) => entree?.stat?.name === nomStat)?.base_stat;
    if (typeof valeur !== 'number' || !Number.isInteger(valeur) || valeur <= 0) throw invalide();
    return valeur;
  }
  const emplacements = new Set();
  const types = [...pokemonJson.types].sort((a, b) => a.slot - b.slot).map((entree) => {
    if (!Number.isInteger(entree?.slot) || entree.slot <= 0 || emplacements.has(entree.slot)
      || typeof entree.type?.name !== 'string' || !/^[a-z]+$/.test(entree.type.name)) throw invalide();
    emplacements.add(entree.slot);
    return entree.type.name;
  });
  if (new Set(types).size !== types.length) throw invalide();
  return {
    numero,
    nom: nom.trim(),
    types,
    stats: {
      pv: lireStat('hp'),
      attaque: lireStat('attack'),
      defense: lireStat('defense'),
      attaqueSpe: lireStat('special-attack'),
      defenseSpe: lireStat('special-defense'),
      vitesse: lireStat('speed'),
    },
    generation,
  };
}
