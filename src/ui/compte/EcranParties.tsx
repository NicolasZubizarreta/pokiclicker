import { useEffect, useRef, useState } from 'react';
import type { PartieListee } from '../synchro';
import { duree, nomRegion, nomZone } from './format-partie';
import { IconeAjout, IconeCorbeille } from './icones-compte';
import { IconeRetour } from '../icones-menu';

export function Parties({ parties, horsConnexion, chargement, occupe, erreur, quandJouer, quandCreer, quandSupprimer, quandRetourJeu }: {
  parties: PartieListee[]; horsConnexion: boolean; chargement: boolean; occupe: boolean; erreur: string;
  quandJouer(id: string): void; quandCreer(nom: string): void; quandSupprimer(id: string): void; quandRetourJeu?: () => void;
}) {
  const [nouvelle, fixerNouvelle] = useState(false);
  const [nom, fixerNom] = useState('');
  const [nomInvalide, fixerNomInvalide] = useState(false);
  const [suppression, fixerSuppression] = useState<PartieListee | null>(null);
  const titre = useRef<HTMLHeadingElement>(null);
  const dialogue = useRef<HTMLDialogElement>(null);
  const titreDialogue = useRef<HTMLHeadingElement>(null);
  const declencheur = useRef<HTMLButtonElement | null>(null);
  const contenu = useRef<HTMLDivElement>(null);
  useEffect(() => { titre.current?.focus(); }, [nouvelle]);
  useEffect(() => {
    if (!suppression) return;
    const fenetre = dialogue.current!;
    // showModal() rend déjà tout le reste de la page inerte ; un `inert` posé sur le <main> parent rendrait aussi la boîte inerte.
    fenetre.showModal();
    titreDialogue.current?.focus();
    return () => { fenetre.close(); declencheur.current?.focus(); };
  }, [suppression]);
  return <>
    <div ref={contenu} className="flex flex-col gap-4" inert={!!suppression}>
      {erreur && <p className="compte-message erreur" role="alert">{erreur}</p>}
      <header className="flex items-center gap-3">
        {nouvelle && <button type="button" className="plaque min-h-12" aria-label="Retour" disabled={occupe} onClick={() => { fixerNouvelle(false); fixerNomInvalide(false); }}><IconeRetour /></button>}
        <h1 ref={titre} tabIndex={-1} className="font-titre text-2xl font-bold">{nouvelle ? 'Nouvelle partie' : 'Mes parties'}</h1>
      </header>
      {horsConnexion && <p className="compte-message alerte" role="status">Hors connexion : tu vois seulement les parties de cet appareil.</p>}
      {chargement && <p role="status">Chargement de tes parties…</p>}
      {(nouvelle || (!parties.length && !chargement)) ? <form className="compte-formulaire cadre" onSubmit={e => {
        e.preventDefault(); if (occupe) return;
        if (!nom.trim()) { fixerNomInvalide(true); return; }
        quandCreer(nom.trim());
      }}>
        {!nouvelle && <><h2 className="font-titre text-xl font-bold">Crée ta première partie</h2><p>Une partie garde ta progression. Tu pourras en créer d'autres plus tard.</p></>}
        <div className={`compte-champ${nomInvalide ? ' en-erreur' : ''}`}>
          <label htmlFor="nom-partie">Nom de la partie</label>
          <div className="zone-saisie"><input id="nom-partie" maxLength={100} value={nom} disabled={occupe} aria-invalid={nomInvalide || undefined} aria-describedby={nomInvalide ? 'nom-partie-erreur' : undefined}
            onChange={e => { fixerNom(e.target.value); fixerNomInvalide(false); }} /></div>
          {nomInvalide && <p id="nom-partie-erreur" role="alert">Donne un nom à ta partie.</p>}
        </div>
        {nouvelle && <p className="text-texte-doux">Tu commences à Bourg Palette, dans la région de Kanto.</p>}
        <button type="submit" className="plaque plaque-action min-h-14 w-full" disabled={occupe}>Créer la partie</button>
      </form> : !nouvelle && parties.length > 0 && <>
        <p className="text-texte-doux">Choisis une partie à jouer.</p>
        {parties.map(p => <article key={p.id} aria-label={p.nom} className="cadre zc-partie">
          <div className="flex flex-wrap items-center gap-2"><h2 className="font-titre text-xl font-bold">{p.nom}</h2>
            {p.courante && <span className="zc-tag info">En cours</span>}
            {!p.surServeur ? <span className="zc-tag alerte">Sur cet appareil seulement</span> : !p.courante && <span className="zc-tag succes">À jour</span>}
          </div>
          <dl><dt>Région</dt><dd>{nomRegion(p.regionCourante)}{p.zoneId ? ` · ${nomZone(p.zoneId)}` : ''}</dd>
            <dt>Temps de jeu</dt><dd>{duree(p.tempsJeuMs)}</dd>
            <dt>Dernière sauvegarde</dt><dd>{new Date(p.ecritLe).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })}</dd></dl>
          <div className="grid grid-cols-2 gap-2">
            {(!p.courante || quandRetourJeu) && <button type="button" className="plaque plaque-action min-h-12" disabled={occupe} aria-label={`${p.courante ? 'Continuer' : 'Jouer'} ${p.nom}`}
              onClick={() => { if (!occupe) { if (p.courante) quandRetourJeu?.(); else quandJouer(p.id); } }}>{p.courante ? 'Continuer' : 'Jouer'}</button>}
            <button type="button" className="plaque zc-danger min-h-12" disabled={occupe} aria-label={`Supprimer ${p.nom}`} onClick={e => {
              if (occupe || suppression) return; declencheur.current = e.currentTarget; fixerSuppression(p);
            }}><IconeCorbeille />Supprimer</button>
          </div>
        </article>)}
        <button type="button" className="plaque min-h-14 w-full" disabled={occupe} onClick={() => fixerNouvelle(true)}><IconeAjout />Nouvelle partie</button>
      </>}
    </div>
    {suppression && <dialog ref={dialogue} className="cadre zc-dialogue" role="dialog" aria-modal="true" aria-labelledby="zc-suppression-titre"
      onCancel={e => { e.preventDefault(); if (!occupe) fixerSuppression(null); }}
      onKeyDown={e => { if (e.key === 'Escape') { e.preventDefault(); if (!occupe) fixerSuppression(null); } }}>
      <h2 ref={titreDialogue} id="zc-suppression-titre" tabIndex={-1} className="font-titre text-xl font-bold">Supprimer « {suppression.nom} » ?</h2>
      <p>Sa progression sera perdue pour de bon. Tes diamants, tes succès et tes skins restent sur ton compte.</p>
      <button type="button" className="plaque zc-danger min-h-12" disabled={occupe} onClick={() => {
        if (occupe) return; quandSupprimer(suppression.id); fixerSuppression(null);
      }}>Oui, supprimer</button>
      <button type="button" className="plaque min-h-12" disabled={occupe} onClick={() => fixerSuppression(null)}>Annuler</button>
    </dialog>}
  </>;
}
