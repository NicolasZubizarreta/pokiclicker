import { accesSac, accesShop, chargerObjets, contenuSac, objetsDuShop, prixObjet } from '../core/boutique';
import { kanto } from '../core/regions';
import { reglages } from '../core/reglages';
import { etatMondeDe } from '../core/sauvegarde';
import type { DonneesRegion } from '../core/sauvegarde';
import { chargerEvolutions } from '../core/evolution';
import donneesJalons from '../../data/jalons.json';
import type { Objet } from '../core/boutique';

const pierresEvolution = new Set(chargerEvolutions().pierre.map(ligne => ligne.pierre));

type Acces = { ouvert: boolean; raison: string | null };
type Description = { id: string; nom: string; description: string; image: string | null;
  categorie: 'balles' | 'soins' | 'equipement' };
export type AffichageBoutique = { acces: Acces; objets: (Description & {
  prix: number; stock: number; possede: boolean; unique: boolean; abordable: boolean;
})[] };
export type AffichageSac = { acces: Acces; entrees: (Description & {
  quantite: number; actif: boolean; utilisable: 'bonbon' | 'calcium' | 'pierre' | 'stase' | 'jeton' | 'direct' | null;
})[] };

const objets = chargerObjets();
const direct = [...Object.keys(reglages.objetsActifs.temporises), 'pokeDoll'];

export function afficherBoutique(region: DonneesRegion, precedent: AffichageBoutique | null): AffichageBoutique {
  const etat = etatMondeDe(region);
  const acces = accesShop(kanto, etat);
  const boutique = { acces: { ouvert: acces.ok, raison: acces.ok ? null : acces.raison ?? null },
    objets: objetsDuShop(objets, kanto, etat).map(objet => {
      const prix = prixObjet(objet, { badges: region.badges.length,
        palier: region.jalonsRecus.includes(reglages.boutique.palierRemise) });
      const possede = region.ameliorations.includes(objet.id);
      return { id: objet.id, nom: objet.nom, description: objet.description, image: objet.image,
        categorie: objet.categorie, prix, stock: objet.inventaire ? region.inventaire[objet.inventaire] ?? 0 : 0,
        possede, unique: objet.type === 'amelioration', abordable: !possede && region.argent >= prix };
    }) };
  return JSON.stringify(boutique) === JSON.stringify(precedent) ? precedent! : boutique;
}

export function afficherSac(region: DonneesRegion, precedent: AffichageSac | null): AffichageSac {
  const etat = etatMondeDe(region);
  const acces = accesSac(kanto, etat);
  const sac: AffichageSac = { acces: { ouvert: acces.ok, raison: acces.ok ? null : acces.raison ?? null },
    entrees: contenuSac(region, [...objets, ...donneesJalons.objetsRecompense as Objet[]], kanto, etat).map(objet => ({
      id: objet.id, nom: objet.nom, description: objet.description, image: objet.image, categorie: objet.categorie,
      quantite: objet.inventaire ? region.inventaire[objet.inventaire] ?? 0 : 1,
      actif: region.ameliorations.includes(objet.id),
      utilisable: objet.inventaire === 'bonbon' || objet.inventaire === 'calcium' ? objet.inventaire
        : objet.inventaire === 'everstone' ? 'stase' : objet.inventaire === 'shinyToken' ? 'jeton'
        : direct.includes(objet.inventaire ?? '') ? 'direct'
        : pierresEvolution.has(objet.inventaire ?? '') ? 'pierre' : null,
    })) };
  return JSON.stringify(sac) === JSON.stringify(precedent) ? precedent! : sac;
}
