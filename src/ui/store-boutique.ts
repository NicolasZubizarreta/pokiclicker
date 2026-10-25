import { accesCentre, accesSac, accesShop, chargerObjets, contenuSac, objetsDuCentre, objetsDuShop, prixObjet } from '../core/boutique';
import { kanto } from '../core/regions';
import { reglages } from '../core/reglages';
import { etatMondeDe } from '../core/sauvegarde';
import type { DonneesRegion } from '../core/sauvegarde';
import { chargerEvolutions } from '../core/evolution';
import { chargerObjetsRecompense } from '../core/progression';

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
  return afficherCatalogue(region, precedent, accesShop(kanto, etat), objetsDuShop(objets, kanto, etat));
}

export function afficherCentre(region: DonneesRegion, precedent: AffichageBoutique | null): AffichageBoutique {
  const etat = etatMondeDe(region);
  return afficherCatalogue(region, precedent, accesCentre(kanto, etat), objetsDuCentre(objets, kanto, etat));
}

function afficherCatalogue(region: DonneesRegion, precedent: AffichageBoutique | null,
  acces: ReturnType<typeof accesShop>, catalogue: ReturnType<typeof chargerObjets>): AffichageBoutique {
  const boutique = { acces: { ouvert: acces.ok, raison: acces.ok ? null : acces.raison ?? null },
    objets: catalogue.map(objet => {
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
  const acces = region.drapeaux.includes('sac-ouvert') ? { ok: true }
    : region.evenementEnCours?.id === 'kanto.intro' ? { ok: false, raison: reglages.sac.raison }
      : accesSac(kanto, etat);
  const sac: AffichageSac = { acces: { ouvert: acces.ok, raison: acces.ok ? null : acces.raison ?? null },
    entrees: contenuSac(region, [...objets, ...chargerObjetsRecompense()], kanto, etat).map(objet => ({
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
