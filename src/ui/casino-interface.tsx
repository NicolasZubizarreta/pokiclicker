import { useCallback, useEffect, useId, useRef, type RefObject } from 'react';
import { IconeObjet } from './icones';
import { cheminSprite } from './precharger';

export const mouvementReduit = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
export const nombre = (n: number) => n.toLocaleString('fr-FR');

/** Ton d'un verdict : toujours accompagné de son texte, jamais la couleur seule. */
export type Ton = 'gain' | 'perte' | 'info' | 'alerte';
export type Signaler = (message: string, ton?: Ton) => void;
/**
 * Un jeu s'occupe d'un coup (`occuper(gain)`) : le gain déjà crédité par le store reste caché de l'affichage des jetons jusqu'à
 * la révélation (`occuper(null)`), pour que les rouleaux, la roue ou le ticket ne soient pas gâchés par un compteur qui change.
 */
export type Occuper = (gainCache: number | null) => void;

export function Verdict({ message, ton }: { message: string; ton?: Ton }) {
  return <p role="status" className="cs-verdict" data-ton={ton}>{message}</p>;
}

export function Jeton({ gros = false }: { gros?: boolean }) {
  return <span aria-hidden="true" className={gros ? 'cs-jeton cs-jeton-gros' : 'cs-jeton'} />;
}

/** Image d'un symbole ou d'un article : sprite 96 px natif, objet 30 px natif, repli SVG quand l'image manque. */
export function Illustration({ image, nom }: { image: string | null; nom: string }) {
  if (image === null) return <IconeObjet image={null} nom={nom} />;
  const sprite = image.startsWith('pokemon/');
  const taille = sprite ? 96 : 30;
  return <img src={sprite ? cheminSprite(Number(image.split('/')[1])) : `img/${image}`} alt="" width={taille} height={taille}
    className={`cs-px ${sprite ? 'cs-sprite' : 'cs-objet'}`} />;
}
/** Version historique (boutique) : même image, taille d'icône du Shop. */
export function IllustrationCasino({ image, nom }: { image: string | null; nom: string }) {
  return <IconeObjet image={image?.startsWith('pokemon/') ? cheminSprite(Number(image.split('/')[1])) : image ? `img/${image}` : null} nom={nom} />;
}

/** Mise : − / champ / + puis montants rapides. `jetons` borne « Max » et le « + ». */
export function MiseCasino({ valeur, changer, bloque = false, jetons }: { valeur: string; changer(v: string): void; bloque?: boolean; jetons: number }) {
  const id = useId();
  const courante = /^\d+$/.test(valeur.trim()) ? Number(valeur) : 0;
  const borne = Math.max(1, jetons);
  return <div className="cs-mise">
    <div className="cs-mise-libelle"><label htmlFor={id}>Mise en jetons</label><span>Tu as {nombre(jetons)}</span></div>
    <div className="cs-pas">
      <button type="button" className="plaque" disabled={bloque} aria-label="Un jeton de moins" onClick={() => changer(String(Math.max(1, courante - 1)))}>−</button>
      <input id={id} className="cs-champ" inputMode="numeric" pattern="[0-9]*" autoComplete="off" value={valeur} disabled={bloque} onChange={e => changer(e.target.value)} />
      <button type="button" className="plaque" disabled={bloque} aria-label="Un jeton de plus" onClick={() => changer(String(Math.min(borne, courante + 1)))}>+</button>
    </div>
    <div className="cs-rapides">
      {[1, 5, 10, 50].map(m => <button key={m} type="button" className="plaque" disabled={bloque} aria-label={`Mise de ${m} ${m > 1 ? 'jetons' : 'jeton'}`} onClick={() => changer(String(m))}>{m}</button>)}
      <button type="button" className="plaque" disabled={bloque} aria-label="Miser tous tes jetons" onClick={() => changer(String(borne))}>Max</button>
    </div>
  </div>;
}

