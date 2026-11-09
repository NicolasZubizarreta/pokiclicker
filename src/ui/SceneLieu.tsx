import { useId, useRef, useState, type PointerEvent } from 'react';
import { partieUtile, ratioUtile, type FormeScene, type Scene } from '../core/scenes';
import { attributsSvg, centreForme } from './carte-geometrie';

/** Boîte englobante de la forme, en fractions de la scène. */
function boiteForme(f: FormeScene): { l: number; h: number } {
  if (f.forme === 'rect') return { l: f.l, h: f.h };
  const xs = f.points.map(([x]) => x);
  const ys = f.points.map(([, y]) => y);
  return { l: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
}

type Props = {
  scene: Scene;
  nom: string;
  quandChoisir: (id: string) => void;
  raisons?: Record<string, string>;
  clignotements?: string[];
  occupe?: boolean;
  /** PC : l'image remplit tout son conteneur (jamais de bande), les bords dépassants sont rognés ; textes en calques. */
  remplir?: boolean;
};

export function SceneLieu({ scene, nom, quandChoisir, raisons = {}, clignotements = [], occupe = false, remplir = false }: Props) {
  const [annonce, annoncer] = useState('');
  const [teleAllumee, allumer] = useState(false);
  // Repère de la zone (survol souris ou focus clavier) : il épouse la forme exacte du polygone, jamais sa boîte englobante.
  const [survol, survoler] = useState<string | null>(null);
  const [focus, focaliser] = useState<string | null>(null);
  const formesSvg = useRef(new Map<string, SVGGeometryElement>());
  const calque = useRef<SVGSVGElement>(null);
  function pointeurDansForme(event: PointerEvent<HTMLButtonElement>, nomForme: string) {
    if (event.pointerType !== 'mouse') return;
    const boite = calque.current?.getBoundingClientRect();
    const forme = formesSvg.current.get(nomForme);
    if (!boite || !boite.width || !forme?.isPointInFill) { survoler(nomForme); return; }
    const dedans = forme.isPointInFill(new DOMPoint((event.clientX - boite.left) / boite.width * 16, (event.clientY - boite.top) / boite.height * 9));
    survoler(dedans ? nomForme : null);
  }
  const video = useRef<HTMLVideoElement>(null);
  const id = useId();
  const ratio = ratioUtile(scene);
  const dimensions = remplir
    ? { width: `max(100cqw, calc(100cqh * ${ratio}))`, height: `max(100cqh, calc(100cqw / ${ratio}))` }
    : { aspectRatio: String(ratio) };
  // L'image entière est posée dans une couche plus grande que le cadre : seule la partie utile reste visible, sans étirement.
  const utile = partieUtile(scene);
  const couche = {
    left: `${-utile.x / utile.l * 100}%`, top: `${-utile.y / utile.h * 100}%`,
    width: `${100 / utile.l}%`, height: `${100 / utile.h}%`,
  };
  const pourcent = (r: { x: number; y: number; l: number; h: number }) => ({
    left: `${r.x * 100}%`, top: `${r.y * 100}%`, width: `${r.l * 100}%`, height: `${r.h * 100}%`,
  });
  const milieu = (r: { x: number; y: number; l: number; h: number }) => ({
    left: `${(r.x + r.l / 2) * 100}%`, top: `${(r.y + r.h / 2) * 100}%`,
  });
  // La vidéo (muette, comme en V1) ne part que sur un clic du joueur.
  function basculerTele() {
    const lecteur = video.current;
    if (lecteur) {
      if (teleAllumee) lecteur.pause?.();
      else { lecteur.currentTime = 0; void lecteur.play?.()?.catch(() => undefined); }
    }
    allumer(!teleAllumee);
  }
  return <section aria-label={nom} className={remplir ? 'absolute inset-0 overflow-clip text-base [container-type:size]' : 'text-base'}>
    <div className={remplir ? 'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2' : 'relative w-full overflow-clip'} style={dimensions}>
      <div className="absolute" style={couche}>
      <img src={`img/${scene.image}`} alt={nom} className="absolute inset-0 h-full w-full object-contain" />
      {scene.tele && <video ref={video} src={scene.tele.video} muted playsInline preload="metadata" aria-hidden="true" hidden={!teleAllumee}
        style={pourcent(scene.tele.ecran)} className="pointer-events-none absolute object-cover" />}
      <svg ref={calque} viewBox="0 0 16 9" preserveAspectRatio="none" aria-hidden="true" focusable="false"
        className="pointer-events-none absolute inset-0 h-full w-full">
        {scene.formes.map(f => {
          const Forme = f.forme === 'polygone' ? 'polygon' : 'rect';
          const couleur = !f.zone || raisons[f.zone] ? 'fill-texte-doux/70'
            : f.teinte === 'red' ? 'fill-erreur-base/45'
              : f.teinte === 'blue' ? 'fill-info-base/45' : 'fill-succes-base/25';
          return <Forme key={f.nom} {...attributsSvg(f)} data-forme={f.nom}
            ref={(element: SVGGeometryElement | null) => { if (element) formesSvg.current.set(f.nom, element); else formesSvg.current.delete(f.nom); }}
            className={`forme-scene ${couleur} ${f.zone && clignotements.includes(f.zone) ? 'motion-safe:flash-vert' : ''}`} />;
        })}
        {scene.formes.filter(f => f.nom === survol || f.nom === focus).map(f => {
          const Forme = f.forme === 'polygone' ? 'polygon' : 'rect';
          // Survol : léger voile dans la forme, sans contour. Focus clavier : contour fin dans la forme.
          return <Forme key={f.nom} {...attributsSvg(f)} data-repere={f.nom}
            className={f.nom === focus ? 'forme-scene fill-transparent stroke-texte' : 'fill-texte/20 stroke-none'} />;
        })}
      </svg>
      {scene.formes.map((f, index) => {
        const centre = centreForme(f);
        const boite = boiteForme(f);
        const position = { left: `${centre.x / 16 * 100}%`, top: `${centre.y / 9 * 100}%`, width: `${boite.l * 100}%`, height: `${boite.h * 100}%` };
        const raison = f.zone ? raisons[f.zone] : 'Bientôt disponible.';
        const texte = raison ?? f.nom;
        return <button key={f.nom} type="button" aria-label={f.nom}
          aria-disabled={raison ? true : undefined} aria-describedby={raison ? `${id}-${index}` : undefined} disabled={occupe}
          style={position} className={`zone-scene absolute min-h-11 min-w-11 -translate-x-1/2 -translate-y-1/2 bg-transparent ${raison ? '' : 'enabled:cursor-pointer'}`}
          onFocus={event => { annoncer(texte); if (event.currentTarget.matches(':focus-visible')) focaliser(f.nom); }} onBlur={() => focaliser(null)}
          onPointerEnter={event => { annoncer(texte); pointeurDansForme(event, f.nom); }} onPointerMove={event => pointeurDansForme(event, f.nom)}
          onPointerLeave={() => survoler(null)} onPointerDown={() => annoncer(texte)}
          onClick={() => { annoncer(texte); if (!raison && f.zone) quandChoisir(f.zone); }} />;
      })}
      {scene.tele && <button type="button" aria-label="Télé" aria-pressed={teleAllumee} onClick={basculerTele}
        style={milieu(scene.tele.bouton)}
        className="absolute min-h-11 min-w-11 -translate-x-1/2 -translate-y-1/2 bg-transparent focus-visible:outline-focus" />}
      </div>
    </div>
    <p role="status" aria-live="polite" className={remplir ? 'pointer-events-none absolute top-2 left-2 z-10 cadre bg-surface/90 p-2 empty:hidden' : 'min-h-11 bg-surface p-2'}>{annonce}</p>
    {scene.bulle && <aside aria-label="Dialogue" className={remplir ? 'pointer-events-none absolute top-4 left-1/2 z-10 -translate-x-1/2 cadre bg-surface/90 p-3' : 'cadre bg-surface p-4'}>{scene.bulle}</aside>}
    {scene.formes.map((f, index) => {
      const raison = f.zone ? raisons[f.zone] : 'Bientôt disponible.';
      return raison && <p key={f.nom} id={`${id}-${index}`} className={remplir ? 'sr-only' : 'text-texte-doux'}>{f.nom} : {raison}</p>;
    })}
  </section>;
}
