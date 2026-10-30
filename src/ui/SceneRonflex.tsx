import { useEffect, useRef, useState } from 'react';
import type { Commande, Etape } from '../core/evenements';
import { evenementsKanto } from '../core/evenements-kanto';
import { reglages } from '../core/reglages';
import { mouvementReduit } from './BoiteDialogue';
import { cheminSprite } from './precharger';

const parametres = reglages.ronflex.souffle;
const rencontre = evenementsKanto.parId('kanto.ronflex-reveil').etapes.find(
  (etape): etape is Extract<Etape, { type: 'combat'; pokemon: number }> => etape.type === 'combat' && etape.pokemon !== undefined,
)!;
const millisecondes = (nom: string) => {
  const valeur = getComputedStyle(document.documentElement).getPropertyValue(nom).trim();
  return parseFloat(valeur) * (valeur.endsWith('ms') ? 1 : 1000);
};

export function SceneRonflex({ decor, commande, possedeFlute, reussirSouffle }: {
  decor: string; commande: Commande | null; possedeFlute: boolean;
  reussirSouffle(ref: { evenement: string; etape: number }): void;
}) {
  const bouton = useRef<HTMLButtonElement>(null);
  const maintien = useRef(false);
  const [presse, presser] = useState(false);
  const [mesure, mesurer] = useState({ niveau: 0, cible: parametres.centreCible, cumul: 0 });
  const actif = commande?.type === 'souffle' && possedeFlute;
  const eveille = commande?.evenement === 'kanto.ronflex-reveil' && commande.type !== 'souffle';
  const evenement = commande?.evenement;
  const etape = commande?.etape;

  useEffect(() => {
    maintien.current = false;
    if (!actif || evenement === undefined || etape === undefined) return;
    bouton.current?.focus();
    const note = millisecondes('--duree-signal');
    const pas = millisecondes('--duration-normal');
    if (!(note > 0 && pas > 0)) return;
    let niveau = 0, cumul = 0;
    let origine: number | null = null, dernier: number | null = null;
    let fini = false, suspendu = document.hidden;
    let frame: number;
    const relacher = () => { maintien.current = false; presser(false); };
    const flou = () => { relacher(); suspendu = true; dernier = null; };
    const reprendre = () => { suspendu = document.hidden; dernier = null; };
    const visibilite = () => { if (document.hidden) flou(); else reprendre(); };
    const tick = (t: number) => {
      if (fini) return;
      if (!suspendu && !document.hidden) {
        if (origine === null && maintien.current) { origine = t; dernier = t; }
        if (origine !== null) {
          if (dernier === null) dernier = t;
          const reduit = mouvementReduit();
          if (!reduit || t - dernier >= pas) {
            const dt = Math.min(t - dernier, pas * parametres.plafondPas);
            dernier = t;
            niveau = Math.max(0, Math.min(1, niveau + (maintien.current ? 1 : -1) * dt / (note * parametres.facteurNiveau)));
            const cible = parametres.centreCible + (reduit ? 0 : Math.sin((t - origine) / (note * parametres.facteurCible)) * parametres.amplitudeCible);
            if (niveau >= cible && niveau <= cible + parametres.largeurCible) cumul += dt;
            cumul = Math.min(cumul, parametres.dureeCumuleeS * 1000);
            mesurer({ niveau, cible, cumul });
            if (cumul >= parametres.dureeCumuleeS * 1000) {
              fini = true;
              relacher();
              reussirSouffle({ evenement, etape });
              return;
            }
          }
        }
      }
      frame = requestAnimationFrame(tick);
    };
    window.addEventListener('blur', flou);
    window.addEventListener('focus', reprendre);
    document.addEventListener('visibilitychange', visibilite);
    frame = requestAnimationFrame(tick);
    return () => {
      fini = true;
      maintien.current = false;
      presser(false);
      mesurer({ niveau: 0, cible: parametres.centreCible, cumul: 0 });
      cancelAnimationFrame(frame);
      window.removeEventListener('blur', flou);
      window.removeEventListener('focus', reprendre);
      document.removeEventListener('visibilitychange', visibilite);
    };
  }, [actif, evenement, etape, reussirSouffle]);

  const souffler = (on: boolean) => { maintien.current = on; presser(on); };
  const position = {
    '--niveau': mesure.niveau,
    '--cible': mesure.cible,
    '--largeur': parametres.largeurCible,
  } as React.CSSProperties;
  const secondes = (mesure.cumul / 1000).toFixed(1).replace('.', ',');
  return <section aria-label="Route de Ronflex" className="space-y-3 lg:col-span-3">
    <div className="cadre relative isolate grid h-66 place-items-center overflow-hidden">
      <img src={decor} alt="" className="absolute inset-0 -z-10 size-full object-cover" />
      <p className="absolute left-3 top-3 bg-surface p-2">Ronflex · Niv. {rencontre.niveau} · {eveille ? 'Réveillé' : 'Endormi'}</p>
      <img src={cheminSprite(rencontre.pokemon)} alt={eveille ? 'Ronflex réveillé' : 'Ronflex endormi'}
        className={`image-rendering-pixelated size-46 ${eveille ? '' : 'motion-safe:flottement'}`} />
      <span aria-hidden="true" className="absolute ml-40 bg-surface p-1 font-titre text-2xl">{eveille ? '!' : 'Zzz'}</span>
    </div>
    {actif ? <section aria-label="Mini-jeu de Pokéflûte" className="cadre space-y-3 bg-surface p-4">
      <p className="text-texte-doux">Pokéflûte · Souffle</p>
      <h2 className="font-titre text-2xl">Une mélodie pour Ronflex</h2>
      <p>Maintiens le bouton, Espace ou A pour souffler ; relâche pour laisser redescendre la jauge.
        Garde le trait dans la zone verte pendant {parametres.dureeCumuleeS} secondes cumulées. Hors de la zone, le temps acquis reste conservé.</p>
      <div role="progressbar" aria-label="Niveau de souffle" aria-valuemin={0} aria-valuemax={100}
        aria-valuenow={Math.round(mesure.niveau * 100)} className="relative h-12 bg-fond" style={position}>
        <span aria-hidden="true" className="absolute h-full left-[calc(var(--cible)*100%)] w-[calc(var(--largeur)*100%)] border-2 border-dashed border-succes-base bg-succes-fond" />
        <span aria-hidden="true" className="absolute h-full w-1 left-[calc(var(--niveau)*(100%_-_var(--spacing)))] bg-focus" />
      </div>
      <progress max={parametres.dureeCumuleeS} value={mesure.cumul / 1000} aria-label="Secondes dans la zone cible" className="h-5 w-full accent-succes-base" />
      <button ref={bouton} type="button" aria-label="Souffler" aria-pressed={presse}
        className="cadre min-h-20 min-w-11 w-full touch-none select-none bg-surface-2 p-3 text-xl focus-visible:outline-focus"
        onContextMenu={event => event.preventDefault()}
        onPointerDown={event => {
          if (event.button !== 0) return;
          event.currentTarget.setPointerCapture?.(event.pointerId);
          souffler(true);
        }}
        onPointerUp={() => souffler(false)} onPointerCancel={() => souffler(false)} onLostPointerCapture={() => souffler(false)}
        onBlur={() => souffler(false)}
        onKeyDown={event => { if ([' ', 'a', 'A'].includes(event.key)) { event.preventDefault(); souffler(true); } }}
        onKeyUp={event => { if ([' ', 'a', 'A'].includes(event.key)) { event.preventDefault(); souffler(false); } }}>
        Maintenir pour souffler · Espace ou A
      </button>
      <p role="status">{secondes} / {parametres.dureeCumuleeS} secondes dans la zone · {Math.round(mesure.niveau * 100)} % de souffle</p>
    </section> : !possedeFlute && <p className="cadre bg-surface p-4">Une Pokéflûte pourrait réveiller Ronflex.</p>}
  </section>;
}
