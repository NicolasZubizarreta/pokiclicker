// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { creerHorlogeSimulee } from '../core/clock';
import { compteInitial, creerGestionnaire, creerStockageMemoire } from '../core/sauvegarde';
import { reglages } from '../core/reglages';
import { EcranCombat } from './EcranCombat';
import { formaterDps } from './nombres';
import { creerStoreJeu } from './store';
import type { StoreJeu } from './store';
import { ERREUR_CHARGEMENT } from './persistance';

let store: StoreJeu;
it('transmet l’accès pension du store et garde Bourg Palette après le clic', () => {
  preparer();
  act(() => store.getState().allerVers('kanto.bourg-palette'));
  expect(screen.getByRole('button', { name: 'Pension Pokémon' }).getAttribute('aria-disabled')).toBe('true');
  act(() => store.setState({ pension: { ...store.getState().pension, acces: { ouvert: true, raison: null } } }));
  const pension = screen.getByRole('button', { name: 'Pension Pokémon' });
  expect(pension.hasAttribute('aria-disabled')).toBe(false);
  fireEvent.click(pension);
  fireEvent.click(screen.getByRole('button', { name: 'Sortir de la pension' }));
  act(() => vi.advanceTimersByTime(450));
  expect(screen.getByRole('region', { name: 'Bourg Palette' })).toBeTruthy();
  expect(store.getState().lieu?.id).toBe('kanto.bourg-palette');
});

it('affiche les deux outils verrouillés et leurs raisons sans aucun objet', () => {
  preparer();
  for (const [nom, raison] of [['Fauchage', 'Nécessite la CT Fauchage.'],
    ['Poké-Radar', 'Nécessite le Poké-Radar.']]) {
    const bouton = screen.getByRole('button', { name: nom });
    expect(bouton.matches(':disabled')).toBe(true);
    expect(screen.getByText(raison!).hidden).toBe(false);
    expect(document.getElementById(bouton.getAttribute('aria-describedby')!)?.textContent).toBe(raison);
  }
});

