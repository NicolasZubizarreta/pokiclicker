import { useEffect, useId, useMemo, useRef, useState, type CSSProperties } from 'react';
import { imageDesCredits, planCredits, tirerImageFlottante, type ImageFlottante } from '../core/credits';
import taillesImages from '../../public/img/tailles.json';
import './Credits.css';

const bouton = 'cadre min-h-11 min-w-11 bg-surface px-4 py-2';
const tailles: Record<string, { largeur: number; hauteur: number }> = taillesImages;

/**
 * Générique de fin (V1 : `startFinalCreditsSequence`) : écran noir, texte qui défile 110 s, images du jeu qui flottent
 * derrière, fondu de sortie de 1,3 s. En mouvement réduit, le défilement devient un affichage par pages.
 */
export function Credits({ fermerCredits, alea = Math.random }: {
  fermerCredits(): void;
  alea?: () => number;
}) {
  const [pages, lireParPages] = useState(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
  const [page, choisirPage] = useState(0);
  const [sortie, sortir] = useState(false);
  const plan = useMemo(() => planCredits(pages), [pages]);
  const dialogue = useRef<HTMLDialogElement>(null);
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

  // Fondu de sortie puis retour au jeu (un seul appel, quelle que soit la façon de sortir).
  useEffect(() => {
    if (!sortie) return;
    const fin = window.setTimeout(fermerCredits, pages ? 0 : plan.temps.fonduMs);
    return () => window.clearTimeout(fin);
  }, [sortie, pages, plan, fermerCredits]);

  useEffect(() => {
    if (pages || sortie) return;
    // Le texte entre par le bas de l'écran et sort par le haut, à vitesse constante.
    const animation = ruban.current?.animate?.([
      { transform: `translateY(${dialogue.current?.clientHeight ?? 0}px)` },
      { transform: `translateY(-${ruban.current.scrollHeight}px)` },
    ], { delay: plan.temps.delaiMs, duration: plan.temps.dureeMs, easing: 'linear', fill: 'both' });
    const fin = window.setTimeout(() => sortir(true), plan.temps.delaiMs + plan.temps.dureeMs + plan.temps.finMs);
    const actifs = new Map<HTMLElement, ImageFlottante>();
    const expirations = new Set<number>();
    const intervalle = window.setInterval(() => {
      const tirage = tirerImageFlottante([...actifs.values()], alea);
      const source = tirage && imageDesCredits(tirage.image);
      if (!tirage || !source || !flottants.current) return;
      const image = document.createElement('img');
      const taille = tailles[source];
      image.src = source;
      image.alt = '';
      if (taille) { image.width = taille.largeur; image.height = taille.hauteur; }
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
  }, [pages, sortie, plan, alea]);

  const sections = pages ? [plan.pages[page]!.section] : plan.sections;
  const style = { '--credits-fondu': `${plan.temps.fonduMs}ms` } as CSSProperties;
  return <dialog ref={dialogue} aria-labelledby={titre} aria-modal="true" data-region="kanto" data-theme="dark"
    className={`credits bg-fond text-texte font-texte text-base ${sortie ? 'credits-sortie' : ''}`}
    style={style}
    onCancel={event => { event.preventDefault(); sortir(true); }}>
    <div ref={flottants} aria-hidden="true" className="credits-couche" />
    <div ref={contenu} tabIndex={-1} className="credits-defilement break-words">
      <div ref={ruban} className="credits-ruban">
        <header className="grid gap-4 text-center">
          <h1 id={titre} className="font-titre text-2xl text-region-accent">{plan.titre}</h1>
          <p className="whitespace-pre-line">{plan.message}</p>
        </header>
        {pages && <p className="py-4 text-center">Page {page + 1} / {plan.pages.length}</p>}
        {sections.map(section => <section key={section.titre} className="grid gap-3 pt-8 text-center">
          <h2 className="font-titre text-xl text-region-accent">{section.titre}</h2>
          {section.lignes.map(ligne => <p key={ligne}>{ligne}</p>)}
        </section>)}
      </div>
    </div>
    <div className="credits-commandes flex flex-wrap justify-center gap-4">
      {pages ? <>
        <button className={bouton} disabled={page === 0} onClick={() => choisirPage(page - 1)}>Précédent</button>
        <button className={bouton} onClick={() => page === plan.pages.length - 1 ? sortir(true) : choisirPage(page + 1)}>{page === plan.pages.length - 1 ? 'Terminer' : 'Suivant'}</button>
      </> : <button className={bouton} onClick={() => lireParPages(true)}>Lire par pages</button>}
      <button className={bouton} onClick={() => sortir(true)}>Passer</button>
    </div>
  </dialog>;
}
