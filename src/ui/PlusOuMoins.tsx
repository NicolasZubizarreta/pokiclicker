import { useEffect, useRef, useState, type ReactNode } from 'react';
import { chargerCasino, lireMise } from '../core/casino';
import { gainPlusOuMoins, multiplicateurPlusOuMoins, nomCarte, rangsGagnants, type ChoixPlusOuMoins } from '../core/jeux-casino';
import type { ActionsCasino } from './store-casino';
import { CarteJeu, MiseCasino, mouvementReduit, nombre, Pluie, piecesPourGain, rangAffiche, usePluie, type CouleurCarte, type Occuper, type Signaler } from './casino-interface';

const animation = chargerCasino().animationJeux;
const COULEURS: CouleurCarte[] = ['S', 'H', 'D', 'C'];
/** Le jeu ne garde que le rang : la couleur affichée est décorative (même rang, même couleur). */
const Carte = ({ rang }: { rang: number | null }) => <ul className="cs-cartes">
  {rang === null ? <CarteJeu dos /> : <CarteJeu rang={rangAffiche(rang)} couleur={COULEURS[rang % 4]!} nom={nomCarte(rang)} />}</ul>;
type Props = { actions: ActionsCasino; carte: number | null; signaler: Signaler; occuper: Occuper; jetons: number; verdict: ReactNode };

/** La carte visible est sauvegardée à chaque coup : un rechargement la retrouve, sans mise engagée. */
export function PlusOuMoins({ actions, carte, signaler, occuper, jetons, verdict }: Props) {
  const [mise, changer] = useState('1');
  const [revele, reveler] = useState<{ avant: number; nouvelle: number; retournee: boolean } | null>(null);
  const delais = useRef<ReturnType<typeof setTimeout>[]>([]);
  const actif = useRef(false);
  const pluie = usePluie();
  useEffect(() => { actions.carteVisiblePlusOuMoins(); }, [actions]);
  useEffect(() => () => delais.current.forEach(clearTimeout), []);
  const visible = revele ? revele.avant : carte;
  const miseLue = /^\d+$/.test(mise.trim()) ? Number(mise) : 0;
  function jouer(choix: ChoixPlusOuMoins) {
    if (actif.current || visible === null) return;
    const resultat = actions.jouerPlusOuMoins(lireMise(mise), choix);
    if (!resultat.ok) { signaler(resultat.raison, 'alerte'); return; }
    const montrer = () => {
      signaler(resultat.message, resultat.gain > 0 ? 'gain' : 'perte');
      if (resultat.gain > 0) { actions.sonnerCasino(); pluie.lancer(piecesPourGain(resultat.gain, lireMise(mise))); }
    };
    if (mouvementReduit()) { montrer(); return; }
    actif.current = true; occuper(resultat.gain); signaler('La carte se retourne…', 'info');
    reveler({ avant: resultat.carteVisible, nouvelle: resultat.nouvelleCarte, retournee: false });
    delais.current = [
      setTimeout(() => { reveler(r => r && { ...r, retournee: true }); occuper(null); montrer(); }, animation.carteRetournee),
      setTimeout(() => { reveler(null); actif.current = false; }, animation.carteRetournee + animation.revelation),
    ];
  }
  const bouton = (choix: ChoixPlusOuMoins, nom: string) => {
    const possible = visible !== null && rangsGagnants(visible, choix) > 0;
    return <button type="button" className="plaque" disabled={!possible || revele !== null} onClick={() => jouer(choix)}>
      <span className="cs-pm-lib"><svg className="cs-ic" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d={choix === 'plus' ? 'M12 19V5M5 12l7-7 7 7' : 'M12 5v14M5 12l7 7 7-7'} /></svg>{nom}</span>
      {possible ? <>
        <b className="cs-gain">×{(Math.floor(multiplicateurPlusOuMoins(visible, choix) * 100) / 100).toLocaleString('fr-FR')}</b>
        <small>{miseLue > 0 ? `Rend ${nombre(gainPlusOuMoins(miseLue, visible, choix))} jetons` : 'Mise à choisir'}</small></>
        : <small>{visible === null ? 'Tirage…' : choix === 'plus' ? 'Impossible sur un Roi' : 'Impossible sur un As'}</small>}
    </button>;
  };
  return <div className="cs-jeu">
    <div className="cs-plateau cs-tapis">
      <div className="cs-pluie-zone">
        <div className="cs-pm-table">
          <div className="cs-pm-colonne"><span className="cs-etiquette">Carte visible</span><Carte rang={visible} /></div>
          <div className="cs-pm-colonne"><span className="cs-etiquette">Carte suivante</span>
            <div className={revele?.retournee ? 'cs-retourne' : undefined}><Carte rang={revele?.retournee ? revele.nouvelle : null} /></div></div>
        </div>
        <Pluie zone={pluie.zone} />
      </div>
      {verdict}
    </div>
    <div className="cs-commandes">
      <MiseCasino valeur={mise} changer={changer} bloque={revele !== null} jetons={jetons} />
      <div className="cs-pm-boutons">{bouton('plus', 'Plus haut')}{bouton('moins', 'Plus bas')}</div>
      <p className="cs-rappel">As = 1, Roi = 13. Égalité : tu perds.</p>
    </div>
  </div>;
}
