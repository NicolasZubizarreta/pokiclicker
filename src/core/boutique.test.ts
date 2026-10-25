import { describe, expect, it, vi } from 'vitest';
import type { accesPc } from './pc';
import { reglages } from './reglages';
import {
  accesSac, accesShop, acheter, chargerObjets, contenuSac, objetsActifs, objetsDuShop,
} from './boutique';

const objets = chargerObjets();
const objet = (id: string) => objets.find(entree => entree.id === id)!;
const etat = {} as Parameters<typeof accesPc>[1];
function mondeAvec(...ids: string[]) {
  const zonesOuvertes = vi.fn<Parameters<typeof accesPc>[0]['zonesOuvertes']>();
  zonesOuvertes.mockReturnValue(ids.map(id => ({ id })) as ReturnType<typeof zonesOuvertes>);
  return { zonesOuvertes };
}
const region = () => ({ argent: 400, inventaire: { pokeball: 3 }, ameliorations: [] as string[] });

describe('accès et catalogue', () => {
  it('verrouille le Shop et le Sac avec leur raison puis les ouvre dans leur zone', () => {
    expect(accesShop(mondeAvec(), etat)).toEqual({ ok: false, raison: "Le Shop s'ouvre à la Forêt de Jade." });
    expect(accesSac(mondeAvec(), etat)).toEqual({ ok: false, raison: "Le Sac s'ouvre à la Route 1." });
    expect(accesShop(mondeAvec('kanto.foret-de-jade'), etat)).toEqual({ ok: true });
    expect(accesSac(mondeAvec('kanto.route-1'), etat)).toEqual({ ok: true });
  });

  it('ne propose que les objets du Shop en zone ouverte et sans les reportés', () => {
    const avant = structuredClone(objets);
    expect(objetsDuShop(objets, mondeAvec('kanto.bourg-palette'), etat)).toEqual([]);
    const zones = [...new Set(objets.flatMap(o => o.zone ? [o.zone] : []))];
    const tous = objetsDuShop(objets, mondeAvec(...zones), etat);
    expect(tous.length).toBeGreaterThan(0);
    expect(tous).toEqual(objets.filter(o => o.boutique === 'shop' && o.zone && !reglages.boutique.reportes.includes(o.id)));
    const debut = objetsDuShop(objets, mondeAvec('kanto.bourg-palette', 'kanto.foret-de-jade'), etat);
    expect(debut).toContainEqual(objet('pokeball'));
    expect(debut).not.toContainEqual(objet('superball'));
    expect(objets).toEqual(avant);
  });

  it('charge des données indépendantes à chaque appel', () => {
    const copie = chargerObjets();
    copie[0]!.nom = 'modifié';
    expect(chargerObjets()[0]!.nom).toBe('Pokéball');
  });
});

describe('achats purs', () => {
  it('accepte le montant exact et cumule le stock sans modifier les entrées', () => {
    const entree = region();
    const avant = structuredClone(entree);
    const balle = objet('pokeball');
    const avantObjet = structuredClone(balle);
    expect(acheter(entree, balle, 2, 200)).toEqual({
      ok: true, region: { ...entree, argent: 0, inventaire: { pokeball: 5 } },
    });
    expect(entree).toEqual(avant);
    expect(balle).toEqual(avantObjet);
  });

  it('crée le stock manquant et accepte la quantité maximale', () => {
    const entree = { ...region(), argent: 990, inventaire: {} };
    expect(acheter(entree, objet('candy'), 99, 10)).toEqual({
      ok: true, region: { ...entree, argent: 0, inventaire: { bonbon: 99 } },
    });
  });

  it('ajoute une amélioration unique puis refuse son rachat', () => {
    const entree = region();
    const achat = acheter(entree, objet('protein'), 1, 400);
    expect(achat).toEqual({ ok: true, region: { ...entree, argent: 0, ameliorations: ['protein'] } });
    expect(entree.ameliorations).toEqual([]);
    if (!achat.ok) throw new Error('Achat refusé');
    expect(acheter(achat.region, objet('protein'), 1, 400)).toEqual({ ok: false, raison: 'Déjà possédé.' });
    expect(objetsActifs(achat.region)).toEqual(['objet:protein']);
  });

  it('refuse les fonds insuffisants sans modification', () => {
    const entree = region();
    expect(acheter(entree, objet('pokeball'), 3, 200)).toEqual({ ok: false, raison: "Pas assez d'argent." });
    expect(entree).toEqual(region());
  });

  it.each([0, -1, 1.5, 100, NaN, Infinity])('refuse la quantité %s', quantite => {
    expect(acheter(region(), objet('pokeball'), quantite, 1)).toEqual({ ok: false, raison: 'Quantité invalide.' });
  });

  it('refuse plusieurs exemplaires d’une amélioration', () => {
    expect(acheter(region(), objet('protein'), 2, 1)).toEqual({ ok: false, raison: 'Quantité invalide.' });
  });
});

describe('contenu du Sac', () => {
  it('montre les objets permanents, les stocks et les améliorations possédées', () => {
    const entree = { ...region(), inventaire: { masterball: 1, calcium: 2, bonbon: 0 }, ameliorations: ['protein', 'runningShoes'] };
    const avant = structuredClone(entree);
    expect(contenuSac(entree, objets, mondeAvec(), etat)).toEqual([]);
    const sac = contenuSac(entree, objets, mondeAvec('kanto.route-1'), etat);
    expect(sac.map(o => o.id)).toEqual(objets.filter(o => ['pokeball', 'candy', 'masterball', 'calcium', 'protein', 'runningShoes'].includes(o.id)).map(o => o.id));
    expect(entree).toEqual(avant);
    expect(objetsActifs(entree)).toEqual(['objet:protein', 'objet:runningShoes']);
  });

  it('affiche les Superball et Hyperball sans stock dès leur zone de Sac', () => {
    const sac = contenuSac(region(), objets, mondeAvec('kanto.route-1', 'kanto.pont-pepite', 'kanto.tunnel-rocheux'), etat);
    expect(sac).toContainEqual(objet('superball'));
    expect(sac).toContainEqual(objet('hyperball'));
    // Décision de Nicolas : la Superball du Sac est alignée sur la zone 6 de la boutique, pas sur la zone 4.
    expect(contenuSac(region(), objets, mondeAvec('kanto.route-1', 'kanto.mont-selenite'), etat)).not.toContainEqual(objet('superball'));
  });
});
