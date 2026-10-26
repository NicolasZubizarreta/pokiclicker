import { useEffect, useId, useRef, useState } from 'react';
import { useStore } from 'zustand';
import { reglages } from '../core/reglages';
import { CarteKanto } from './CarteKanto';
import { IconeObjet } from './icones';
import { Image } from './Image';
import { storeJeu } from './store';

export function PageCarte({ quandArrive }: { quandArrive: () => void }) {
  const [ouvert, ouvrir] = useState<'centre' | null>(null);
  const annonce = useStore(storeJeu, etat => etat.annonce);
  const conteneur = useRef<HTMLDivElement>(null);
  const visite = useRef(false);
  useEffect(() => {
    if (!visite.current) { visite.current = true; return; }
    conteneur.current?.querySelector<HTMLElement>(ouvert ? 'h1[tabindex]' : '[data-centre]')?.focus();
  }, [ouvert]);
  return <div ref={conteneur}>
    <div hidden={ouvert !== null}>
      {annonce !== null && <div aria-live="polite" className="cadre bg-surface p-2 text-center">{annonce}</div>}
      <CarteKanto quandArrive={quandArrive} quandCentre={() => ouvrir('centre')} />
    </div>
    {ouvert === 'centre' && <PageCentre retour={() => ouvrir(null)} />}
  </div>;
}

export function PageCentre({ retour }: { retour: () => void }) {
  const centre = useStore(storeJeu, etat => etat.centre);
  const argent = useStore(storeJeu, etat => etat.argent);
  const annonce = useStore(storeJeu, etat => etat.annonce);
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

  return <section className="relative isolate mx-auto max-w-screen-xl pb-24 text-base tabular-nums">
    <div className="pointer-events-none fixed inset-0 -z-10">
      <Image genre="decor" src="img/decors/centre-commercial.webp" alt="" couvrir className="h-full w-full" />
    </div>
    <header className="cadre flex flex-wrap items-center justify-between gap-4 bg-surface p-4">
      <div className="grid gap-2">
        <p className="text-texte-doux">Kanto · Céladopole</p>
        <h1 tabIndex={-1} className="font-titre text-3xl font-semibold">Centre commercial</h1>
        <p>Objets exclusifs · {centre.objets.length} objets</p>
      </div>
      <div className="grid gap-2">
        <strong className="text-region-accent">{argent.toLocaleString('fr-FR')} pièces</strong>
        <button type="button" onClick={retour}
          className={`${bouton} cadre fixed inset-x-4 bottom-20 z-10 bg-surface text-lien shadow-md md:static`}>Retour à la carte</button>
      </div>
    </header>
    {!centre.acces.ouvert ? <p className="cadre mt-4 bg-surface p-4">{centre.acces.raison}</p> : objet &&
      <div className="mt-4 grid items-start gap-4 lg:grid-cols-3">
        <div role="group" aria-label="Choisis un objet" className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:col-span-2 lg:col-start-2">
          {centre.objets.map(o => <button type="button" key={o.id} data-objet={o.id} aria-pressed={o.id === objet.id}
            onClick={() => selectionner(o.id)}
            className={`${bouton} cadre grid content-start gap-2 text-left ${o.id === objet.id ? 'border-focus bg-selection' : 'bg-surface hover:bg-selection'}`}>
            <IconeObjet image={o.image} nom={o.nom} taille="petite" />
            <strong>{o.id === objet.id && '✓ '}{o.nom}</strong>
            <span className="text-region-accent">{o.prix.toLocaleString('fr-FR')} pièces</span>
            <span aria-label={`En sac : ${o.stock}`}>×{o.stock}</span>
          </button>)}
        </div>
        <section aria-labelledby={choixId} className="cadre grid gap-2 bg-surface p-4 lg:sticky lg:top-8 lg:col-start-1 lg:row-start-1">
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
            {valide ? `Acheter ×${nombre} · ${(objet.prix * nombre).toLocaleString('fr-FR')} pièces` : 'Acheter'}
          </button>
          <p id={raisonId}>{raison ?? 'Les objets achetés rejoignent ton Sac.'}</p>
          <p role="status" className="min-h-12">{annonce}</p>
        </section>
      </div>}
  </section>;
}
