import { useState } from 'react';
import { useStore } from 'zustand';
import { CarteObjet } from './CarteObjet';
import { FiltreCategories } from './FiltreCategories';
import { storeJeu } from './store';
import { categorieShop, categoriesShop } from './categories-shop';
import { useTelephone } from './useTelephone';
import './ShopPC.css';

export function PageShop() {
  const boutique = useStore(storeJeu, etat => etat.boutique);
  const argent = useStore(storeJeu, etat => etat.argent);
  const acheter = useStore(storeJeu, etat => etat.acheter);
  const [choix, choisir] = useState('tout');
  const telephone = useTelephone();
  const rayons = [{ cle: 'tout', nom: 'Tout' }, ...categoriesShop];
  const objets = boutique.objets.filter(objet => choix === 'tout' || categorieShop(objet) === choix);
  const carte = (objet: (typeof objets)[number]) =>
    <CarteObjet key={objet.id} {...objet} compact={telephone} argent={argent} acheter={quantite => acheter(objet.id, quantite)} />;
  return <section className={`${telephone ? '' : 'shop-pc '}mx-auto grid max-w-screen-xl grid-cols-1 gap-4 text-base`}>
    <h1 tabIndex={-1} className="min-h-12 font-titre text-2xl font-semibold">Shop</h1>
    {!boutique.acces.ouvert ? <p className="text-texte-doux">{boutique.acces.raison}</p> : <>
      <p className="hidden text-region-accent lg:block">{!telephone && 'Tu as '}{argent.toLocaleString('fr-FR')}{' ₽'}</p>
      <FiltreCategories categories={rayons} choix={choix} choisir={choisir} onglets={!telephone} />
      {choix === 'objets' && <p className="text-texte-doux">Objets à acheter autant de fois que tu veux.</p>}
      {choix === 'accessoires' && <p className="text-texte-doux">Objets uniques : un seul achat, un bonus pour toujours.</p>}
      {objets.length === 0 ? <p className="text-texte-doux">Rien à vendre ici pour l'instant.</p> :
        <div role={telephone ? undefined : 'tabpanel'} aria-label={telephone ? undefined : rayons.find(c => c.cle === choix)?.nom}
          className={`${telephone ? '' : 'produits cadre '}grid grid-cols-1 items-stretch gap-4`}>
          {choix === 'tout'
            ? categoriesShop.flatMap(({ cle, nom }) => {
              const duRayon = objets.filter(objet => categorieShop(objet) === cle);
              return duRayon.length === 0 ? [] : [<h2 key={`rayon-${cle}`} className="separateur-rayon">{nom}</h2>, ...duRayon.map(carte)];
            })
            : objets.map(carte)}
        </div>}
    </>}
  </section>;
}
