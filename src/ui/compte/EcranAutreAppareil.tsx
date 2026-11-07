import { useEffect, useRef } from 'react';
import { nomRegion, nomZone } from './format-partie';
import { IconeTelephone, IconeValide, IconeParties } from './icones-compte';
import './Compte.css';
import './ZoneCompte.css';

export function EcranAutreAppareil({ nom, regionId, zoneId, ecritLe, occupe, erreur, quandReprendre, quandPlusTard }: {
  nom: string; regionId: string; zoneId: string; ecritLe: string; occupe: boolean; erreur: string; quandReprendre(): void; quandPlusTard(): void;
}) {
  const titre = useRef<HTMLHeadingElement>(null);
  useEffect(() => { titre.current?.focus(); }, []);
  return <main data-theme="dark" className="zc-zone zc-ecran min-h-dvh bg-fond text-texte font-texte p-4 lg:p-8 grid content-center">
    <section className="cadre bg-surface p-4 lg:p-8 w-full max-w-(--breakpoint-md) mx-auto flex flex-col gap-4">
      <h1 ref={titre} tabIndex={-1} className="font-titre text-2xl mb-4">Partie ouverte ailleurs</h1>
      <p className="font-titre text-xl font-bold">{nom}</p>
      <p className="compte-message info" role="status"><IconeTelephone /><span>Cette partie est ouverte sur un autre appareil. Là-bas, elle en est à {nomZone(zoneId)} ({nomRegion(regionId)}), sauvegardée le {new Date(ecritLe).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })}.</span></p>
      <h2 className="font-titre text-xl font-bold">Si tu la reprends ici</h2>
      <ul className="zc-reprise-liste">
        <li><IconeValide /><span>Tu repars <b>exactement là où la partie en était sur l'autre appareil</b> : même zone, même étape, mêmes Pokémon.</span></li>
        <li><IconeTelephone /><span>La partie se ferme sur l'autre appareil, qui affiche « Partie reprise ailleurs ».</span></li>
        <li><IconeParties /><span>Il n'y a toujours qu'une seule sauvegarde : rien n'est copié, rien n'est à choisir.</span></li>
      </ul>
      <button type="button" disabled={occupe} onClick={quandReprendre} className="plaque plaque-action min-h-12">
        {occupe ? 'Un instant…' : 'Reprendre ici'}
      </button>
      <button type="button" disabled={occupe} onClick={quandPlusTard} className="plaque min-h-12">Pas maintenant</button>
      {erreur && <p role="alert" className="compte-message erreur">{erreur}</p>}
    </section>
  </main>;
}
