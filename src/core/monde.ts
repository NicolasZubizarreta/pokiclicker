import { evaluer, valider } from './conditions';
import type { Condition, EtatMonde, ResultatCondition } from './conditions';
import { chargerPokemon } from './pokemon';

// Format documenté dans data/schemas/zone.schema.json (ADR 0002).
export type Rarete = 'commun' | 'peu-commun' | 'rare' | 'tres-rare' | 'legendaire';
export type Lien = { vers: string; si?: Condition };
export type Rencontre = { pokemon: number; nom: string; niveau: number; capture: number };
export type ZoneSansCombat = {
  id: string;
  nom: string;
  sansCombat: true;
  message?: string;
  decor: string;
  liens: Lien[];
  ancienId: number;
  fin?: boolean;
};
export type Zone = {
  id: string;
  nom: string;
  sansCombat?: false;
  type?: 'arene' | 'ligue';
  decor: string;
  niveaux: [number, number];
  etapes: number;
  multiplicateurPv: number;
  sauvages: { pokemon: number; rarete: Rarete; apparition: number; capture: number }[];
  boss: Rencontre;
  adversaires?: Rencontre[];
  liens: Lien[];
  ancienId: number;
  fin?: boolean;
};
export type ZoneMonde = Zone | ZoneSansCombat;
export type Lieu = { lieu: string; nom: string; decor: string; ancienId: number; depuis: string; si?: Condition };
export type FichierZones = {
  version: number; region: string; depart: string; premierCombat: string; zones: ZoneMonde[]; lieux: Lieu[];
};

export function chargerMonde(fichier: FichierZones, catalogue = chargerPokemon()) {
  if (fichier.version !== 1 || !Array.isArray(fichier.zones)) throw new Error('Fichier de zones invalide');
  const index = new Map<string, ZoneMonde>();
  for (const zone of fichier.zones) {
    if (index.has(zone.id)) throw new Error(`Identifiant de zone dupliqué : ${zone.id}`);
    index.set(zone.id, zone);
  }
  function zone(id: string): ZoneMonde {
    const resultat = index.get(id);
    if (!resultat) throw new Error(`Zone inconnue : ${id}`);
    return resultat;
  }
  function zoneDeCombat(id: string): Zone {
    const resultat = zone(id);
    if (resultat.sansCombat) throw new Error(`Zone sans combat : ${id}`);
    return resultat;
  }
  zone(fichier.depart);
  zoneDeCombat(fichier.premierCombat);
  for (const actuelle of fichier.zones) {
    if (!actuelle.liens.length && actuelle.fin !== true) throw new Error(`Zone sans sortie : ${actuelle.id}`);
    if ('type' in actuelle && actuelle.type !== undefined && !['arene', 'ligue'].includes(actuelle.type)) {
      throw new Error(`Type de zone inconnu : ${actuelle.type}`);
    }
    for (const lien of actuelle.liens) {
      zone(lien.vers);
      if (lien.si !== undefined) valider(lien.si);
    }
    if (actuelle.sansCombat) {
      if (actuelle.message !== undefined && (typeof actuelle.message !== 'string' || !actuelle.message.trim())) {
        throw new Error(`Message de zone invalide : ${actuelle.id}`);
      }
      if ('sauvages' in actuelle || 'boss' in actuelle || 'adversaires' in actuelle) {
        throw new Error(`Zone sans combat invalide : ${actuelle.id}`);
      }
      continue;
    }
    if (actuelle.niveaux.length !== 2 || !actuelle.niveaux.every(Number.isFinite)
      || actuelle.niveaux[0] > actuelle.niveaux[1]) throw new Error(`Niveaux invalides : ${actuelle.id}`);
    if (!Number.isInteger(actuelle.etapes) || actuelle.etapes < 1) throw new Error(`Étapes invalides : ${actuelle.id}`);
    if (!actuelle.sauvages.length && actuelle.type !== 'ligue') throw new Error(`Aucun Pokémon sauvage : ${actuelle.id}`);
    if (actuelle.type === 'ligue'
      ? !Array.isArray(actuelle.adversaires) || actuelle.adversaires.length !== actuelle.etapes - 1
      : actuelle.adversaires !== undefined) throw new Error(`Adversaires de la Ligue invalides : ${actuelle.id}`);
    if (actuelle.type === 'ligue' && actuelle.sauvages.length) throw new Error(`Sauvages interdits dans la Ligue : ${actuelle.id}`);
    for (const sauvage of actuelle.sauvages) {
      if (!Number.isFinite(sauvage.apparition) || sauvage.apparition <= 0) throw new Error(`Apparition invalide : ${actuelle.id}`);
      if (!['commun', 'peu-commun', 'rare', 'tres-rare', 'legendaire'].includes(sauvage.rarete)) {
        throw new Error(`Rareté inconnue : ${sauvage.rarete}`);
      }
    }
    for (const rencontre of [...actuelle.sauvages, ...(actuelle.adversaires ?? []), actuelle.boss]) {
      catalogue.parNumero(rencontre.pokemon);
      if (!Number.isFinite(rencontre.capture) || rencontre.capture < 0 || rencontre.capture > 255) {
        throw new Error(`Capture invalide : ${actuelle.id}`);
      }
    }
  }
  const indexLieux = new Map<string, Lieu>();
  for (const lieu of fichier.lieux) {
    if (indexLieux.has(lieu.lieu)) throw new Error(`Lieu dupliqué : ${lieu.lieu}`);
    indexLieux.set(lieu.lieu, lieu);
    zone(lieu.depuis);
    if (lieu.si !== undefined) valider(lieu.si);
  }
  function lieu(id: string): Lieu {
    const resultat = indexLieux.get(id);
    if (!resultat) throw new Error(`Lieu inconnu : ${id}`);
    return resultat;
  }
  const contexte = { nomZone: (id: string) => zone(id).nom };
  function parcourir(etat?: EtatMonde): ZoneMonde[] {
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
    premierCombat: fichier.premierCombat,
    zones: fichier.zones,
    lieux: fichier.lieux,
    lieu,
    zone,
    zoneDeCombat,
    zonePrecedente(id: string): ZoneMonde | undefined {
      return fichier.zones.find(actuelle => actuelle.liens.some(lien => lien.vers === id));
    },
    accesZone(vers: string, etat: EtatMonde): ResultatCondition {
      if (this.zonesOuvertes(etat).some(actuelle => actuelle.id === vers)) return { ok: true };
      const precedente = this.zonePrecedente(vers);
      return precedente ? this.peutPasser(precedente.id, vers, etat)
        : { ok: false, raison: 'Cette zone est inaccessible.' };
    },
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
