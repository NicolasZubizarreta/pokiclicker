import { useState } from 'react';
import { useStore } from 'zustand';
import { storeJeu } from './store';
import { Image } from './Image';
import { nomAffiche, spriteAffiche } from './affichage-pokemon';
import { useTelephone } from './useTelephone';

export function EquipesEnregistrees() {
  const equipes = useStore(storeJeu, s => s.suivi.equipes);
  const equipe = useStore(storeJeu, s => s.equipe);
  const pc = useStore(storeJeu, s => s.pc);
  const telephone = useTelephone();
  const [confirmation, confirmer] = useState<number | null>(null);
  const [message, annoncer] = useState('');
  const [ouvert, ouvrir] = useState(false);
  const disponibles = new Map([...equipe.flatMap(m => m ? [m.pokemon] : []), ...pc].map(p => [p.uid, p]));
  const annonce = message && <p role="status" className="col-span-full">{message}</p>;
  return <section aria-label="Équipes enregistrées" className={telephone ? 'space-y-2 py-2 text-base' : 'text-base'} onKeyDown={event => { if (event.key === 'Escape') ouvrir(false); }}>
    <button type="button" aria-expanded={ouvert} aria-controls="equipes-enregistrees-liste" className="plaque min-h-11 px-4" onClick={() => ouvrir(!ouvert)}>Équipes enregistrées</button>
    {ouvert && <div id="equipes-enregistrees-liste" className={telephone ? 'grid grid-cols-1 gap-4' : 'cadre absolute right-0 top-full z-20 mt-2 grid w-max max-w-[90vw] grid-cols-3 gap-4 bg-surface p-4'}>
      {['A', 'B', 'C'].map((lettre, i) => <section key={lettre} aria-label={`Équipe ${lettre}`} className="cadre space-y-2 bg-surface p-4">
        <h2 className="font-titre font-semibold">Équipe {lettre}</h2>
        <div className="flex flex-wrap">{equipes[i]?.map(uid => {
          const p = disponibles.get(uid);
          return p ? <Image key={uid} src={spriteAffiche(p)} genre="sprite" alt={nomAffiche(p)} className="size-12" /> : null;
        })}</div>
        {!equipes[i]?.length && <p className="text-texte-doux">Emplacement vide</p>}
        <div className={telephone ? 'grid grid-cols-2 gap-2' : 'flex flex-wrap gap-2'}>
          <button type="button" className="plaque min-h-11 px-4" onClick={() => {
            if (equipes[i]?.length && confirmation !== i) { confirmer(i); return; }
            confirmer(null);
            annoncer(storeJeu.getState().enregistrerEquipe(i) ?? `Équipe ${lettre} enregistrée`);
          }}>{confirmation === i ? 'Remplacer ?' : 'Enregistrer'}</button>
          <button type="button" disabled={!equipes[i]?.length} className="plaque min-h-11 px-4" onClick={() => {
            confirmer(null);
            const erreur = storeJeu.getState().appliquerEquipe(i);
            annoncer(erreur ?? storeJeu.getState().avertissementEquipe ?? `Équipe ${lettre} appliquée`);
          }}>Appliquer</button>
        </div>
      </section>)}
      {!telephone && annonce}
    </div>}
    {telephone && annonce}
  </section>;
}
