import { musiques, pisteDeScene, type Scene } from '../core/musiques';
import { volumes } from './volumes';

const cle = 'pokiclicker:musique';

type Lecteur = Pick<HTMLAudioElement, 'play' | 'pause' | 'currentTime' | 'loop' | 'volume' | 'paused'>;

function lireActif(): boolean {
  try {
    const valeur = localStorage.getItem(cle);
    return valeur === null ? musiques.actifParDefaut : valeur === '1';
  } catch { return musiques.actifParDefaut; }
}

function ecrireActif(actif: boolean) {
  try { localStorage.setItem(cle, actif ? '1' : '0'); } catch { /* Stockage refusé : le choix ne dure que cette visite. */ }
}

export function creerMusique({
  creerLecteur = fichier => new Audio(fichier),
  actifInitial = lireActif(),
  enregistrer = ecrireActif,
  volume = () => 100,
}: {
  creerLecteur?: (fichier: string) => Lecteur; actifInitial?: boolean; enregistrer?: (actif: boolean) => void;
  /** Curseur « Musique », de 0 à 100. */
  volume?: () => number;
} = {}) {
  const gainLecteur = () => 10 ** (musiques.volumeDb / 20) * volume() / 100;
  const lecteurs = new Map<string, Lecteur>();
  const abonnes = new Set<() => void>();
  let actif = actifInitial;
  let deverrouille = false;
  let cache = false;
  let scene: Scene | null = null;
  let courant: Lecteur | undefined;

  function appliquer() {
    const id = scene && actif && deverrouille && !cache ? pisteDeScene(scene) : null;
    const lecteur = id ? lecteurs.get(id) ?? (() => {
      const piste = musiques.pistes[id]!;
      const nouveau = creerLecteur(piste.fichier);
      nouveau.loop = piste.boucle;
      nouveau.volume = gainLecteur();
      lecteurs.set(id, nouveau);
      return nouveau;
    })() : undefined;
    if (lecteur === courant) {
      if (lecteur?.paused) void lecteur.play().catch(() => {});
      return;
    }
    courant?.pause();
    courant = lecteur;
    if (!lecteur) return;
    // Une piste qui ne boucle pas (fanfare) repart du début ; les autres reprennent où elles s'étaient arrêtées.
    if (!lecteur.loop) lecteur.currentTime = 0;
    void lecteur.play().catch(() => { /* Geste refusé ou audio indisponible : silence. */ });
  }

  function prevenir() { abonnes.forEach(abonne => abonne()); }

  return {
    estActive: () => actif,
    abonner(abonne: () => void) { abonnes.add(abonne); return () => { abonnes.delete(abonne); }; },
    /** À appeler au premier geste du joueur : avant, les navigateurs refusent toute lecture. */
    deverrouiller() { deverrouille = true; appliquer(); },
    definirScene(prochaine: Scene | null) { if (prochaine !== scene) { scene = prochaine; appliquer(); } },
    /** Onglet masqué : on coupe, on reprend au retour. */
    masquer(masque: boolean) { cache = masque; appliquer(); },
    basculer() { actif = !actif; enregistrer(actif); appliquer(); prevenir(); },
    arreter() { scene = null; appliquer(); },
    /** À appeler quand le curseur de musique bouge : les pistes déjà créées suivent tout de suite. */
    ajusterVolume() { lecteurs.forEach(lecteur => { lecteur.volume = gainLecteur(); }); },
  };
}

export const musique = creerMusique({ volume: () => volumes.lire('musique') });
volumes.abonner(musique.ajusterVolume);
