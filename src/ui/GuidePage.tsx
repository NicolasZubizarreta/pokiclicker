import { useState } from 'react';
import { useStore } from 'zustand';
import { tutoriels } from '../core/tutoriels';
import { storeJeu } from './store';
import { lancerTuto } from './tuto/store-tuto';
import { guide } from '../core/guide';
import { IconeChevron, IconeRetour } from './icones-menu';
import { TableTypes } from './TableTypes';
import { useTelephone } from './useTelephone';
import './DexPC.css';

export function GuidePage({ retour }: { retour(): void }) {
  const vus = useStore(storeJeu, e => e.tutosVus);
  const lignesTutoriels = tutoriels.map(t => <div key={t.id} className="ligne-tuto flex flex-wrap items-center gap-2 py-2"><strong>{t.titre}</strong><span className="text-texte-doux">{vus.includes(t.id) ? 'Vu' : 'Pas encore vu'}</span><button type="button" className="plaque min-h-11 min-w-11 px-3" onClick={() => lancerTuto(t.id, true)}>Rejouer le tuto</button></div>);
  const listeTutoriels = <section aria-label="Tutoriels" className="cadre bg-surface p-3"><h2 className="font-titre text-xl font-bold">Tutoriels</h2>{lignesTutoriels}</section>;
  const [ouvert, setOuvert] = useState<string | undefined>(guide.sections[0]?.id);
  const telephone = useTelephone();
  const sections = [...guide.sections, { id: 'types', titre: 'Types', paragraphes: [] }];
  const sectionsPc = [...sections, { id: 'tutoriels', titre: 'Tutoriels', paragraphes: [] }];
  const section = sectionsPc.find(s => s.id === ouvert);
  if (!telephone) return <section className="guide-pc text-base">
    <header className="flex items-center gap-4"><button type="button" onClick={retour} className="plaque min-h-11 px-4">Retour au menu</button><h1 tabIndex={-1} className="font-titre text-2xl font-semibold">{guide.titre}</h1></header>
    <div className="guide-corps"><nav aria-label="Sections du guide">{sectionsPc.map(s => <button key={s.id} type="button" aria-current={s.id === ouvert} onClick={() => setOuvert(ouvert === s.id ? undefined : s.id)} className="min-h-11 px-3 py-2 text-left">{s.titre}</button>)}</nav>
      {section && <article className="cadre min-w-0 bg-surface p-6"><h2 className="font-titre text-xl font-bold">{section.titre}</h2>{section.id === 'types' ? <TableTypes telephone={false} /> : section.id === 'tutoriels' ? <div aria-label="Tutoriels" role="region">{lignesTutoriels}</div> : section.paragraphes.map((p, i) => <p key={i} className="max-w-prose">{p}</p>)}</article>}</div>
  </section>;

  return <section className="mx-auto max-w-screen-xl space-y-4 text-base">
    <header className="flex items-center gap-2">
      <button type="button" aria-label="Retour au menu" onClick={retour}
        className="flex min-h-11 min-w-11 items-center justify-center bg-surface-2 hover:bg-selection"><IconeRetour /></button>
      <h1 tabIndex={-1} className="font-titre text-2xl font-semibold">{guide.titre}</h1>
    </header>
    {listeTutoriels}
    <p className="text-texte-doux">{sections.length} sections. Touche un titre pour l'ouvrir.</p>
    {sections.map(section => <details key={section.id} open={ouvert === section.id} className="cadre bg-surface">
      <summary className="flex min-h-11 cursor-pointer items-center gap-2 px-3 py-2 font-bold"
        onClick={event => {
          event.preventDefault();
          setOuvert(ouvert === section.id ? undefined : section.id);
        }}>
        {section.titre}<span className={`ml-auto ${ouvert === section.id ? 'rotate-90' : ''}`}><IconeChevron /></span>
      </summary>
      <div className="grid gap-2 px-3 pb-3">
        {section.id === 'types' ? <TableTypes telephone /> : section.paragraphes.map((paragraphe, index) => <p key={index} className="max-w-prose break-words">{paragraphe}</p>)}
      </div>
    </details>)}
  </section>;
}
