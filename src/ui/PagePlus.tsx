import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { useStore } from 'zustand';
import { BoiteBadges } from './BoiteBadges';
import { Diplome } from './Diplome';
import './MenuPC.css';
import { Pokedex } from './Pokedex';
import { PokedexTelephone } from './PokedexTelephone';
import { BadgesTelephone } from './BadgesTelephone';
import { StatistiquesPage } from './StatistiquesPage';
import { GuidePage } from './GuidePage';
import { erreurRetourMenu, useRetourMenuPrincipal } from './useRetourMenuPrincipal';
import { useTelephone } from './useTelephone';
import { storeJeu } from './store';
import { PC } from './icones';
import { formaterProchainPalier } from './store-progression';
import { PageReglages } from './PageReglages';
import type { EtatSynchro } from './synchro';
import { EtatSynchronisation } from './EtatSynchronisation';
import { estProbleme } from './synchronisations';
import { IconeMonde, IconePokedex, IconeBadges, IconeStats, IconeGuide, IconeReglages, IconeDisque, IconeSortie, IconeChevron } from './icones-menu';

function GroupeMenu({ telephone, children }: { telephone: boolean; children: ReactNode }) {
  return telephone ? <>{children}</> : <div className="menu-pc-tuiles grid-cols-3">{children}</div>;
}

function LigneMenu({ icone, titre, titreVisible, sousTexte, children, entree, onClick, disabled, grise, compteurDansNom }: {
  icone: ReactNode; titre: string; titreVisible?: string; sousTexte?: string; children?: ReactNode;
  entree?: string; onClick(): void; disabled?: boolean; grise?: boolean; compteurDansNom?: boolean;
}) {
  // Nom accessible : le titre (avec le compteur si demandé) ; le reste est la description.
  const titreId = useId();
  const sousId = useId();
  const enfantId = useId();
  const description = [sousTexte && !compteurDansNom ? sousId : '', children ? enfantId : ''].filter(Boolean).join(' ');
  return <button type="button" data-entree={entree} onClick={onClick} disabled={disabled}
    aria-labelledby={sousTexte && compteurDansNom ? `${titreId} ${sousId}` : titreId}
    aria-describedby={description || undefined}
    className={`cadre flex min-h-11 w-full items-center gap-4 bg-surface p-4 text-left hover:bg-selection${grise ? ' opacity-60' : ''}`}>
    {icone}
    <span className="min-w-0 flex-1">
      <span id={titreId} className="block font-semibold">{titreVisible ? <><span className="sr-only">{titre}</span><span aria-hidden="true">{titreVisible}</span></> : titre}</span>
      {sousTexte && <span id={sousId} className="block text-sm text-texte-doux">{sousTexte}</span>}
      {children && <span id={enfantId}>{children}</span>}
    </span>
    <IconeChevron />
  </button>;
}

