import { evaluer, valider } from './conditions';
import type { Condition, EtatMonde, ResultatCondition } from './conditions';
import { chargerPokemon } from './pokemon';

// Format documenté dans data/schemas/zone.schema.json (ADR 0002).
export type Rarete = 'commun' | 'peu-commun' | 'rare' | 'tres-rare' | 'legendaire';
export type Lien = { vers: string; si?: Condition };
export type Zone = {
  id: string;
  nom: string;
  decor: string;
  niveaux: [number, number];
  etapes: number;
  multiplicateurPv: number;
  sauvages: { pokemon: number; rarete: Rarete; apparition: number; capture: number }[];
  boss: { pokemon: number; nom: string; niveau: number; capture: number };
  liens: Lien[];
  ancienId: number;
  fin?: boolean;
};
export type FichierZones = { version: number; region: string; depart: string; zones: Zone[] };

export function chargerMonde(fichier: FichierZones, catalogue = chargerPokemon()) {
  if (fichier.version !== 1 || !Array.isArray(fichier.zones)) throw new Error('Fichier de zones invalide');
  const index = new Map<string, Zone>();
  for (const zone of fichier.zones) {
    if (index.has(zone.id)) throw new Error(`Identifiant de zone dupliqué : ${zone.id}`);
    index.set(zone.id, zone);
  }
  function zone(id: string): Zone {
    const resultat = index.get(id);
    if (!resultat) throw new Error(`Zone inconnue : ${id}`);
    return resultat;
  }
  zone(fichier.depart);
  for (const actuelle of fichier.zones) {
    if (!actuelle.liens.length && actuelle.fin !== true) throw new Error(`Zone sans sortie : ${actuelle.id}`);
    if (actuelle.niveaux.length !== 2 || !actuelle.niveaux.every(Number.isFinite)
      || actuelle.niveaux[0] > actuelle.niveaux[1]) throw new Error(`Niveaux invalides : ${actuelle.id}`);
    if (!Number.isInteger(actuelle.etapes) || actuelle.etapes < 1) throw new Error(`Étapes invalides : ${actuelle.id}`);
    if (!actuelle.sauvages.length) throw new Error(`Aucun Pokémon sauvage : ${actuelle.id}`);
    for (const sauvage of actuelle.sauvages) {
      if (!Number.isFinite(sauvage.apparition) || sauvage.apparition <= 0) throw new Error(`Apparition invalide : ${actuelle.id}`);
      if (!['commun', 'peu-commun', 'rare', 'tres-rare', 'legendaire'].includes(sauvage.rarete)) {
        throw new Error(`Rareté inconnue : ${sauvage.rarete}`);
      }
    }
    for (const rencontre of [...actuelle.sauvages, actuelle.boss]) {
      catalogue.parNumero(rencontre.pokemon);
      if (!Number.isFinite(rencontre.capture) || rencontre.capture < 0 || rencontre.capture > 255) {
        throw new Error(`Capture invalide : ${actuelle.id}`);
      }
    }
    for (const lien of actuelle.liens) {
      zone(lien.vers);
      if (lien.si !== undefined) valider(lien.si);
    }
  }
  const contexte = { nomZone: (id: string) => zone(id).nom };
  function parcourir(etat?: EtatMonde): Zone[] {
    const visites = new Set<string>([fichier.depart]);
    for (const id of visites) {
      for (const lien of zone(id).liens) {
        if (!etat || !lien.si || evaluer(lien.si, etat, contexte).ok) visites.add(lien.vers);
      }
    }
    return [...visites].map(zone);
  }
  const accessibles = new Set(parcourir().map((zone) => zone.id));
  for (const actuelle of fichier.zones) {
    if (!accessibles.has(actuelle.id)) throw new Error(`Zone inaccessible : ${actuelle.id}`);
  }
  return {
    region: fichier.region,
    depart: fichier.depart,
    zones: fichier.zones,
    zone,
    liensDepuis: (id: string) => zone(id).liens,
    peutPasser(depuis: string, vers: string, etat: EtatMonde): ResultatCondition {
      const liens = zone(depuis).liens.filter((lien) => lien.vers === vers);
      if (!liens.length) return { ok: false, raison: `Pas de chemin de ${depuis} vers ${vers}.` };
      const resultats = liens.map((lien) => lien.si ? evaluer(lien.si, etat, contexte) : { ok: true });
      return resultats.find((resultat) => resultat.ok) ?? resultats[0]!;
    },
    zonesOuvertes: (etat: EtatMonde) => parcourir(etat),
  };
}
