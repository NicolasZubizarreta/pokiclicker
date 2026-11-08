import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { PartieListee, VersionArchivee } from '../synchro';
import { duree, nomRegion, nomZone } from './format-partie';
import { IconeAjout, IconeCorbeille, IconeCrayon } from './icones-compte';
import { IconeRetour } from '../icones-menu';
import { useTelephone } from '../useTelephone';

export function Parties({ parties, horsConnexion, chargement, occupe, erreur, quandJouer, quandCreer, quandSupprimer, quandRenommer, quandRetourJeu, quandListerVersions, quandRestaurer }: {
  parties: PartieListee[]; horsConnexion: boolean; chargement: boolean; occupe: boolean; erreur: string;
  quandJouer(id: string): void; quandCreer(nom: string): void; quandSupprimer(id: string): void; quandRetourJeu?: () => void;
  quandRenommer?(id: string, nom: string): Promise<boolean>;
  quandListerVersions?(id: string): Promise<VersionArchivee[] | null>;
  quandRestaurer?(id: string, lot: string): Promise<'ok' | 'introuvable' | 'echec'>;
}) {
  const telephone = useTelephone();
  const Grille = telephone ? Fragment : 'div';
  const BarreTitre = telephone ? Fragment : 'header';
  const [nouvelle, fixerNouvelle] = useState(false);
  const [nom, fixerNom] = useState('');
  const [nomInvalide, fixerNomInvalide] = useState(false);
  const [suppression, fixerSuppression] = useState<PartieListee | null>(null);
  const titre = useRef<HTMLHeadingElement>(null);
  const dialogue = useRef<HTMLDialogElement>(null);
  const titreDialogue = useRef<HTMLHeadingElement>(null);
  const declencheur = useRef<HTMLButtonElement | null>(null);
  const [restauration, fixerRestauration] = useState<PartieListee | null>(null);
  const [versions, fixerVersions] = useState<VersionArchivee[] | null | undefined>(undefined);
  const [choisie, fixerChoisie] = useState<VersionArchivee | null>(null);
  const [restaure, fixerRestaure] = useState(false);
  const [erreurRestauration, fixerErreurRestauration] = useState('');
  const dialogueRestauration = useRef<HTMLDialogElement>(null);
  const titreRestauration = useRef<HTMLHeadingElement>(null);
  const declencheurRestauration = useRef<HTMLButtonElement | null>(null);
  const recherche = useRef(0);
  const bloqueRestauration = occupe || restaure;
  const dateVersion = (v: VersionArchivee) => new Date(v.remplaceLe).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' });
  async function chargerVersions(id: string) {
    const numero = ++recherche.current;
    fixerVersions(undefined);
    let resultat: VersionArchivee[] | null;
    try { resultat = await quandListerVersions!(id); } catch { resultat = null; }
    if (numero === recherche.current) fixerVersions(resultat);
  }
  useEffect(() => {
    if (!restauration) return;
    const fenetre = dialogueRestauration.current!;
    fenetre.showModal(); titreRestauration.current?.focus();
    // Le compteur est volontairement relu à la fermeture : il invalide une recherche encore en cours.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => { recherche.current++; fenetre.close(); declencheurRestauration.current?.focus(); };
  }, [restauration]);
  const contenu = useRef<HTMLDivElement>(null);
  const [edition, fixerEdition] = useState<string | null>(null);
  const [nomEdition, fixerNomEdition] = useState('');
  const [editionInvalide, fixerEditionInvalide] = useState(false);
  const champEdition = useRef<HTMLInputElement>(null);
  const crayons = useRef(new Map<string, HTMLButtonElement>());
  const focusCrayon = useRef<string | null>(null);
  const idsParties = parties.map(p => p.id).join(',');
  const [idsPrecedents, fixerIdsPrecedents] = useState(idsParties);
  if (idsPrecedents !== idsParties) {
    fixerIdsPrecedents(idsParties); fixerEdition(null);
  }
  useLayoutEffect(() => {
    if (edition) { champEdition.current?.focus(); champEdition.current?.select(); }
    else if (focusCrayon.current && !occupe) {
      crayons.current.get(focusCrayon.current)?.focus(); focusCrayon.current = null;
    }
  }, [edition, occupe]);
  function fermerEdition(id: string) { focusCrayon.current = id; fixerEdition(null); }
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
    <div ref={contenu} className={`${telephone ? '' : 'parties-pc '}flex flex-col gap-4`} inert={!!suppression || !!restauration}>
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
      </form> : !nouvelle && parties.length > 0 && <Grille {...(telephone ? {} : { className: 'parties-grille' })}>
        <p className="text-texte-doux">Choisis une partie à jouer.</p>
        {parties.map(p => <article key={p.id} aria-label={p.nom} className="cadre zc-partie">
          <div className="flex flex-wrap items-center gap-2">
            {edition === p.id ? <form className="compte-formulaire" onKeyDown={e => {
              if (e.key === 'Escape' && !occupe) { e.preventDefault(); fermerEdition(p.id); }
            }} onSubmit={async e => {
              e.preventDefault(); if (occupe) return;
              const nettoye = nomEdition.trim();
              if (!nettoye) { fixerEditionInvalide(true); return; }
              if (nettoye === p.nom) { fermerEdition(p.id); return; }
              if (await quandRenommer?.(p.id, nettoye)) fermerEdition(p.id);
            }}>
              <div className={`compte-champ${editionInvalide ? ' en-erreur' : ''}`}>
                <label htmlFor="nom-edition">Nom de la partie</label>
                <div className="zone-saisie"><input ref={champEdition} id="nom-edition" maxLength={100} value={nomEdition} disabled={occupe}
                  aria-invalid={editionInvalide || undefined} aria-describedby={editionInvalide ? 'nom-edition-erreur' : undefined}
                  onChange={e => { fixerNomEdition(e.target.value); fixerEditionInvalide(false); }} /></div>
                {editionInvalide && <p id="nom-edition-erreur" role="alert">Donne un nom à ta partie.</p>}
              </div>
              <button type="submit" className="plaque plaque-action min-h-12" disabled={occupe}>Valider</button>
              <button type="button" className="plaque min-h-12" disabled={occupe} onClick={() => fermerEdition(p.id)}>Annuler</button>
            </form> : <h2 className="font-titre text-xl font-bold">{p.nom}</h2>}
            {quandRenommer && <button key="renommer" ref={bouton => { if (bouton) crayons.current.set(p.id, bouton); else crayons.current.delete(p.id); }} type="button" className="plaque min-h-12 min-w-12" aria-label={`Renommer ${p.nom}`} disabled={occupe} hidden={edition === p.id}
              onClick={() => { if (occupe) return; fixerNomEdition(p.nom); fixerEditionInvalide(false); fixerEdition(p.id); }}><IconeCrayon /></button>}
            {p.courante && <span className="zc-tag info">En cours</span>}
            {p.ailleurs && <span className="zc-tag info"><span className="zc-point" aria-hidden="true" />Ouverte ailleurs</span>}
            {!p.surServeur ? <span className="zc-tag alerte">Sur cet appareil seulement</span> : !p.courante && !p.ailleurs && <span className="zc-tag succes">À jour</span>}
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
          {quandListerVersions && quandRestaurer && <button type="button" className="plaque min-h-12 w-full" disabled={occupe}
            aria-label={`Restaurer une sauvegarde précédente de ${p.nom}`} onClick={e => {
              if (occupe || restauration) return;
              declencheurRestauration.current = e.currentTarget;
              fixerChoisie(null); fixerErreurRestauration(''); fixerRestauration(p); void chargerVersions(p.id);
            }}>Restaurer une sauvegarde précédente</button>}
        </article>)}
        <button type="button" className="plaque min-h-14 w-full" disabled={occupe} onClick={() => fixerNouvelle(true)}><IconeAjout />Nouvelle partie</button>
      </Grille>}
    </div>
    {suppression && <dialog ref={dialogue} className="cadre zc-dialogue" role="dialog" aria-modal="true" aria-labelledby="zc-suppression-titre"
      onCancel={e => { e.preventDefault(); if (!occupe) fixerSuppression(null); }}
      onKeyDown={e => { if (e.key === 'Escape') { e.preventDefault(); if (!occupe) fixerSuppression(null); } }}>
      <BarreTitre {...(telephone ? {} : { className: 'fenetre-titre' })}>
      <h2 ref={titreDialogue} id="zc-suppression-titre" tabIndex={-1} className="font-titre text-xl font-bold">Supprimer « {suppression.nom} » ?</h2>
      {!telephone && <button type="button" className="plaque" aria-label="Fermer" disabled={occupe} onClick={() => fixerSuppression(null)}>×</button>}
      </BarreTitre>
      <p>Sa progression sera perdue pour de bon. Tes diamants, tes succès et tes skins restent sur ton compte.</p>
      <button type="button" className="plaque zc-danger min-h-12" disabled={occupe} onClick={() => {
        if (occupe) return; quandSupprimer(suppression.id); fixerSuppression(null);
      }}>Oui, supprimer</button>
      <button type="button" className="plaque min-h-12" disabled={occupe} onClick={() => fixerSuppression(null)}>Annuler</button>
    </dialog>}
    {restauration && <dialog ref={dialogueRestauration} className="cadre zc-dialogue" role="dialog" aria-modal="true" aria-labelledby="zc-restauration-titre"
      onCancel={e => { e.preventDefault(); if (!bloqueRestauration) fixerRestauration(null); }}
      onKeyDown={e => { if (e.key === 'Escape') { e.preventDefault(); if (!bloqueRestauration) fixerRestauration(null); } }}>
      <BarreTitre {...(telephone ? {} : { className: 'fenetre-titre' })}>
      <h2 ref={titreRestauration} id="zc-restauration-titre" tabIndex={-1} className="font-titre text-xl font-bold">Restaurer une sauvegarde précédente</h2>
      {!telephone && <button type="button" className="plaque" aria-label="Fermer" disabled={bloqueRestauration} onClick={() => fixerRestauration(null)}>×</button>}
      </BarreTitre>
      {erreurRestauration && <p role="alert">{erreurRestauration}</p>}
      {choisie ? <>
        <p>Cela remplace la sauvegarde actuelle de « {restauration.nom} ». L'actuelle est mise de côté à son tour : rien n'est perdu.</p>
        <dl><dt>Mise de côté le</dt><dd>{dateVersion(choisie)}</dd><dt>Temps de jeu</dt><dd>{choisie.tempsJeuMs === null ? '—' : duree(choisie.tempsJeuMs)}</dd></dl>
        <button type="button" className="plaque plaque-action min-h-12" disabled={bloqueRestauration} onClick={async () => {
          if (bloqueRestauration) return;
          fixerRestaure(true); fixerErreurRestauration('');
          let resultat: 'ok' | 'introuvable' | 'echec';
          try { resultat = await quandRestaurer!(restauration.id, choisie.lot); } catch { resultat = 'echec'; }
          fixerRestaure(false);
          if (resultat === 'ok') fixerRestauration(null);
          else if (resultat === 'introuvable') {
            fixerErreurRestauration("Cette sauvegarde n'existe plus. Choisis-en une autre.");
            fixerChoisie(null); void chargerVersions(restauration.id);
          } else fixerErreurRestauration("Connexion impossible. Rien n'a changé, réessaie.");
        }}>Oui, restaurer</button>
        <button type="button" className="plaque min-h-12" disabled={bloqueRestauration} onClick={() => { fixerChoisie(null); fixerErreurRestauration(''); }}>Retour</button>
      </> : <>
        {versions === undefined ? <p role="status">Recherche des sauvegardes…</p> : versions === null ? <p role="alert">Connexion impossible. Réessaie.</p> : !versions.length ?
          <p>Aucune sauvegarde précédente pour cette partie. Elles apparaissent quand une partie est reprise ailleurs ou restaurée.</p> : <>
            <p>Retrouve une ancienne version de ta partie. Celle d'aujourd'hui sera mise de côté, rien n'est perdu.</p>
            <ul className="flex flex-col gap-4">{versions.map(v => <li key={v.lot} className="cadre zc-partie">
              <dl><dt>Mise de côté le</dt><dd>{dateVersion(v)}</dd>
                <dt>Temps de jeu</dt><dd>{v.tempsJeuMs === null ? '—' : duree(v.tempsJeuMs)}</dd>
                <dt>Zone</dt><dd>{nomRegion(v.regionCourante)}{v.zoneId ? ` · ${nomZone(v.zoneId)}` : ''}</dd>
                {v.niveauEquipe !== null && <><dt>Niveau de l'équipe</dt><dd>{v.niveauEquipe}</dd></>}
              </dl>
              <button type="button" className="plaque min-h-12" disabled={bloqueRestauration} aria-label={`Restaurer cette version du ${dateVersion(v)}`}
                onClick={() => { fixerChoisie(v); fixerErreurRestauration(''); }}>Restaurer cette version</button>
            </li>)}</ul>
          </>}
        <button type="button" className="plaque min-h-12" disabled={bloqueRestauration} onClick={() => fixerRestauration(null)}>{versions?.length === 0 ? 'Fermer' : 'Annuler'}</button>
      </>}
    </dialog>}
  </>;
}
