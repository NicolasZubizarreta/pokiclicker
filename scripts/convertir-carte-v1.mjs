import { open } from 'node:fs/promises';

/**
 * Lit uniquement la signature PNG et l'en-tête IHDR.
 * @param {URL} fichier
 * @returns {Promise<{largeur: number, hauteur: number}>}
 */
export async function lireTaillePng(fichier) {
  const entree = await open(fichier, 'r');
  try {
    const entete = Buffer.alloc(24);
    const { bytesRead } = await entree.read(entete, 0, 24, 0);
    if (bytesRead !== 24 || entete.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a'
      || entete.readUInt32BE(8) !== 13 || entete.toString('ascii', 12, 16) !== 'IHDR') {
      throw new Error('En-tête PNG invalide.');
    }
    return { largeur: entete.readUInt32BE(16), hauteur: entete.readUInt32BE(20) };
  } finally {
    await entree.close();
  }
}

/**
 * Convertit les coordonnées V1 en fractions, sans modifier les entrées ni leur ordre.
 * @param {{type: string, coords: number[], name: string, zoneId: number | null, color: string}[]} mapData
 * @param {{largeur: number, hauteur: number}} image
 * @param {{id: string, ancienId: number}[]} zones
 */
export function convertirCarte(mapData, { largeur, hauteur }, zones) {
  if (!Number.isFinite(largeur) || largeur <= 0 || !Number.isFinite(hauteur) || hauteur <= 0) {
    throw new Error('Dimensions de carte invalides.');
  }
  const identifiants = new Map(zones.map(zone => [zone.ancienId, zone.id]));
  const formes = mapData.map(({ type, coords, name, zoneId, color }) => {
    const zone = zoneId === null ? null : identifiants.get(zoneId);
    if (zone === undefined) throw new Error(`Zone inconnue : ${zoneId}`);
    const debut = { zone, nom: name, teinte: color };
    /** @param {number} indice */
    function coord(indice) {
      const valeur = coords[indice];
      if (valeur === undefined || !Number.isFinite(valeur)) throw new Error(`Forme de carte invalide : ${name}`);
      return valeur;
    }
    if (type === 'rect') {
      return { ...debut, forme: 'rect', x: coord(0) / largeur, y: coord(1) / hauteur,
        l: (coord(2) - coord(0)) / largeur, h: (coord(3) - coord(1)) / hauteur };
    }
    if (type === 'circle') {
      return { ...debut, forme: 'cercle', x: coord(0) / largeur, y: coord(1) / hauteur, r: coord(2) / largeur };
    }
    if (type === 'polygon') {
      const points = [];
      for (let indice = 0; indice < coords.length; indice += 2) {
        points.push([coord(indice) / largeur, coord(indice + 1) / hauteur]);
      }
      return { ...debut, forme: 'polygone', points };
    }
    throw new Error(`Forme de carte invalide : ${name}`);
  });
  return { image: 'kanto/carte-kanto.webp', ratio: [16, 9], formes };
}
