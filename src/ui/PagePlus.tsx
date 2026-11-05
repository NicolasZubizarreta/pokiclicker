import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { useStore } from 'zustand';
import { BoiteBadges } from './BoiteBadges';
import { Diplome } from './Diplome';
import { Guide } from './Guide';
import { Statistiques } from './Statistiques';
import { Pokedex } from './Pokedex';
import { storeJeu } from './store';
import { PC } from './icones';
import { formaterProchainPalier } from './store-progression';
import { PageReglages } from './PageReglages';
import { IconeMonde, IconePokedex, IconeBadges, IconeStats, IconeGuide, IconeReglages, IconeDisque, IconeSortie, IconeChevron } from './icones-menu';

function LigneMenu({ icone, titre, sousTexte, children, entree, onClick, disabled, grise, compteurDansNom }: {
  icone: ReactNode; titre: string; sousTexte?: string; children?: ReactNode;
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
      <span id={titreId} className="block font-semibold">{titre}</span>
      {sousTexte && <span id={sousId} className="block text-sm text-texte-doux">{sousTexte}</span>}
      {children && <span id={enfantId}>{children}</span>}
    </span>
    <IconeChevron />
  </button>;
}

export function PagePlus({ ouvrirPC, ouvrirMonde, menuPrincipal, attendreEnvoi }: {
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
  const [guideOuvert, ouvrirGuide] = useState(false);
  const [statsOuvertes, ouvrirStats] = useState(false);
  const [sousPage, choisir] = useState<null | 'pokedex' | 'badges' | 'reglages'>(null);
  const progression = useStore(storeJeu, etat => etat.progression);
  const lieu = useStore(storeJeu, etat => etat.lieu);
  const [sauvegarde, definirSauvegarde] = useState<'repos' | 'enCours' | 'succes' | 'local' | 'echec'>('repos');
  const [heure, definirHeure] = useState('');
  const sauvegardeEnCours = useRef(false);
  const [retourEnCours, definirRetourEnCours] = useState(false);
  const retourVerrouille = useRef(false);
  const [retourEchoue, definirRetourEchoue] = useState(false);
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
  const revenirAuMenuPrincipal = async () => {
    if (!menuPrincipal || retourVerrouille.current) return;
    retourVerrouille.current = true;
    definirRetourEnCours(true);
    definirRetourEchoue(false);
    try {
      definirRetourEchoue(!await menuPrincipal());
    } catch {
      definirRetourEchoue(true);
    } finally {
      retourVerrouille.current = false;
      definirRetourEnCours(false);
    }
  };
  const { nombre, total } = progression.pokedex;
  const conteneur = useRef<HTMLDivElement>(null);

  const monte = useRef(false);
  const entree = useRef<'pokedex' | 'badges' | 'reglages'>('pokedex');
  useEffect(() => {
    // Pas de déplacement du focus au premier rendu : seul le changement de sous-page compte.
    if (!monte.current) { monte.current = true; return; }
    const conteneurPage = conteneur.current;
    if (sousPage === null) conteneurPage?.querySelector<HTMLElement>(`[data-entree="${entree.current}"]`)?.focus();
    else conteneurPage?.querySelector('h1')?.focus();
  }, [sousPage]);

  return <div ref={conteneur}>
    {sousPage === 'pokedex' ? <Pokedex retour={() => choisir(null)} />
        : sousPage === 'badges' ? <section className="mx-auto max-w-screen-xl space-y-4 text-base">
          <button type="button" onClick={() => choisir(null)}
            className="min-h-11 bg-surface-2 px-4 py-2 hover:bg-selection">Retour</button>
          <h1 tabIndex={-1} className="font-titre text-2xl font-semibold">Badges</h1>
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
            <button type="button" onClick={sauvegarder} disabled={sauvegarde === 'enCours' || retourEnCours}
              className="flex min-h-11 w-full items-center justify-center gap-4 bg-action p-4 text-action-texte">
              <IconeDisque />Sauvegarder maintenant
            </button>
          </section>
          <LigneMenu icone={<IconeMonde />} titre="Monde Pokémon" sousTexte="Kanto jouable" onClick={ouvrirMonde} />
          <h2 className="font-titre text-lg text-region-accent">Ton aventure</h2>
          <LigneMenu icone={<PC />} titre="PC de Léo" entree="pc" grise={!pcOuvert} onClick={ouvrirPC} />
          <LigneMenu icone={<IconePokedex />} titre="Pokédex" sousTexte={`${nombre} / ${total}`}
            entree="pokedex" compteurDansNom
            onClick={() => { entree.current = 'pokedex'; choisir('pokedex'); }}>
            <span data-prochain-palier className="block text-sm text-texte-doux">{formaterProchainPalier(progression.prochain)}</span>
          </LigneMenu>
          <LigneMenu icone={<IconeBadges />} titre="Badges" sousTexte={`${progression.obtenus} sur ${progression.total}`}
            entree="badges" onClick={() => { entree.current = 'badges'; choisir('badges'); }} />
          <LigneMenu icone={<IconeStats />} titre="Statistiques" sousTexte="Dégâts, DPS et gains" onClick={() => ouvrirStats(true)} />
          {diplome && <LigneMenu icone={<IconePokedex />} titre="Diplôme du Pokédex" onClick={() => ouvrirDiplome(true)} />}
          <h2 className="font-titre text-lg text-region-accent">Aide et réglages</h2>
          <LigneMenu icone={<IconeGuide />} titre="Guide du jeu" onClick={() => ouvrirGuide(true)} />
          <LigneMenu icone={<IconeReglages />} titre="Réglages" entree="reglages"
            onClick={() => { entree.current = 'reglages'; choisir('reglages'); }} />
          {menuPrincipal && <LigneMenu icone={<IconeSortie />} titre="Menu principal"
            sousTexte="Sauvegarde, puis retour à tes parties" disabled={retourEnCours || sauvegarde === 'enCours'} onClick={revenirAuMenuPrincipal} />}
          {retourEchoue && <p role="alert">La sauvegarde a échoué : tu restes dans la partie.</p>}
        </section>}
    {diplomeOuvert && diplome && <Diplome diplome={diplome} fermer={() => ouvrirDiplome(false)} />}
    {guideOuvert && <Guide fermer={() => ouvrirGuide(false)} />}
    {statsOuvertes && <Statistiques fermer={() => ouvrirStats(false)} />}
  </div>;
}
