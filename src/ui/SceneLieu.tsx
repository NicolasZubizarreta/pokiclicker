import { useId, useRef, useState } from 'react';
import type { FormeScene, Scene } from '../core/scenes';
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
  annonceExterne?: string | null;
};

export function SceneLieu({ scene, nom, quandChoisir, raisons = {}, clignotements = [], occupe = false, annonceExterne }: Props) {
  const [annonce, annoncer] = useState('');
  const [teleAllumee, allumer] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const id = useId();
  const dimensions = { aspectRatio: scene.ratio.join(' / ') };
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
  return <section aria-label={nom} className="text-base">
    <div className="relative w-full" style={dimensions}>
      <img src={`img/${scene.image}`} alt={nom} className="absolute inset-0 h-full w-full object-contain" />
      {scene.tele && <video ref={video} src={scene.tele.video} muted playsInline preload="metadata" aria-hidden="true" hidden={!teleAllumee}
        style={pourcent(scene.tele.ecran)} className="pointer-events-none absolute object-cover" />}
      <svg viewBox="0 0 16 9" preserveAspectRatio="none" aria-hidden="true" focusable="false"
        className="pointer-events-none absolute inset-0 h-full w-full">
        {scene.formes.map(f => {
          const Forme = f.forme === 'polygone' ? 'polygon' : 'rect';
          const couleur = !f.zone || raisons[f.zone] ? 'fill-texte-doux/70'
            : f.teinte === 'red' ? 'fill-erreur-base/45'
              : f.teinte === 'blue' ? 'fill-info-base/45' : 'fill-succes-base/25';
          return <Forme key={f.nom} {...attributsSvg(f)} data-forme={f.nom}
            className={`forme-scene ${couleur} ${f.zone && clignotements.includes(f.zone) ? 'motion-safe:flash-vert' : ''}`} />;
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
          style={position} className={`absolute min-h-11 min-w-11 -translate-x-1/2 -translate-y-1/2 bg-transparent focus-visible:outline-focus ${raison ? '' : 'enabled:cursor-pointer'}`}
          onFocus={() => annoncer(texte)} onPointerEnter={() => annoncer(texte)} onPointerDown={() => annoncer(texte)}
          onClick={() => { annoncer(texte); if (!raison && f.zone) quandChoisir(f.zone); }} />;
      })}
      {scene.tele && <button type="button" aria-label="Télé" aria-pressed={teleAllumee} onClick={basculerTele}
        style={milieu(scene.tele.bouton)}
        className="absolute min-h-11 min-w-11 -translate-x-1/2 -translate-y-1/2 bg-transparent focus-visible:outline-focus" />}
    </div>
    <p role="status" aria-live="polite" className="min-h-11 bg-surface p-2">{annonceExterne ?? annonce}</p>
    {scene.bulle && <aside aria-label="Dialogue" className="cadre bg-surface p-4">{scene.bulle}</aside>}
    {scene.formes.map((f, index) => {
      const raison = f.zone ? raisons[f.zone] : 'Bientôt disponible.';
      return raison && <p key={f.nom} id={`${id}-${index}`} className="text-texte-doux">{f.nom} : {raison}</p>;
    })}
  </section>;
}
