import { useState } from 'react';
import { useStore } from 'zustand';
import { CarteObjet } from './CarteObjet';
import { FiltreCategories } from './FiltreCategories';
import { storeJeu } from './store';
import { categorieShop, categoriesShop } from './categories-shop';
import { useTelephone } from './useTelephone';

export function PageShop() {
  const boutique = useStore(storeJeu, etat => etat.boutique);
  const argent = useStore(storeJeu, etat => etat.argent);
  const acheter = useStore(storeJeu, etat => etat.acheter);
  const [choix, choisir] = useState('balles');
  const telephone = useTelephone();
  const objets = boutique.objets.filter(objet => categorieShop(objet) === choix);
  return <section className="mx-auto grid max-w-screen-xl grid-cols-1 gap-4 text-base">
    <h1 tabIndex={-1} className="min-h-12 font-titre text-2xl font-semibold">Shop</h1>
    {!boutique.acces.ouvert ? <p className="text-texte-doux">{boutique.acces.raison}</p> : <>
      <p className="hidden text-region-accent lg:block">{argent.toLocaleString('fr-FR')}{' ₽'}</p>
      <FiltreCategories categories={categoriesShop} choix={choix} choisir={choisir} />
      {choix === 'objets' && <p className="text-texte-doux">Objets à acheter autant de fois que tu veux.</p>}
      {choix === 'accessoires' && <p className="text-texte-doux">Objets uniques : un seul achat, un bonus pour toujours.</p>}
      {objets.length === 0 ? <p className="text-texte-doux">Rien à vendre ici pour l'instant.</p> :
        <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-3">
          {objets.map(objet =>
            <CarteObjet key={objet.id} {...objet} compact={telephone} argent={argent} acheter={quantite => acheter(objet.id, quantite)} />)}
        </div>}
    </>}
  </section>;
}
