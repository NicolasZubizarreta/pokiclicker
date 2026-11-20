import { ErreurStockage, type Stockage } from '../core/sauvegarde';

/**
 * Export d'une partie. Si la partie est trop abîmée pour l'export normal, on garde le texte brut de ses clés :
 * rien n'est perdu et le fichier peut être envoyé au support.
 */
export function exporterPartieOuBrut(exportNormal: () => string, stockage: Stockage, id: string): string {
  try { return exportNormal(); } catch (erreur) {
    if (erreur instanceof ErreurStockage) throw erreur;
    const cles = stockage.cles().filter(cle => cle === `pokiclicker:partie:${id}` || cle.startsWith(`pokiclicker:region:${id}:`));
    if (cles.length === 0) throw erreur;
    return JSON.stringify({ format: 'pokiclicker-partie-brute', id, exporteLe: new Date().toISOString(),
      cles: Object.fromEntries(cles.map(cle => [cle, stockage.lire(cle)])) });
  }
}
