import { useSyncExternalStore, type ReactNode } from 'react';
import { useStore } from 'zustand';
import { creditPiste, musiques } from '../core/musiques';
import { IconeRetour } from './icones-menu';
import { Interrupteur } from './Interrupteur';
import { musique } from './musique';
import { storeJeu } from './store';
import { volumes, type Canal } from './volumes';
import { useTelephone } from './useTelephone';
import './MenuPC.css';

function PanneauPC({ telephone, titre, children }: { telephone: boolean; titre: string; children: ReactNode }) {
  return telephone ? <section className="space-y-4" aria-label={titre}><h2 className="font-titre text-xl font-semibold">{titre}</h2>{children}</section> : <section className="cadre reglages-pc-panneau"><h2 className="font-titre text-lg">{titre}</h2>{children}</section>;
}

function CurseurVolume({ canal, libelle, actif }: { canal: Canal; libelle: string; actif: boolean }) {
  const valeur = useSyncExternalStore(volumes.abonner, () => volumes.instantane()[canal]);
  return <div className="flex items-center gap-4">
    <input type="range" min={0} max={100} step={1} value={valeur} disabled={!actif}
      aria-label={libelle} aria-valuetext={`${valeur} %`}
      onChange={evenement => volumes.definir(canal, Number(evenement.target.value))}
      className="min-h-12 min-w-0 flex-1 accent-region-accent disabled:opacity-50" />
    <span className="w-8 text-right text-region-accent">{valeur}</span>
  </div>;
}

