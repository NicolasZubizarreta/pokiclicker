import { useEffect, useRef, useState } from 'react';
import { useStore } from 'zustand';
import { chargerCasino } from '../core/casino';
import { storeJeu, type StoreJeu } from './store';
import { Image, imageConnue } from './Image';
import { boutonCasino, IllustrationCasino } from './casino-interface';
import { MachineASous } from './MachineASous';
import { PileOuFace } from './PileOuFace';
import { TableBlackjack } from './TableBlackjack';
import './PageCasino.css';

const donnees = chargerCasino();
const nombre = (n: number) => n.toLocaleString('fr-FR');
export function PageCasino({ retour, store = storeJeu }: { retour(): void; store?: StoreJeu }) {
  const casino = useStore(store, e => e.casino), argent = useStore(store, e => e.argent);
  const actions = store.getState();
  const [onglet, choisir] = useState(casino.blackjackEnCours ? 'Blackjack' : 'Machine à sous');
  const [occupe, occuper] = useState(false), [message, signaler] = useState('Choisis ton jeu et ta mise.');
  const titre = useRef<HTMLHeadingElement>(null);
  useEffect(() => { titre.current?.focus(); }, []);
  function agir(action: () => { ok: true; message: string } | { ok: false; raison: string }) {
    const r = action(); signaler(r.ok ? r.message : r.raison);
  }
  return <section className="mx-auto grid max-w-screen-xl gap-4 text-base">
    <header className="cadre relative isolate overflow-hidden bg-surface p-4">
      {imageConnue('img/decors/casino.webp') && <Image src="img/decors/casino.webp" genre="decor" alt="" couvrir className="absolute inset-0 -z-10 size-full" />}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-surface p-4">
        <div><p>Céladopole · Kanto</p><h1 ref={titre} tabIndex={-1} className="font-titre text-3xl font-semibold">Casino</h1></div>
        <button className={boutonCasino} onClick={retour}>Retour à la Carte</button>
      </div>
    </header>
    <p>{donnees.rappel}</p>
    {casino.acces.ouvert && <>
      <section aria-label="Tes jetons" className="cadre flex flex-wrap items-center gap-4 bg-surface p-4">
        <div><strong className="text-2xl text-region-accent">{nombre(casino.jetons)} jetons</strong><p>{nombre(argent)} $</p></div>
        <div><button className={boutonCasino} disabled={occupe || argent < donnees.jetons.achat.cost} onClick={() => agir(actions.acheterJetons)}>Acheter 50 jetons</button><p>Coût : {nombre(donnees.jetons.achat.cost)} $</p>
          {argent < donnees.jetons.achat.cost && <p>{donnees.messages.argentInsuffisant}</p>}</div>
        <div><button className={boutonCasino} disabled={occupe || casino.jetons < donnees.jetons.rachat.tokens} onClick={() => agir(actions.echangerJetons)}>Échanger 50 jetons</button><p>Reçois {nombre(donnees.jetons.rachat.money)} $</p>
          {casino.jetons < donnees.jetons.rachat.tokens && <p>{donnees.messages.jetonsInsuffisants}</p>}</div>
      </section>
      <nav aria-label="Activités du casino" className="flex flex-wrap gap-2">{['Machine à sous', 'Pile ou face', 'Blackjack', 'Boutique'].map(nom =>
        <button key={nom} className={boutonCasino} aria-pressed={onglet === nom} disabled={occupe} onClick={() => { choisir(nom); signaler(nom === 'Blackjack' && casino.blackjackEnCours ? 'À toi de jouer.' : 'Choisis ton jeu et ta mise.'); }}>{nom}</button>)}</nav>
      <div className="cadre bg-surface p-4">
        {onglet === 'Machine à sous' && <MachineASous actions={actions} signaler={signaler} occuper={occuper} />}
        {onglet === 'Pile ou face' && <PileOuFace actions={actions} signaler={signaler} occuper={occuper} />}
        {onglet === 'Blackjack' && <TableBlackjack actions={actions} main={casino.blackjackEnCours} signaler={signaler} />}
        {onglet === 'Boutique' && <section aria-label="Boutique du casino"><h2 className="mb-4 font-titre text-2xl">Boutique de jetons</h2>
          <div className="grid gap-4 md:grid-cols-2">{casino.objets.map(objet => {
            const article = donnees.boutique.find(a => a.key === objet.id)!;
            return <article key={objet.id} className="flex flex-wrap items-center gap-4 border-2 border-bordure bg-surface-2 p-4">
              <IllustrationCasino image={article.type === 'pokemon' ? `pokemon/${article.id}` : article.key === 'masterball' ? 'objets/master-ball.png' : null} nom={objet.nom} />
              <div className="min-w-0 flex-1"><h3>{objet.nom}</h3><p>{nombre(objet.prix)} jetons</p>{article.type === 'pokemon' && <p>Niveau 25 · Équipe ou PC</p>}</div>
              <button className={boutonCasino} disabled={!objet.abordable} aria-describedby={objet.raison ? `casino-${objet.id}` : undefined} onClick={() => agir(() => actions.acheterAuCasino(objet.id))}>Obtenir {objet.nom}</button>
              {objet.raison && <p id={`casino-${objet.id}`} className="w-full">{objet.raison}</p>}
            </article>;
          })}</div></section>}
      </div>
    </>}
    <p role="status" className="cadre bg-surface p-4">{casino.acces.ouvert ? message : casino.acces.raison}</p>
  </section>;
}
