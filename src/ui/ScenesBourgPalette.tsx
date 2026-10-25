import { useEffect, useRef, useState } from 'react';
import { chargerScenes } from '../core/scenes';
import { reglages } from '../core/reglages';
import { kanto } from '../core/regions';
import { evaluer } from '../core/conditions';
import { SceneLieu } from './SceneLieu';
import type { AffichageJeu } from './store';

const scenes = chargerScenes();
const bourg = 'kanto.bourg-palette';
const pension = kanto.lieu('pension');
const accesPensionParDefaut = { ouvert: false, raison: pension.si ? evaluer(pension.si, {
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
  quandSortieLabo?: () => void;
  quandScene?: (id: string) => void;
  accesPension?: AffichageJeu['pension']['acces'];
  quandPension?: () => void;
  sceneInitiale?: string;
  bloquee?: boolean;
  annonce?: string | null;
};

export function ScenesBourgPalette({ laboAVisiter = false, sortieLaboClignote = false, quandLabo, quandSortieLabo, quandScene, accesPension = accesPensionParDefaut, quandPension, sceneInitiale = bourg, bloquee = false, annonce }: Props) {
  const [courante, changerScene] = useState(sceneInitiale);
  const [phase, changerPhase] = useState<'repos' | 'couvrir' | 'decouvrir'>('repos');
  const [sortieVue, noterSortie] = useState(false);
  const [reduit] = useState(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
  const minuteurs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const verrou = useRef(false);
  const cadre = useRef<HTMLDivElement>(null);
  const rendreFocus = useRef(false);
  const scene = scenes.find(s => s.id === courante)!;
  const raisons: Record<string, string> = accesPension.ouvert ? {} : { 'kanto.pension': accesPension.raison ?? accesPensionParDefaut.raison };

  useEffect(() => () => minuteurs.current.forEach(id => clearTimeout(id)), []);
  useEffect(() => {
    if (phase === 'repos' && rendreFocus.current) {
      cadre.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus();
      rendreFocus.current = false;
    }
  }, [courante, phase]);

  function choisir(id: string) {
    if (verrou.current) return;
    if (id === 'kanto.pension') { quandPension?.(); return; }
    verrou.current = true;
    const changer = () => {
      if (courante === 'kanto.labo') { noterSortie(true); quandSortieLabo?.(); }
      changerScene(id);
      quandScene?.(id);
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
      raisons={raisons} clignotements={clignotements} occupe={phase !== 'repos' || bloquee} annonceExterne={annonce} />
    <div data-voile aria-hidden="true" className={`pointer-events-none absolute inset-0 bg-texte motion-safe:intro-voile ${phase === 'couvrir' ? 'opacity-100' : 'opacity-0'}`} />
  </div>;
}