export function PageReglages({ retour }: { retour?(): void }) {
  const telephone = useTelephone();
  const musiqueActive = useSyncExternalStore(musique.abonner, musique.estActive);
  const sonActive = useStore(storeJeu, e => e.sonActive);
  const autoClicLie = useStore(storeJeu, e => e.autoClicLie);
  const evolutionAuto = useStore(storeJeu, e => e.evolutionAuto);
  const passerEclosions = useStore(storeJeu, e => e.passerEclosions);
  const relacherDoublons = useStore(storeJeu, e => e.relacherDoublons);
  const notifications = useStore(storeJeu, e => e.notifications);
  const journalActif = useStore(storeJeu, e => e.journalActif);
  const exporterReleve = () => {
    const releve = storeJeu.getState().exporterJournal();
    if (!releve) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(releve, null, 2)], { type: 'application/json' }));
    const lien = document.createElement('a');
    lien.href = url;
    lien.download = `poki-releve-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.append(lien);
    try { lien.click(); } finally {
      lien.remove();
      setTimeout(() => URL.revokeObjectURL(url), 0);
    }
  };

  return <section className={telephone ? 'mx-auto max-w-screen-xl space-y-4 text-base' : 'reglages-pc'}>
    <header className="flex items-center gap-2">
      {retour && <button type="button" aria-label={telephone ? 'Retour' : 'Retour au menu'} onClick={retour}
        className="flex min-h-12 min-w-12 items-center justify-center bg-surface-2 hover:bg-selection"><IconeRetour />{!telephone && 'Retour au menu'}</button>}
      <h1 tabIndex={-1} className="font-titre text-2xl font-semibold">Réglages</h1>
    </header>
    <PanneauPC telephone={telephone} titre="Son">
    <section className="cadre bg-surface p-4">
      <div className="flex items-center justify-between gap-4">
        <div><h3 className="font-titre font-semibold">Musique</h3><p className="text-sm text-texte-doux">{musiqueActive ? 'Activée' : 'Désactivée'}</p></div>
        <Interrupteur nom="Musique" actif={musiqueActive} basculer={() => musique.basculer()} />
      </div>
      <CurseurVolume canal="musique" libelle="Volume de la musique" actif={musiqueActive} />
    </section>
    <section className="cadre bg-surface p-4">
      <div className="flex items-center justify-between gap-4">
        <div><h3 className="font-titre font-semibold">Effets sonores</h3><p className="text-sm text-texte-doux">{sonActive ? 'Activés' : 'Désactivés'}</p></div>
        <Interrupteur nom="Effets sonores" actif={sonActive} basculer={() => storeJeu.getState().basculerSon()} />
      </div>
      <CurseurVolume canal="effets" libelle="Volume des effets sonores" actif={sonActive} />
    </section>
    <details className="bg-surface-2 px-4 py-2">
      <summary className="min-h-12 cursor-pointer py-2">Crédits des musiques</summary>
      <div className="space-y-2 pb-2">
        {Object.values(musiques.pistes).map(piste => <p key={piste.fichier}>{creditPiste(piste)}</p>)}
      </div>
    </details>
    </PanneauPC>
    <PanneauPC telephone={telephone} titre="Combat">
    <section className="cadre bg-surface p-4">
      <div className="flex items-center justify-between gap-4">
        <div><h3 className="font-titre font-semibold">Auto-clic lié à l'attaque auto</h3>
          <p className="text-sm text-texte-doux">{autoClicLie ? "Lié : l'auto-clic s'active et s'arrête avec Attaque auto" : "Délié : l'auto-clic est désactivé"}</p></div>
        <Interrupteur nom="Auto-clic lié à l'attaque auto" actif={autoClicLie} basculer={() => storeJeu.getState().reglerAutoClicLie(!autoClicLie)} />
      </div>
      <p className="mt-2 text-sm text-texte-doux">Sans effet tant que tu n'as pas acheté les Restes (Shop, Sylphe SARL).</p>
    </section>
    <section className="cadre bg-surface p-4">
      <div className="flex items-center justify-between gap-4">
        <div><h3 className="font-titre font-semibold">Évolution automatique</h3>
          <p className="text-sm text-texte-doux">{evolutionAuto ? 'Activée' : 'Désactivée'}</p></div>
        <Interrupteur nom="Évolution automatique" actif={evolutionAuto} basculer={() => storeJeu.getState().reglerEvolutionAuto(!evolutionAuto)} />
      </div>
      <p className="mt-2 text-sm text-texte-doux">Quand un Pokémon est prêt, une fenêtre te propose de le faire évoluer. Désactivée, il faut l'évoluer toi-même depuis sa fiche.</p>
    </section>
    </PanneauPC>
    <PanneauPC telephone={telephone} titre="Collection">
    <section className="cadre bg-surface p-4">
      <div className="flex items-center justify-between gap-4">
        <div><h3 className="font-titre font-semibold">Passer les éclosions</h3>
          <p className="text-sm text-texte-doux">{passerEclosions ? 'Activée' : 'Désactivée'}</p></div>
        <Interrupteur nom="Passer les éclosions" actif={passerEclosions} basculer={() => storeJeu.getState().reglerPasserEclosions(!passerEclosions)} />
      </div>
      <p className="mt-2 text-sm text-texte-doux">Quand un œuf éclôt, la fenêtre d'éclosion ne s'ouvre pas : le Pokémon est ajouté directement et une notification le dit. Utile pour laisser tourner la pension.</p>
    </section>
    <section className="cadre bg-surface p-4">
      <div className="flex items-center justify-between gap-4">
        <div><h3 className="font-titre font-semibold">Relâcher automatiquement les doublons</h3>
          <p className="text-sm text-texte-doux">{relacherDoublons ? 'Activée' : 'Désactivée'}</p></div>
        <Interrupteur nom="Relâcher automatiquement les doublons" actif={relacherDoublons} basculer={() => storeJeu.getState().reglerRelacherDoublons(!relacherDoublons)} />
      </div>
      <p className="mt-2 text-sm text-texte-doux">Un Pokémon capturé dont l'espèce est déjà dans ton Pokédex est relâché aussitôt. Un Pokémon éclos dont l'espèce est déjà dans ta collection d'éclos est relâché aussitôt. Les chromatiques ne sont jamais relâchés, et les récompenses de capture sont versées comme d'habitude.</p>
    </section>
    </PanneauPC>
    <PanneauPC telephone={telephone} titre="Affichage">
    <section className="cadre bg-surface p-4">
      <div className="flex items-center justify-between gap-4">
        <div><h3 className="font-titre font-semibold">Notifications</h3>
          <p className="text-sm text-texte-doux">{notifications ? 'Activées' : 'Désactivées'}</p></div>
        <Interrupteur nom="Notifications" actif={notifications} basculer={() => storeJeu.getState().reglerNotifications(!notifications)} />
      </div>
      <p className="mt-2 text-sm text-texte-doux">Les messages en bas à droite : niveau gagné, éclosion, relâche automatique, objet utilisé… Désactivées, ils ne s'affichent plus.</p>
    </section>
    {!import.meta.env.PROD && <details className="cadre mt-4 space-y-4 bg-surface p-4">
      <summary className="min-h-12 cursor-pointer py-2">Avancé</summary>
      <h3 className="font-titre font-semibold">Relevé de partie</h3>
      <p className="text-texte-doux">Le relevé reste sur cet appareil. Active-le pour jouer, exporter ou effacer. Les temps actifs excluent les pauses et les onglets masqués, mais incluent les attentes visibles, captures et dialogues. Les clics et le hasard diffèrent du simulateur.</p>
      <button type="button" role="switch" aria-checked={journalActif} onClick={() => storeJeu.getState().basculerJournal()}
        className="flex min-h-12 w-full items-center justify-between gap-2 bg-surface-2 px-4 py-2 text-left hover:bg-selection">
        <span>Relevé de partie</span><span className="text-region-accent">{journalActif ? 'Activé' : 'Désactivé'}</span>
      </button>
      <button type="button" disabled={!journalActif} onClick={exporterReleve}
        className="min-h-12 bg-surface-2 px-4 py-2 hover:bg-selection">Exporter le relevé</button>
      <button type="button" disabled={!journalActif} onClick={() => {
        if (window.confirm('Effacer le relevé de partie sur cet appareil ?')) storeJeu.getState().effacerJournal();
      }} className="min-h-12 bg-surface-2 px-4 py-2 hover:bg-selection">Effacer le relevé</button>
    </details>}
    </PanneauPC>
  </section>;
}
