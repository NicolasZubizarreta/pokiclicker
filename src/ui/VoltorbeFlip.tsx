import { useState, type ReactNode } from 'react';
import { lireMise } from '../core/casino';
import { NIVEAUX_VOLTORBE, TAILLE_VOLTORBE, type IndiceLigne, type VueVoltorbe } from '../core/voltorbe';
import type { ActionsCasino } from './store-casino';
import { MiseCasino, jetonsTexte, nombre, type Signaler } from './casino-interface';

type Props = { actions: ActionsCasino; grille: VueVoltorbe | null; signaler: Signaler; jetons: number; verdict: ReactNode };
const indices = Array.from({ length: TAILLE_VOLTORBE }, (_, k) => k);
const multiple = (m: number) => m.toLocaleString('fr-FR', { maximumFractionDigits: 2 });

function Indice({ nom, indice }: { nom: string; indice: IndiceLigne }) {
  return <div className="cs-vo-indice" role="group" aria-label={`${nom} : total ${indice.points}, ${indice.voltorbes} Voltorbe${indice.voltorbes > 1 ? 's' : ''}`}>
    <b aria-hidden="true">{indice.points}</b><span className="cs-vo-v" aria-hidden="true">{indice.voltorbes}</span></div>;
}

/** Voltorbe Flip : la grille est sauvegardée, un rechargement la retrouve avec les cartes déjà retournées. */
export function VoltorbeFlip({ actions, grille, signaler, jetons, verdict }: Props) {
  const [mise, changer] = useState('1');
  const [niveau, choisir] = useState(0);
  function commencer() {
    const r = actions.commencerVoltorbe(lireMise(mise, jetons), niveau);
    if (!r.ok) { signaler(r.raison, 'alerte'); return; }
    signaler('Retourne une carte : évite les Voltorbes.', 'info');
  }
  function retourner(index: number) {
    const r = actions.retournerVoltorbe(index);
    if (!r.ok) { signaler(r.raison, 'alerte'); return; }
    const ton = r.fin ? (r.fin.perdu ? 'perte' : 'gain') : 'info';
    signaler(r.message, ton);
    if (r.fin && !r.fin.perdu) actions.sonnerCasino();
  }
  function encaisser() {
    const r = actions.encaisserVoltorbe();
    if (!r.ok) { signaler(r.raison, 'alerte'); return; }
    signaler(r.message, 'gain'); actions.sonnerCasino();
  }
  if (!grille) return <div className="cs-jeu">
    <div className="cs-plateau cs-tapis">
      <p className="cs-rappel">Cinq lignes, cinq colonnes, 25 cartes cachées : ×1, ×2, ×3 ou un Voltorbe. Chaque ×2 et ×3 retourné fait monter la mise en jeu ;
        un Voltorbe fait tout perdre. Encaisse quand tu veux (retenue sur le gain) ou retourne tous les ×2 et ×3 pour être payé en entier.</p>
      {verdict}
    </div>
    <div className="cs-commandes">
      <div className="cs-choix cs-vo-niveaux" role="group" aria-label="Niveau de la grille">
        {NIVEAUX_VOLTORBE.map((n, i) => <button key={n.nom} type="button" className="plaque" aria-pressed={niveau === i} onClick={() => choisir(i)}>
          {n.nom}<small>{n.voltorbes} Voltorbes</small></button>)}
      </div>
      <MiseCasino valeur={mise} changer={changer} jetons={jetons} />
      <button type="button" className="plaque plaque-action cs-grand" onClick={commencer}>Commencer la grille</button>
    </div>
  </div>;
  return <div className="cs-jeu">
    <div className="cs-plateau cs-tapis">
      <div className="cs-vo-grille" role="group" aria-label="Grille de Voltorbe Flip">
        {indices.map(l => <div key={l} className="cs-vo-ligne">
          {indices.map(c => {
            const i = l * TAILLE_VOLTORBE + c;
            const valeur = grille.cases[i];
            return valeur === null || valeur === undefined
              ? <button key={c} type="button" className="cs-vo-carte cs-dos" aria-label={`Retourner la carte ligne ${l + 1}, colonne ${c + 1}`} onClick={() => retourner(i)} />
              : <span key={c} className="cs-vo-carte" data-v={valeur} role="img" aria-label={`Ligne ${l + 1}, colonne ${c + 1} : ×${valeur}`}>×{valeur}</span>;
          })}
          <Indice nom={`Ligne ${l + 1}`} indice={grille.lignes[l]!} />
        </div>)}
        <div className="cs-vo-ligne">
          {indices.map(c => <Indice key={c} nom={`Colonne ${c + 1}`} indice={grille.colonnes[c]!} />)}
        </div>
      </div>
      <p className="cs-rappel">Chiffre : total des cartes de la ligne ou de la colonne. Pastille : nombre de Voltorbes.</p>
      {verdict}
    </div>
    <div className="cs-commandes">
      <dl className="cs-vo-etat">
        <div><dt>Mise</dt><dd>{nombre(grille.mise)}</dd></div>
        <div><dt>Mise en jeu</dt><dd>×{multiple(grille.multiple)}</dd></div>
        <div><dt>Encaisser</dt><dd>{nombre(grille.gainSiEncaisse)}</dd></div>
        <div><dt>Cartes ×2 et ×3 restantes</dt><dd>{grille.restantes}</dd></div>
      </dl>
      <button type="button" className="plaque plaque-action cs-grand" onClick={encaisser}>Encaisser {jetonsTexte(grille.gainSiEncaisse)}</button>
      <p className="cs-rappel">Encaisser avant la fin garde une partie du gain seulement. Si tu quittes la salle sans encaisser, la grille reste en cours.</p>
    </div>
  </div>;
}
