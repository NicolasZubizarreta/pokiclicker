import { useState } from 'react';
import { useStore } from 'zustand';
import { CarteObjet } from './CarteObjet';
import { FiltreCategories } from './FiltreCategories';
import { storeJeu } from './store';

const categories = [
  { cle: 'tout', nom: 'Tout' },
  { cle: 'balles', nom: 'Balles' },
  { cle: 'soins', nom: 'Soins' },
  { cle: 'equipement', nom: 'Équipement' },
];

export function PageShop() {
  const boutique = useStore(storeJeu, etat => etat.boutique);
  const argent = useStore(storeJeu, etat => etat.argent);
  const acheter = useStore(storeJeu, etat => etat.acheter);
  const [choix, choisir] = useState('tout');

  return <section className="mx-auto grid max-w-screen-xl gap-4 text-base">
    <h1 tabIndex={-1} className="font-titre text-2xl font-semibold">Shop</h1>
    {!boutique.acces.ouvert ? <p className="text-texte-doux">{boutique.acces.raison}</p> : <>
      <p className="text-region-accent">{argent.toLocaleString('fr-FR')} pièces</p>
      <FiltreCategories categories={categories} choix={choix} choisir={choisir} />
      {categories.slice(1).filter(c => (choix === 'tout' || choix === c.cle) && boutique.objets.some(objet => objet.categorie === c.cle)).map(categorie =>
        <section key={categorie.cle} className="grid gap-4">
          <h2 className="font-titre text-xl font-semibold">{categorie.nom}</h2>
          <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 lg:grid-cols-3">
            {boutique.objets.filter(objet => objet.categorie === categorie.cle).map(objet =>
              <CarteObjet key={objet.id} {...objet} argent={argent} acheter={quantite => acheter(objet.id, quantite)} />)}
          </div>
        </section>)}
    </>}
  </section>;
}
