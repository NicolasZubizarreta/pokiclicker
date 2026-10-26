// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Sac } from './Sac';
import type { AffichageSac } from './store-boutique';
import { storeJeu } from './store';
import { commandeCourante, declencher, etapeTerminee } from '../core/evenements';
import { evenementsKanto } from '../core/evenements-kanto';
import { regionInitiale } from '../core/sauvegarde';

const sac: AffichageSac = { acces: { ouvert: true, raison: null }, entrees: [
  { id: 'pokeball', nom: 'Pokéball', description: 'Capture un Pokémon.', image: 'img/objets/pokeball.png',
    categorie: 'balles', quantite: 0, actif: false, utilisable: null },
  { id: 'candy', nom: 'Bonbon', description: 'Ajoute un niveau.', image: 'img/objets/candy.png',
    categorie: 'soins', quantite: 2, actif: false, utilisable: 'bonbon' },
  { id: 'shoes', nom: 'Chaussures', description: 'Réduit l’attente.', image: null,
    categorie: 'equipement', quantite: 1, actif: true, utilisable: null },
] };
afterEach(cleanup);

it('transmet le bouton déclencheur avec l’objet utilisé', () => {
  const utiliser = vi.fn();
  render(<Sac sac={sac} utiliser={utiliser} />);
  const bouton = screen.getByRole('button', { name: 'Bonbon ×2' });
  fireEvent.click(bouton);
  expect(utiliser).toHaveBeenCalledTimes(1);
  expect(utiliser).toHaveBeenCalledWith(sac.entrees[1], bouton);
  expect(bouton.title).toBe('Ajoute un niveau.');
  expect(screen.queryByRole('button', { name: 'Utiliser' })).toBeNull();
  expect(screen.queryByText('Ajoute un niveau.')).toBeNull();
});

it('ne présente que la raison quand le Sac est verrouillé', () => {
  render(<Sac sac={{ ...sac, acces: { ouvert: false, raison: "Le Sac s’ouvre à la Route 1." } }} utiliser={vi.fn()} />);
  expect(screen.getByText('Le Sac s’ouvre à la Route 1.')).toBeTruthy();
  expect(screen.queryByRole('button')).toBeNull();
  expect(screen.queryByRole('list')).toBeNull();
});

it('présente une grille compacte, les stocks, les icônes locales et le repli SVG', () => {
  const { container } = render(<Sac sac={sac} utiliser={vi.fn()} />);
  expect(screen.getAllByRole('listitem')).toHaveLength(3);
  expect(screen.getByRole('list', { name: 'Objets du Sac' }).className).toBe('grid grid-cols-2 gap-2');
  expect(container.querySelector('.size-16')).toBeNull();
  for (const ligne of screen.getAllByRole('listitem')) {
    expect(ligne.querySelector('button')?.className).toContain('min-h-11');
    expect(ligne.querySelector('img, svg')?.classList.contains('size-8')).toBe(true);
  }
  expect(Array.from(container.querySelectorAll('img')).every(img => img.getAttribute('src')?.startsWith('img/'))).toBe(true);
  expect(Array.from(container.querySelectorAll('img')).every(img => img.width === 32 && img.height === 32)).toBe(true);
  expect(container.querySelectorAll('img')).toHaveLength(2);
  expect(screen.getByRole('img', { name: 'Chaussures' }).tagName).toBe('svg');
  expect(screen.getByText('ACTIF').className).toContain('text-succes-base');
  expect(screen.getByText('UTILISER').className).toContain('text-region-accent');
  expect(screen.getByRole('button', { name: 'Pokéball ×0' }).className).toContain('opacity-50');
  expect(container.querySelectorAll('.bg-action')).toHaveLength(0);
});

