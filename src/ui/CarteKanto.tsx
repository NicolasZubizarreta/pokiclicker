import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { PointerEvent as EvenementPointeur } from 'react';
import { useStore } from 'zustand';
import tailles from '../../public/img/tailles.json';
import positionsCarte from '../../data/regions/kanto/carte-positions.json';
import { centreForme, deplacer, positionFiche, rayonCible, vueInitiale, zoomer } from './carte-geometrie';
import type { Point, Vue } from './carte-geometrie';
import { storeJeu } from './store';
import type { EtatForme } from './store';
import { kanto } from '../core/regions';
import type { FormeCarte } from '../core/monde';
import { reglages } from '../core/reglages';
import { Image, imageConnue } from './Image';
import { cheminDecor, precharger } from './precharger';
import { DresseurVol, imagesVol, useVol, VolGen1 } from './VolGen1';
import { useTelephone } from './useTelephone';
import './CarteTelephone.css';

const nomAccessible = (f: EtatForme) => f.numero === null || f.numero <= 0 ? f.nom : `${f.nom} (Zone ${f.numero})`;
// Positions des repères sur l'image, en fractions de sa largeur et de sa hauteur (data/regions/kanto/carte-positions.json).
const positions = positionsCarte as Record<string, Point>;
const centreDe = (f: EtatForme): Point => {
  const p = f.zone ? positions[f.zone] : undefined;
  return p ? { x: p.x * 16, y: p.y * 9 } : centreForme(f.forme);
};
// Le vol part du repère de la zone actuelle : on le représente par un petit cercle posé dessus.
const formeDepart = (f: EtatForme): FormeCarte => {
  const c = centreDe(f);
  return { zone: f.zone, nom: f.nom, teinte: f.forme.teinte, forme: 'cercle', x: c.x / 16, y: c.y / 9, r: 0.01 };
};

