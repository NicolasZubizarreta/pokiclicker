import donnees from '../../data/astuces.json';

export function chargerAstuces(source: unknown = donnees): readonly string[] {
  const fichier = source as { version?: unknown; astuces?: unknown } | null;
  if (!fichier || fichier.version !== 1 || !Array.isArray(fichier.astuces)
    || fichier.astuces.length < 30
    || fichier.astuces.some(texte => typeof texte !== 'string' || !texte.trim() || texte.length > 110)
    || new Set(fichier.astuces).size !== fichier.astuces.length) {
    throw new Error('Liste d’astuces invalide.');
  }
  return Object.freeze([...fichier.astuces]) as readonly string[];
}

const astuces = chargerAstuces();
export function tirerAstuce(alea: () => number): string {
  return astuces[Math.floor(alea() * astuces.length)]!;
}
