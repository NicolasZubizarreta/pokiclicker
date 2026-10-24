import { readFileSync } from 'node:fs';

export function lireJetons() {
  const couleurs = readFileSync(new URL('../design/tokens.css', import.meta.url), 'utf8');
  const regions = readFileSync(new URL('../design/regions.css', import.meta.url), 'utf8');
  /** @param {string} css @param {string} nom */
  function lire(css, nom) {
    const bloc = css.match(/:root\[data-theme="dark"\][^{]*\{([^}]+)\}/)?.[1];
    const valeur = bloc?.match(new RegExp(`--${nom}:\\s*([^;]+);`))?.[1]?.trim();
    if (!valeur) throw new Error(`Le jeton ${nom} du thème sombre est introuvable.`);
    return valeur;
  }
  return { fond: lire(couleurs, 'fond'), action: lire(couleurs, 'action'),
    texte: lire(couleurs, 'texte'), accent: lire(regions, 'region-accent') };
}
