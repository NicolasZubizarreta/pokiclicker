import { useEffect, useRef, useState } from 'react';
import type { PartieListee } from '../synchro';
import { duree, nomRegion, nomZone } from './format-partie';

export function EcranParties({ parties, horsConnexion, chargement, occupe, erreur, quandJouer, quandCreer, quandSupprimer, quandRetour }: {
  parties: PartieListee[]; horsConnexion: boolean; chargement: boolean; occupe: boolean; erreur: string;
  quandJouer: (id: string) => void; quandCreer: (nom: string) => void; quandSupprimer: (id: string) => void; quandRetour?: () => void;
}) {
  const titre = useRef<HTMLHeadingElement>(null);
  const confirmation = useRef<HTMLParagraphElement>(null);
  const declencheur = useRef<HTMLButtonElement | null>(null);
  const [suppression, fixerSuppression] = useState<string | null>(null);
  const [nom, fixerNom] = useState('');
  const [erreurNom, fixerErreurNom] = useState('');
  useEffect(() => { titre.current?.focus(); }, []);
  useEffect(() => { if (suppression) confirmation.current?.focus(); }, [suppression]);
  return <main data-theme="dark" className="min-h-dvh bg-fond text-texte font-texte p-4 lg:p-8 grid content-center">
    <section className="cadre bg-surface p-4 lg:p-8 w-full max-w-(--breakpoint-md) mx-auto">
      {quandRetour && <button disabled={occupe} onClick={quandRetour} className="min-h-11 p-2 text-lien underline">Retour au jeu</button>}
      <h1 ref={titre} tabIndex={-1} className="font-titre text-2xl mb-4">{!parties.length && !chargement ? 'Crée ta première partie' : 'Tes parties'}</h1>
      {(chargement || horsConnexion) && <p role="status" className="mb-4">{chargement ? 'Chargement de tes parties…' : 'Hors connexion : tu vois seulement les parties de cet appareil.'}</p>}
      <div className="grid gap-4 md:grid-cols-2 items-start">
        {parties.map(partie => <section key={partie.id} className="cadre bg-surface-2 p-4">
          <h2 className="font-titre text-xl mb-4">{partie.nom}</h2>
          {partie.courante && <p className="mb-4">En cours</p>}
          {!partie.surServeur && <p className="mb-4">Sur cet appareil seulement</p>}
          <dl className="mb-4">
            <dt className="text-sm text-texte-doux">Région</dt><dd className="mb-2">{nomRegion(partie.regionCourante)}</dd>
            <dt className="text-sm text-texte-doux">Zone</dt><dd className="mb-2">{nomZone(partie.zoneId)}</dd>
            <dt className="text-sm text-texte-doux">Temps de jeu</dt><dd className="mb-2 text-region-accent">{duree(partie.tempsJeuMs)}</dd>
            <dt className="text-sm text-texte-doux">Dernière sauvegarde</dt><dd className="mb-2">{new Date(partie.ecritLe).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })}</dd>
          </dl>
          {!partie.courante && <button disabled={occupe} onClick={() => quandJouer(partie.id)} className="min-h-11 p-2 w-full bg-surface-2 border border-bordure hover:bg-selection disabled:text-texte-doux">Jouer cette partie</button>}
          <button disabled={occupe} className="min-h-11 py-2 text-lien underline" onClick={e => { declencheur.current = e.currentTarget; fixerSuppression(partie.id); }}>Supprimer</button>
          {suppression === partie.id && <div className="grid gap-2 mt-2">
            <p ref={confirmation} tabIndex={-1}>Supprimer « {partie.nom} » ? Sa progression sera perdue pour de bon. Tes diamants, tes succès et tes skins restent sur ton compte.</p>
            <div className="flex flex-wrap items-center gap-4">
              <button disabled={occupe} onClick={() => quandSupprimer(partie.id)} className="min-h-11 p-2 text-erreur-base bg-surface-2 border border-bordure hover:bg-selection disabled:text-texte-doux"><span aria-hidden="true">✗ </span>Oui, supprimer</button>
              <button disabled={occupe} className="min-h-11 p-2 text-lien underline" onClick={() => { fixerSuppression(null); declencheur.current?.focus(); }}>Annuler</button>
            </div>
          </div>}
        </section>)}
      </div>
      <form noValidate className="grid gap-4 mt-4" onSubmit={e => {
        e.preventDefault();
        if (occupe) return;
        if (!nom.trim()) { fixerErreurNom('Donne un nom à ta partie.'); return; }
        fixerErreurNom(''); quandCreer(nom.trim());
      }}>
        <label htmlFor="nom-partie" className="grid gap-2">Nom de la partie
          <input id="nom-partie" required maxLength={100} disabled={occupe} value={nom} onChange={e => { fixerNom(e.target.value); fixerErreurNom(''); }} className="min-h-11 p-2 w-full bg-surface-2 text-base" />
        </label>
        <button disabled={occupe} className="min-h-11 p-2 w-full bg-action text-action-texte hover:bg-action-survol disabled:bg-surface-2 disabled:text-texte-doux">Créer la partie</button>
      </form>
      {(erreur || erreurNom) && <p role="alert" className="mt-4">{erreur || erreurNom}</p>}
    </section>
  </main>;
}