export function CarteKanto({ quandArrive, quandCentre, quandCasino }: { quandArrive: () => void; quandCentre?: () => void; quandCasino?: () => void }) {
  const telephone = useTelephone();
  const [celadopoleOuverte, ouvrirCeladopole] = useState(false);
  const dialogueCeladopole = useRef<HTMLDialogElement>(null);
  const ligneCeladopole = useRef<HTMLButtonElement>(null);
  const { etat: vol, reduit, lancer } = useVol(zone => storeJeu.getState().allerVers(zone), quandArrive);
  const carte = useStore(storeJeu, etat => etat.carte);
  const lieu = useStore(storeJeu, etat => etat.lieu);
  const centre = useStore(storeJeu, etat => etat.centre.acces);
  const casino = useStore(storeJeu, etat => etat.casino.acces);
  const raisonCasino = quandCasino ? casino.raison : 'Bientôt disponible.';
  const centreOuvert = !!quandCentre && centre.ouvert;
  const raisonCentre = quandCentre ? centre.raison : 'Bientôt disponible.';
  const [nouvelles] = useState(() => carte.nouvelles);
  const [fondu, demarrerFondu] = useState(false);
  const [selection, selectionner] = useState<string | null>(null);
  const [vue, changerVue] = useState(vueInitiale);
  const [largeur, mesurer] = useState(0);
  const svg = useRef<SVGSVGElement>(null);
  const fiche = useRef<HTMLElement>(null);
  const pointeurs = useRef(new Map<number, Point>());
  const origine = useRef<Point | null>(null);
  const zoneTouchee = useRef<string | null>(null);
  const glissement = useRef(false);
  const debug = new URLSearchParams(window.location.search).get('debug') === 'carte';
  const pxParUnite = largeur > 0 ? largeur / (telephone ? 16 : vue.largeur) : 1;
  const choisie = carte.formes.find(f => f.zone === selection && selection !== null);
  const actuelle = carte.formes.find(f => f.actuelle);
  const zoneCeladopole = carte.formes.find(f => f.nom === 'Céladopole')?.zone;
  const zones = carte.formes.filter(f => f.zone !== null)
    .sort((a, b) => kanto.zones.findIndex(z => z.id === a.zone) - kanto.zones.findIndex(z => z.id === b.zone));
  const dimensions = tailles['img/decors/carte-kanto.webp'];
  const decor = choisie?.zone ? cheminDecor(kanto.zone(choisie.zone)) : null;
  // Repères : 14 px de rayon sur grand écran, plus petits quand la carte est étroite.
  const rayonRepere = Math.min(14, largeur / 30);

  useLayoutEffect(() => {
    const element = fiche.current;
    if (!element || !choisie || !svg.current) return;
    const style = getComputedStyle(element);
    if (style.getPropertyValue('--fiche-ancree').trim() !== '1') return;
    const rect = svg.current.getBoundingClientRect();
    const position = positionFiche(centreDe(choisie), vue,
      { largeur: rect.width, hauteur: rect.height },
      { largeur: element.offsetWidth, hauteur: element.offsetHeight }, parseFloat(style.paddingLeft));
    element.style.setProperty('--fiche-x', `${position.x}px`);
    element.style.setProperty('--fiche-y', `${position.y}px`);
  }, [choisie, vue, largeur, vol.actif, centreOuvert, raisonCentre, raisonCasino]);

  useEffect(() => { void precharger(imagesVol); }, []);

  useEffect(() => {
    const fenetre = dialogueCeladopole.current;
    if (telephone && celadopoleOuverte && !vol.actif) {
      if (!fenetre?.open) fenetre?.showModal();
    } else {
      if (fenetre?.open) fenetre.close();
    }
  }, [telephone, celadopoleOuverte, vol.actif]);

  function fermerCeladopole() {
    ouvrirCeladopole(false);
    dialogueCeladopole.current?.close();
  }

  useEffect(() => {
    if (!nouvelles.length) return;
    const delai = setTimeout(() => {
      demarrerFondu(true);
      storeJeu.getState().voirCarte();
    }, reglages.carte.deblocageMs);
    return () => clearTimeout(delai);
  }, [nouvelles]);

  useEffect(() => {
    const element = svg.current!;
    const taille = () => mesurer(element.getBoundingClientRect().width);
    taille();
    const observateur = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(taille);
    observateur?.observe(element);
    window.addEventListener('resize', taille);
    const molette = (event: WheelEvent) => {
      event.preventDefault();
      const rect = element.getBoundingClientRect();
      if (!rect.width) return;
      changerVue(v => zoomer(v, Math.exp(-event.deltaY / reglages.carte.diviseurMolette), {
        x: v.x + (event.clientX - rect.left) * v.largeur / rect.width,
        y: v.y + (event.clientY - rect.top) * v.hauteur / rect.height,
      }));
    };
    if (!telephone) element.addEventListener('wheel', molette, { passive: false });
    return () => {
      observateur?.disconnect();
      window.removeEventListener('resize', taille);
      if (!telephone) element.removeEventListener('wheel', molette);
    };
  }, [telephone]);

  function commencer(event: EvenementPointeur<SVGSVGElement>) {
    if (event.button !== 0) return;
    const point = { x: event.clientX, y: event.clientY };
    if (!pointeurs.current.size) {
      origine.current = point; glissement.current = false;
      zoneTouchee.current = (event.target as Element).closest('[data-zone]')?.getAttribute('data-zone') ?? null;
    }
    pointeurs.current.set(event.pointerId, point);
    if (pointeurs.current.size > 1) glissement.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function bouger(event: EvenementPointeur<SVGSVGElement>) {
    const avant = [...pointeurs.current.values()];
    const ancien = pointeurs.current.get(event.pointerId);
    if (!ancien) return;
    const point = { x: event.clientX, y: event.clientY };
    pointeurs.current.set(event.pointerId, point);
    if (origine.current && Math.hypot(point.x - origine.current.x, point.y - origine.current.y) > reglages.carte.seuilGlissementPx) glissement.current = true;
    if (!glissement.current) return;
    const rect = event.currentTarget.getBoundingClientRect();
    if (!rect.width) return;
    const apres = [...pointeurs.current.values()];
    changerVue(v => {
      const convertir = (p: Point, vue: Vue) => ({ x: vue.x + (p.x - rect.left) * vue.largeur / rect.width, y: vue.y + (p.y - rect.top) * vue.hauteur / rect.height });
      if (avant.length === 2) {
        const milieu = (ps: Point[]) => ({ x: (ps[0]!.x + ps[1]!.x) / 2, y: (ps[0]!.y + ps[1]!.y) / 2 });
        const distance = (ps: Point[]) => Math.hypot(ps[0]!.x - ps[1]!.x, ps[0]!.y - ps[1]!.y);
        const debut = milieu(avant), fin = milieu(apres);
        const agrandie = zoomer(v, distance(avant) ? distance(apres) / distance(avant) : 1, convertir(debut, v));
        return deplacer(agrandie, (debut.x - fin.x) * agrandie.largeur / rect.width, (debut.y - fin.y) * agrandie.hauteur / rect.height);
      }
      return deplacer(v, (ancien.x - point.x) * v.largeur / rect.width, (ancien.y - point.y) * v.hauteur / rect.height);
    });
  }

  function terminer(event: EvenementPointeur<SVGSVGElement>) {
    if (event.type !== 'pointerup') glissement.current = true;
    if (pointeurs.current.has(event.pointerId) && !glissement.current && zoneTouchee.current) selectionner(zoneTouchee.current);
    if (pointeurs.current.has(event.pointerId) && !glissement.current && !zoneTouchee.current) selectionner(null);
    pointeurs.current.delete(event.pointerId);
  }

  return <section>
    <h1 className="mb-4 font-titre text-2xl font-semibold">Carte</h1>
    {!telephone && <section className="mb-4 bg-surface p-4 text-base" aria-label="Ton voyage">
      <h2 className="font-titre text-xl font-semibold">Ton voyage</h2>
      <p>{carte.badges.obtenus} badges sur {carte.badges.total} · {lieu?.nom ?? actuelle?.nom} en cours</p>
      <progress className="w-full accent-region-accent" value={carte.badges.obtenus} max={carte.badges.total} aria-label="Badges obtenus" />
      {nouvelles.length > 0 && !choisie && <p role="status">
        Zone débloquée ! {carte.formes.filter(f => f.zone && nouvelles.includes(f.zone)).map(f => f.nom).join(', ')}
      </p>}
    </section>}
    <div className={telephone ? 'carte-telephone' : 'carte-grille grid gap-x-4'}>
    {telephone && <ul aria-label="Zones de Kanto" className={`liste-zones flex flex-col gap-2 ${vol.actif ? 'opacity-60' : ''}`}>
      {zones.map(f => {
        const celadopole = f.nom === 'Céladopole';
        // Céladopole terminée reste ouverte : le Centre commercial et le Casino s'y atteignent toujours.
        const fermee = !f.ouverte || (f.terminee && !celadopole);
        const inactive = vol.actif || fermee;
        const secondaire = [
          f.numero !== null && f.numero > 0 ? `Zone ${f.numero}` : '',
          f.terminee ? ['Terminée', celadopole ? '3 lieux' : ''].filter(Boolean).join(' · ') : [f.actuelle ? 'tu es ici' : '', celadopole ? '3 lieux' : '', !f.ouverte ? 'fermée' : ''].filter(Boolean).join(' · '),
        ].filter(Boolean).join(' · ');
        return <li key={f.zone}>
          <button type="button" aria-label={`${nomAccessible(f)}${f.actuelle ? ', tu es ici' : ''}`}
            ref={celadopole ? ligneCeladopole : undefined}
            aria-disabled={inactive ? true : undefined}
            className={`flex min-h-14 w-full items-center gap-3 border-2 px-3 py-1 text-left focus-visible:outline-2 focus-visible:outline-focus ${f.actuelle ? 'bg-selection border-succes-base' : fermee ? 'bg-surface-2 text-texte-doux border-bordure' : 'bg-surface border-bordure'}`}
            onClick={inactive || (f.actuelle && !celadopole) ? undefined : () => {
              if (celadopole) {
                if (!celadopoleOuverte) ouvrirCeladopole(true);
              } else lancer(f.zone!, actuelle ? formeDepart(actuelle) : null);
            }}>
            {f.actuelle && <span className="size-3 shrink-0 rounded-full bg-succes-base" aria-hidden="true" />}
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">{f.nom}</span>
              <span className="block text-sm text-texte-doux">{secondaire}</span>
            </span>
            {!fermee && <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6 shrink-0 fill-none stroke-current stroke-2"><path d="m9 6 6 6-6 6" /></svg>}
          </button>
        </li>;
      })}
    </ul>}
    <div className={telephone ? 'cadre aspect-video flex-none overflow-hidden bg-surface p-1' : 'cadre overflow-hidden bg-surface p-2'}>
      <div className={`carte-support relative ${vol.actif && reduit ? 'fondu-carte' : ''}`}
        onKeyDown={event => { if (event.key === 'Escape') selectionner(null); }}>
      <svg ref={svg} role={telephone ? 'img' : undefined} aria-label={telephone ? 'Carte de Kanto. Zone actuelle en vert.' : 'Carte de Kanto'} className={telephone ? 'pointer-events-none block aspect-video w-full select-none' : 'block aspect-video w-full touch-none select-none'}
        viewBox={telephone ? '0 0 16 9' : `${vue.x} ${vue.y} ${vue.largeur} ${vue.hauteur}`}
        onPointerDown={telephone ? undefined : commencer} onPointerMove={telephone ? undefined : bouger} onPointerUp={telephone ? undefined : terminer}
        onPointerCancel={telephone ? undefined : terminer} onLostPointerCapture={telephone ? undefined : event => { pointeurs.current.delete(event.pointerId); }}>
        <image href="img/decors/carte-kanto.webp" width={16} height={16 * dimensions.hauteur / dimensions.largeur} />
        {!telephone && <g data-halos className={debug ? 'fill-focus/30 stroke-focus' : 'fill-transparent'}>
          {carte.formes.filter(f => f.ouverte && f.zone).map(f => {
            const centre = centreDe(f);
            return <circle key={f.zone} data-zone={f.zone} cx={centre.x} cy={centre.y} r={rayonCible(pxParUnite)}
              vectorEffect="non-scaling-stroke" onClick={() => { if (!glissement.current) selectionner(f.zone); }} />;
          })}
        </g>}
        <g>
          {zones.map(f => {
            const c = centreDe(f);
            const choisieIci = !telephone && selection === f.zone;
            const nouvelle = nouvelles.includes(f.zone!);
            return <g key={f.zone} data-zone={f.zone} data-forme={f.nom} role={telephone ? undefined : 'button'} tabIndex={telephone ? undefined : 0} aria-label={nomAccessible(f)}
              transform={`translate(${c.x} ${c.y}) scale(${1 / pxParUnite})`}
              className={`${telephone ? 'group outline-none' : 'group cursor-pointer outline-none'} ${nouvelle ? fondu ? 'carte-deblocage' : 'opacity-0' : ''}`}
              onClick={telephone ? undefined : () => { if (!glissement.current) selectionner(f.zone); }}
              onKeyDown={telephone ? undefined : event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selectionner(f.zone); } }}>
              <circle r={rayonRepere} strokeWidth={choisieIci ? 3 : 1.5} className={`${!f.ouverte ? 'fill-texte-doux/30' : f.actuelle ? telephone ? 'fill-succes-base' : 'fill-succes-base/35' : 'fill-alerte-base/30'} ${choisieIci ? 'stroke-succes-base' : telephone && f.actuelle ? 'stroke-texte' : 'stroke-neutre-950 group-focus-visible:stroke-focus'}`} />
              {!telephone && <title>{nomAccessible(f)}</title>}
            </g>;
          })}
        </g>
        <g className="pointer-events-none fill-succes-base">
          {carte.tutorielRoute1 && carte.formes.filter(f => f.numero === 1).map(f => <circle key={f.nom}
            cx={centreDe(f).x} cy={centreDe(f).y} r={rayonRepere / pxParUnite} className="carte-clignotement" />)}
          {actuelle && <circle data-actuelle={actuelle.zone} cx={centreDe(actuelle).x} cy={centreDe(actuelle).y}
            r={rayonRepere / pxParUnite} className="carte-pulsation" />}
        </g>
        {vol.actif && !reduit && vol.depart && <DresseurVol ms={vol.ms} forme={vol.depart} />}
        {debug && <g className="pointer-events-none fill-texte font-texte text-base">
          {carte.formes.map(f => {
            const centre = centreDe(f);
            return <text key={f.nom} transform={`translate(${centre.x} ${centre.y}) scale(${1 / pxParUnite})`} textAnchor="middle">{f.nom}</text>;
          })}
        </g>}
      </svg>
      {vol.actif && !reduit && <VolGen1 ms={vol.ms} />}
      {!telephone && choisie && <section ref={fiche} aria-label="Zone sélectionnée" className="carte-fiche cadre absolute flex gap-2 overflow-y-auto bg-surface p-2 text-base text-texte outline-none"
        onKeyDown={event => { if (event.key === 'Escape') selectionner(null); }}>
        <button type="button" aria-label="Fermer" className="absolute right-0 top-0 min-h-11 min-w-11 text-xl focus-visible:outline-2 focus-visible:outline-focus" onClick={() => selectionner(null)}>×</button>
        {decor && imageConnue(decor) && <Image genre="decor" src={decor} alt={`Décor de ${choisie.nom}`} className="carte-miniature shrink-0 object-cover" />}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 pr-11">
            <h2 className="font-titre text-base font-semibold">{choisie.nom}</h2>
            {choisie.numero !== null && choisie.numero > 0 && <p className="text-info-texte">Zone {choisie.numero}</p>}
          </div>
          {choisie.terminee ? <p>Terminée, plus accessible</p>
            : !choisie.ouverte ? <><p>Bloquée</p><p>{choisie.raison ?? 'Pas encore accessible.'}</p></>
            : choisie.actuelle && !vol.actif ? <p>Tu es ici.</p>
              : <button type="button" className="min-h-11 min-w-11 w-full bg-action px-4 py-2 text-action-texte shadow-sm hover:bg-action-survol focus-visible:outline-2 focus-visible:outline-focus"
                disabled={vol.actif} onClick={() => { lancer(choisie.zone!, actuelle ? formeDepart(actuelle) : null); selectionner(null); }}>{choisie.nom === 'Céladopole' ? 'Arène' : 'Y aller'}</button>}
          {choisie.nom === 'Céladopole' && <div className="mt-2 grid gap-2">
            <div>
              <button type="button" data-centre disabled={!centreOuvert || vol.actif}
                onClick={() => { lancer('centre-commercial', actuelle ? formeDepart(actuelle) : null, quandCentre); selectionner(null); }}
                aria-describedby={!centreOuvert && raisonCentre ? 'carte-commerce' : undefined}
                className={`min-h-11 min-w-11 w-full px-4 py-2 focus-visible:outline-2 focus-visible:outline-focus ${centreOuvert
                  ? 'bg-action text-action-texte shadow-sm hover:bg-action-survol' : 'bg-surface text-texte-doux'}`}>Centre commercial</button>
              {!centreOuvert && raisonCentre && <p id="carte-commerce">{raisonCentre}</p>}
            </div>
            <div>
              <button type="button" data-casino disabled={!casino.ouvert || !quandCasino || vol.actif}
                onClick={quandCasino} aria-describedby={raisonCasino ? 'carte-casino' : undefined}
                className="min-h-11 min-w-11 w-full bg-surface px-4 py-2 focus-visible:outline-2 focus-visible:outline-focus disabled:text-texte-doux">Casino</button>
              {raisonCasino && <p id="carte-casino">{raisonCasino}</p>}
            </div>
          </div>}
        </div>
      </section>}
      </div>
      {telephone && <dialog ref={dialogueCeladopole} aria-labelledby="carte-celadopole-titre"
        className="guide-fenetre cadre w-[calc(100%-2rem)] max-w-sm bg-surface p-0 text-base text-texte"
        onClose={() => { ouvrirCeladopole(false); ligneCeladopole.current?.focus(); }}>
        <div className="fiche-contenu grid min-w-0 gap-4 p-4 lg:p-8">
          <button type="button" aria-label="Fermer" className="cadre min-h-12 min-w-12 justify-self-end bg-surface p-3 text-2xl leading-none" onClick={fermerCeladopole}>×</button>
          <h2 id="carte-celadopole-titre" className="break-words font-titre text-2xl">Céladopole</h2>
          <p>Où veux-tu aller ?</p>
          {[
            { nom: 'Arène', zone: zoneCeladopole, ouvert: actuelle?.zone !== zoneCeladopole, raison: 'Tu es ici.', arrivee: undefined, id: 'carte-arene-telephone' },
            { nom: 'Centre commercial', zone: 'centre-commercial', ouvert: centreOuvert, raison: raisonCentre, arrivee: quandCentre, id: 'carte-commerce-telephone' },
            { nom: 'Casino', zone: 'casino', ouvert: !!(casino.ouvert && quandCasino), raison: raisonCasino, arrivee: quandCasino, id: 'carte-casino-telephone' },
          ].map(choix => <div key={choix.id}>
            <button type="button" disabled={!choix.ouvert}
              aria-describedby={!choix.ouvert && choix.raison ? choix.id : undefined}
              className={`cadre flex min-h-14 w-full items-center justify-between gap-2 px-4 py-2 text-left font-semibold focus-visible:outline-2 focus-visible:outline-focus ${choix.ouvert
                ? 'bg-surface hover:bg-selection' : 'bg-surface-2 text-texte-doux'}`}
              onClick={() => {
                fermerCeladopole();
                if (choix.zone) lancer(choix.zone, actuelle ? formeDepart(actuelle) : null, choix.arrivee);
              }}>{choix.nom}{choix.ouvert && <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6 shrink-0 fill-none stroke-current stroke-2"><path d="m9 6 6 6-6 6" /></svg>}</button>
            {!choix.ouvert && choix.raison && <p id={choix.id} className="text-sm">{choix.raison}</p>}
          </div>)}
        </div>
      </dialog>}
      {vol.actif && <p role="status" className="sr-only">Vol en cours vers {vol.cible === 'centre-commercial' ? 'Centre commercial' : vol.cible === 'casino' ? 'Casino' : carte.formes.find(f => f.zone === vol.cible)?.nom}…</p>}
    </div>
      {!telephone && <div className="carte-liste relative min-w-0">
        <ul role="listbox" aria-label="Zones de Kanto" className="max-h-64 overflow-y-auto overscroll-contain p-1 lg:absolute lg:inset-0 lg:max-h-none">
          {zones.map(f => <li key={f.zone} role="option" aria-label={nomAccessible(f)}
            aria-selected={selection === f.zone} tabIndex={0}
            className={`flex min-h-11 cursor-pointer items-center gap-2 border-2 px-2 py-1 ${selection === f.zone ? 'border-succes-base' : 'border-transparent'} ${f.ouverte ? 'bg-surface text-texte' : 'bg-surface-2 text-texte-doux'}`}
            onClick={() => selectionner(f.zone)}
            onKeyDown={event => {
              if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selectionner(f.zone); }
              if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                event.preventDefault();
                const suivante = event.key === 'ArrowDown' ? event.currentTarget.nextElementSibling : event.currentTarget.previousElementSibling;
                (suivante as HTMLElement | null)?.focus();
              }
            }}>
            <span className="w-2 shrink-0">{f.actuelle && <><span className="block size-2 rounded-full bg-succes-base" /><span className="sr-only">position actuelle</span></>}</span>
            <span className="w-6 shrink-0 tabular-nums">{f.numero !== null && f.numero >= 0 ? f.numero : ''}</span>
            <span>{f.nom}</span>
            {f.terminee && <span className="text-texte-doux">Terminée</span>}
          </li>)}
        </ul>
      </div>}
    </div>
  </section>;
}
