import donnees from '../../data/objets.json';
import type { EtatMonde, ResultatCondition } from './conditions';
import type { chargerMonde } from './monde';
import { reglages } from './reglages';

export type Objet = {
  id: string; nom: string; description: string; prix: number;
  type: 'consommable' | 'amelioration'; zone: string | null;
  boutique: 'shop' | 'mall' | 'casino' | null; sansInflation: boolean;
  inventaire: string | null; image: string | null;
  categorie: 'balles' | 'soins' | 'equipement'; sac: string | null;
};
type MondeBoutique = Pick<ReturnType<typeof chargerMonde>, 'zonesOuvertes'>;
type RegionBoutique = {
  argent: number; inventaire: Readonly<Record<string, number>>; ameliorations: readonly string[];
};
export type ResultatAchat<R> = { ok: true; region: R } | { ok: false; raison: string };

export function chargerObjets(): Objet[] {
  return structuredClone(donnees) as Objet[];
}

export function prixObjet(objet: Objet, { badges, palier }: { badges: number; palier: boolean }): number {
  const base = objet.type === 'consommable' && !objet.sansInflation
    ? Math.floor(objet.prix * (1 + badges * reglages.boutique.inflationParBadge)) : objet.prix;
  return palier ? Math.floor(base * reglages.boutique.remise) : base;
}

export function accesShop(monde: MondeBoutique, etat: EtatMonde): ResultatCondition {
  return monde.zonesOuvertes(etat).some(zone => zone.id === reglages.shop.zone)
    ? { ok: true } : { ok: false, raison: reglages.shop.raison };
}

export function accesSac(monde: MondeBoutique, etat: EtatMonde): ResultatCondition {
  return monde.zonesOuvertes(etat).some(zone => zone.id === reglages.sac.zone)
    ? { ok: true } : { ok: false, raison: reglages.sac.raison };
}

export function objetsDuShop(objets: readonly Objet[], monde: MondeBoutique, etat: EtatMonde): Objet[] {
  if (!accesShop(monde, etat).ok) return [];
  const ouvertes = new Set(monde.zonesOuvertes(etat).map(zone => zone.id));
  return objets.filter(objet => objet.boutique === 'shop' && objet.zone !== null
    && ouvertes.has(objet.zone) && !reglages.boutique.reportes.includes(objet.id));
}

export function acheter<R extends RegionBoutique>(region: R, objet: Objet, quantite: number, prix: number): ResultatAchat<R> {
  if (!Number.isInteger(quantite) || quantite < 1 || quantite > reglages.boutique.quantiteMax
    || (objet.type === 'amelioration' && quantite !== 1)) {
    return { ok: false, raison: 'Quantité invalide.' };
  }
  if (objet.type === 'amelioration' && region.ameliorations.includes(objet.id)) {
    return { ok: false, raison: 'Déjà possédé.' };
  }
  const cout = prix * quantite;
  if (region.argent < cout) return { ok: false, raison: "Pas assez d'argent." };
  if (objet.type === 'consommable') {
    const cle = objet.inventaire!;
    return { ok: true, region: { ...region, argent: region.argent - cout,
      inventaire: { ...region.inventaire, [cle]: (region.inventaire[cle] ?? 0) + quantite } } };
  }
  return { ok: true, region: { ...region, argent: region.argent - cout,
    ameliorations: [...region.ameliorations, objet.id] } };
}

export function objetsActifs(region: Pick<RegionBoutique, 'ameliorations'>): string[] {
  return region.ameliorations.map(id => 'objet:' + id);
}

export function contenuSac(region: Pick<RegionBoutique, 'inventaire' | 'ameliorations'>,
  objets: readonly Objet[], monde: MondeBoutique, etat: EtatMonde): Objet[] {
  if (!accesSac(monde, etat).ok) return [];
  const ouvertes = new Set(monde.zonesOuvertes(etat).map(zone => zone.id));
  return objets.filter(objet => objet.type === 'amelioration'
    ? region.ameliorations.includes(objet.id)
    : objet.sac === 'toujours' || (objet.sac !== null && ouvertes.has(objet.sac))
      || (objet.inventaire !== null && (region.inventaire[objet.inventaire] ?? 0) > 0));
}
