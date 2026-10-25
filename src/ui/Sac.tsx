import { useState } from 'react';
import { FiltreCategories } from './FiltreCategories';
import { IconeObjet } from './icones';
import type { AffichageSac } from './store-boutique';

const categories = [{ cle: 'tout', nom: 'Tout' }, { cle: 'balles', nom: 'Balles' },
  { cle: 'soins', nom: 'Soins' }, { cle: 'equipement', nom: 'Équipement' }];

export function Sac({ sac, utiliser }: {
  sac: AffichageSac;
  utiliser(entree: AffichageSac['entrees'][number]): void;
}) {
  const [categorie, filtrer] = useState('tout');
  const [choisi, choisir] = useState<string | null>(null);
  const detail = sac.entrees.find(entree => entree.id === choisi);
  if (!sac.acces.ouvert) return <p className="text-texte-doux">{sac.acces.raison}</p>;
  return <section aria-label="Sac" className="cadre min-w-0 space-y-4 bg-surface p-4 text-base">
    <h2 className="font-titre text-xl font-semibold">Ton Sac</h2>
    <FiltreCategories categories={categories} choix={categorie} choisir={filtrer} />
    <ul aria-label="Objets du Sac" className="flex flex-wrap gap-4">
      {sac.entrees.filter(entree => categorie === 'tout' || entree.categorie === categorie).map(entree =>
        <li key={entree.id} className="w-16">
          <button type="button" aria-label={`${entree.nom} ×${entree.quantite}`} aria-pressed={choisi === entree.id}
            className="cadre relative grid size-16 place-items-center bg-surface-2 aria-pressed:bg-selection"
            onClick={() => choisir(entree.id)}>
            <IconeObjet image={entree.image} nom={entree.nom} />
            <span className="absolute bottom-0 right-0 bg-surface px-1">×{entree.quantite}</span>
          </button>
          {entree.actif && <span className="block text-center text-succes-base">Actif</span>}
        </li>)}
    </ul>
    {detail && <div className="space-y-2 bg-surface-2 p-4">
      <h3 className="font-semibold">{detail.nom}</h3>
      <p>{detail.description}</p>
      {detail.utilisable && <button type="button" className="cadre min-h-11 bg-surface px-4 py-2"
        disabled={detail.quantite <= 0} onClick={() => utiliser(detail)}>Utiliser</button>}
    </div>}
  </section>;
}
