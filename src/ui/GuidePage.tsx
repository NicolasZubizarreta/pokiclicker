import { useState } from 'react';
import { guide } from '../core/guide';
import { IconeChevron, IconeRetour } from './icones-menu';

export function GuidePage({ retour }: { retour(): void }) {
  const [ouvert, setOuvert] = useState<string | undefined>(guide.sections[0]?.id);

  return <section className="mx-auto max-w-screen-xl space-y-4 text-base">
    <header className="flex items-center gap-2">
      <button type="button" aria-label="Retour au menu" onClick={retour}
        className="flex min-h-11 min-w-11 items-center justify-center bg-surface-2 hover:bg-selection"><IconeRetour /></button>
      <h1 tabIndex={-1} className="font-titre text-2xl font-semibold">{guide.titre}</h1>
    </header>
    <p className="text-texte-doux">{guide.sections.length} sections. Touche un titre pour l'ouvrir.</p>
    {guide.sections.map(section => <details key={section.id} open={ouvert === section.id} className="cadre bg-surface">
      <summary className="flex min-h-11 cursor-pointer items-center gap-2 px-3 py-2 font-bold"
        onClick={event => {
          event.preventDefault();
          setOuvert(ouvert === section.id ? undefined : section.id);
        }}>
        {section.titre}<span className={`ml-auto ${ouvert === section.id ? 'rotate-90' : ''}`}><IconeChevron /></span>
      </summary>
      <div className="grid gap-2 px-3 pb-3">
        {section.paragraphes.map((paragraphe, index) => <p key={index} className="max-w-prose break-words">{paragraphe}</p>)}
      </div>
    </details>)}
  </section>;
}