it('affiche les effets sous les PV sans annonce en direct et suit le store', () => {
  preparer();
  expect(screen.queryByRole('list', { name: 'Effets actifs' })).toBeNull();
  act(() => store.setState({ effets: [{ id: 'xAttack', pastille: 'Attaque + ×1,5', restantS: 12 }] }));
  const effets = screen.getByRole('list', { name: 'Effets actifs' });
  const pv = screen.getByRole('progressbar', { name: 'PV de Rattata' });
  expect(pv.parentElement?.parentElement?.contains(effets)).toBe(true);
  expect(pv.compareDocumentPosition(effets) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(effets.textContent).toBe('Attaque + ×1,5 : 12 s');
  expect(effets.closest('[aria-live], [role="status"]')).toBeNull();
  act(() => store.setState({ effets: [] }));
  expect(screen.queryByRole('list', { name: 'Effets actifs' })).toBeNull();
});

it('cache les outils sans objet et explique chaque verrou quand un outil est possédé', () => {
  preparer();
  const zone = store.getState().zone;
  act(() => store.setState({ zone: null }));
  expect(screen.queryByRole('button', { name: 'Fauchage' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Poké-Radar' })).toBeNull();
  act(() => store.setState({ zone, radar: true }));
  const fauchage = screen.getByRole('button', { name: 'Fauchage' });
  expect(fauchage.matches(':disabled')).toBe(true);
  expect(document.getElementById(fauchage.getAttribute('aria-describedby')!)?.textContent)
    .toBe('Nécessite la CT Fauchage.');
  act(() => store.setState({ radar: false, fauchage: { ...store.getState().fauchage,
    possede: true, disponible: true, raison: null } }));
  const radar = screen.getByRole('button', { name: 'Poké-Radar' });
  expect(radar.matches(':disabled')).toBe(true);
  expect(document.getElementById(radar.getAttribute('aria-describedby')!)?.textContent)
    .toBe('Nécessite le Poké-Radar.');
});

it('branche Fauchage et affiche son état actif, sa recharge et le refus sur un boss', () => {
  preparer();
  const faucher = vi.fn();
  act(() => store.setState({ faucher, fauchage: { possede: true, disponible: true,
    raison: null, rechargeS: 0, actif: false } }));
  const bouton = screen.getByRole('button', { name: 'Fauchage' });
  fireEvent.click(bouton);
  expect(faucher).toHaveBeenCalledOnce();
  act(() => store.setState({ fauchage: { ...store.getState().fauchage,
    disponible: false, actif: true, rechargeS: 30, raison: 'Recharge : 30 s' } }));
  expect(bouton.getAttribute('aria-pressed')).toBe('true');
  expect(screen.getByText('Recharge : 30 s')).toBeTruthy();
  act(() => store.setState({ ennemi: { ...store.getState().ennemi!, boss: true },
    fauchage: { ...store.getState().fauchage, actif: false, raison: 'Inutile sur un boss !' } }));
  expect(bouton.matches(':disabled')).toBe(true);
  expect(screen.getByText('Inutile sur un boss !')).toBeTruthy();
  fireEvent.click(bouton);
  expect(faucher).toHaveBeenCalledOnce();
});

it('ouvre le Radar sur les sauvages du lieu, applique le Pokédex et rend le focus', () => {
  preparer();
  const prototype = HTMLDialogElement.prototype;
  const modalInitial = Object.getOwnPropertyDescriptor(prototype, 'showModal');
  const closeInitial = Object.getOwnPropertyDescriptor(prototype, 'close');
  const showModal = vi.fn(function (this: HTMLDialogElement) {
    this.setAttribute('open', '');
  });
  const close = vi.fn(function (this: HTMLDialogElement) {
    this.removeAttribute('open');
    fireEvent(this, new Event('close'));
  });
  Object.defineProperty(prototype, 'showModal', { configurable: true, value: showModal });
  Object.defineProperty(prototype, 'close', { configurable: true, value: close });
  try {
    const zone = store.getState().zone!;
    const premier = zone.sauvages[0]!.pokemon;
    act(() => store.setState({ radar: true, pokedex: [premier] }));
    const bouton = screen.getByRole('button', { name: 'Poké-Radar' });
    fireEvent.click(bouton);
    const fenetre = screen.getByRole('dialog', { name: store.getState().lieu!.nom });
    expect(showModal).toHaveBeenCalledOnce();
    const images = within(fenetre).getAllByRole('img');
    expect(images).toHaveLength(zone.sauvages.length);
    for (const [index, image] of images.entries()) {
      expect(image.classList.contains('brightness-0')).toBe(zone.sauvages[index]!.pokemon !== premier);
      expect(image.getAttribute('src')).toMatch(/^img\//);
    }
    expect(within(fenetre).getAllByText('Commun').length).toBeGreaterThan(0);
    fireEvent.click(within(fenetre).getByRole('button', { name: 'Fermer' }));
    expect(screen.queryByRole('dialog', { name: store.getState().lieu!.nom })).toBeNull();
    expect(document.activeElement).toBe(bouton);
  } finally {
    if (modalInitial) Object.defineProperty(prototype, 'showModal', modalInitial);
    else Reflect.deleteProperty(prototype, 'showModal');
    if (closeInitial) Object.defineProperty(prototype, 'close', closeInitial);
    else Reflect.deleteProperty(prototype, 'close');
  }
});

it('regroupe réglages et outils dans une seule rangée défilante sans action principale supplémentaire', () => {
  const { container } = preparer();
  act(() => store.setState({ radar: true }));
  const rangees = container.querySelectorAll('.commandes-combat .overflow-x-auto');
  expect(rangees).toHaveLength(1);
  const rangee = rangees[0]!;
  expect(rangee.classList.contains('flex')).toBe(true);
  for (const nom of ['Auto-attaque', 'Auto-clic', 'Arrêt auto', "Réglages de l'arrêt", 'Fauchage', 'Poké-Radar']) {
    expect(rangee.contains(screen.getByRole('button', { name: nom }))).toBe(true);
  }
  for (const groupe of rangee.children) {
    expect(rangee.className).toContain('[&>div]:flex-nowrap');
    expect(groupe.classList.contains('overflow-x-auto')).toBe(false);
  }
  expect(container.querySelectorAll('.bg-action')).toHaveLength(1);
});

it('affiche Auto-clic et le rend utilisable avec les Restes', () => {
  preparer();
  expect(screen.getByRole('button', { name: 'Auto-clic' }).matches(':disabled')).toBe(true);
  const basculerAutoClic = vi.fn();
  act(() => store.setState({ autoClic: { possede: true, actif: true }, basculerAutoClic }));
  const bouton = screen.getByRole('button', { name: 'Auto-clic' });
  expect(bouton.matches(':disabled')).toBe(false);
  expect(bouton.getAttribute('aria-pressed')).toBe('true');
  fireEvent.click(bouton);
  expect(basculerAutoClic).toHaveBeenCalledOnce();
});
it('branche la capture sous la scène et garde une seule action principale', () => {
  const { container } = preparer();
  const capturer = vi.fn();
  act(() => store.setState({ capturer, capture: { ...store.getState().capture,
    possible: true, raison: null, balles: [
      { cle: 'pokeball', nom: 'Pokéball', image: 'img/objets/poke-ball.png', quantite: 3 },
      { cle: 'superball', nom: 'Superball', image: 'img/objets/great-ball.png', quantite: 2 },
    ] } }));
  const capture = screen.getByRole('region', { name: 'Capture' });
  const scene = screen.getByRole('region', { name: 'Combat contre Rattata' });
  expect(scene.contains(capture)).toBe(false);
  expect(scene.compareDocumentPosition(capture) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(capture.closest('.lg\\:col-span-3')).toBeTruthy();
  expect(container.querySelectorAll('.bg-action')).toHaveLength(1);
  fireEvent.click(screen.getByRole('button', { name: 'Superball ×2' }));
  fireEvent.click(screen.getByRole('button', { name: 'Capturer' }));
  expect(capturer).toHaveBeenCalledWith('superball');
  for (const bouton of within(capture).getAllByRole('button')) {
    expect(bouton.classList.contains('min-h-11')).toBe(true);
    expect(bouton.classList.contains('min-w-11')).toBe(true);
  }
});
it('désactive les balles et la capture sur un boss avec une raison visible', () => {
  preparer();
  const raison = 'Ce Pokémon ne peut pas être capturé.';
  act(() => store.setState({ ennemi: { ...store.getState().ennemi!, boss: true },
    capture: { ...store.getState().capture, possible: false, raison,
      balles: [{ cle: 'pokeball', nom: 'Pokéball', image: 'img/objets/poke-ball.png', quantite: 3 }] } }));
  const capture = screen.getByRole('region', { name: 'Capture' });
  expect(within(capture).getByText(raison)).toBeTruthy();
  for (const bouton of within(capture).getAllByRole('button')) expect(bouton.matches(':disabled')).toBe(true);
  const bouton = within(capture).getByRole('button', { name: 'Capturer' });
  expect(document.getElementById(bouton.getAttribute('aria-describedby')!)?.textContent).toBe(raison);
});
it('anime les sprites uniquement pendant la capture et désactive la bande', () => {
  preparer();
  act(() => store.setState({ capture: { ...store.getState().capture, enCours: true } }));
  for (const sprite of screen.getAllByRole('img', { name: 'Rattata' })) {
    expect(sprite.classList.contains('capture-en-cours')).toBe(true);
  }
  expect(screen.getByRole('button', { name: 'Capturer' }).matches(':disabled')).toBe(true);
  act(() => store.setState({ capture: { ...store.getState().capture, enCours: false } }));
  for (const sprite of screen.getAllByRole('img', { name: 'Rattata' })) {
    expect(sprite.classList.contains('capture-en-cours')).toBe(false);
  }
});
it('branche les réglages du store avec des cibles tactiles de 44 px', () => {
  preparer();
  const basculerAutoAttaque = vi.fn();
  const reglerArretAuto = vi.fn();
  act(() => store.setState({ autoAttaque: false, basculerAutoAttaque, reglerArretAuto,
    arretAuto: { ...store.getState().arretAuto, actif: true } }));
  for (const nom of ['Auto-attaque', 'Arrêt auto', "Réglages de l'arrêt"]) {
    const bouton = screen.getByRole('button', { name: nom });
    expect(bouton.classList.contains('min-h-11')).toBe(true);
    expect(bouton.classList.contains('min-w-11')).toBe(true);
  }
  expect(screen.getByRole('button', { name: 'Auto-attaque' }).getAttribute('aria-pressed')).toBe('false');
  expect(screen.getByRole('button', { name: 'Arrêt auto' }).getAttribute('aria-pressed')).toBe('true');
  fireEvent.click(screen.getByRole('button', { name: 'Auto-attaque' }));
  fireEvent.click(screen.getByRole('button', { name: 'Arrêt auto' }));
  expect(basculerAutoAttaque).toHaveBeenCalledOnce();
  expect(reglerArretAuto).toHaveBeenCalledWith({ actif: false });
});
beforeEach(() => vi.useFakeTimers());
afterEach(() => { cleanup(); store?.getState().arreter(); vi.useRealTimers(); });
function preparer(corrompu = false) {
  const horloge = creerHorlogeSimulee();
  const stockage = creerStockageMemoire();
  const compte = compteInitial();
  creerGestionnaire({ stockage, horloge, genererId: () => 'test' }).ecrireCompte({ ...compte,
    preferences: { ...compte.preferences, arretAuto: { ...reglages.depart.preferences.arretAuto, actif: false } } });
  if (corrompu) stockage.ecrire('pokiclicker:partie:test', '{abîmée');
  store = creerStoreJeu({ horloge, stockage, alea: () => .1, genererId: () => 'test' });
  store.getState().demarrer();
  const vue = render(<EcranCombat store={store} />);
  return { ...vue, horloge, stockage };
}

it('affiche les pièces du store au format français sans constante provisoire', () => {
  preparer();
  for (const argent of [1250, 9876543, 0]) {
    act(() => store.setState({ argent }));
    expect(screen.getByRole('banner').textContent?.replace(/\s/g, ' ')).toContain(
      `${new Intl.NumberFormat('fr-FR').format(argent).replace(/\s/g, ' ')} pièces`);
  }
  expect(readFileSync('src/ui/EcranCombat.tsx', 'utf8'))
    .not.toContain(['ARGENT', 'PROVISOIRE'].join('_'));
});
it('affiche les niveaux mobile et PC ainsi que les XP accessibles de chaque Pokémon', () => {
  preparer();
  const noms = ['Bulbizarre', 'Salamèche', 'Carapuce'];
  const membres = store.getState().equipe.filter(membre => membre !== null);
  expect(membres).toHaveLength(3);
  for (const [index, membre] of membres.entries()) {
    const nom = noms[index];
    const carte = screen.getByLabelText(`${nom}, niveau ${membre.pokemon.niveau}, ${formaterDps(membre.dps)} DPS`);
    expect(within(carte).getByText(String(membre.pokemon.niveau)).className).toContain('lg:hidden');
    expect(within(carte).getByText(`Niv. ${membre.pokemon.niveau}`)).toBeTruthy();
    const barre = within(carte).getByRole('progressbar', { name: `XP de ${nom}` });
    expect(barre.getAttribute('aria-valuemin')).toBe('0');
    expect(barre.getAttribute('aria-valuemax')).toBe(String(membre.xpMax));
    expect(barre.getAttribute('aria-valuenow')).toBe(String(membre.pokemon.xp));
    expect(barre.className).toContain('h-1');
  }
  expect(screen.getAllByRole('progressbar', { name: /^XP de / })).toHaveLength(3);
  act(() => store.setState({ equipe: store.getState().equipe.map((membre, index) =>
    membre && index === 0 ? { ...membre, pokemon: { ...membre.pokemon, niveau: 100 }, xpMax: 0 } : membre) }));
  expect(screen.queryByRole('progressbar', { name: 'XP de Bulbizarre' })).toBeNull();
  expect(screen.getAllByRole('progressbar', { name: /^XP de / })).toHaveLength(2);
});
it('affiche puis retire l’annonce du store sans déplacer la scène', () => {
  preparer();
  expect(screen.queryByRole('status')).toBeNull();
  const annonce = 'Salamèche passe au niveau 6 ! Chromatique ! +5 Bonbons';
  act(() => store.setState({ annonce }));
  const message = screen.getByRole('status');
  expect(message.textContent).toBe(annonce);
  expect(message.getAttribute('aria-live')).toBe('polite');
  expect(message.className).toContain('absolute');
  expect(message.className).toContain('pointer-events-none');
  act(() => store.setState({ annonce: null }));
  expect(screen.queryByRole('status')).toBeNull();
  expect(screen.queryByText(annonce)).toBeNull();
});
it('masque l’ennemi pendant la recherche en gardant la cible d’attaque et les éléments en place', () => {
  const { container } = preparer();
  expect(screen.queryByText('Recherche en cours…')).toBeNull();
  const attaque = screen.getByRole('button', { name: /^Attaquer / });
  const panneau = screen.getByRole('progressbar', { name: 'PV de Rattata' }).parentElement?.parentElement;
  const sprite = container.querySelector('.will-change-transform');
  act(() => store.setState({ enRecherche: true, cache: true }));
  expect(screen.getByRole('status').textContent).toBe('Recherche en cours…');
  expect(screen.getByRole('button', { name: /^Attaquer / })).toBe(attaque);
  expect(attaque.getAttribute('aria-label')).toBe('Attaquer (recherche en cours)');
  expect(screen.queryByRole('heading', { name: 'Rattata' })).toBeNull();
  expect(screen.queryByRole('img', { name: 'Rattata' })).toBeNull();
  expect(panneau?.classList.contains('opacity-0')).toBe(true);
  expect(sprite?.classList.contains('opacity-0')).toBe(true);
  act(() => store.setState({ enRecherche: false, cache: false }));
  expect(screen.queryByText('Recherche en cours…')).toBeNull();
  expect(panneau?.classList.contains('opacity-0')).toBe(false);
  expect(sprite?.classList.contains('opacity-0')).toBe(false);
});

it('cache le sprite sans message pendant la réapparition qui suit une capture', () => {
  const { container } = preparer();
  act(() => store.setState({ enRecherche: false, cache: true }));
  expect(screen.queryByText('Recherche en cours…')).toBeNull();
  expect(container.querySelector('.will-change-transform')?.classList.contains('opacity-0')).toBe(true);
});

it('rend la scène attaquable, avec des PV accessibles et dix étapes dont le boss', () => {
  const { container, horloge } = preparer();
  const attaque = screen.getByRole('button', { name: /^Attaquer / });
  expect(attaque.classList.contains('inset-0')).toBe(true);
  expect(container.querySelectorAll('.bg-action')).toHaveLength(1);
  const barre = screen.getByRole('progressbar', { name: 'PV de Rattata' });
  const avant = Number(barre.getAttribute('aria-valuenow'));
  fireEvent.click(attaque);
  expect(container.querySelector('.degat-flottant')?.textContent).toBe('−5');
  expect(Number(barre.getAttribute('aria-valuenow'))).toBe(avant);
  act(() => { horloge.avancer(100); store.getState().tick(); });
  expect(Number(barre.getAttribute('aria-valuenow'))).toBeLessThan(avant);
  expect(screen.getAllByRole('listitem')).toHaveLength(10);
  expect(screen.getByLabelText('Étape 10 : boss').querySelector('svg')).toBeTruthy();
  expect(screen.getByLabelText('Étape 1').getAttribute('aria-current')).toBe('step');
  act(() => vi.advanceTimersByTime(500));
  expect(container.querySelector('.degat-flottant')).toBeNull();
});
it('réserve une marge à droite des cartes et une ligne distincte au DPS', () => {
  preparer();
  const carte = screen.getByLabelText(/Bulbizarre, niveau 5/);
  expect(carte.className).toContain('lg:pe-4');
  const nom = carte.querySelector('strong')!;
  const dps = Array.from(carte.children).find(element => element.textContent?.includes('DPS'))!;
  expect(dps.parentElement).toBe(carte);
  expect(nom.parentElement).not.toBe(dps);
  expect(carte.className).toContain('lg:grid-cols-');
  expect(screen.getAllByLabelText('Case libre')).toHaveLength(3);
});
it('explique le verrouillage et désactive la destination fermée', () => {
  preparer();
  const destination = store.getState().zoneSuivante!;
  const bouton = screen.getByRole('button', { name: `Zone suivante : ${destination.nom}` });
  const allerVers = vi.spyOn(store.getState(), 'allerVers');
  expect(bouton.hasAttribute('disabled')).toBe(true);
  expect(screen.getByText(destination.raison!)).toBeTruthy();
  fireEvent.click(bouton);
  expect(allerVers).not.toHaveBeenCalled();
  expect(screen.queryByText('La suite arrive bientôt.')).toBeNull();
});
it('permet de choisir les destinations ouvertes et conserve l’annonce du store', () => {
  preparer();
  act(() => store.setState({ zoneSuivante: { ...store.getState().zoneSuivante!, ouverte: true, raison: null },
    annonce: 'Zone débloquée !' }));
  const allerVers = vi.spyOn(store.getState(), 'allerVers').mockImplementation(() => {});
  for (const [libelle, destination] of [
    ['Zone suivante', store.getState().zoneSuivante], ['Zone précédente', store.getState().zonePrecedente],
  ] as const) {
    expect(destination).not.toBeNull();
    const bouton = screen.getByRole('button', { name: `${libelle} : ${destination!.nom}` });
    expect(bouton.hasAttribute('disabled')).toBe(false);
    fireEvent.click(bouton);
    expect(allerVers).toHaveBeenLastCalledWith(destination!.id);
  }
  expect(screen.getByRole('status').textContent).toBe('Zone débloquée !');
  expect(screen.queryByText(/terminée !/)).toBeNull();
  expect(screen.queryByText('La suite arrive bientôt.')).toBeNull();
  act(() => store.setState({ zonePrecedente: null, zoneSuivante: null }));
  expect(screen.queryByRole('button', { name: /^Zone / })).toBeNull();
  expect(screen.queryByText('La suite arrive bientôt.')).toBeNull();
});
it('affiche la barre de temps seulement avec un minuteur de combat', () => {
  preparer();
  expect(screen.queryByRole('progressbar', { name: 'Temps restant' })).toBeNull();
  act(() => store.setState({ minuteur: { restantMs: 23456, totalMs: 30000 } }));
  expect(screen.getByRole('progressbar', { name: 'Temps restant' }).getAttribute('aria-valuenow')).toBe('24');
  act(() => store.setState({ minuteur: null, enRecherche: true }));
  expect(screen.queryByRole('progressbar', { name: 'Temps restant' })).toBeNull();
  expect(screen.getByText('Recherche en cours…')).toBeTruthy();
});
it('affiche le lieu sans combat, son décor et son message en gardant l’équipe', () => {
  const { container } = preparer();
  const precedente = store.getState().zonePrecedente!;
  act(() => store.getState().allerVers(precedente.id));
  const { lieu, zone, ennemi } = store.getState();
  expect(zone).toBeNull();
  expect(ennemi).toBeNull();
  expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(lieu!.nom);
  expect(within(screen.getByRole('banner')).getByText(lieu!.nom, { selector: 'p' })).toBeTruthy();
  expect(screen.getByText(('message' in lieu! ? lieu.message : undefined)!)).toBeTruthy();
  // Le décor de Bourg Palette arrive avec le ticket P : sans image au registre, l'écran reste affiché sans décor.
  expect(container.querySelector('img[src^="img/decors/"]')).toBeNull();
  expect(screen.queryByRole('button', { name: /^Attaquer/ })).toBeNull();
  expect(screen.queryByRole('list', { name: 'Étapes de la zone' })).toBeNull();
  expect(screen.queryByText(/Étape .* sur 10/)).toBeNull();
  expect(screen.getByRole('region', { name: 'Ton équipe' })).toBeTruthy();
  expect(screen.getAllByRole('progressbar', { name: /^XP de / })).toHaveLength(3);
  expect(screen.getByText('Choisis une zone pour partir à l’aventure.')).toBeTruthy();
  expect(screen.queryByText('La suite arrive bientôt.')).toBeNull();
});
it('affiche une erreur française sans toucher au stockage corrompu', () => {
  const { stockage } = preparer(true);
  expect(screen.getByRole('alert').textContent).toContain(ERREUR_CHARGEMENT);
  expect(screen.getByText('Les données de cette partie ne peuvent pas être lues.')).toBeTruthy();
  expect(screen.queryByRole('button', { name: /^Attaquer / })).toBeNull();
  expect(stockage.lire('pokiclicker:partie:test')).toBe('{abîmée');
});
it('emploie des textes et libellés français dans tout l’écran', () => {
  const { container } = preparer();
  const parcours = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  const textes: string[] = [];
  while (parcours.nextNode()) textes.push(parcours.currentNode.textContent ?? '');
  for (const element of container.querySelectorAll('[aria-label], [alt], [title]')) {
    textes.push(element.getAttribute('aria-label') ?? '', element.getAttribute('alt') ?? '', element.getAttribute('title') ?? '');
  }
  expect(textes.join(' ')).not.toMatch(/\b(attack|health|level|next|locked|loading|shop|team|damage|stage|empty)\b/i);
  expect(screen.getByText('Prof. Chen')).toBeTruthy();
  expect(screen.getByText('Les Rattata sont ici. Touche le Pokémon pour attaquer.')).toBeTruthy();
  for (const image of container.querySelectorAll('img')) expect(image.getAttribute('src')).toMatch(/^img\//);
});
it('affiche et journalise la cause technique d’une erreur inconnue', () => {
  const cause = new TypeError('Panne inattendue de test');
  const journal = vi.spyOn(console, 'error').mockImplementation(() => {});
  try {
    store = creerStoreJeu({ horloge: creerHorlogeSimulee(), stockage: creerStockageMemoire(),
      alea: () => .1, genererId: () => { throw cause; } });
    store.getState().demarrer();
    render(<EcranCombat store={store} />);
    expect(screen.getByText('Une erreur inattendue est survenue.')).toBeTruthy();
    expect(screen.getByText('TypeError: Panne inattendue de test').className).toContain('text-sm');
    expect(screen.getByRole('alert').textContent).toContain('Recharge la page ; ta partie est gardée.');
    expect(journal).toHaveBeenCalledWith(cause);
  } finally { journal.mockRestore(); }
});
it('compte les pointeurs principaux et le clavier sans doubler le clic souris', () => {
  preparer();
  const attaquer = vi.spyOn(store.getState(), 'attaquer');
  const bouton = screen.getByRole('button', { name: /^Attaquer / });
  const pointer = (button: number) => {
    const evenement = new Event('pointerdown', { bubbles: true });
    Object.defineProperty(evenement, 'button', { value: button });
    fireEvent(bouton, evenement);
  };
  pointer(0);
  fireEvent.click(bouton, { detail: 1 });
  pointer(2);
  expect(attaquer).toHaveBeenCalledTimes(1);
  fireEvent.click(bouton, { detail: 0 });
  expect(attaquer).toHaveBeenCalledTimes(2);
});

it('affiche le nom de l’adversaire de la Ligue à la place de « (Géant) »', () => {
  preparer();
  act(() => store.setState({ ennemi: { ...store.getState().ennemi!, boss: true } }));
  expect(screen.getByRole('heading', { name: 'Rattata (Géant)' })).toBeTruthy();
  act(() => store.setState({ nomAdversaire: 'Olga (Lokhlass)' }));
  expect(screen.getByRole('heading', { name: 'Olga (Lokhlass)' })).toBeTruthy();
  expect(screen.getByRole('region', { name: 'Combat contre Olga (Lokhlass)' })).toBeTruthy();
  expect(screen.getAllByAltText('Olga (Lokhlass)').length).toBeGreaterThan(0);
  expect(screen.getByRole('progressbar', { name: 'PV de Olga (Lokhlass)' })).toBeTruthy();
});
