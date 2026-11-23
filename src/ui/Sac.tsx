import { useState } from 'react';
import { useStore } from 'zustand';
import { chargerObjetsCles } from '../core/evenements';
import { FiltreCategories } from './FiltreCategories';
import { Diplome } from './Diplome';
import { plafondQuantite } from '../core/quantite';
import { IconeObjet } from './icones';
import { notifier } from './pileNotifications';
import { CommandesQuantite } from './SelecteurQuantite';
import type { AffichageSac } from './store-boutique';
import { storeJeu } from './store';

const catalogueObjetsCles = chargerObjetsCles();

const categories = [{ cle: 'tout', nom: 'Tout' }, { cle: 'balles', nom: 'Balles' },
  { cle: 'soins', nom: 'Soins' }, { cle: 'equipement', nom: 'Équipement' }];

export function Sac({ sac, utiliser, annoncer: annoncerObjet }: {
  sac: AffichageSac;
  utiliser(entree: AffichageSac['entrees'][number], declencheur: HTMLButtonElement): void;
  /** Où afficher le message d'une utilisation en série (par défaut : notification). */
  annoncer?(message: string | null): void;
}) {
  const [categorie, filtrer] = useState('tout');
  const diplome = useStore(storeJeu, etat => etat.fin.diplome);
  const [diplomeOuvert, ouvrirDiplome] = useState(false);
  const objetsCles = useStore(storeJeu, etat => etat.objetsCles);
  const utiliserObjetCle = useStore(storeJeu, etat => etat.utiliserObjetCle);
  const utiliserObjetActif = useStore(storeJeu, etat => etat.utiliserObjetActif);
  const [message, annoncer] = useState<string | null>(null);
  const [ouvert, ouvrir] = useState<string | null>(null);
  const [quantite, changerQuantite] = useState(1);
  if (!sac.acces.ouvert) return <p className="text-texte-doux">{sac.acces.raison}</p>;
  const visibles = sac.entrees.filter(entree => categorie === 'tout' || entree.categorie === categorie);
  // Onglet « Tout » : les objets permanents déjà en service passent en tête.
  const actifs = categorie === 'tout' ? visibles.filter(entree => entree.actif && entree.quantite > 0) : [];
  const autres = visibles.filter(entree => !actifs.includes(entree));
  const ligne = (entree: AffichageSac['entrees'][number]) => {
    const empilable = entree.utilisable === 'direct' && entree.id !== 'pokeDoll';
    const deplie = empilable && ouvert === entree.id && entree.quantite > 0;
    return <li key={entree.id} className={deplie ? 'col-span-2 min-w-0' : 'min-w-0'}>
      <button type="button" aria-label={`${entree.nom} ×${entree.quantite}`} title={entree.description}
        disabled={entree.utilisable === null || entree.quantite <= 0}
        aria-expanded={empilable ? deplie : undefined}
        className={`cadre flex min-h-11 w-full items-center gap-2 bg-surface-2 p-1 text-left enabled:hover:bg-selection ${entree.quantite <= 0 ? 'opacity-50' : ''}`}
        onClick={event => {
          if (!empilable) { utiliser(entree, event.currentTarget); return; }
          changerQuantite(1);
          ouvrir(deplie ? null : entree.id);
        }}>
        <IconeObjet image={entree.image} nom={entree.nom} taille="petite" />
        <span className="min-w-0">
          <span className="block truncate text-xs text-texte-doux">{entree.nom}</span>
          <span className="line-clamp-2 text-xs font-normal text-texte-doux">{entree.description}</span>
          <span className="flex items-center gap-1 whitespace-nowrap text-sm font-bold">
            ×{entree.quantite}
            {entree.utilisable !== null && entree.quantite > 0 && <span className="text-xs text-region-accent">UTILISER</span>}
            {entree.actif && <span className="text-xs text-succes-base">ACTIF</span>}
          </span>
        </span>
      </button>
      {deplie && <div className="cadre mt-1 bg-surface-2 p-2">
        <CommandesQuantite nom={entree.nom} valeur={Math.min(quantite, plafondQuantite(entree.quantite))} max={entree.quantite} changer={changerQuantite}
          utiliser={() => {
            const n = Math.min(quantite, plafondQuantite(entree.quantite));
            const stock = () => storeJeu.getState().sac.entrees.find(e => e.id === entree.id)?.quantite ?? 0;
            let dernier: string | null = null;
            for (let i = 0; i < n; i++) {
              const avant = stock();
              dernier = utiliserObjetActif(entree.id);
              if (stock() >= avant) break;
            }
            (annoncerObjet ?? notifier)(dernier);
            changerQuantite(1);
            if (stock() <= 0) ouvrir(null);
          }} annuler={() => ouvrir(null)} />
      </div>}
      {entree.id === 'diploma' && entree.quantite > 0 && diplome && <button type="button"
        className="min-h-11 w-full bg-surface-2 px-4 py-2 text-region-accent hover:bg-selection"
        onClick={() => ouvrirDiplome(true)}>Voir</button>}
    </li>;
  };
  return <section aria-label="Sac" className="cadre min-w-0 space-y-2 bg-surface p-2 text-base">
    <h2 className="font-titre text-xl font-semibold">Ton Sac</h2>
    <FiltreCategories categories={categories} choix={categorie} choisir={filtrer} />
    {actifs.length > 0 && <>
      <h3 className="font-titre text-xl font-semibold">Actifs</h3>
      <ul role="list" aria-label="Objets actifs du Sac" className="grid grid-cols-2 gap-2">{actifs.map(ligne)}</ul>
      <h3 className="font-titre text-xl font-semibold">Autres objets</h3>
    </>}
    <ul role="list" aria-label="Objets du Sac" className="grid grid-cols-2 gap-2">{autres.map(ligne)}</ul>
    {objetsCles.length > 0 && <section aria-label="Objets clés" className="space-y-2">
      <h3 className="font-titre text-xl font-semibold">Objets clés</h3>
      <ul role="list" aria-label="Objets clés du Sac" className="grid grid-cols-2 gap-2">
        {catalogueObjetsCles.filter(objet => objetsCles.includes(objet.id)).map(objet =>
          <li key={objet.id} className="cadre flex min-w-0 flex-wrap items-center gap-2 bg-surface-2 p-2">
            <IconeObjet image={null} nom={objet.nom} taille="petite" />
            <span className="min-w-0 text-sm">{objet.nom}</span>
            {objet.id === 'pokeflute' && <p className="text-sm text-texte-doux">À utiliser devant Ronflex</p>}
            <button type="button" aria-label={`Utiliser ${objet.nom}`} title={objet.description}
              className="cadre min-h-11 min-w-11 bg-surface p-2 hover:bg-selection"
              onClick={() => annoncer(utiliserObjetCle(objet.id))}>Utiliser</button>
          </li>)}
      </ul>
      <p role="status">{message ?? ''}</p>
    </section>}
    {diplomeOuvert && diplome && <Diplome diplome={diplome} fermer={() => ouvrirDiplome(false)} />}
  </section>;
}
