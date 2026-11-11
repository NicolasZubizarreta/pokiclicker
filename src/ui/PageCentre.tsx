import { useEffect, useId, useRef, useState } from 'react';
import { useStore } from 'zustand';
import { reglages } from '../core/reglages';
import { CarteKanto } from './CarteKanto';
import { IconeObjet } from './icones';
import { Image } from './Image';
import { storeJeu } from './store';
import { AccueilCasino } from './AccueilCasino';
import { useTelephone } from './useTelephone';
import './ShopPC.css';

export function PageCarte({ quandArrive }: { quandArrive: () => void }) {
  const telephone = useTelephone();
  const [ouvert, ouvrir] = useState<'centre' | 'casino' | null>(null);
  const dernier = useRef('centre');
  const conteneur = useRef<HTMLDivElement>(null);
  const visite = useRef(false);
  useEffect(() => {
    if (!visite.current) { visite.current = true; return; }
    if (ouvert) dernier.current = ouvert;
    // La fiche de zone est fermée au clic : au retour, le focus va sur la carte, sur la zone de départ si elle y est.
    const racine = conteneur.current;
    if (ouvert) racine?.querySelector<HTMLElement>('h1[tabindex]')?.focus();
    else (racine?.querySelector<HTMLElement>(`[data-${dernier.current}]`)
      ?? racine?.querySelector<HTMLElement>('[data-forme="Céladopole"][role="button"]')
      ?? racine?.querySelector<HTMLElement>('[data-zone][role="button"]'))?.focus();
  }, [ouvert]);
  return <div ref={conteneur} className={!telephone && ouvert === null ? 'carte-page-pc' : undefined}>
    <div hidden={ouvert !== null} className={!telephone && ouvert === null ? 'carte-page-contenu-pc' : undefined}>
      <CarteKanto quandArrive={quandArrive} quandCentre={() => ouvrir('centre')} quandCasino={() => ouvrir('casino')} />
    </div>
    {ouvert === 'centre' && <PageCentre retour={() => ouvrir(null)} />}
    {ouvert === 'casino' && <AccueilCasino retour={() => ouvrir(null)} />}
  </div>;
}

export function PageCentre({ retour }: { retour: () => void }) {
  const telephone = useTelephone();
  const centre = useStore(storeJeu, etat => etat.centre);
  const argent = useStore(storeJeu, etat => etat.argent);
  const acheter = useStore(storeJeu, etat => etat.acheter);
  const [selection, selectionner] = useState<string | null>(null);
  const [quantite, changerQuantite] = useState('1');
  const quantiteId = useId(), raisonId = useId(), choixId = useId();
  const objet = centre.objets.find(o => o.id === selection) ?? centre.objets[0];
  const nombre = Number(quantite);
  const valide = Number.isInteger(nombre) && nombre >= 1 && nombre <= reglages.boutique.quantiteMax;
  const raison = !valide ? `Choisis une quantité de 1 à ${reglages.boutique.quantiteMax}.`
    : objet && (!objet.abordable || objet.prix * nombre > argent) ? "Pas assez d'argent." : null;
  const bouton = 'min-h-11 min-w-11 p-2';

  return <section className={telephone ? 'relative isolate mx-auto max-w-screen-xl pb-24 text-base tabular-nums' : 'commercial-pc text-base tabular-nums'}>
    <div className={telephone ? 'pointer-events-none fixed inset-0 -z-10' : 'commercial-decor pointer-events-none'}>
      <Image genre="decor" src="img/decors/centre-commercial.webp" alt="" couvrir className="h-full w-full" />
    </div>
    <header className="cadre flex flex-wrap items-center justify-between gap-4 bg-surface p-4">
      <div className="grid gap-2">
        <p className="text-texte-doux">Kanto · Céladopole</p>
        <h1 tabIndex={-1} className="font-titre text-3xl font-semibold">Centre commercial</h1>
        <p>Objets exclusifs · {centre.objets.length} objets</p>
      </div>
      <div className="grid gap-2">
        <strong className="text-region-accent">{argent.toLocaleString('fr-FR')}{'\u00a0₽'}</strong>
        <button type="button" onClick={retour}
          className={telephone ? `${bouton} cadre fixed inset-x-4 bottom-20 z-10 bg-surface text-lien shadow-md md:static` : `${bouton} plaque`}>Retour à la carte</button>
      </div>
    </header>
    {!centre.acces.ouvert ? <p className="cadre mt-4 bg-surface p-4">{centre.acces.raison}</p> : objet &&
      <div className={telephone ? 'mt-4 grid items-start gap-4 lg:grid-cols-3' : 'commercial-contenu'}>
        <div role="group" aria-label="Choisis un objet" className={telephone ? 'grid grid-cols-2 gap-2 md:grid-cols-3 lg:col-span-2 lg:col-start-2' : 'commercial-grille'}>
          {centre.objets.map(o => <button type="button" key={o.id} data-objet={o.id} aria-pressed={o.id === objet.id}
            onClick={() => selectionner(o.id)}
            className={`${bouton} cadre grid content-start gap-2 text-left ${o.id === objet.id ? 'border-focus bg-selection' : 'bg-surface hover:bg-selection'}`}>
            <IconeObjet image={o.image} nom={o.nom} taille="petite" />
            <strong>{o.id === objet.id && '✓ '}{o.nom}</strong>
            <span className="text-region-accent">{o.prix.toLocaleString('fr-FR')}{'\u00a0₽'}</span>
            <span aria-label={`En sac : ${o.stock}`}>×{o.stock}</span>
          </button>)}
        </div>
        <section aria-labelledby={choixId} className={telephone ? 'cadre grid gap-2 bg-surface p-4 lg:sticky lg:top-8 lg:col-start-1 lg:row-start-1' : 'commercial-achat cadre grid gap-2 bg-surface p-4'}>
          <p className="text-texte-doux">Ton achat</p>
          <h2 id={choixId} className="font-titre text-xl font-semibold">{objet.nom}</h2>
          <p>{objet.description}</p>
          <div className="flex flex-wrap items-center gap-4">
            <label htmlFor={quantiteId}>Quantité</label>
            <input id={quantiteId} type="number" min={1} max={reglages.boutique.quantiteMax} step={1} value={quantite}
              onChange={event => changerQuantite(event.target.value)} className="cadre min-h-11 w-18 bg-surface-2 p-2" />
          </div>
          <button type="button" disabled={raison !== null} aria-describedby={raisonId}
            onClick={() => acheter(objet.id, nombre)}
            className={`${bouton} cadre bg-action text-action-texte shadow-sm hover:bg-action-survol disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-texte-doux disabled:shadow-none`}>
            {valide ? `Acheter ×${nombre} · ${(objet.prix * nombre).toLocaleString('fr-FR')}\u00a0₽` : 'Acheter'}
          </button>
          <p id={raisonId}>{raison ?? 'Les objets achetés rejoignent ton Sac.'}</p>
        </section>
      </div>}
  </section>;
}
