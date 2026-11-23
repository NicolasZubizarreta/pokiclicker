import { Fragment, type ReactNode } from 'react';
import { CATEGORIES_DEPENSE, JEUX_SUIVIS, type Suivi } from '../core/suivi';
import { joursRecents } from './argent-jours';
import { formaterDuree, formaterTempsBoss } from './duree';
import { formaterNombre } from './nombres';

const depenses = { boutique: 'Boutique', centre: 'Centre commercial', casino: 'Casino (achats de jetons)', pension: 'Pension', safari: 'Parc Safari' };
const jeux = { machine: 'Machine à sous', roulette: 'Roulette', plusOuMoins: 'Plus ou moins',
  pileOuFace: 'Pile ou face', gratter: 'Carte à gratter', blackjack: 'Blackjack', voltorbe: 'Voltorbe Flip' };
const cadre = 'cadre grid content-start gap-2 bg-surface p-4 text-base tabular-nums';
const titreCarte = 'font-titre text-lg font-bold';

function Carte({ titre, lignes, children }: { titre: string; lignes: [string, ReactNode][]; children?: ReactNode }) {
  return <section aria-label={titre} className={cadre}>
    <h2 className={titreCarte}>{titre}</h2>
    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
      {lignes.map(([libelle, valeur]) => <Fragment key={libelle}>
        <dt className="text-texte-doux">{libelle}</dt>
        <dd className="text-right font-bold">{typeof valeur === 'number' ? formaterNombre(valeur) : valeur}</dd>
      </Fragment>)}
    </dl>{children}
  </section>;
}

export function StatistiquesSuivi({ suivi, tempsJeuMs, aujourdhui = new Date() }: {
  suivi: Suivi; tempsJeuMs: number; aujourdhui?: Date;
}) {
  const { records } = suivi;
  const parties: [string, string][] = [];
  for (const jeu of JEUX_SUIVIS) {
    const n = suivi.casino[jeu]?.parties ?? 0;
    if (n > 0) parties.push([jeux[jeu], `${formaterNombre(n)} partie${n > 1 ? 's' : ''}`]);
  }
  const jours = joursRecents(suivi.argentJours, aujourdhui);
  const maximum = Math.max(...jours.map(jour => jour.valeur));
  return <>
    <Carte titre="Partie" lignes={[
      ['Temps de jeu', formaterDuree(tempsJeuMs)], ['Pokémon capturés', suivi.captures],
      ['Dont chromatiques', suivi.capturesShiny], ['Évolutions', suivi.evolutions],
      ['Œufs éclos', suivi.oeufsEclos], ['Boss vaincus', suivi.bossVaincus],
    ]} />
    <Carte titre="Argent dépensé" lignes={[
      ...CATEGORIES_DEPENSE.map((cle): [string, number] => [depenses[cle], suivi.depenses[cle] ?? 0]),
      ['Total', Object.values(suivi.depenses).reduce((total, n) => total + n, 0)],
    ]} />
    <Carte titre="Casino" lignes={[
      ['Jetons gagnés', suivi.jetons.gagnes], ['Jetons perdus', suivi.jetons.perdus], ...parties,
    ]}>{!parties.length && <p>Aucune partie</p>}</Carte>
    <Carte titre="Records" lignes={[
      ['Plus gros dégât de clic', records.degatsClicMax], ['DPS maximal', records.dpsMax],
      ['Meilleure série de victoires', <>{formaterNombre(records.serieVictoiresMax)}
        <span className="block font-normal text-texte-doux">En cours : {formaterNombre(suivi.serieVictoires)}</span></>],
      ['Meilleur temps de boss', formaterTempsBoss(records.tempsBossMinMs)],
      ['Cadence maximale', `${formaterNombre(records.cadenceMax)} clic${records.cadenceMax > 1 ? 's' : ''} par seconde`],
      ['Captures en une heure', records.capturesHeureMax],
      ['Plus longue chaîne de rencontres', records.chaineMax],
      ...(records.liguePlusMax > 0 ? [['Meilleur rang de la Ligue+', records.liguePlusMax] as [string, number]] : []),
      ...(records.mannequinDpsMax > 0 ? [['Record du mannequin', records.mannequinDpsMax] as [string, number]] : []),
    ]} />
    <section className={cadre} aria-label="Argent gagné sur 7 jours">
      <h2 className={titreCarte}>Argent gagné sur 7 jours</h2>
      {maximum === 0 ? <p>Rien de gagné depuis le début du suivi.</p> : <div>
        <svg role="img" aria-label={jours.map(j => `${j.libelle} ${j.cle} : ${formaterNombre(j.valeur)}`).join(', ')}
          viewBox="0 0 70 100" preserveAspectRatio="none" className="block h-24 w-full border-b text-region-accent">
          {jours.map((jour, i) => {
            const hauteur = 100 * (jour.valeur / maximum);
            return <rect key={jour.cle} x={10 * i + 2} y={100 - hauteur} width="6" height={hauteur} fill="currentColor" />;
          })}
        </svg>
        <div aria-hidden="true" className="grid grid-cols-7 text-center">{jours.map(j => <span key={j.cle}>{j.libelle}</span>)}</div>
      </div>}
    </section>
  </>;
}
