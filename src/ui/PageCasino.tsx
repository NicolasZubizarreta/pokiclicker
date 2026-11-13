import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useStore } from 'zustand';
import { chargerCasino, messageBienvenue, prixJeton, valeurJeton } from '../core/casino';
import { storeJeu, type StoreJeu } from './store';
import { Image, imageConnue } from './Image';
import { BoutiqueCasino } from './BoutiqueCasino';
import { CarteAGratter } from './CarteAGratter';
import { CarteJeu, Illustration, Jeton, nombre, Verdict, type Ton } from './casino-interface';
import { MachineASous } from './MachineASous';
import { PileOuFace } from './PileOuFace';
import { PlusOuMoins } from './PlusOuMoins';
import { Roulette } from './Roulette';
import { TableBlackjack } from './TableBlackjack';
import './PageCasino.css';

const donnees = chargerCasino();
type Vue = 'salle' | 'machine' | 'blackjack' | 'pile' | 'roulette' | 'plusmoins' | 'gratter' | 'boutique';
const titres: Record<Vue, string> = { salle: 'Casino', machine: 'Machine à sous', blackjack: 'Blackjack', pile: 'Pile ou face', roulette: 'Roulette',
  plusmoins: 'Plus ou moins', gratter: 'Carte à gratter', boutique: 'Boutique de jetons' };
const accueils: Record<Vue, string> = { salle: '', machine: 'Choisis ta mise et lance.', blackjack: 'Choisis ta mise et distribue.', pile: 'Choisis ton côté, puis lance.',
  roulette: 'Choisis ta mise sur la table, puis lance la bille.', plusmoins: 'La suivante sera-t-elle plus haute ou plus basse ?',
  gratter: 'Achète une carte, puis gratte les 6 cases.', boutique: '' };

