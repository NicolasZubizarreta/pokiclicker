import donnees from '../../data/objectifs.json';

type Definition = { id: string; type: 'equipement' | 'palierPokedex' | 'pension' | 'objetShop'; exclus?: string[]; objet?: string; texte: string; texteFait: string; cible: string };
export type CatalogueObjectifs = { alternanceMs: number; boss: { texteBoss: string; texteZoneSuivante: string; texteZoneSuivanteFait: string; libelle: string }; fonctionnalites: Definition[] };
export type Objectif = { id: string; libelle?: string; texte: string; fait: boolean; applicable: boolean; cible: string | null; guide?: 'zoneSuivante' };
export type ResultatObjectifs = { boss: Objectif | null; fonctionnalites: Objectif[] };
export type EntreeObjectifs = {
  zone: { nom: string; type?: string; etapes: number; boss: { nom: string } } | null;
  zoneSuivante: { nom: string; ouverte: boolean; atteinte?: boolean } | null; argent: number;
  boutique: { ouverte: boolean; objets: { id: string; categorie: string; possede: boolean; abordable: boolean }[] };
  progression: { pokedex: { nombre: number }; prochain: { palier: number; restantes: number } | null; paliers: { palier: number; description: string; recu: boolean }[] };
  pension: { ouverte: boolean; parents: number; oeufs: number; especesEcloses: number };
};

export function chargerObjectifs(source: unknown = donnees): CatalogueObjectifs {
  const erreur = () => { throw new Error('Données des objectifs invalides'); };
  const objet = (v: unknown): Record<string, unknown> => {
    if (!v || typeof v !== 'object' || Array.isArray(v)) return erreur();
    return v as Record<string, unknown>;
  };
  const cles = (v: Record<string, unknown>, attendues: string[]) => {
    if (Object.keys(v).some(c => !attendues.includes(c))) erreur();
  };
  const texte = (v: unknown, variables: string[] = []) => {
    if (typeof v !== 'string' || !v.trim()) return erreur();
    const reste = v.replace(/\{([^{}]+)\}/g, (_, cle: string) => { if (!variables.includes(cle)) erreur(); return ''; });
    if (/[{}]/.test(reste)) erreur();
  };
  const racine = objet(source);
  cles(racine, ['alternanceMs', 'boss', 'fonctionnalites']);
  if (!Number.isInteger(racine.alternanceMs) || (racine.alternanceMs as number) <= 0) erreur();
  const boss = objet(racine.boss);
  cles(boss, ['texteBoss', 'texteZoneSuivante', 'texteZoneSuivanteFait', 'libelle']);
  texte(boss.texteBoss, ['nom', 'etapes']); texte(boss.texteZoneSuivante, ['zone']); texte(boss.texteZoneSuivanteFait, ['zone']); texte(boss.libelle);
  if (!Array.isArray(racine.fonctionnalites)) return erreur();
  const ids = new Set<string>();
  for (const valeur of racine.fonctionnalites) {
    const d = objet(valeur);
    const types = ['equipement', 'palierPokedex', 'pension', 'objetShop'];
    if (!types.includes(d.type as string)) erreur();
    cles(d, ['id', 'type', 'texte', 'texteFait', 'cible', ...(d.type === 'equipement' ? ['exclus'] : d.type === 'objetShop' ? ['objet'] : [])]);
    texte(d.id); if (ids.has(d.id as string) || d.id === 'boss') erreur(); ids.add(d.id as string);
    texte(d.texte, d.type === 'palierPokedex' ? ['nombre', 'palier', 'bonus'] : []); texte(d.texteFait);
    if (!['Combat', 'PC', 'Shop', 'Carte', 'Pokédex', 'Menu', 'Monde', 'Casino', 'Pension', 'Centre'].includes(d.cible as string)) erreur();
    if (d.type === 'objetShop') texte(d.objet);
    if (d.type === 'equipement') {
      if (!Array.isArray(d.exclus)) return erreur();
      d.exclus.forEach(v => texte(v));
    }
  }
  return structuredClone(source) as CatalogueObjectifs;
}
export const objectifs = chargerObjectifs();
const remplir = (texte: string, valeurs: Record<string, string | number>) => texte.replace(/\{([^}]+)\}/g, (_, cle: string) => String(valeurs[cle] ?? ''));

export function calculerObjectifs(e: EntreeObjectifs): ResultatObjectifs {
  const { zone, zoneSuivante: suivante } = e;
  const visitee = !!suivante?.ouverte && suivante.atteinte === true;
  const guide = !!suivante?.ouverte && !visitee;
  const boss: Objectif | null = zone ? { id: 'boss', libelle: objectifs.boss.libelle, fait: visitee, applicable: !visitee,
    cible: guide ? 'Combat' : null, ...(guide ? { guide: 'zoneSuivante' as const } : {}),
    texte: suivante?.ouverte ? remplir(visitee ? objectifs.boss.texteZoneSuivanteFait : objectifs.boss.texteZoneSuivante, { zone: suivante.nom })
      : remplir(objectifs.boss.texteBoss, { nom: ['arene', 'ligue'].includes(zone.type ?? '') ? zone.boss.nom.replace(/\s*\([^()]*\)$/, '') : zone.boss.nom, etapes: zone.etapes }) } : null;
  const fonctionnalites = objectifs.fonctionnalites.flatMap(d => {
    let fait = false; let applicable = false;
    const valeurs: Record<string, string | number> = {};
    if (d.type === 'equipement') {
      if (!e.boutique.ouverte) return [];
      const objets = e.boutique.objets.filter(o => o.categorie === 'equipement' && !d.exclus?.includes(o.id));
      fait = objets.some(o => o.possede); applicable = !fait && objets.some(o => !o.possede && o.abordable);
    } else if (d.type === 'palierPokedex') {
      const prochain = e.progression.prochain;
      fait = !prochain; applicable = !fait;
      if (prochain) Object.assign(valeurs, { nombre: e.progression.pokedex.nombre, palier: prochain.palier, bonus: e.progression.paliers.find(p => p.palier === prochain.palier)?.description ?? '' });
    } else if (d.type === 'pension') {
      if (!e.pension.ouverte) return [];
      fait = e.pension.parents >= 2 || e.pension.oeufs > 0 || e.pension.especesEcloses > 0; applicable = !fait;
    } else {
      const objet = e.boutique.objets.find(o => o.id === d.objet);
      if (!objet) return [];
      fait = objet.possede; applicable = !fait;
    }
    return [{ id: d.id, texte: fait ? d.texteFait : remplir(d.texte, valeurs), fait, applicable, cible: d.cible }];
  });
  return { boss, fonctionnalites };
}
export function listeFenetre(r: ResultatObjectifs): Objectif[] { return [...(r.boss ? [r.boss] : []), ...r.fonctionnalites]; }
export function objectifAffiche(compteur: number, r: ResultatObjectifs): Objectif | null {
  const fonctions = r.fonctionnalites.filter(o => o.applicable && !o.fait);
  const boss = r.boss?.applicable && !r.boss.fait ? r.boss : null;
  if (!fonctions.length) return boss;
  if (!boss) return fonctions[compteur % fonctions.length]!;
  return compteur % 2 === 0 ? boss : fonctions[Math.floor(compteur / 2) % fonctions.length]!;
}