export function PagePlus({ ouvrirPC, ouvrirMonde, menuPrincipal, attendreEnvoi, etatSynchro }: {
  /** Affiché dans le Menu du téléphone seulement quand il y a un problème (sur PC : barre latérale). */
  etatSynchro?: EtatSynchro;
  ouvrirPC(): void;
  ouvrirMonde(): void;
  /** Sauvegarde puis ouvre les parties ; absent hors ligne. */
  menuPrincipal?: () => Promise<boolean>;
  /** Attend l'envoi après la sauvegarde locale ; false si la partie n'est partie nulle part (hors ligne, refus, conflit). */
  attendreEnvoi?: () => Promise<boolean | void>;
}) {
  const pcOuvert = useStore(storeJeu, etat => etat.accesPc.ouvert);
  const diplome = useStore(storeJeu, etat => etat.fin.diplome);
  const [diplomeOuvert, ouvrirDiplome] = useState(false);
  const [sousPage, choisir] = useState<null | 'pokedex' | 'badges' | 'reglages' | 'stats' | 'guide'>(null);
  const telephone = useTelephone();
  const progression = useStore(storeJeu, etat => etat.progression);
  const lieu = useStore(storeJeu, etat => etat.lieu);
  const [sauvegarde, definirSauvegarde] = useState<'repos' | 'enCours' | 'succes' | 'local' | 'echec'>('repos');
  const [heure, definirHeure] = useState('');
  const sauvegardeEnCours = useRef(false);
  const { retourEnCours, retourEchoue, revenirAuMenuPrincipal } = useRetourMenuPrincipal(menuPrincipal);
  const sauvegarder = async () => {
    if (sauvegardeEnCours.current) return;
    sauvegardeEnCours.current = true;
    definirSauvegarde('enCours');
    try {
      const ok = storeJeu.getState().sauvegarder();
      let envoye = true;
      if (ok) {
        try { envoye = (await attendreEnvoi?.()) !== false; } catch { envoye = false; /* La sauvegarde locale est faite. */ }
        definirHeure(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
      }
      definirSauvegarde(!ok ? 'echec' : envoye ? 'succes' : 'local');
    } finally {
      sauvegardeEnCours.current = false;
    }
  };
  const { nombre, total } = progression.pokedex;
  const conteneur = useRef<HTMLDivElement>(null);

  const monte = useRef(false);
  const entree = useRef<'pokedex' | 'badges' | 'reglages' | 'stats' | 'guide'>('pokedex');
  useEffect(() => {
    // Pas de déplacement du focus au premier rendu : seul le changement de sous-page compte.
    if (!monte.current) { monte.current = true; return; }
    const conteneurPage = conteneur.current;
    if (sousPage === null) conteneurPage?.querySelector<HTMLElement>(`[data-entree="${entree.current}"]`)?.focus();
    else conteneurPage?.querySelector('h1')?.focus();
  }, [sousPage]);

  return <div ref={conteneur} className={!telephone && sousPage === null ? 'menu-pc' : undefined}>
    {sousPage === 'pokedex' ? telephone
        ? <PokedexTelephone retour={() => choisir(null)} ouvrirDiplome={diplome ? () => ouvrirDiplome(true) : undefined} />
        : <Pokedex retour={() => choisir(null)} />
        : sousPage === 'stats' ? <StatistiquesPage retour={() => choisir(null)} />
        : sousPage === 'guide' ? <GuidePage retour={() => choisir(null)} />
        : sousPage === 'badges' && telephone ? <BadgesTelephone badges={progression.badges} retour={() => choisir(null)} />
        : sousPage === 'badges' ? <section className="mx-auto max-w-screen-xl space-y-4 text-base">
          <header className="flex items-center gap-4">
          <button type="button" onClick={() => choisir(null)}
            className="min-h-11 bg-surface-2 px-4 py-2 hover:bg-selection">Retour au menu</button>
          <h1 tabIndex={-1} className="font-titre text-2xl font-semibold">Badges</h1>
          <span className="plaque">{progression.obtenus} / 8</span>
          </header>
          <BoiteBadges badges={progression.badges} />
        </section>
        : sousPage === 'reglages' ? <PageReglages retour={() => choisir(null)} />
        : <section className="mx-auto max-w-screen-xl space-y-4 text-base">
          <h1 tabIndex={-1} className="font-titre text-2xl font-semibold">Menu</h1>
          <section aria-label="Partie en cours" className="cadre space-y-4 bg-surface p-4">
            <p className="text-sm text-texte-doux">Partie en cours</p>
            <h2 className="font-titre text-lg font-semibold">{lieu ? `Kanto · ${lieu.nom}` : 'Kanto'}</h2>
            <p role={sauvegarde === 'echec' ? 'alert' : sauvegarde === 'repos' ? undefined : 'status'} className="text-sm text-texte-doux">
              {sauvegarde === 'repos' ? 'La partie se sauvegarde toute seule.'
                : sauvegarde === 'enCours' ? 'Sauvegarde en cours…'
                  : sauvegarde === 'succes' ? `Partie sauvegardée à ${heure}.`
                    : sauvegarde === 'local' ? `Partie sauvegardée sur cet appareil à ${heure}. L'envoi en ligne est en attente.`
                    : 'La sauvegarde a échoué. Réessaie : ta partie reste en mémoire.'}
            </p>
            {telephone && etatSynchro && estProbleme(etatSynchro) && <p role="status"><EtatSynchronisation etat={etatSynchro} /></p>}
            {!telephone && <dl className="menu-pc-infos">
              <dt>Région</dt><dd>Kanto</dd><dt>Zone</dt><dd>{lieu?.nom ?? 'Kanto'}</dd>
              <dt>Pokédex</dt><dd>{`${nombre} / 151`}</dd><dt>Badges</dt><dd>{`${progression.obtenus} / 8`}</dd>
            </dl>}
            <button type="button" onClick={sauvegarder} disabled={sauvegarde === 'enCours' || retourEnCours}
              className="flex min-h-11 w-full items-center justify-center gap-4 bg-action p-4 text-action-texte">
              <IconeDisque />Sauvegarder maintenant
            </button>
          </section>
          <GroupeMenu telephone={telephone}>
          <LigneMenu icone={<IconeMonde />} titre="Monde Pokémon" titreVisible={telephone ? undefined : 'Monde'} sousTexte="Kanto jouable" onClick={ouvrirMonde} />
          <h2 className="font-titre text-lg text-region-accent">Ton aventure</h2>
          <LigneMenu icone={<PC />} titre="PC de Léo" entree="pc" grise={!pcOuvert} onClick={ouvrirPC} />
          <LigneMenu icone={<IconePokedex />} titre="Pokédex" sousTexte={`${nombre} / ${total}`}
            entree="pokedex" compteurDansNom
            onClick={() => { entree.current = 'pokedex'; choisir('pokedex'); }}>
            <span data-prochain-palier className="block text-sm text-texte-doux">{formaterProchainPalier(progression.prochain)}</span>
          </LigneMenu>
          <LigneMenu icone={<IconeBadges />} titre="Badges" sousTexte={`${progression.obtenus} sur ${progression.total}`}
            entree="badges" onClick={() => { entree.current = 'badges'; choisir('badges'); }} />
          <LigneMenu icone={<IconeStats />} titre="Statistiques" sousTexte="Dégâts, DPS et gains" entree="stats"
            onClick={() => { entree.current = 'stats'; choisir('stats'); }} />
          {diplome && !telephone && <LigneMenu icone={<IconePokedex />} titre="Diplôme du Pokédex" onClick={() => ouvrirDiplome(true)} />}
          <h2 className="font-titre text-lg text-region-accent">Aide et réglages</h2>
          <LigneMenu icone={<IconeGuide />} titre="Guide du jeu" entree="guide"
            onClick={() => { entree.current = 'guide'; choisir('guide'); }} />
          <LigneMenu icone={<IconeReglages />} titre="Réglages" entree="reglages"
            onClick={() => { entree.current = 'reglages'; choisir('reglages'); }} />
          </GroupeMenu>
          {telephone && menuPrincipal && <LigneMenu icone={<IconeSortie />} titre="Menu principal"
            sousTexte="Sauvegarde, puis retour à tes parties" disabled={retourEnCours || sauvegarde === 'enCours'} onClick={revenirAuMenuPrincipal} />}
          {telephone && retourEchoue && <p role="alert">{erreurRetourMenu}</p>}
        </section>}
    {diplomeOuvert && diplome && <Diplome diplome={diplome} fermer={() => ouvrirDiplome(false)} />}
  </div>;
}