/** Cartes de la salle (variante A) : un jeu par carte, avec trois images de vitrine décoratives. */
const vitrines: { vue: Exclude<Vue, 'salle'>; titre: string; texte: string; bouton: string; vitrine: ReactNode }[] = [
  { vue: 'machine', titre: 'Machine à sous', texte: 'Trois symboles identiques et ça paie, jusqu’à ×500 avec les 7.', bouton: 'Jouer à la machine',
    vitrine: ['pokemon/121', 'objets/master-ball.png', 'pokemon/25'].map(i => <span key={i} className="cs-mini"><Illustration image={i} nom="" /></span>) },
  { vue: 'blackjack', titre: 'Blackjack', texte: 'Bats le Croupier Rocket sans dépasser 21. Blackjack payé ×2,5.', bouton: 'S’asseoir à la table',
    vitrine: <ul className="cs-cartes"><CarteJeu rang="A" couleur="S" nom="As de pique" /><CarteJeu rang="K" couleur="H" nom="Roi de cœur" /><CarteJeu dos /></ul> },
  { vue: 'pile', titre: 'Pile ou face', texte: 'Choisis un côté. Bonne réponse : ta mise ×2.', bouton: 'Lancer la pièce',
    vitrine: <span className="cs-mini cs-mini-piece"><Illustration image="pokemon/25" nom="" /></span> },
  { vue: 'roulette', titre: 'Roulette', texte: '37 cases, le 0 est vert. Rouge ou noir, pair ou impair ×2, numéro plein ×36.', bouton: 'Lancer la bille',
    vitrine: [['rouge', 17], ['vert', 0], ['noir', 22]].map(([c, n]) => <span key={n} className="cs-puce cs-grande" data-c={c}>{n}</span>) },
  { vue: 'plusmoins', titre: 'Plus ou moins', texte: 'Une carte visible : la suivante sera-t-elle plus haute ou plus basse ? Égalité : tu perds.', bouton: 'Jouer',
    vitrine: <><ul className="cs-cartes"><CarteJeu rang="7" couleur="S" nom="7 de pique" /></ul>
      <svg className="cs-fleche-grande" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M8 20V4M4 8l4-4 4 4M16 4v16M12 16l4 4 4-4" /></svg>
      <ul className="cs-cartes"><CarteJeu dos /></ul></> },
  { vue: 'gratter', titre: 'Carte à gratter', texte: 'Six cases à gratter : trois symboles identiques ou plus, tu gagnes.', bouton: 'Gratter',
    vitrine: <><span className="cs-mini"><Illustration image="pokemon/25" nom="" /></span><span className="cs-mini"><Illustration image="pokemon/25" nom="" /></span><span className="cs-mini cs-hachure" /></> },
  { vue: 'boutique', titre: 'Boutique de jetons', texte: 'Abra, Porygon, Master Ball… dès 250 jetons.', bouton: 'Voir la boutique',
    vitrine: ['pokemon/63', 'objets/master-ball.png', 'pokemon/137'].map(i => <span key={i} className="cs-produit-image"><Illustration image={i} nom="" /></span>) },
];
export function PageCasino({ retour, store = storeJeu, offerts = 0 }: { retour(): void; store?: StoreJeu; offerts?: number }) {
  const casino = useStore(store, e => e.casino), argent = useStore(store, e => e.argent);
  const actions = store.getState();
  const [vue, aller] = useState<Vue>(casino.blackjackEnCours ? 'blackjack' : 'salle');
  const [message, ecrire] = useState(casino.blackjackEnCours ? 'À toi de jouer.' : ''), [ton, tonner] = useState<Ton | undefined>(undefined);
  /** Gain déjà crédité mais pas encore révélé par l'animation du jeu en cours : retiré de l'affichage des jetons. */
  const [cache, cacher] = useState<number | null>(null);
  const [nbJetons, saisir] = useState('50');
  const titre = useRef<HTMLHeadingElement>(null);
  useEffect(() => { titre.current?.focus(); }, [vue]);
  const signaler = useCallback((m: string, t?: Ton) => { ecrire(m); tonner(t); }, []);
  const occuper = useCallback((gain: number | null) => cacher(gain), []);
  const changer = (v: Vue) => {
    cacher(null); aller(v); ecrire(v === 'blackjack' && casino.blackjackEnCours ? 'À toi de jouer.' : accueils[v]); tonner(undefined);
  };
  const jetons = Math.max(0, casino.jetons - (cache ?? 0));
  const verdict = <Verdict message={message} ton={ton} />;
  const nombreLu = /^\d+$/.test(nbJetons.trim()) ? Number(nbJetons) : NaN;
  const pas = (d: number) => saisir(String(Math.max(1, (Number.isNaN(nombreLu) ? 0 : nombreLu) + d)));
  const caisse = (action: () => { ok: true; message: string } | { ok: false; raison: string }) => {
    const r = action(); signaler(r.ok ? r.message : r.raison, r.ok ? 'gain' : 'alerte');
  };
  const pastille = <span className="cs-pastille"><Jeton /><b data-jetons>{nombre(jetons)}</b></span>;
  const entete = (v: Vue) => v === 'salle' ? null : <div className="cs-jeu-entete">
    <button type="button" className="plaque" onClick={() => changer('salle')}>Salle</button>
    <h1 ref={titre} tabIndex={-1}>{titres[v]}</h1>{pastille}</div>;
  const rappel = <p className="cs-rappel">{donnees.rappel}</p>;

  if (!casino.acces.ouvert) return <section className="casino cs-page">
    <div className="cs-accueil"><div><h1 ref={titre} tabIndex={-1}>Casino</h1><p>Céladopole · Kanto</p></div>
      <button type="button" className="plaque" onClick={retour}>Retour à la Carte</button></div>
    {rappel}<p role="status" className="cs-verdict">{casino.acces.raison}</p>
  </section>;

  return <section className="casino cs-page" data-vue={vue}>
    {vue === 'salle' && <div className="cs-salle-grille">
      <div className="cs-colonne">
        <figure className="cs-scene">
          {imageConnue('img/decors/casino.webp') && <Image src="img/decors/casino.webp" genre="decor" couvrir className="cs-scene-img"
            alt="La salle du casino de Céladopole : machines à sous, comptoir de la boutique et tapis à l’emblème Poké Ball" />}
        </figure>
        <div className="cs-accueil">
          <div><h1 ref={titre} tabIndex={-1}>Casino</h1><p>Céladopole · Kanto</p>
            <span className="cs-pastille cs-solde-mobile"><Jeton /><b data-jetons>{nombre(jetons)} jetons</b></span></div>
          <button type="button" className="plaque" onClick={retour}>Retour à la Carte</button>
        </div>
        <div className="cs-jeux-grille">{vitrines.map((v, i) => <article key={v.vue} data-tuto={i === 0 ? "casino-jeux" : undefined} className="cs-carte-jeu">
          <div className="cs-vitrine" aria-hidden="true">{v.vitrine}</div>
          <div className="cs-carte-corps"><h2>{v.titre}</h2><p>{v.texte}</p>
            <button type="button" className="plaque" onClick={() => changer(v.vue)}>{v.bouton}</button></div>
        </article>)}</div>
      </div>
      <div className="cs-colonne cs-droite">
        {/* Zone vivante toujours présente pour que le cadeau soit annoncé ; sans role="status", réservé à la phrase d'état. */}
        <div aria-live="polite">{offerts > 0 && <section className="cs-cadeau cadre-alerte" aria-label="Cadeau de bienvenue">
          <p data-bienvenue-casino>{messageBienvenue(offerts)}</p></section>}</div>
        <section className="cs-caisse cadre" aria-labelledby="cs-t-caisse"><h2 id="cs-t-caisse" data-tuto="casino-jetons">Tes jetons</h2>
          <dl className="cs-soldes"><div><dt>Jetons</dt><dd><Jeton gros /><span data-jetons>{nombre(jetons)}</span></dd></div>
            <div><dt>Pokédollars</dt><dd>{nombre(argent)} ₽</dd></div></dl>
          <div className="cs-echange"><label htmlFor="cs-nb-jetons">Combien de jetons ?</label>
            <div className="cs-pas">
              <button type="button" className="plaque" aria-label="10 jetons de moins" onClick={() => pas(-10)}>−</button>
              <input id="cs-nb-jetons" className="cs-champ" inputMode="numeric" pattern="[0-9]*" autoComplete="off" value={nbJetons} onChange={e => saisir(e.target.value)} />
              <button type="button" className="plaque" aria-label="10 jetons de plus" onClick={() => pas(10)}>+</button></div>
            <div className="cs-rapides">{[10, 50, 100, 500].map(n =>
              <button key={n} type="button" className="plaque" aria-label={`${n} jetons`} onClick={() => saisir(String(n))}>{n}</button>)}</div>
            <p className="cs-prix"><span>{nombre(prixJeton())} ₽ le jeton.</span>
              <span>Achat : <b>{Number.isNaN(nombreLu) ? '—' : `${nombre(nombreLu * prixJeton())} ₽`}</b></span>
              <span>Rachat : <b>{Number.isNaN(nombreLu) ? '—' : `${nombre(nombreLu * valeurJeton())} ₽`}</b></span></p>
            <div className="cs-actions-echange">
              <button type="button" className="plaque" onClick={() => caisse(() => actions.acheterJetons(nombreLu))}>Acheter</button>
              <button type="button" className="plaque" onClick={() => caisse(() => actions.echangerJetons(nombreLu))}>Racheter</button></div>
            <button type="button" className="plaque" onClick={() => caisse(() => actions.acheterJetons())}>Lot de 50 jetons · {nombre(50 * prixJeton())} ₽</button>
            {verdict}</div>
          {rappel}
        </section>
      </div>
    </div>}
    {vue !== 'salle' && <>
      {entete(vue)}
      {vue === 'machine' && <MachineASous actions={actions} signaler={signaler} occuper={occuper} jetons={jetons} verdict={verdict} />}
      {vue === 'pile' && <PileOuFace actions={actions} signaler={signaler} occuper={occuper} jetons={jetons} verdict={verdict} />}
      {vue === 'blackjack' && <TableBlackjack actions={actions} main={casino.blackjackEnCours} signaler={signaler} jetons={jetons} verdict={verdict} />}
      {vue === 'roulette' && <Roulette actions={actions} signaler={signaler} occuper={occuper} jetons={jetons} verdict={verdict} />}
      {vue === 'plusmoins' && <PlusOuMoins actions={actions} carte={casino.plusOuMoinsCarte} signaler={signaler} occuper={occuper} jetons={jetons} verdict={verdict} />}
      {vue === 'gratter' && <CarteAGratter actions={actions} signaler={signaler} occuper={occuper} jetons={jetons} verdict={verdict} />}
      {vue === 'boutique' && <BoutiqueCasino actions={actions} objets={casino.objets} jetons={jetons} signaler={signaler} verdict={verdict} />}
      {rappel}
    </>}
  </section>;
}
