import { useEffect, useRef, useState } from 'react';
import { chargerScenes } from '../core/scenes';
import { reglages } from '../core/reglages';
import { kanto } from '../core/regions';
import { evaluer } from '../core/conditions';
import { SceneLieu } from './SceneLieu';

const scenes = chargerScenes();
const bourg = 'kanto.bourg-palette';
const pension = kanto.lieu('pension');
const raisons = { 'kanto.pension': pension.si ? evaluer(pension.si, {
  badges: [], bossVaincus: [], objets: [], quetes: [], drapeaux: [],
}, { nomZone: id => kanto.zone(id).nom }).raison! : 'Bientôt disponible.' };
const noms: Record<string, string> = {
  [bourg]: 'Bourg Palette', 'kanto.chez-maman': 'Chez Maman',
  'kanto.chez-blue': 'Chez Blue', 'kanto.labo': 'Labo Pokémon du Prof. Chen',
};

type Props = {
  laboAVisiter?: boolean;
  sortieLaboClignote?: boolean;
  quandLabo?: () => void;
};

export function ScenesBourgPalette({ laboAVisiter = false, sortieLaboClignote = false, quandLabo }: Props) {
  const [courante, changerScene] = useState(bourg);
  const [phase, changerPhase] = useState<'repos' | 'couvrir' | 'decouvrir'>('repos');
  const [sortieVue, noterSortie] = useState(false);
  const [reduit] = useState(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
  const minuteurs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const verrou = useRef(false);
  const cadre = useRef<HTMLDivElement>(null);
  const rendreFocus = useRef(false);
  const scene = scenes.find(s => s.id === courante)!;

  useEffect(() => () => minuteurs.current.forEach(id => clearTimeout(id)), []);
  useEffect(() => {
    if (phase === 'repos' && rendreFocus.current) {
      cadre.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus();
      rendreFocus.current = false;
    }
  }, [courante, phase]);

  function choisir(id: string) {
    if (verrou.current) return;
    verrou.current = true;
    const changer = () => {
      if (courante === 'kanto.labo') noterSortie(true);
      changerScene(id);
      rendreFocus.current = true;
      if (id === 'kanto.labo') quandLabo?.();
    };
    const finir = () => { verrou.current = false; changerPhase('repos'); };
    if (reduit) { changer(); finir(); return; }
    changerPhase('couvrir');
    minuteurs.current.push(setTimeout(() => {
      changer();
      changerPhase('decouvrir');
      minuteurs.current.push(setTimeout(finir, reglages.intro.voileRetraitDelaiMs));
    }, reglages.intro.sceneDelaiMs));
  }

  const clignotements = courante === bourg ? laboAVisiter ? ['kanto.labo'] : []
    : courante !== 'kanto.labo' || (sortieLaboClignote && !sortieVue) ? [bourg] : [];

  return <div ref={cadre} className="relative">
    <SceneLieu key={courante} scene={scene} nom={noms[courante]!} quandChoisir={choisir}
      raisons={raisons} clignotements={clignotements} occupe={phase !== 'repos'} />
    <div data-voile aria-hidden="true" className={`pointer-events-none absolute inset-0 bg-texte motion-safe:intro-voile ${phase === 'couvrir' ? 'opacity-100' : 'opacity-0'}`} />
  </div>;
}
