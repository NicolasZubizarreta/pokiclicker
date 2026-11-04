import { useEffect, useRef } from 'react';
import { kanto } from '../../core/regions';
import type { Resume } from '../synchro';

function nomZone(id: string) {
  try { return kanto.zone(id).nom; } catch { return id; }
}
function duree(ms: number | null) {
  if (ms === null) return 'Non disponible';
  const minutes = Math.floor(ms / 60_000);
  return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')}`;
}
export function EcranChoixVersion({ choix, occupe, erreur, quandChoisir }: {
  choix: { local: Resume; serveur: Resume }; occupe: boolean; erreur: string; quandChoisir: (c: 'local' | 'serveur') => void;
}) {
  const titre = useRef<HTMLHeadingElement>(null);
  useEffect(() => { titre.current?.focus(); }, []);
  return <main data-theme="dark" className="min-h-dvh bg-fond text-texte font-texte p-4 lg:p-8 grid content-center">
    <section className="cadre bg-surface p-4 lg:p-8 w-full max-w-(--breakpoint-md) mx-auto">
      <h1 ref={titre} tabIndex={-1} className="font-titre text-2xl mb-4">Deux versions de ta partie</h1>
      <p className="mb-4">Cet appareil et le serveur ont chacun avancé. Choisis la version à garder ; l'autre est conservée en secours, rien n'est fusionné.</p>
      <div className="grid gap-4 md:grid-cols-2 items-start">
        {(['local', 'serveur'] as const).map(cote => {
          const resume = choix[cote];
          return <section key={cote} className="cadre bg-surface-2 p-4">
            <h2 className="font-titre text-xl mb-4">{cote === 'local' ? 'Cet appareil' : "L'autre version"}</h2>
            <dl className="mb-4">
              <dt className="text-sm text-texte-doux">Région</dt><dd className="mb-2">{resume.regionId.charAt(0).toUpperCase() + resume.regionId.slice(1)}</dd>
              <dt className="text-sm text-texte-doux">Zone</dt><dd className="mb-2">{nomZone(resume.zoneId)}</dd>
              <dt className="text-sm text-texte-doux">Dernière sauvegarde</dt><dd className="mb-2">{new Date(resume.ecritLe).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })}</dd>
              <dt className="text-sm text-texte-doux">Temps de jeu</dt><dd className="mb-2 text-region-accent">{duree(resume.tempsJeuMs)}</dd>
            </dl>
            <button disabled={occupe} onClick={() => quandChoisir(cote)} className="min-h-11 p-2 w-full bg-surface-2 border border-bordure hover:bg-selection disabled:text-texte-doux">
              {occupe ? 'Un instant…' : cote === 'local' ? 'Garder cet appareil' : "Récupérer l'autre version"}
            </button>
          </section>;
        })}
      </div>
      {erreur && <p role="alert" className="mt-4">{erreur}</p>}
    </section>
  </main>;
}
