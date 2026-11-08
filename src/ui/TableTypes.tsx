import { useId, useState } from 'react';
import types from '../../data/types.json';
import { ficheType, multiplicateurPaire, typesDuJeu } from '../core/table-types';
import { nomType } from '../core/pokemon';
import { IconeChevron } from './icones-menu';
import './FichePokemon.css';
import './TableTypes.css';

const liste = typesDuJeu();
const nombre = new Intl.NumberFormat('fr-FR');

function Pastille({ type }: { type: string }) {
  return <span className={`pastille-type pastille-type-${type}`}>{nomType(type)}</span>;
}

export function TableTypes({ telephone, efficacite = types.efficacite }: {
  telephone: boolean;
  efficacite?: Record<string, Record<string, number>>;
}) {
  const [ouvert, setOuvert] = useState<string | null>(null);
  const [survol, setSurvol] = useState<{ ligne: string; colonne: string } | null>(null);
  const id = useId();

  if (telephone) return <div className="grid min-w-0 gap-2 break-words">
    {liste.map(type => {
      const fiche = ficheType(type, liste, efficacite);
      const groupes = [
        { titre: 'Quand il attaque', lignes: [['Fort contre (×2)', fiche.attaque.fort], ['Peu efficace contre (×0,5)', fiche.attaque.peu], ['Sans effet sur (×0)', fiche.attaque.nul]] },
        { titre: 'Quand il défend', lignes: [['Faible contre (subit ×2)', fiche.defense.faible], ['Résiste à (subit ×0,5)', fiche.defense.resiste], ['Immunisé contre (subit ×0)', fiche.defense.immunise]] },
      ] satisfies { titre: string; lignes: [string, string[]][] }[];
      return <div key={type} className="min-w-0">
        <button type="button" className="flex min-h-12 w-full min-w-0 items-center gap-2" aria-expanded={ouvert === type} aria-controls={`${id}-${type}`} onClick={() => setOuvert(ouvert === type ? null : type)}>
          <Pastille type={type} /><span className={`ml-auto ${ouvert === type ? 'rotate-90' : ''}`}><IconeChevron /></span>
        </button>
        <div id={`${id}-${type}`} hidden={ouvert !== type} className="min-w-0">
          {groupes.map(groupe => <div key={groupe.titre} className="grid min-w-0 gap-2 py-2">
            <h3 className="font-bold">{groupe.titre}</h3>
            {groupe.lignes.map(([libelle, membres]) => <div key={libelle} className="flex min-w-0 flex-wrap items-center gap-2">
              <span>{libelle}</span>{membres.length ? membres.map(membre => <Pastille key={membre} type={membre} />) : <span className="text-texte-doux">Aucun</span>}
            </div>)}
          </div>)}
        </div>
      </div>;
    })}
  </div>;

  return <div className="table-types-corps min-w-0">
    <p className="mb-2 text-sm text-texte-doux">×2 : très efficace · ×0,5 : peu efficace · ×0 : sans effet · vide : normal</p>
    <div className="table-types-region" role="region" aria-label="Table des types" tabIndex={0}>
      <table className="table-types" onMouseLeave={() => setSurvol(null)}>
        <caption className="sr-only">Efficacité des attaques : attaque en ligne, défense en colonne</caption>
        <thead><tr><td>Attaque ↓<br />Défense →</td>{liste.map(type => <th key={type} scope="col" className={survol?.colonne === type ? 'type-eclaire' : undefined}><Pastille type={type} /></th>)}</tr></thead>
        <tbody>{liste.map(attaque => <tr key={attaque}>
          <th scope="row" tabIndex={0} className={survol?.ligne === attaque ? 'type-eclaire' : undefined}><Pastille type={attaque} /></th>
          {liste.map(defense => {
            const valeur = multiplicateurPaire(attaque, defense, efficacite);
            return <td key={defense} onMouseEnter={() => setSurvol({ ligne: attaque, colonne: defense })} className={[
              valeur > 1 ? 'text-succes-texte type-fort' : valeur === 0 ? 'text-erreur-texte font-bold' : valeur < 1 ? 'text-erreur-texte type-peu' : '',
              survol?.ligne === attaque || survol?.colonne === defense ? 'type-eclaire' : '',
            ].join(' ')}>{valeur === 1 ? <span className="sr-only">×1</span> : `×${nombre.format(valeur)}`}</td>;
          })}
        </tr>)}</tbody>
      </table>
    </div>
  </div>;
}