/** Pluie de pièces (V1 : pièce de 500 ms) : calque décoratif à poser dans un plateau `position: relative`. */
export function usePluie(): { zone: RefObject<HTMLDivElement | null>; lancer(pieces: number): void } {
  const zone = useRef<HTMLDivElement>(null);
  const animations = useRef<Animation[]>([]);
  useEffect(() => () => { animations.current.forEach(a => a.cancel()); animations.current = []; }, []);
  const lancer = useCallback((pieces: number) => {
    const calque = zone.current;
    if (!calque || mouvementReduit() || typeof calque.animate !== 'function') return;
    const hauteur = calque.offsetHeight || 300, largeur = calque.offsetWidth || 300;
    for (let i = 0; i < pieces; i++) {
      const piece = document.createElement('span');
      piece.className = 'cs-piece-chute';
      piece.style.left = `${Math.random() * Math.max(10, largeur - 28)}px`;
      calque.appendChild(piece);
      const haut = { transform: 'translateY(-100%)', opacity: 1 }, bas = { transform: `translateY(${hauteur}px)`, opacity: 1 };
      const animation = piece.animate([haut, bas],
        { duration: 500 + Math.random() * 600, delay: Math.random() * 300, easing: 'cubic-bezier(0.2, 0, 0, 1)', fill: 'backwards' });
      animations.current.push(animation);
      animation.onfinish = () => { piece.remove(); animations.current = animations.current.filter(a => a !== animation); };
    }
  }, []);
  return { zone, lancer };
}
export const Pluie = ({ zone }: { zone: RefObject<HTMLDivElement | null> }) => <div ref={zone} className="cs-pluie" aria-hidden="true" />;

/** Nombre de pièces de la pluie selon l'importance du gain (multiple de la mise). */
export const piecesPourGain = (gain: number, mise: number) => gain <= 0 ? 0 : gain >= mise * 25 ? 24 : gain >= mise * 5 ? 14 : 10;

const COULEURS = {
  S: { nom: 'pique', rouge: false, trace: 'M12 2c4 4.5 8 7 8 11a4.5 4.5 0 0 1-7.5 3.3L14 22H10l1.5-5.7A4.5 4.5 0 0 1 4 13c0-4 4-6.5 8-11Z' },
  H: { nom: 'cœur', rouge: true, trace: 'M12 21 3.5 12.5A5.2 5.2 0 0 1 12 6.2a5.2 5.2 0 0 1 8.5 6.3Z' },
  D: { nom: 'carreau', rouge: true, trace: 'M12 2 20 12 12 22 4 12Z' },
  C: { nom: 'trèfle', rouge: false, trace: 'M12 3a4 4 0 0 0-3.2 6.4A4.5 4.5 0 1 0 11 16.8L10 22h4l-1-5.2a4.5 4.5 0 1 0 2.2-7.4A4 4 0 0 0 12 3Z' },
} as const;
export type CouleurCarte = keyof typeof COULEURS;
export const nomCouleur = (c: string) => COULEURS[c as CouleurCarte]?.nom ?? c;

/** Carte à jouer. `dos` : carte cachée (sa valeur n'entre jamais dans l'interface). */
export function CarteJeu({ rang, couleur, nom, dos = false }: { rang?: string; couleur?: CouleurCarte; nom?: string; dos?: boolean }) {
  if (dos || !rang || !couleur) return <li><div role="img" aria-label="Carte cachée" className="cs-carte cs-dos" /></li>;
  const { rouge, trace } = COULEURS[couleur];
  return <li><div role="img" aria-label={nom} className={`cs-carte${rouge ? ' cs-rouge' : ''}`}>
    <span className="cs-rang" aria-hidden="true">{rang}</span>
    <svg className="cs-couleur" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d={trace} /></svg>
  </div></li>;
}

/** Pictogramme du ton d'un résultat (coche, croix, égal) : le ton ne repose jamais sur la couleur seule. */
export function Pictogramme({ ton }: { ton: 'gain' | 'perte' | 'nul' }) {
  const trace = ton === 'gain' ? 'm5 12 5 5 9-10' : ton === 'perte' ? 'm6 6 12 12M18 6 6 18' : 'M5 9h14M5 15h14';
  return <svg className="cs-pictogramme" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d={trace} /></svg>;
}

export const rangAffiche = (rang: number) => rang === 1 ? 'A' : rang === 11 ? 'J' : rang === 12 ? 'Q' : rang === 13 ? 'K' : String(rang);
