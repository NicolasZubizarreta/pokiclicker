// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { creerHorlogeSimulee } from '../core/clock';
import { compteInitial, creerGestionnaire, creerStockageMemoire } from '../core/sauvegarde';
import { reglages } from '../core/reglages';
import { EcranCombat } from './EcranCombat';
import { formaterDps } from './nombres';
import { creerStoreJeu, storeJeu } from './store';
import type { StoreJeu } from './store';
import { ERREUR_CHARGEMENT } from './persistance';
import * as chargement from './precharger';
import { FenetreSac } from './FenetreSac';
import { PageEquipe } from './PageEquipe';
import { reinitialiserSac, storeSac } from './sacContexte';

let store: StoreJeu;
it('réserve les deux panneaux PC au combat actif', () => {
  const { container } = preparer();
  expect(container.querySelectorAll('.combat-pc')).toHaveLength(1);
  expect(screen.getByRole('region', { name: 'Ton équipe' })).toBeTruthy();
  expect(screen.getByRole('region', { name: 'Effets actifs' })).toBeTruthy();
  act(() => store.getState().allerVers('kanto.bourg-palette'));
  expect(container.querySelector('.combat-pc')).toBeNull();
});
it('précharge le chromatique courant et garde ses deux couches sur chaque taille', () => {
  const precharger = vi.spyOn(chargement, 'precharger').mockResolvedValue({ charges: 1, echecs: 0 });
  try {
    const { container } = preparer();
    const ennemi = store.getState().ennemi!;
    act(() => store.setState({ ennemi: { ...ennemi, shiny: true } }));
    const src = `img/sprites/pokemon-shiny/${ennemi.numero}.png`;
    expect(precharger).toHaveBeenCalledWith([src]);
    expect(container.querySelectorAll(`img[src="${src}"]`)).toHaveLength(4);
    expect(container.querySelectorAll(`img.halo-shiny[src="${src}"]`)).toHaveLength(2);
    expect(container.querySelector('h2 svg path')).toBeTruthy();
    precharger.mockClear();
    act(() => store.setState({ ennemi: { ...ennemi, shiny: true, pv: ennemi.pv - 1 } }));
    expect(precharger).not.toHaveBeenCalled();
  } finally { precharger.mockRestore(); }
});
it('transmet l’accès pension du store et garde Bourg Palette après le clic', () => {
  preparer();
  act(() => store.getState().allerVers('kanto.bourg-palette'));
  expect(screen.getByRole('button', { name: 'Pension Pokémon' }).getAttribute('aria-disabled')).toBe('true');
  act(() => store.setState({ pension: { ...store.getState().pension, acces: { ouvert: true, raison: null } } }));
  const pension = screen.getByRole('button', { name: 'Pension Pokémon' });
  expect(pension.hasAttribute('aria-disabled')).toBe(false);
  fireEvent.click(pension);
  fireEvent.click(screen.getByRole('button', { name: 'Retour à Bourg Palette' }));
  act(() => vi.advanceTimersByTime(450));
  expect(screen.getByRole('region', { name: 'Bourg Palette' })).toBeTruthy();
  expect(store.getState().lieu?.id).toBe('kanto.bourg-palette');
});

it('cache les deux outils sans aucun objet', () => {
  preparer();
  for (const nom of ['Fauchage', 'Poké-Radar']) {
    expect(screen.queryByRole('button', { name: nom })).toBeNull();
  }
});

it('réserve le bouton Sac à son accès et affiche la somme des quantités', () => {
  preparer();
  const sac = store.getState().sac;
  act(() => store.setState({ sac: { ...sac, acces: { ouvert: false, raison: 'Route 1' } } }));
  const verrou = screen.getByRole('button', { name: 'Sac' });
  expect(verrou.getAttribute('aria-disabled')).toBe('true');
  fireEvent.click(verrou);
  expect(storeSac.getState().ouvert).toBe(false);
  act(() => store.setState({ sac: { ...sac, acces: { ouvert: true, raison: null },
    entrees: sac.entrees.slice(0, 2).map((entree, index) => ({ ...entree, quantite: index + 2 })) } }));
  const bouton = within(screen.getByRole('group', { name: 'Actions du combat' })).getByRole('button', { name: 'Sac' });
  expect(bouton.querySelector('span[aria-hidden="true"]')?.textContent).toBe('5');
  act(() => store.setState({ sac: { ...store.getState().sac, entrees: [] } }));
  expect(bouton.querySelector('span[aria-hidden="true"]')).toBeNull();
});

