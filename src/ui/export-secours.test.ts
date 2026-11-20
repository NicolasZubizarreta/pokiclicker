import { describe, expect, it } from 'vitest';
import { ErreurStockage, type Stockage } from '../core/sauvegarde';
import { exporterPartieOuBrut } from './export-secours';

const stockage = (contenu: Record<string, string>): Stockage => ({
  lire: cle => contenu[cle] ?? null, ecrire: () => undefined, supprimer: () => undefined, cles: () => Object.keys(contenu),
});

describe('exporterPartieOuBrut', () => {
  it("renvoie l'export normal quand il réussit", () => {
    expect(exporterPartieOuBrut(() => 'normal', stockage({}), 'a')).toBe('normal');
  });
  it('garde le texte brut de la partie et de ses régions quand elle est illisible', () => {
    const texte = exporterPartieOuBrut(() => { throw new Error('Cette sauvegarde est illisible'); },
      stockage({ 'pokiclicker:partie:a': '{pas du json', 'pokiclicker:region:a:kanto': '{}', 'pokiclicker:partie:b': 'autre' }), 'a');
    const fichier = JSON.parse(texte);
    expect(fichier.format).toBe('pokiclicker-partie-brute');
    expect(fichier.cles).toEqual({ 'pokiclicker:partie:a': '{pas du json', 'pokiclicker:region:a:kanto': '{}' });
  });
  it("relance l'erreur quand il n'y a rien à garder ou quand le stockage est en cause", () => {
    expect(() => exporterPartieOuBrut(() => { throw new Error('x'); }, stockage({}), 'a')).toThrow('x');
    expect(() => exporterPartieOuBrut(() => { throw new ErreurStockage(new Error()); }, stockage({ 'pokiclicker:partie:a': '1' }), 'a'))
      .toThrow(ErreurStockage);
  });
});
