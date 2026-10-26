import donnees from '../../data/easter-eggs.json';
import evolutions from '../../data/evolutions.json';

type Effet = 'retourne' | 'arc-en-ciel' | 'caca' | 'photo';
type Fichier = Omit<typeof donnees, 'effets'> & { effets: (Omit<typeof donnees.effets[number], 'effet'> & { effet: Effet | null })[] };

export function chargerEasterEggs(fichier: unknown = donnees): Fichier {
  function verifier(ok: unknown): asserts ok {
    if (!ok) throw new Error('Easter eggs invalides : version, effets ou déclencheurs incorrects.');
  }
  verifier(fichier && typeof fichier === 'object');
  const f = fichier as Fichier;
  verifier(f.version === 1 && Array.isArray(f.effets) && f.effets.length > 0);
  const noms = new Set<string>();
  for (const effet of f.effets) {
    verifier(effet && typeof effet.nom === 'string' && effet.nom.length > 0
      && typeof effet.inactif === 'boolean' && Array.isArray(effet.assets)
      && effet.assets.every(a => typeof a === 'string' && a.length > 0)
      && (effet.inactif ? effet.effet === null : ['retourne', 'arc-en-ciel', 'caca', 'photo'].includes(effet.effet!))
      && (effet.effet !== 'photo' || effet.assets.length === 3)
      && Array.isArray(effet.declencheurs) && effet.declencheurs.length > 0);
    for (const nom of effet.declencheurs) {
      verifier(typeof nom === 'string' && nom.length > 0 && nom === nom.trim().toLowerCase() && !noms.has(nom));
      noms.add(nom);
    }
  }
  return structuredClone(f);
}
const catalogue = chargerEasterEggs(donnees);
export function effetDe(surnom?: string): Effet | null {
  const nom = surnom?.trim().toLowerCase();
  return catalogue.effets.find(e => !e.inactif && e.declencheurs.includes(nom ?? ''))?.effet ?? null;
}
export function stadeEvolution(numero: number): 1 | 2 | 3 {
  if (!Number.isInteger(numero) || numero < 1 || numero > 151) throw new Error('Numéro de Pokémon invalide.');
  const liens = Object.values(evolutions).flat();
  const parent = liens.find(e => e.vers === numero);
  if (!parent) return 1;
  return liens.some(e => e.vers === parent.de) ? 3 : 2;
}
