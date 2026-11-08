import { useStore } from 'zustand';
import { IconeRetour } from './icones-menu';
import { storeJeu } from './store';
import { useTelephone } from './useTelephone';
import './DexPC.css';

export function StatistiquesPage({ retour }: { retour(): void }) {
  const statistiques = useStore(storeJeu, etat => etat.statistiques);
  const telephone = useTelephone();
  const cartes = statistiques.map(stat => <section key={stat.libelle} aria-label={stat.libelle} className="cadre grid gap-2 bg-surface p-4">
    <h2 className="font-titre text-lg font-bold">{stat.libelle}</h2>
    {stat.valeur !== undefined ? <p className="font-titre text-2xl font-bold text-region-accent">{stat.valeur.toLocaleString('fr-FR')}{stat.unite}</p> : <dl className="grid grid-cols-[auto_1fr] gap-x-3">
      {stat.base !== undefined && <><dt className="text-texte-doux">{stat.libelleBase ?? 'Base'}</dt><dd className="text-right font-bold">{stat.base}</dd></>}
      <dt className="text-texte-doux">{stat.total === undefined ? 'Boosts passifs' : 'Boosts'}</dt><dd className="text-right font-bold">{stat.boosts?.join(', ') || 'Aucun'}</dd>
      {stat.total !== undefined && <><dt className="text-texte-doux">Total</dt><dd className="text-right font-bold text-region-accent">{stat.total}</dd></>}
    </dl>}
  </section>);
  if (!telephone) return <section className="stats-pc text-base"><header className="flex items-center gap-4"><button type="button" onClick={retour} className="plaque min-h-11 px-4">Retour au menu</button><h1 tabIndex={-1} className="font-titre text-2xl font-semibold">Statistiques</h1></header><div className="stats-grille">{cartes}</div></section>;

  return <section className="mx-auto max-w-screen-xl space-y-4 text-base">
    <header className="flex items-center gap-2">
      <button type="button" aria-label="Retour au menu" onClick={retour}
        className="flex min-h-11 min-w-11 items-center justify-center bg-surface-2 hover:bg-selection"><IconeRetour /></button>
      <h1 tabIndex={-1} className="font-titre text-2xl font-semibold">Statistiques</h1>
    </header>
    {statistiques.map(stat => <section key={stat.libelle} aria-label={stat.libelle} className="cadre grid gap-2 bg-surface p-4">
      <h2 className="font-titre text-lg font-bold">{stat.libelle}</h2>
      {stat.valeur !== undefined
        ? <p className="font-titre text-2xl font-bold text-region-accent">{stat.valeur.toLocaleString('fr-FR')}{stat.unite}</p>
        : <dl className="grid grid-cols-[auto_1fr] gap-x-3">
          {stat.base !== undefined && <>
            <dt className="text-texte-doux">{stat.libelleBase ?? 'Base'}</dt>
            <dd className="text-right font-bold">{stat.base}</dd>
          </>}
          <dt className="text-texte-doux">{stat.total === undefined ? 'Boosts passifs' : 'Boosts'}</dt>
          <dd className="text-right font-bold">{stat.boosts?.join(', ') || 'Aucun'}</dd>
          {stat.total !== undefined && <>
            <dt className="text-texte-doux">Total</dt>
            <dd className="text-right font-bold text-region-accent">{stat.total}</dd>
          </>}
        </dl>}
    </section>)}
  </section>;
}
