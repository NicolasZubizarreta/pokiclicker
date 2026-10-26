import { createElement, Fragment, useEffect, useRef, useState } from 'react';
import type { PointerEvent as EvenementPointeur } from 'react';
import { useStore } from 'zustand';
import tailles from '../../public/img/tailles.json';
import { attributsSvg, centreForme, deplacer, rayonCible, vueInitiale, zoomer } from './carte-geometrie';
import type { Point, Vue } from './carte-geometrie';
import { storeJeu } from './store';
import type { EtatForme } from './store';
import { kanto } from '../core/regions';
import { reglages } from '../core/reglages';
import { Image, imageConnue } from './Image';
import { cheminDecor, precharger } from './precharger';
import { DresseurVol, imagesVol, useVol, VolGen1 } from './VolGen1';

const nomAccessible = (f: EtatForme) => f.numero === null || f.numero === 0 ? f.nom : `${f.nom} (Zone ${f.numero})`;
const balise = (f: EtatForme) => f.forme.forme === 'cercle' ? 'circle' : f.forme.forme === 'polygone' ? 'polygon' : 'rect';
const couleur = (f: EtatForme) => !f.ouverte ? 'fill-texte-doux/50'
  : f.actuelle ? 'fill-succes-base/60' : /arène/i.test(f.nom) ? 'fill-erreur-base/30'
    : f.nom === 'Caverne Azurée' ? 'fill-info-texte/30'
      : /route|bourg/i.test(f.nom) ? 'fill-alerte-base/30' : 'fill-info-base/30';