it('ferme le Sac global, marque les Pokémon éligibles et applique la Pierre Stase au clic', () => {
  const showModal = vi.fn(function (this: HTMLDialogElement) { this.setAttribute('open', ''); });
  const close = vi.fn(function (this: HTMLDialogElement) { this.removeAttribute('open'); this.dispatchEvent(new Event('close')); });
  Object.defineProperties(HTMLDialogElement.prototype, { showModal: { configurable: true, value: showModal },
    close: { configurable: true, value: close } });
  preparer();
  const poserStase = vi.fn<(uid: string) => string | null>(() => null);
  const sac = store.getState().sac;
  act(() => store.setState({ poserStase, sac: { ...sac, acces: { ouvert: true, raison: null },
    entrees: [{ id: 'everstone', nom: 'Pierre Stase', description: '', image: null, categorie: 'equipement',
      quantite: 1, actif: false, utilisable: 'stase' }] } }));
  storeJeu.setState({ ...store.getState() });
  render(<FenetreSac />);
  fireEvent.click(within(screen.getByRole('group', { name: 'Actions du combat' })).getByRole('button', { name: 'Sac' }));
  fireEvent.click(screen.getByRole('button', { name: 'Pierre Stase ×1' }));
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(storeSac.getState().objet?.type).toBe('stase');
  const page = render(<PageEquipe />);
  const choix = within(page.container).getByRole('button', { name: 'Bulbizarre, niveau 5' });
  expect(choix.className).toContain('cible-valide');
  fireEvent.click(choix);
  expect(poserStase).toHaveBeenCalledExactlyOnceWith(store.getState().equipe[0]!.pokemon.uid);
  // Le mode « utiliser un objet » reste ouvert tant que le joueur ne ferme pas : on peut l'appliquer à plusieurs Pokémon.
  expect(choix.className).toContain('cible-valide');
  expect(storeSac.getState().objet?.type).toBe('stase');
  fireEvent.click(screen.getByRole('button', { name: /^Fermer/ }));
  expect(choix.className).not.toContain('cible-valide');
  expect(storeSac.getState().objet).toBeNull();
});

it('abandonne le choix du Pokémon avec Fermer', () => {
  preparer();
  const sac = store.getState().sac;
  act(() => store.setState({ sac: { ...sac, acces: { ouvert: true, raison: null },
    entrees: [{ id: 'everstone', nom: 'Pierre Stase', description: '', image: null, categorie: 'equipement',
      quantite: 1, actif: false, utilisable: 'stase' }] } }));
  storeJeu.setState({ ...store.getState() });
  render(<FenetreSac />);
  fireEvent.click(within(screen.getByRole('group', { name: 'Actions du combat' })).getByRole('button', { name: 'Sac' }));
  fireEvent.click(screen.getByRole('button', { name: 'Pierre Stase ×1' }));
  const page = render(<PageEquipe />);
  const choix = within(page.container).getByRole('button', { name: 'Bulbizarre, niveau 5' });
  expect(choix.className).toContain('cible-valide');
  fireEvent.click(screen.getByRole('button', { name: /^Fermer/ }));
  expect(choix.className).not.toContain('cible-valide');
  expect(storeSac.getState().objet).toBeNull();
  expect(screen.getByRole('dialog', { name: 'Ton Sac' })).toBeTruthy();
});

it('affiche les effets dans leur panneau sans annonce en direct et suit le store', () => {
  preparer();
  expect(screen.queryByRole('list', { name: 'Effets actifs' })).toBeNull();
  act(() => store.setState({ effets: [{ id: 'xAttack', pastille: 'Attaque + ×1,5', restantS: 12 }] }));
  const effets = screen.getByRole('list', { name: 'Effets actifs' });
  expect(screen.getByRole('region', { name: 'Effets actifs' }).contains(effets)).toBe(true);
  expect(effets.textContent).toBe('Attaque + ×1,5 : 12 s');
  expect(effets.closest('[aria-live], [role="status"]')).toBeNull();
  act(() => store.setState({ effets: [] }));
  expect(screen.queryByRole('list', { name: 'Effets actifs' })).toBeNull();
  expect(screen.getByText('Aucun effet actif.')).toBeTruthy();
});

