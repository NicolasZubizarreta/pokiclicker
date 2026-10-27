import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { planCredits, tirerImageFlottante, type ImageFlottante } from '../core/credits';
import { cheminDecor, cheminSprite } from './precharger';
import { imageConnue } from './Image';
import './Credits.css';

const bouton = 'cadre min-h-11 min-w-11 bg-surface px-4 py-2';
const decorLabo = cheminDecor({ decor: 'kanto/labo.webp' });
// Le laboratoire est actuellement livré parmi les scènes de l’introduction.
const laboratoire = imageConnue(decorLabo) ? decorLabo : 'img/scenes/labo.webp';

export function Credits({ fermerCredits, alea = Math.random }: {
  fermerCredits(): void;
  alea?: () => number;
}) {
  const [pages, lireParPages] = useState(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
  const [page, choisirPage] = useState(0);
  const [fini, terminer] = useState(false);
  const plan = useMemo(() => planCredits(pages), [pages]);
  const dialogue = useRef<HTMLDialogElement>(null);
  const lecture = useRef<HTMLDivElement>(null);
  const ruban = useRef<HTMLDivElement>(null);
  const flottants = useRef<HTMLDivElement>(null);
  const contenu = useRef<HTMLDivElement>(null);
  const titre = useId();

  useEffect(() => {
    const avant = document.activeElement;
    const fenetre = dialogue.current!;
    fenetre.showModal();
    contenu.current?.focus();
    return () => {
      fenetre.close();
      if (avant instanceof HTMLElement && avant.isConnected) avant.focus();
    };
  }, []);

  useEffect(() => {
    const preference = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const changer = () => { if (preference?.matches) lireParPages(true); };
    preference?.addEventListener('change', changer);
    return () => preference?.removeEventListener('change', changer);
  }, []);

  useEffect(() => { contenu.current?.focus(); }, [page, pages, fini]);

  useEffect(() => {
    if (pages || fini) return;
    const animation = ruban.current?.animate?.([
      { transform: 'translateY(0)' },
      { transform: `translateY(-${ruban.current.scrollHeight}px)` },
    ], { delay: plan.temps.delaiMs, duration: plan.temps.dureeMs, fill: 'forwards' });
    const fin = window.setTimeout(() => terminer(true), plan.temps.delaiMs + plan.temps.dureeMs + plan.temps.finMs);
    const actifs = new Map<HTMLElement, ImageFlottante>();
    const expirations = new Set<number>();
    const intervalle = window.setInterval(() => {
      const tirage = tirerImageFlottante([...actifs.values()], alea);
      if (!tirage || !flottants.current) return;
      const image = document.createElement('img');
      // Les chemins V1 du tirage sont remplacés par les starters disponibles en V2.
      image.src = cheminSprite([1, 4, 7][Math.floor(alea() * 3)]!);
      image.alt = '';
      image.width = 96;
      image.height = 96;
      image.className = 'credits-flottant image-rendering-pixelated';
      image.style.left = `${tirage.x}%`;
      image.style.top = `${tirage.y}%`;
      image.style.width = `${tirage.w}%`;
      image.style.setProperty('--credits-vie', `${tirage.vieMs}ms`);
      image.style.setProperty('--credits-opacite', String(tirage.opacite));
      flottants.current.append(image);
      actifs.set(image, tirage);
      const expiration = window.setTimeout(() => {
        image.remove();
        actifs.delete(image);
        expirations.delete(expiration);
      }, tirage.vieMs);
      expirations.add(expiration);
    }, plan.imagesFlottantes!.intervalleMs);
    return () => {
      animation?.cancel();
      window.clearTimeout(fin);
      window.clearInterval(intervalle);
      expirations.forEach(id => window.clearTimeout(id));
      actifs.forEach((_, image) => image.remove());
    };
  }, [pages, fini, plan, alea]);

  const sections = pages ? [plan.pages[page]!.section] : plan.sections;
  return <dialog ref={dialogue} aria-labelledby={titre} aria-modal="true" data-region="kanto" data-theme="dark"
    className="credits bg-fond text-texte font-texte text-base"
    onCancel={event => { event.preventDefault(); fermerCredits(); }}>
    <img src={laboratoire} alt="" width={imageConnue(decorLabo) ? 1920 : 1080} height={1080}
      className="pointer-events-none absolute inset-0 size-full object-cover opacity-20" />
    <div ref={flottants} aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden" />
    <div className="relative flex h-full min-w-0 flex-col gap-4 p-4 lg:p-8">
      <div ref={contenu} tabIndex={-1} className="min-h-0 flex-1 overflow-y-auto break-words">
        {fini ? <section className="cadre mx-auto grid max-w-3xl gap-4 bg-fond p-6">
          <h1 id={titre} className="font-titre text-2xl">Retour à Kanto</h1>
          <p>Ta sauvegarde est à jour. Tu peux continuer ton aventure.</p>
          <button className={`${bouton} bg-action text-action-texte`} onClick={fermerCredits}>Retour à Kanto</button>
        </section> : <div className="credits-contenu mx-auto h-full max-w-5xl gap-8 lg:grid lg:grid-cols-2">
          <header className="grid content-center gap-4 text-center">
            <h1 id={titre} className="font-titre text-2xl text-region-accent">{plan.titre}</h1>
            <p className="whitespace-pre-line">{plan.message}</p>
          </header>
          <div ref={lecture} className={pages ? 'cadre bg-fond p-4' : 'credits-lecture bg-fond/80 p-4'}>
            {pages && <p>Page {page + 1} / {plan.pages.length}</p>}
            <div ref={ruban}>
              {sections.map(section => <section key={section.titre} className="grid gap-4 py-6 text-center">
                <h2 className="font-titre text-xl text-region-accent">{section.titre}</h2>
                {section.lignes.map(ligne => <p key={ligne}>{ligne}</p>)}
              </section>)}
            </div>
          </div>
        </div>}
      </div>
      <div className="flex shrink-0 flex-wrap justify-center gap-4">
        {!fini && (pages ? <>
          <button className={bouton} disabled={page === 0} onClick={() => choisirPage(page - 1)}>Précédent</button>
          <button className={bouton} onClick={() => page === plan.pages.length - 1 ? terminer(true) : choisirPage(page + 1)}>{page === plan.pages.length - 1 ? 'Terminer' : 'Suivant'}</button>
        </> : <button className={bouton} onClick={() => lireParPages(true)}>Lire par pages</button>)}
        <button className={bouton} onClick={fermerCredits}>{fini ? 'Fermer' : 'Passer'}</button>
      </div>
    </div>
  </dialog>;
}