export function CarteKanto({ quandArrive, quandCentre }: { quandArrive: () => void; quandCentre?: () => void }) {
  const { etat: vol, reduit, lancer } = useVol(zone => storeJeu.getState().allerVers(zone), quandArrive);
  const carte = useStore(storeJeu, etat => etat.carte);
  const lieu = useStore(storeJeu, etat => etat.lieu);
  const centre = useStore(storeJeu, etat => etat.centre.acces);
  const centreOuvert = !!quandCentre && centre.ouvert;
  const raisonCentre = quandCentre ? centre.raison : 'Bientôt disponible.';
  const [nouvelles] = useState(() => carte.nouvelles);
  const [fondu, demarrerFondu] = useState(false);
  const [selection, selectionner] = useState<string | null>(null);
  const [vue, changerVue] = useState(vueInitiale);
  const [largeur, mesurer] = useState(0);
  const svg = useRef<SVGSVGElement>(null);
  const pointeurs = useRef(new Map<number, Point>());
  const origine = useRef<Point | null>(null);
  const zoneTouchee = useRef<string | null>(null);
  const glissement = useRef(false);
  const debug = new URLSearchParams(window.location.search).get('debug') === 'carte';
  const pxParUnite = largeur > 0 ? largeur / vue.largeur : 1;
  const choisie = carte.formes.find(f => f.zone === selection && selection !== null);
  const actuelle = carte.formes.find(f => f.actuelle);
  const dimensions = tailles['img/decors/carte-kanto.webp'];
  const decor = choisie?.zone ? cheminDecor(kanto.zone(choisie.zone)) : null;

  useEffect(() => { void precharger(imagesVol); }, []);

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
    element.addEventListener('wheel', molette, { passive: false });
    return () => {
      observateur?.disconnect();
      window.removeEventListener('resize', taille);
      element.removeEventListener('wheel', molette);
    };
  }, []);

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
    pointeurs.current.delete(event.pointerId);
  }

  return <section>
    <h1 className="mb-4 font-titre text-2xl font-semibold">Carte</h1>
    <section className="mb-4 bg-surface p-4 text-base" aria-label="Ton voyage">
      <h2 className="font-titre text-xl font-semibold">Ton voyage</h2>
      <p>{carte.badges.obtenus} badges sur {carte.badges.total} · {lieu?.nom ?? actuelle?.nom} en cours</p>
      <progress className="w-full accent-region-accent" value={carte.badges.obtenus} max={carte.badges.total} aria-label="Badges obtenus" />
    </section>
    <div className="cadre overflow-hidden bg-surface p-2">
      <div className={`relative ${vol.actif && reduit ? 'fondu-carte' : ''}`}>
      <svg ref={svg} aria-label="Carte de Kanto" className="block aspect-video w-full touch-none select-none"
        viewBox={`${vue.x} ${vue.y} ${vue.largeur} ${vue.hauteur}`}
        onPointerDown={commencer} onPointerMove={bouger} onPointerUp={terminer}
        onPointerCancel={terminer} onLostPointerCapture={event => { pointeurs.current.delete(event.pointerId); }}>
        <image href="img/decors/carte-kanto.webp" width={16} height={16 * dimensions.hauteur / dimensions.largeur} />
        <g data-halos className={debug ? 'fill-focus/30 stroke-focus' : 'fill-transparent'}>
          {carte.formes.filter(f => f.ouverte && f.zone).map(f => {
            const centre = centreForme(f.forme);
            return <circle key={f.zone} data-zone={f.zone} cx={centre.x} cy={centre.y} r={rayonCible(pxParUnite)}
              vectorEffect="non-scaling-stroke" onClick={() => { if (!glissement.current) selectionner(f.zone); }} />;
          })}
        </g>
        <g>
          {carte.formes.map(f => {
            const Forme = balise(f);
            const nouvelle = f.zone !== null && nouvelles.includes(f.zone);
            return <Fragment key={f.nom}>
              {nouvelle && <Forme {...attributsSvg(f.forme)} className="pointer-events-none fill-texte-doux/50" />}
              <Forme {...attributsSvg(f.forme)} data-forme={f.nom} data-zone={f.zone}
              className={`${couleur(f)} focus-visible:outline-none focus-visible:stroke-focus focus-visible:stroke-3 ${nouvelle ? fondu ? 'carte-deblocage' : 'opacity-0' : ''} ${debug ? 'stroke-focus' : ''} ${f.zone ? 'cursor-pointer' : 'pointer-events-none'}`}
              vectorEffect="non-scaling-stroke" role={f.zone ? 'button' : undefined}
              tabIndex={f.zone ? 0 : undefined} aria-label={nomAccessible(f)}
              onClick={() => { if (f.zone && !glissement.current) selectionner(f.zone); }}
              onKeyDown={event => {
              if (f.zone && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); selectionner(f.zone); }
              }}><title>{nomAccessible(f)}</title></Forme>
            </Fragment>;
          })}
        </g>
        {vol.actif && !reduit && vol.depart && <DresseurVol ms={vol.ms} forme={vol.depart} />}
        <g className="pointer-events-none fill-succes-base">
          {carte.tutorielRoute1 && carte.formes.filter(f => f.numero === 1).map(f => createElement(balise(f), {
            ...attributsSvg(f.forme), key: f.nom, className: 'carte-clignotement',
          }))}
          {actuelle && <circle data-actuelle={actuelle.zone} cx={centreForme(actuelle.forme).x} cy={centreForme(actuelle.forme).y}
            r={rayonCible(pxParUnite) / 2} className="carte-pulsation" />}
        </g>
        {debug && <g className="pointer-events-none fill-texte font-texte text-base">
          {carte.formes.map(f => {
            const centre = centreForme(f.forme);
            return <text key={f.nom} transform={`translate(${centre.x} ${centre.y}) scale(${1 / pxParUnite})`} textAnchor="middle">{f.nom}</text>;
          })}
        </g>}
      </svg>
      {vol.actif && !reduit && <VolGen1 ms={vol.ms} />}
      </div>
      {vol.actif && <p role="status" className="sr-only">Vol en cours vers {vol.cible === 'centre-commercial' ? 'Centre commercial' : carte.formes.find(f => f.zone === vol.cible)?.nom}…</p>}
      <section aria-label="Zone sélectionnée" className="carte-bande-reservee mt-2 bg-surface-2 p-4 text-base">
        {nouvelles.length > 0 && !choisie && <p role="status" className="mb-2">
          Zone débloquée ! {carte.formes.filter(f => f.zone && nouvelles.includes(f.zone)).map(f => f.nom).join(', ')}
        </p>}
        {!choisie ? <p>Touche une zone pour la voir.</p> : <>
          <h2 className="font-titre text-xl font-semibold">{choisie.nom}</h2>
          {choisie.numero !== null && choisie.numero !== 0 && <p>Zone {choisie.numero}</p>}
          {decor && imageConnue(decor) && <Image genre="decor" src={decor} alt={`Décor de ${choisie.nom}`} className="carte-miniature my-2" />}
          {!choisie.ouverte ? <><p>Bloquée</p><p>{choisie.raison ?? 'Pas encore accessible.'}</p></>
            : choisie.actuelle && !vol.actif ? <p>Tu es ici.</p>
              : <button type="button" className="min-h-11 min-w-11 bg-action px-4 py-2 text-action-texte shadow-sm hover:bg-action-survol"
                disabled={vol.actif} onClick={() => lancer(choisie.zone!, actuelle?.forme ?? null)}>{choisie.nom === 'Céladopole' ? 'Arène' : 'Y aller'}</button>}
          {choisie.nom === 'Céladopole' && <div className="mt-2 grid gap-2">
            <div>
              <button type="button" data-centre disabled={!centreOuvert || vol.actif}
                onClick={() => lancer('centre-commercial', actuelle?.forme ?? null, quandCentre)}
                aria-describedby={!centreOuvert && raisonCentre ? 'carte-commerce' : undefined}
                className={`min-h-11 min-w-11 px-4 py-2 ${centreOuvert
                  ? 'bg-action text-action-texte shadow-sm hover:bg-action-survol' : 'bg-surface text-texte-doux'}`}>Centre commercial</button>
              {!centreOuvert && raisonCentre && <p id="carte-commerce">{raisonCentre}</p>}
            </div>
            <div>
              <button type="button" disabled aria-describedby="carte-casino"
                className="min-h-11 min-w-11 bg-surface px-4 py-2 text-texte-doux">Casino</button>
              <p id="carte-casino">Bientôt disponible.</p>
            </div>
          </div>}
        </>}
      </section>
    </div>
  </section>;
}
