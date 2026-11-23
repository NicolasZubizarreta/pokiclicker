import { useState } from 'react';
import { CATEGORIES_SKINS, skinsEquipes, SKINS, type DefinitionSkin } from '../../core/skins';
import type { ResumeCompte } from '../store';
import { attributsSkin } from '../skins';
import { IconeDiamant } from './icones-compte';
import '../Plaques.css';
import '../Skins.css';

export type ActionsBoutique = {
  acheter(id: string): string | null;
  equiper(categorie: string, id: string | null): string | null;
};

/** Aperçu avant achat : le même rendu que dans le jeu, sur un petit fond neutre. */
function Apercu({ skin }: { skin: DefinitionSkin }) {
  const { className, style } = attributsSkin(skin);
  if (skin.categorie === 'cadre-profil') return <span aria-hidden="true" style={style} className={`apercu-skin ${className}`}>Carte</span>;
  if (skin.categorie === 'fond-scene') return <span aria-hidden="true" className="apercu-skin relative overflow-hidden"><span style={style} className={`absolute inset-0 ${className}`} /></span>;
  const image = <img src="img/objets/poke-ball.png" alt="" width={30} height={30} className={`image-rendering-pixelated size-8 ${skin.categorie === 'effet-capture' ? className : ''}`} style={skin.categorie === 'effet-capture' ? style : undefined} />;
  return <span aria-hidden="true" className="apercu-skin">{skin.categorie === 'cadre-balle'
    ? <span style={style} className={`${className} p-1`}>{image}</span> : image}</span>;
}

export function BoutiqueSkins({ compte, actions }: { compte: ResumeCompte; actions: ActionsBoutique }) {
  const [message, fixerMessage] = useState('');
  const equipes = skinsEquipes(compte);
  const agir = (resultat: string | null, succes: string) => fixerMessage(resultat ?? succes);
  return <section aria-labelledby="titre-boutique-skins" className="space-y-4">
    <h2 id="titre-boutique-skins" className="font-titre text-xl">Boutique de skins</h2>
    <p className="text-texte-doux">Les skins ne changent que l'apparence : aucun avantage en jeu.</p>
    <p role="status" aria-live="polite" className="min-h-6">{message}</p>
    {CATEGORIES_SKINS.map(categorie => <section key={categorie.id} aria-label={categorie.nom} className="space-y-2">
      <h3 className="font-titre text-lg">{categorie.nom}</h3>
      <p className="text-sm text-texte-doux">{categorie.ou}</p>
      <ul className="grid gap-2">{SKINS.filter(s => s.categorie === categorie.id).map(skin => {
        const possede = compte.skins.includes(skin.id);
        const equipe = equipes[categorie.id]?.id === skin.id;
        return <li key={skin.id} className="cadre flex flex-wrap items-center gap-3 bg-surface p-3">
          <Apercu skin={skin} />
          <div className="min-w-0 flex-1">
            <p className="font-bold">{skin.nom}</p>
            <p className="text-sm text-texte-doux">{skin.description}</p>
          </div>
          {!possede && <button type="button" className="plaque min-h-11 px-4" disabled={compte.diamants < skin.prix}
            aria-label={`Acheter ${skin.nom} pour ${skin.prix} diamants`}
            onClick={() => agir(actions.acheter(skin.id), `${skin.nom} acheté.`)}>
            <span>Acheter</span><span className="inline-flex items-center gap-1"><IconeDiamant />{skin.prix}</span></button>}
          {possede && !equipe && <button type="button" className="plaque min-h-11 px-4" aria-label={`Équiper ${skin.nom}`}
            onClick={() => agir(actions.equiper(categorie.id, skin.id), `${skin.nom} équipé.`)}>Équiper</button>}
          {equipe && <button type="button" className="plaque min-h-11 px-4" aria-label={`Retirer ${skin.nom}`}
            onClick={() => agir(actions.equiper(categorie.id, null), `${skin.nom} retiré.`)}>Retirer</button>}
          {equipe && <p className="w-full text-sm text-succes-texte"><span aria-hidden="true">✓ </span>Équipé</p>}
        </li>;
      })}</ul>
    </section>)}
  </section>;
}
