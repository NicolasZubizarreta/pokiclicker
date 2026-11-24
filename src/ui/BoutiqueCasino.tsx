import type { ReactNode } from 'react';
import { chargerCasino } from '../core/casino';
import type { ActionsCasino, AffichageCasino } from './store-casino';
import { Illustration, jetonsTexte, nombre, type Signaler } from './casino-interface';

const donnees = chargerCasino();
const imageArticle = (article: (typeof donnees.boutique)[number]) =>
  article.type === 'pokemon' ? `pokemon/${article.id}` : article.key === 'masterball' ? 'objets/master-ball.png' : null;

export function BoutiqueCasino({ actions, objets, vip, jetons, signaler, verdict }: {
  actions: ActionsCasino; objets: AffichageCasino['objets']; vip: AffichageCasino['vip']; jetons: number; signaler: Signaler; verdict: ReactNode;
}) {
  function obtenir(id: string) {
    const r = actions.acheterAuCasino(id);
    signaler(r.ok ? r.message : r.raison, r.ok ? 'gain' : 'alerte');
    if (r.ok) actions.sonnerCasino();
  }
  return <div className="cs-jeu cs-jeu-boutique">
    <div className="cs-plateau">
      <p className="cs-doux">Tu as <b className="cs-chiffre">{nombre(jetons)}</b> jetons.</p>
      {vip.remisePourCent > 0 && <p className="cs-doux">Remise de fidélité ({vip.niveau!.nom}) : −{vip.remisePourCent} % sur tous les prix.</p>}
      <ul className="cs-produits">{objets.map(objet => {
        const article = donnees.boutique.find(a => a.key === objet.id)!;
        return <li key={objet.id} className="cs-produit">
          <span className="cs-produit-image"><Illustration image={imageArticle(article)} nom={objet.nom} /></span>
          <div className="cs-produit-texte"><h3 className="cs-produit-nom">{objet.nom}</h3>
            <p className="cs-produit-prix"><span className="cs-jeton" aria-hidden="true" />{jetonsTexte(objet.prix)}</p>
            {article.type === 'pokemon' && <p className="cs-produit-desc">Niveau 25 · Équipe ou PC</p>}</div>
          <button type="button" className="plaque" disabled={!objet.abordable} aria-describedby={objet.raison ? `casino-${objet.id}` : undefined}
            onClick={() => obtenir(objet.id)}>Obtenir {objet.nom}</button>
          {objet.raison && <p id={`casino-${objet.id}`} className="cs-manque">{objet.raison}</p>}
        </li>;
      })}</ul>
      {verdict}
    </div>
  </div>;
}
