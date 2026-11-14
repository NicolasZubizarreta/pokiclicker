import { useEffect, useId, useRef, useState } from 'react';
import { useStore } from 'zustand';
import { reglages } from '../core/reglages';
import { CarteKanto } from './CarteKanto';
import { IconeObjet } from './icones';
import { Image } from './Image';
import { storeJeu } from './store';
import { AccueilCasino } from './AccueilCasino';
import { PagePension } from './PagePension';
import { useTelephone } from './useTelephone';
import { useTuto } from './tuto/store-tuto';
import './ShopPC.css';

export function PageCarte({ quandArrive }: { quandArrive: () => void }) {
  const telephone = useTelephone();
  const [ouvert, ouvrir] = useState<'centre' | 'casino' | 'pension' | null>(null);
  const dernier = useRef('centre');
  const conteneur = useRef<HTMLDivElement>(null);
  const visite = useRef(false);
  const tuto = useTuto();
  // Le rejeu du mini-tuto du Centre commercial depuis le Guide ouvre le Centre : sa cible n'est pas sur la carte.
  const rejoueCentre = tuto?.id === 'centre-commercial' && tuto.rejeu;
  const [rejeuOuvert, noterRejeu] = useState(false);
  if (rejoueCentre !== rejeuOuvert) { noterRejeu(rejoueCentre); if (rejoueCentre) ouvrir('centre'); }
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
      <CarteKanto quandArrive={quandArrive} quandCentre={() => ouvrir('centre')} quandCasino={() => ouvrir('casino')} quandPension={() => ouvrir('pension')} />
    </div>
    {ouvert === 'centre' && <PageCentre retour={() => ouvrir(null)} />}
    {ouvert === 'pension' && <PagePension retour={() => ouvrir(null)} libelleRetour="Retour à la carte" />}
    {ouvert === 'casino' && <AccueilCasino retour={() => ouvrir(null)} />}
  </div>;
}

export function PageCentre({ retour }: { retour: () => void }) {
  const telephone = useTelephone();
  const centre = useStore(storeJeu, etat => etat.centre);
  const argent = useStore(storeJeu, etat => etat.argent);
  const acheter = useStore(storeJeu, etat => etat.acheter);
  const [selection, selectionner] = useState<string | null>(null);
  const [nombre, changerQuantite] = useState(1);
  const raisonId = useId(), choixId = useId();
  const objet = centre.objets.find(o => o.id === selection) ?? centre.objets[0];
  const raison = objet && (!objet.abordable || objet.prix * nombre > argent) ? "Pas assez d'argent." : null;
  const bouton = 'min-h-11 min-w-11 p-2';
  // Éléments posés sur le décor : fond à 80 % d'opacité pour qu'on le voie derrière.
  const voile = 'bg-surface/80';

  return <section className={telephone ? 'relative isolate mx-auto max-w-screen-xl pb-24 text-base tabular-nums' : 'commercial-pc text-base tabular-nums'}>
    <div className={telephone ? 'pointer-events-none fixed inset-0 -z-10' : 'commercial-decor pointer-events-none'}>
      <Image genre="decor" src="img/decors/centre-commercial.webp" alt="" couvrir className="h-full w-full" />
    </div>
    <header className={`cadre flex flex-wrap items-center justify-between gap-4 ${voile} p-4`}>
      <div className="grid gap-2">
        <p className="text-texte-doux">Kanto · Céladopole</p>
        <h1 data-tuto="page-centre" tabIndex={-1} className="font-titre text-3xl font-semibold">Centre commercial</h1>
        <p>Objets exclusifs · {centre.objets.length} objets</p>
      </div>
      <div className="grid gap-2">
        <strong className="text-region-accent">{argent.toLocaleString('fr-FR')}{'\u00a0₽'}</strong>
        <button type="button" onClick={retour}
          className={telephone ? `${bouton} cadre fixed inset-x-4 bottom-20 z-10 bg-surface text-lien shadow-md md:static` : `${bouton} plaque`}>Retour à la carte</button>
      </div>
    </header>
    {!centre.acces.ouvert ? <p className={`cadre mt-4 ${voile} p-4`}>{centre.acces.raison}</p> : objet &&
      <div className={telephone ? 'mt-4 grid items-start gap-4 lg:grid-cols-3' : 'commercial-contenu'}>
        <div role="group" aria-label="Choisis un objet" className={telephone ? 'grid grid-cols-2 gap-2 md:grid-cols-3 lg:col-span-2 lg:col-start-2' : 'commercial-grille'}>
          {centre.objets.map(o => <button type="button" key={o.id} data-objet={o.id} aria-pressed={o.id === objet.id}
            onClick={() => selectionner(o.id)}
            className={`${bouton} cadre grid content-start gap-2 text-left ${o.id === objet.id ? 'border-focus bg-selection/80' : `${voile} hover:bg-selection/80`}`}>
            <IconeObjet image={o.image} nom={o.nom} taille="petite" />
            <strong>{o.id === objet.id && '✓ '}{o.nom}</strong>
            <span className="text-region-accent">{o.prix.toLocaleString('fr-FR')}{'\u00a0₽'}</span>
            <span aria-label={`En sac : ${o.stock}`}>×{o.stock}</span>
          </button>)}
        </div>
        <section aria-labelledby={choixId} className={telephone ? `cadre grid gap-2 ${voile} p-4 lg:sticky lg:top-8 lg:col-start-1 lg:row-start-1` : `commercial-achat cadre grid gap-2 ${voile} p-4`}>
          <p className="text-texte-doux">Ton achat</p>
          <h2 id={choixId} className="font-titre text-xl font-semibold">{objet.nom}</h2>
          <p>{objet.description}</p>
          <div role="group" aria-label={`Quantité de ${objet.nom}`} className="flex flex-wrap items-center gap-3">
            <button type="button" aria-label="Moins" className={`${bouton} cadre bg-surface`} disabled={nombre <= 1}
              onClick={() => changerQuantite(q => Math.max(1, q - 1))}>−</button>
            <output aria-label="Quantité">{nombre}</output>
            <button type="button" aria-label="Plus" className={`${bouton} cadre bg-surface`} disabled={nombre >= reglages.boutique.quantiteMax}
              onClick={() => changerQuantite(q => Math.min(reglages.boutique.quantiteMax, q + 1))}>+</button>
            <output aria-label="Total" className="text-region-accent">= {(objet.prix * nombre).toLocaleString('fr-FR')}{' ₽'}</output>
          </div>
          <button type="button" disabled={raison !== null} aria-describedby={raisonId}
            onClick={() => acheter(objet.id, nombre)}
            className={`${bouton} cadre bg-action text-action-texte shadow-sm hover:bg-action-survol disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-texte-doux disabled:shadow-none`}>
            Acheter ×{nombre}
          </button>
          <p id={raisonId}>{raison ?? 'Les objets achetés rejoignent ton Sac.'}</p>
        </section>
      </div>}
  </section>;
}
