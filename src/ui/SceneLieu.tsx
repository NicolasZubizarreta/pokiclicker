import { useId, useState } from 'react';
import type { Scene } from '../core/scenes';
import { attributsSvg, centreForme } from './carte-geometrie';

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
  const id = useId();
  const dimensions = { aspectRatio: scene.ratio.join(' / ') };
  return <section aria-label={nom} className="text-base">
    <div className="relative w-full" style={dimensions}>
      <img src={`img/${scene.image}`} alt={nom} className="absolute inset-0 h-full w-full object-contain" />
      <svg viewBox="0 0 16 9" preserveAspectRatio="none" aria-hidden="true" focusable="false"
        className="pointer-events-none absolute inset-0 h-full w-full">
        {scene.formes.map(f => {
          const Forme = f.forme === 'polygone' ? 'polygon' : 'rect';
          const couleur = !f.zone || raisons[f.zone] ? 'fill-texte-doux/50'
            : f.teinte === 'red' ? 'fill-erreur-base/30'
              : f.teinte === 'blue' ? 'fill-info-base/30' : 'fill-succes-base/60';
          return <Forme key={f.nom} {...attributsSvg(f)} data-forme={f.nom}
            className={`${couleur} ${f.zone && clignotements.includes(f.zone) ? 'motion-safe:flash-vert' : ''}`} />;
        })}
      </svg>
      {scene.formes.map((f, index) => {
        const centre = centreForme(f);
        const position = { left: `${centre.x / 16 * 100}%`, top: `${centre.y / 9 * 100}%` };
        const raison = f.zone ? raisons[f.zone] : 'Bientôt disponible.';
        const texte = raison ?? f.nom;
        return <button key={f.nom} type="button" aria-label={f.nom}
          aria-disabled={raison ? true : undefined} aria-describedby={raison ? `${id}-${index}` : undefined} disabled={occupe}
          style={position} className="absolute min-h-11 min-w-11 -translate-x-1/2 -translate-y-1/2 bg-transparent focus-visible:outline-focus"
          onFocus={() => annoncer(texte)} onPointerEnter={() => annoncer(texte)} onPointerDown={() => annoncer(texte)}
          onClick={() => { annoncer(texte); if (!raison && f.zone) quandChoisir(f.zone); }} />;
      })}
    </div>
    <p role="status" aria-live="polite" className="min-h-11 bg-surface p-2">{annonceExterne ?? annonce}</p>
    {scene.bulle && <aside aria-label="Dialogue" className="cadre bg-surface p-4">{scene.bulle}</aside>}
    {scene.formes.map((f, index) => {
      const raison = f.zone ? raisons[f.zone] : 'Bientôt disponible.';
      return raison && <p key={f.nom} id={`${id}-${index}`} className="text-texte-doux">{f.nom} : {raison}</p>;
    })}
  </section>;
}