it('conserve les filtres par catégorie au-dessus de la grille', () => {
  render(<Sac sac={sac} utiliser={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: 'Soins' }));
  expect(screen.getAllByRole('listitem')).toHaveLength(1);
  expect(screen.getByRole('button', { name: 'Bonbon ×2' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Tout' }));
  expect(screen.getAllByRole('listitem')).toHaveLength(3);
  fireEvent.click(screen.getByRole('button', { name: 'Équipement' }));
  expect(screen.getAllByRole('listitem')).toHaveLength(1);
  expect(screen.getByRole('button', { name: 'Chaussures ×1' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Balles' }));
  expect(screen.getAllByRole('listitem')).toHaveLength(1);
  expect(screen.getByRole('button', { name: 'Pokéball ×0' })).toBeTruthy();
});

it.each([
  { ...sac.entrees[0]!, quantite: 3 },
  sac.entrees[2]!,
  { ...sac.entrees[1]!, quantite: 0 },
])('désactive la ligne non utilisable $nom ×$quantite', entree => {
  const utiliser = vi.fn();
  render(<Sac sac={{ ...sac, entrees: [entree] }} utiliser={utiliser} />);
  const bouton = screen.getByRole('button', { name: `${entree.nom} ×${entree.quantite}` }) as HTMLButtonElement;
  expect(bouton.disabled).toBe(true);
  expect(bouton.title).toBe(entree.description);
  fireEvent.click(bouton);
  expect(utiliser).not.toHaveBeenCalled();
  expect(screen.queryByText('UTILISER')).toBeNull();
});

it.each(['stase', 'jeton', 'direct'] as const)('transmet le nouvel usage %s sans bouton imbriqué ni action principale', utilisable => {
  const utiliser = vi.fn();
  const entree = { ...sac.entrees[1]!, utilisable };
  const { container } = render(<Sac sac={{ ...sac, entrees: [entree] }} utiliser={utiliser} />);
  const bouton = screen.getByRole('button', { name: 'Bonbon ×2' });
  fireEvent.click(bouton);
  expect(utiliser).toHaveBeenCalledTimes(1);
  expect(utiliser).toHaveBeenCalledWith(entree, bouton);
  expect(container.querySelector('button button')).toBeNull();
  expect(container.querySelectorAll('.bg-action')).toHaveLength(0);
});

describe('objets clés', () => {
  let avant: ReturnType<typeof storeJeu.getState>;
  beforeEach(() => {
    avant = storeJeu.getState();
    storeJeu.setState({ objetsCles: [] });
  });
  afterEach(() => { storeJeu.setState(avant); });

  it('masque la section sans objet clé', () => {
    render(<Sac sac={sac} utiliser={vi.fn()} />);
    expect(screen.queryByRole('region', { name: 'Objets clés' })).toBeNull();
    expect(screen.queryByText('Objets clés')).toBeNull();
  });

  it('affiche la Pokéflûte obtenue après la Tour, même avec un filtre du Sac', () => {
    render(<Sac sac={sac} utiliser={vi.fn()} />);
    let region = declencher(evenementsKanto, regionInitiale('kanto', 'kanto.tour-pokemon'),
      { type: 'boss-vaincu', zone: 'kanto.tour-pokemon' });
    for (let i = 0; i < 10; i++) {
      const commande = commandeCourante(evenementsKanto, region);
      if (commande?.type !== 'dialogue') break;
      region = etapeTerminee(evenementsKanto, region, commande);
    }
    act(() => { storeJeu.setState({ objetsCles: region.objetsCles }); });
    fireEvent.click(screen.getByRole('button', { name: 'Soins' }));
    expect(screen.getByRole('region', { name: 'Objets clés' })).toBeTruthy();
    expect(screen.getByRole('img', { name: 'Pokéflûte' }).tagName).toBe('svg');
    const bouton = screen.getByRole('button', { name: 'Utiliser Pokéflûte' });
    expect(bouton.textContent).toContain('Utiliser');
    expect(bouton.className).toContain('min-h-11');
    expect(bouton.className).toContain('min-w-11');
  });

  it('appelle une fois le store par clic et annonce le refus, puis efface la raison au succès', async () => {
    const utiliserObjetCle = vi.fn().mockReturnValueOnce("Ce n'est pas le moment d'utiliser ça !").mockReturnValue(null);
    storeJeu.setState({ objetsCles: ['pokeflute'], utiliserObjetCle });
    render(<Sac sac={sac} utiliser={vi.fn()} />);
    const bouton = screen.getByRole('button', { name: 'Utiliser Pokéflûte' });
    await userEvent.click(bouton);
    expect(utiliserObjetCle).toHaveBeenCalledTimes(1);
    expect(utiliserObjetCle).toHaveBeenCalledWith('pokeflute');
    expect(screen.getByRole('status').textContent).toBe("Ce n'est pas le moment d'utiliser ça !");
    await userEvent.click(bouton);
    expect(utiliserObjetCle).toHaveBeenCalledTimes(2);
    expect(screen.queryByText("Ce n'est pas le moment d'utiliser ça !")).toBeNull();
  });

  it.each(['{Enter}', ' '])('permet un usage unique au clavier avec %s', async touche => {
    const utiliserObjetCle = vi.fn().mockReturnValue(null);
    storeJeu.setState({ objetsCles: ['pokeflute'], utiliserObjetCle });
    render(<Sac sac={sac} utiliser={vi.fn()} />);
    const utilisateur = userEvent.setup();
    const bouton = screen.getByRole('button', { name: 'Utiliser Pokéflûte' });
    for (let i = 0; i < 10 && document.activeElement !== bouton; i++) await utilisateur.tab();
    expect(document.activeElement).toBe(bouton);
    await utilisateur.keyboard(touche);
    expect(utiliserObjetCle).toHaveBeenCalledTimes(1);
    expect(utiliserObjetCle).toHaveBeenCalledWith('pokeflute');
  });
});
