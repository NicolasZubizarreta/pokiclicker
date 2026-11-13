import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { tutoriel, tutoriels } from '../../core/tutoriels';
import type { Page } from '../Navigation';
import { armementTutoAutorise, storeJeu } from '../store';
import { storeSac } from '../sacContexte';
import { ciblesVisibles, obstaclesVisibles, trouverCible, zoneUtile } from './cibles';
import { placerTuto, type Rect } from './placement';
import { etapeSuivanteTuto, fermerTuto, lancerTuto, storeTuto, useTuto } from './store-tuto';
import './tuto.css';

const modaleOuverte = () => Array.from(document.querySelectorAll('dialog[open], [role="dialog"], [aria-modal="true"]')).some(e => !e.closest('.tuto-couche'));
function poser(element: HTMLElement, r: Rect) {
  Object.assign(element.style, { left: `${r.x}px`, top: `${r.y}px`, width: `${r.w}px` });
}
/** Le bouton cliqué disparaît avec la carte : le focus revient au contenu de la page. */
const rendreLeFocus = () => queueMicrotask(() => document.getElementById('contenu')?.focus({ preventScroll: true }));

export function Tutoriel({ page, aller }: { page: Page; aller(page: Page): void }) {
  const actif = useTuto();
  const carte = useRef<HTMLDivElement>(null), repere = useRef<HTMLDivElement>(null), voile = useRef<HTMLDivElement>(null);
  const couche = useRef<HTMLDivElement>(null);
  const rejeu = useRef<object | null>(null);
  const [annonce, annoncer] = useState('');
  const [cibleInactive, fixerInactive] = useState(false);
  const tuto = actif ? tutoriel(actif.id) : null;
  const etape = tuto && actif ? tuto.etapes[actif.etape] : null;
  // Région live permanente : montée une fois, elle reçoit le texte de chaque étape puis se vide au bout de 6 s.
  useEffect(() => {
    if (!annonce) return;
    const minuterie = setTimeout(() => annoncer(''), 6000);
    return () => clearTimeout(minuterie);
  }, [annonce]);
  const [etapeDite, noterEtape] = useState('');
  const cleEtape = actif ? `${actif.id}:${actif.etape}` : '';
  if (cleEtape !== etapeDite) {
    noterEtape(cleEtape);
    if (tuto && etape && actif) annoncer(`${tuto.titre}, étape ${actif.etape + 1} sur ${tuto.etapes.length} : ${etape.texte}${etape.geste ? ` À faire : ${etape.geste}` : ''}`);
  }
  const avancer = () => { if (actif && etapeSuivanteTuto()) { storeJeu.getState().marquerTutoVu(actif.id); rendreLeFocus(); } };

  useEffect(() => {
    if (actif?.rejeu && (rejeu.current as { id?: string } | null)?.id !== actif.id) {
      rejeu.current = actif;
      aller(tutoriel(actif.id).ecran);
    }
    if (!actif) rejeu.current = null;
  }, [actif, aller]);

  useEffect(() => {
    const armer = () => {
      if (storeTuto.getState().actif || !armementTutoAutorise() || storeSac.getState().ouvert || modaleOuverte()) return;
      // Sans DOM d'abord : plus rien à voir, plus de mesure.
      if (tutoriels.every(({ id }) => storeJeu.getState().tutosVus.includes(id))) return;
      const id = storeJeu.getState().tutoAArmer(ciblesVisibles);
      if (id) lancerTuto(id);
    };
    armer();
    const jeu = storeJeu.subscribe(armer), sac = storeSac.subscribe(armer);
    let frame = 0, minuterie: ReturnType<typeof setTimeout> | undefined, derniere = 0;
    const observer = new MutationObserver(() => {
      if (frame || minuterie) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        minuterie = setTimeout(() => { minuterie = undefined; derniere = Date.now(); armer(); }, Math.max(0, 250 - (Date.now() - derniere)));
      });
    });
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['open', 'hidden', 'inert', 'aria-hidden'] });
    return () => { jeu(); sac(); observer.disconnect(); cancelAnimationFrame(frame); clearTimeout(minuterie); };
  }, [page]);

  useEffect(() => {
    if (!actif || !etape) return;
    const debut = actif.debut;
    let avance = false;
    const verifier = () => {
      if (avance) return;
      if ((etape.action === 'vaincu' && storeJeu.getState().eliminations > debut)
        || (etape.action === 'equipe' && page === 'Équipe') || (etape.action === 'sac' && storeSac.getState().ouvert)) {
        avance = true; avancer();
      }
    };
    const clic = (event: MouseEvent) => {
      if (!avance && etape.action === 'clic' && event.target instanceof Element
        && event.target.closest('[data-tuto]')?.getAttribute('data-tuto') === etape.cible) { avance = true; avancer(); }
    };
    document.addEventListener('click', clic, true);
    const jeu = storeJeu.subscribe(verifier), sac = storeSac.subscribe(verifier);
    verifier();
    return () => { jeu(); sac(); document.removeEventListener('click', clic, true); };
    // « avancer » est recréée à chaque rendu : l'étape ne se réarme que quand l'étape ou la page change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actif, etape, page]);

  useLayoutEffect(() => {
    if (!etape) return;
    let decrite: HTMLElement | null = null, ancienneDescription: string | null = null, defilee: HTMLElement | null = null, debutDefilement = 0;
    const retirerDescription = () => {
      if (decrite) {
        if (ancienneDescription === null) decrite.removeAttribute('aria-describedby');
        else decrite.setAttribute('aria-describedby', ancienneDescription);
      }
      decrite = null;
    };
    const placer = () => {
      if (!carte.current || !repere.current || !voile.current || !couche.current) return;
      const masque = modaleOuverte();
      if (couche.current.hidden !== masque) couche.current.hidden = masque;
      if (masque) return;
      const cible = etape.cible ? trouverCible(etape.cible) : null;
      if (cible !== decrite) {
        retirerDescription();
        if (cible) {
          ancienneDescription = cible.getAttribute('aria-describedby');
          cible.setAttribute('aria-describedby', [ancienneDescription, 'tuto-texte'].filter(Boolean).join(' '));
          decrite = cible;
        }
      }
      fixerInactive(!!etape.cible && (!cible || cible.matches(':disabled, [aria-disabled="true"]')));
      let r = cible?.getBoundingClientRect();
      // La mise en page peut bouger juste après l’arrivée sur l’écran : on recadre pendant 1,5 s, puis le joueur reprend la main.
      if (cible && cible !== defilee) { defilee = cible; debutDefilement = performance.now(); }
      if (cible && performance.now() - debutDefilement < 1500) {
        const zone = zoneUtile();
        if (r && (r.top < 0 || r.bottom > zone.y + zone.h || r.left < zone.x || r.right > innerWidth)
          && !cible.closest('nav, .barre-nav, .barre-laterale')) {
          cible.scrollIntoView({ block: r.height < zone.h ? 'center' : 'nearest' }); r = cible.getBoundingClientRect();
        }
      }
      const rect = r ? { x: r.left, y: r.top, w: r.width, h: r.height } : null;
      const placement = placerTuto({ zone: zoneUtile(), cible: rect, obstacles: obstaclesVisibles(cible), marge: 16,
        carte: { largeurMax: 340, largeurMin: 240, hauteur: largeur => {
          carte.current!.style.width = `${largeur}px`; return carte.current!.offsetHeight;
        } } });
      poser(carte.current, placement.carte);
      repere.current.hidden = !rect;
      voile.current.hidden = !!rect;
      if (rect) { poser(repere.current, { x: rect.x - 6, y: rect.y - 6, w: rect.w + 12, h: rect.h + 12 }); repere.current.style.height = `${rect.h + 12}px`; }
    };
    let frame = 0;
    const programmer = () => { if (!frame) frame = requestAnimationFrame(() => { frame = 0; placer(); }); };
    const mutations = new MutationObserver(programmer);
    mutations.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['open', 'hidden', 'inert', 'aria-hidden'] });
    const tailles = new ResizeObserver(programmer);
    if (carte.current) tailles.observe(carte.current);
    window.addEventListener('resize', programmer); document.addEventListener('scroll', programmer, true);
    placer();
    return () => { retirerDescription(); mutations.disconnect(); tailles.disconnect(); cancelAnimationFrame(frame); window.removeEventListener('resize', programmer); document.removeEventListener('scroll', programmer, true); };
  }, [etape]);

  const regionLive = <p className="sr-only" aria-live="polite" aria-atomic="true">{annonce}</p>;
  if (!actif || !tuto || !etape) return <>{null}{regionLive}</>;
  const n = tuto.etapes.length, compteur = n > 1 ? `${actif.etape + 1}/${n}` : '';
  return <>{<div ref={couche} className="tuto-couche">
    <div ref={voile} className="voile" hidden />
    <div ref={repere} className="repere" hidden />
    <div ref={carte} className="tuto" role="region" aria-label={`Tutoriel ${tuto.titre}${compteur ? `, étape ${compteur}` : ''}`}>
      <div className="tuto-corps">
        <p className="tuto-entete"><span className="qui">Prof. Chen</span>{compteur && <span className="compteur">{compteur}</span>}{n > 1 && <span className="segs" aria-hidden="true">{tuto.etapes.map((_, i) => <i key={i} className={i < actif.etape ? 'fait' : i === actif.etape ? 'ici' : ''} />)}</span>}</p>
        <p className="tuto-texte" id="tuto-texte"><span className="lu">{etape.texte}</span></p>
        {etape.geste && <p className="geste"><span>À faire</span> {etape.geste}</p>}
        <div className="tuto-actions">{(etape.action === 'ok' || cibleInactive) && <button type="button" className="plaque action tuto-ok min-h-11 min-w-11" onClick={avancer}>{actif.etape === n - 1 ? 'Compris' : 'Suivant'}</button>}
          <button type="button" className="tuto-passer min-h-11 min-w-11" onClick={() => { storeJeu.getState().marquerTutoVu(actif.id); fermerTuto(); rendreLeFocus(); annoncer('Tuto passé. Rejoue-le depuis le Guide.'); }}>Passer le tuto</button></div>
      </div>
    </div>
  </div>}{regionLive}</>;
}