it('cache les outils sans objet et explique chaque verrou quand un outil est possédé', () => {
  preparer();
  const zone = store.getState().zone;
  act(() => store.setState({ zone: null }));
  expect(screen.queryByRole('button', { name: 'Fauchage' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Poké-Radar' })).toBeNull();
  act(() => store.setState({ zone, radar: true }));
  expect(screen.queryByRole('button', { name: 'Fauchage' })).toBeNull();
  expect(screen.getByRole('button', { name: 'Poké-Radar' }).hasAttribute('aria-disabled')).toBe(false);
  act(() => store.setState({ radar: false, fauchage: { ...store.getState().fauchage,
    possede: true, disponible: false, raison: 'Inutile sur un boss !' } }));
  const fauchage = screen.getByRole('button', { name: 'Fauchage' });
  expect(fauchage.getAttribute('aria-disabled')).toBe('true');
  expect(document.getElementById(fauchage.getAttribute('aria-describedby')!)?.textContent)
    .toBe('Inutile sur un boss !');
  expect(screen.queryByRole('button', { name: 'Poké-Radar' })).toBeNull();
});

it('grise le Poké-Radar à la Ligue, où il n’y a que des boss', () => {
  preparer();
  const zone = store.getState().zone!;
  act(() => store.setState({ radar: true }));
  expect((screen.getByRole('button', { name: 'Poké-Radar' }) as HTMLButtonElement).disabled).toBe(false);
  act(() => store.setState({ zone: { ...zone, type: 'ligue', adversaires: [] } as typeof zone }));
  const radar = screen.getByRole('button', { name: 'Poké-Radar' }) as HTMLButtonElement;
  expect(radar.disabled).toBe(true);
  expect(radar.title).toContain('Ligue');
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
  expect(bouton.getAttribute('aria-disabled')).toBe('true');
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
    const images = Array.from(fenetre.querySelectorAll('img'));
    expect(images).toHaveLength(zone.sauvages.length);
    for (const [index, image] of images.entries()) {
      expect(image.classList.contains('brightness-0')).toBe(zone.sauvages[index]!.pokemon !== premier);
      expect(image.getAttribute('src')).toMatch(/^img\//);
    }
    const captures = zone.sauvages.filter(sauvage => sauvage.pokemon === premier).length;
    expect(within(fenetre).getAllByRole('img', { name: 'Déjà capturé' })).toHaveLength(captures);
    expect(within(fenetre).getAllByText('???')).toHaveLength(zone.sauvages.length - captures);
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

it('regroupe les quatre actions sous la capture et conserve le Radar dans la scène', () => {
  const { container } = preparer();
  act(() => store.setState({ radar: true, fauchage: { ...store.getState().fauchage, possede: true } }));
  const rangee = screen.getByRole('group', { name: 'Actions du combat' });
  expect(within(rangee).getAllByRole('button')).toHaveLength(4);
  expect(screen.getByRole('region', { name: 'Ton équipe' }).contains(rangee)).toBe(false);
  for (const nom of ['Attaque auto', 'Arrêt auto', "Réglage de l'arrêt auto", 'Sac']) {
    expect(rangee.contains(screen.getByRole('button', { name: nom }))).toBe(true);
  }
  expect(screen.getByRole('region', { name: 'Capture' }).contains(screen.getByRole('button', { name: 'Fauchage' }))).toBe(true);
  const radar = screen.getByRole('button', { name: 'Poké-Radar' });
  expect(rangee.contains(radar)).toBe(false);
  expect(screen.getByRole('region', { name: 'Combat contre Rattata' }).contains(radar)).toBe(true);
  expect(radar.classList.contains('rounded-full')).toBe(true);
  expect(radar.querySelector('img')?.getAttribute('src')).toBe('img/objets/PokeRadar.png');
  for (const bouton of within(rangee as HTMLElement).getAllByRole('button')) {
    expect(bouton.querySelector('svg[aria-hidden="true"]')).toBeTruthy();
    expect(bouton.childNodes[0]!.nodeName.toLowerCase()).toBe('svg');
  }
  expect(container.querySelectorAll('[data-raccourci="capturer"]')).toHaveLength(1);
});

it('ouvre les réglages d’arrêt auto et transmet les critères au store', () => {
  preparer();
  const reglerArretAuto = vi.fn();
  act(() => store.setState({ reglerArretAuto }));
  const bouton = screen.getByRole('button', { name: "Réglage de l'arrêt auto" });
  bouton.focus();
  fireEvent.click(bouton);
  const dialogue = screen.getByRole('dialog', { name: "Réglage de l'arrêt auto" });
  const rare = within(dialogue).getByRole('checkbox', { name: 'Rare' }) as HTMLInputElement;
  const avant = rare.checked;
  fireEvent.click(rare);
  expect(reglerArretAuto).toHaveBeenCalledWith({ rare: !avant });
  fireEvent.click(within(dialogue).getByRole('button', { name: 'Fermer' }));
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(document.activeElement).toBe(bouton);
});
it('branche la ligne de capture sous la scène et permet de changer de balle', () => {
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
  expect(screen.getByRole('region', { name: 'Ton équipe' }).contains(capture)).toBe(false);
  expect(container.querySelector('.dock-capture')).toBeNull();
  expect(container.querySelectorAll('[data-raccourci="capturer"]')).toHaveLength(1);
  fireEvent.click(screen.getByRole('button', { name: 'Balle choisie : Pokéball, ×3. Toucher pour changer' }));
  expect(screen.getByRole('button', { name: 'Balle choisie : Superball, ×2. Toucher pour changer' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Capturer' }));
  expect(capturer).toHaveBeenCalledWith('superball');
});
it('désactive les balles et la capture sur un boss sans afficher la raison (lecteur d’écran seulement)', () => {
  preparer();
  const raison = 'Ce Pokémon ne peut pas être capturé.';
  act(() => store.setState({ ennemi: { ...store.getState().ennemi!, boss: true },
    capture: { ...store.getState().capture, possible: false, raison,
      balles: [{ cle: 'pokeball', nom: 'Pokéball', image: 'img/objets/poke-ball.png', quantite: 3 }] } }));
  const capture = screen.getByRole('region', { name: 'Capture' });
  expect(within(capture).getByText(raison).classList.contains('sr-only')).toBe(true);
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
it('branche les états et les bascules des actions au store', () => {
  preparer();
  const basculerAutoAttaque = vi.fn();
  const reglerArretAuto = vi.fn();
  act(() => store.setState({ autoAttaque: false, basculerAutoAttaque, reglerArretAuto,
    arretAuto: { ...store.getState().arretAuto, actif: true } }));
  expect(screen.getByRole('button', { name: 'Attaque auto' }).getAttribute('aria-pressed')).toBe('false');
  expect(screen.getByRole('button', { name: 'Arrêt auto' }).getAttribute('aria-pressed')).toBe('true');
  fireEvent.click(screen.getByRole('button', { name: 'Attaque auto' }));
  fireEvent.click(screen.getByRole('button', { name: 'Arrêt auto' }));
  expect(basculerAutoAttaque).toHaveBeenCalledOnce();
  expect(reglerArretAuto).toHaveBeenCalledWith({ actif: false });
});
beforeEach(() => {
  vi.useFakeTimers();
  Object.defineProperties(HTMLDialogElement.prototype, {
    showModal: { configurable: true, value(this: HTMLDialogElement) { this.setAttribute('open', ''); } },
    close: { configurable: true, value(this: HTMLDialogElement) { this.removeAttribute('open'); this.dispatchEvent(new Event('close')); } },
  });
});
afterEach(() => { cleanup(); store?.getState().arreter(); reinitialiserSac(); vi.restoreAllMocks(); vi.useRealTimers(); });
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

it('réserve les Pokédollars au bandeau de la coquille', () => {
  const { container } = preparer();
  for (const argent of [1250, 9876543, 0]) {
    act(() => store.setState({ argent }));
    expect(container.textContent?.replace(/\s/g, ' ')).not.toContain(
      `${new Intl.NumberFormat('fr-FR').format(argent).replace(/\s/g, ' ')} ₽`);
  }
  expect(readFileSync('src/ui/EcranCombat.tsx', 'utf8'))
    .not.toContain(['ARGENT', 'PROVISOIRE'].join('_'));
});
it('affiche les niveaux, DPS et XP accessibles de chaque rang d’équipe', () => {
  preparer();
  const noms = ['Bulbizarre', 'Salamèche', 'Carapuce'];
  const membres = store.getState().equipe.filter(membre => membre !== null);
  expect(membres).toHaveLength(3);
  for (const [index, membre] of membres.entries()) {
    const nom = noms[index];
    const carte = screen.getByRole('button', { name: `Ouvrir la fiche de ${nom}` });
    expect(within(carte).getByText(`${formaterDps(membre.dps)} DPS`)).toBeTruthy();
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
  expect(within(screen.getByRole('button', { name: 'Ouvrir la fiche de Bulbizarre' })).getByText('Prêt à évoluer')).toBeTruthy();
  expect(screen.getAllByRole('progressbar', { name: /^XP de / })).toHaveLength(2);
});
it('n’affiche plus l’annonce du store dans la scène : elle passe par le calque de notifications', () => {
  preparer();
  expect(screen.queryByRole('status')).toBeNull();
  const annonce = 'Salamèche passe au niveau 6 ! Chromatique ! +5 Bonbons';
  const avant = document.body.innerHTML;
  act(() => store.setState({ annonce }));
  expect(screen.queryByText(annonce)).toBeNull();
  expect(screen.queryByRole('status')).toBeNull();
  expect(document.body.innerHTML).toBe(avant);
});
it('pose la pokéball « Déjà capturé » près du nom de l’ennemi seulement si son espèce est au Pokédex', () => {
  preparer();
  const titre = () => screen.getByRole('heading', { level: 2, name: /^Rattata/ });
  act(() => store.setState({ pokedex: [1] }));
  expect(within(titre()).queryByRole('img', { name: 'Déjà capturé' })).toBeNull();
  act(() => store.setState({ pokedex: [1, store.getState().ennemi!.numero] }));
  expect(within(titre()).getByRole('img', { name: 'Déjà capturé' })).toBeTruthy();
  act(() => store.setState({ nomAdversaire: 'Pierre' }));
  expect(screen.queryByRole('img', { name: 'Déjà capturé' })).toBeNull();
});
it('ouvre la fiche au clic sur un rang d’équipe et rend le focus à la fermeture', () => {
  preparer();
  const prototype = HTMLDialogElement.prototype;
  const modalInitial = Object.getOwnPropertyDescriptor(prototype, 'showModal');
  const closeInitial = Object.getOwnPropertyDescriptor(prototype, 'close');
  Object.defineProperty(prototype, 'showModal', { configurable: true, value(this: HTMLDialogElement) { this.setAttribute('open', ''); } });
  Object.defineProperty(prototype, 'close', { configurable: true, value(this: HTMLDialogElement) {
    this.removeAttribute('open'); fireEvent(this, new Event('close'));
  } });
  try {
    for (const nom of ['Bulbizarre', 'Salamèche', 'Carapuce']) {
      expect(screen.getByRole('button', { name: `Ouvrir la fiche de ${nom}` })).toBeTruthy();
    }
    // La fiche lit le store global du jeu : on lui donne la même équipe que le store de test.
    storeJeu.setState({ equipe: store.getState().equipe, pc: [] });
    const rang = screen.getByRole('button', { name: 'Ouvrir la fiche de Salamèche' });
    rang.focus();
    fireEvent.click(rang);
    const fiche = screen.getByRole('dialog');
    expect(within(fiche).getByRole('heading', { name: /Salamèche/ })).toBeTruthy();
    fireEvent.click(within(fiche).getByRole('button', { name: 'Ferme la fiche' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(rang);
  } finally {
    if (modalInitial) Object.defineProperty(prototype, 'showModal', modalInitial);
    else Reflect.deleteProperty(prototype, 'showModal');
    if (closeInitial) Object.defineProperty(prototype, 'close', closeInitial);
    else Reflect.deleteProperty(prototype, 'close');
  }
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
  expect(attaque.getAttribute('data-raccourci')).toBe('attaquer');
  const barre = screen.getByRole('progressbar', { name: 'PV de Rattata' });
  const avant = Number(barre.getAttribute('aria-valuenow'));
  fireEvent.click(attaque);
  expect(container.querySelector('.degat-flottant')?.textContent).toBe('−5');
  expect(Number(barre.getAttribute('aria-valuenow'))).toBe(avant);
  act(() => { horloge.avancer(100); store.getState().tick(); });
  expect(Number(barre.getAttribute('aria-valuenow'))).toBeLessThan(avant);
  expect(container.querySelectorAll('.zone-marque')).toHaveLength(10);
  expect(container.querySelectorAll('.zone-marque-boss')).toHaveLength(1);
  expect(container.querySelector('.zone-marque:last-child')?.classList.contains('zone-marque-boss')).toBe(true);
  expect(container.querySelector('.zone-marque')?.classList.contains('zone-marque-courante')).toBe(true);
  expect(screen.getByText('Étape 1 sur 10')).toBeTruthy();
  act(() => vi.advanceTimersByTime(500));
  expect(container.querySelector('.degat-flottant')).toBeNull();
});
it('n’affiche aucun bouton ni texte Auto-clic dans la colonne de droite sur PC, même avec les Restes', () => {
  const { container } = preparer();
  act(() => store.setState({ autoClic: { possede: true, actif: true } }));
  expect(screen.queryByRole('button', { name: 'Auto-clic' })).toBeNull();
  expect(container.querySelector('.combat-pc-droite')?.textContent).not.toContain('Auto-clic');
  expect(container.querySelector('.combat-pc-autoclic')).toBeNull();
  expect(screen.getByRole('region', { name: 'Effets actifs' })).toBeTruthy();
});
it('affiche six rangs dont les cases libres dans le panneau d’équipe', () => {
  preparer();
  const equipe = within(screen.getByRole('region', { name: 'Ton équipe' }));
  expect(equipe.getAllByRole('listitem')).toHaveLength(6);
  expect(equipe.getAllByRole('button', { name: /^Ouvrir la fiche de / })).toHaveLength(3);
  expect(equipe.getAllByLabelText('Case libre')).toHaveLength(3);
  expect(equipe.getByText('3 / 6')).toBeTruthy();
});
it('explique le verrouillage et désactive la destination fermée', () => {
  preparer();
  const allerVers = vi.fn();
  act(() => store.setState({ allerVers }));
  const destination = store.getState().zoneSuivante!;
  const bouton = screen.getByRole('button', { name: `Zone suivante : ${destination.nom}` });
  expect(bouton.getAttribute('aria-disabled')).toBe('true');
  fireEvent.click(bouton);
  expect(screen.getByRole('status').textContent).toBe(destination.raison);
  expect(allerVers).not.toHaveBeenCalled();
  expect(screen.queryByText('La suite arrive bientôt.')).toBeNull();
});
it('permet de choisir les destinations ouvertes', () => {
  preparer();
  act(() => store.setState({ zoneSuivante: { ...store.getState().zoneSuivante!, ouverte: true, raison: null },
    annonce: 'Zone débloquée !' }));
  const allerVers = vi.fn();
  act(() => store.setState({ allerVers }));
  for (const [libelle, destination] of [
    ['Zone suivante', store.getState().zoneSuivante], ['Zone précédente', store.getState().zonePrecedente],
  ] as const) {
    expect(destination).not.toBeNull();
    const bouton = screen.getByRole('button', { name: `${libelle} : ${destination!.nom}` });
    expect(bouton.getAttribute('aria-disabled')).toBe('false');
    fireEvent.click(bouton);
    expect(allerVers).toHaveBeenLastCalledWith(destination!.id);
  }
  expect(screen.queryByText(/terminée !/)).toBeNull();
  expect(screen.queryByText('La suite arrive bientôt.')).toBeNull();
  act(() => store.setState({ zonePrecedente: null, zoneSuivante: null }));
  for (const bouton of screen.getAllByRole('button', { name: /^Zone / })) {
    expect(bouton.getAttribute('aria-disabled')).toBe('true');
    fireEvent.click(bouton);
  }
  expect(allerVers).toHaveBeenCalledTimes(2);
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
it('sur PC, une erreur de sauvegarde non fatale garde le combat complet (Capturer, équipe)', () => {
  preparer();
  act(() => store.setState({ erreur: 'Sauvegarde impossible.' }));
  expect(screen.getByRole('alert').textContent).toContain('Sauvegarde impossible.');
  expect(screen.getByRole('button', { name: 'Capturer' })).toBeTruthy();
  expect(screen.getByRole('region', { name: 'Ton équipe' })).toBeTruthy();
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
  expect(screen.getByRole('heading', { name: 'Ton équipe 3 / 6' })).toBeTruthy();
  expect(screen.getByRole('heading', { name: 'Effets actifs' })).toBeTruthy();
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
