import { useState } from 'react';

type Starter = { numero: number; nom: string; shiny: boolean };

/** Choix du partenaire (V1 : `#intro-selection`). Trois Poké Balls ; l’artwork apparaît au survol, au focus et à la sélection. */
export function ChoixStarter({ starters, choisir }: { starters: Starter[]; choisir(numero: number): void }) {
  const [selection, selectionner] = useState<number | null>(null);
  const choisi = starters.find(starter => starter.numero === selection);
  return <section aria-labelledby="choix-starter" className="grid justify-items-center gap-4 p-4">
    <h2 id="choix-starter" className="cadre bg-surface p-2 text-center font-titre text-lg">CHOISIS TON PARTENAIRE</h2>
    <div className="flex justify-center gap-4">
      {starters.map(starter => {
        const actif = starter.numero === selection;
        const artwork = `img/artworks/${starter.numero}${starter.shiny ? '-shiny' : ''}.png`;
        return <button key={starter.numero} type="button" aria-pressed={actif}
          aria-label={starter.shiny ? `${starter.nom} chromatique` : starter.nom}
          onClick={() => selectionner(starter.numero)}
          className="group grid justify-items-center gap-2 p-1 motion-safe:transition-transform motion-safe:hover:intro-starter-survol">
          <span className={`relative grid size-20 place-items-center rounded-full ${starter.shiny ? 'ring-2 ring-alerte-base' : ''}`}>
            <img src="img/objets/poke-ball.png" alt="" width={80} height={80}
              className={`image-rendering-pixelated size-full object-contain motion-safe:intro-starter-fondu ${actif ? 'opacity-0' : 'opacity-100'}`} />
            <img src={artwork} alt="" width={80} height={80}
              className={`absolute inset-0 size-full object-contain motion-safe:intro-starter-fondu ${actif
                ? 'opacity-100 intro-starter-choisi'
                : 'scale-0 opacity-0 group-hover:scale-100 group-hover:opacity-100 group-focus-visible:scale-100 group-focus-visible:opacity-100'}`} />
          </span>
          <span className={`cadre bg-surface px-2 py-1 text-xs ${actif ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100'}`}>
            {starter.nom.toUpperCase()}
          </span>
        </button>;
      })}
    </div>
    {choisi && <button type="button" onClick={() => choisir(choisi.numero)}
      className="min-h-11 bg-action px-6 py-2 font-titre text-action-texte hover:bg-action-survol">
      CHOISIR {choisi.nom.toUpperCase()}
    </button>}
  </section>;
}
