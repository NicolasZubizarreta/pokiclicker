import { describe, expect, it } from 'vitest';
import { blocage, commandeCourante, declencher, etapeTerminee,
  type CatalogueEvenements, type Evenement } from './evenements';
import { regionInitiale } from './sauvegarde';

const entree = { type: 'entree-zone', zone: 'kanto.route-1' } as const;
const dialogue = { type: 'dialogue', locuteur: 'Chen', texte: 'Bonjour !' } as const;
function evenement(id: string, options: Partial<Evenement> = {}): Evenement {
  return { id, declencheur: entree, priorite: 0, repetable: false, etapes: [dialogue], ...options };
}
function catalogue(...liste: Evenement[]): CatalogueEvenements {
  return { liste, parId(id) {
    const resultat = liste.find(e => e.id === id);
    if (!resultat) throw new Error(`Événement inconnu : ${id}`);
    return resultat;
  } };
}
const region = () => regionInitiale('kanto', 'kanto.route-1');
const essai = () => catalogue(evenement('essai', {
  si: { non: { type: 'drapeau', id: 'essai-fait' } },
  etapes: [dialogue, { type: 'donner', objet: 'pokeball', quantite: 5 },
    { type: 'poser-drapeau', id: 'essai-fait' },
    { type: 'bloquer', zone: 'kanto.foret-de-jade', sauf: 'flute', raison: 'Un Ronflex dort.' },
    { type: 'combat', pokemon: 143, niveau: 30, capture: 25, nom: 'Ronflex' },
    { type: 'deplacer', zone: 'kanto.bourg-palette' }],
}));

describe('moteur des événements', () => {
  it('conserve la référence quand aucun nouvel événement n’est éligible', () => {
    const cat = catalogue(evenement('ferme', { si: { type: 'drapeau', id: 'absent' } }));
    const r = region();
    expect(declencher(cat, r, entree)).toBe(r);
    const enCours = declencher(catalogue(evenement('actif')), r, entree);
    expect(declencher(catalogue(evenement('actif')), enCours, entree)).toBe(enCours);
  });

  it('trie B avant a selon la comparaison des identifiants', () => {
    const r = declencher(catalogue(evenement('a'), evenement('B')), region(), entree);
    expect(r.evenementEnCours).toEqual({ id: 'B', etape: 0, file: ['a'] });
  });

  it('enchaîne les six étapes, reprend après JSON et ne récompense qu’une fois', () => {
    const cat = essai();
    const initiale = region();
    initiale.inventaire.pokeball = 2;
    initiale.etape = 9;
    expect(blocage(cat, initiale, 'kanto.foret-de-jade')).toEqual({ ok: true });
    const debut = declencher(cat, initiale, entree);
    expect(commandeCourante(cat, debut)).toEqual({ ...dialogue, evenement: 'essai', etape: 0 });
    expect(debut.evenementsJoues).toEqual([]);
    const milieu = etapeTerminee(cat, debut, { evenement: 'essai', etape: 0 });
    expect(milieu.inventaire.pokeball).toBe(7);
    expect(milieu.drapeaux).toContain('essai-fait');
    expect(milieu.evenementsJoues).toEqual([]);
    expect(commandeCourante(cat, milieu)).toEqual({ type: 'combat', evenement: 'essai', etape: 4,
      pokemon: 143, niveau: 30, capture: 25, nom: 'Ronflex' });
    const reprise = JSON.parse(JSON.stringify(milieu));
    expect(commandeCourante(cat, reprise)).toEqual(commandeCourante(cat, milieu));
    expect(etapeTerminee(cat, reprise, { evenement: 'essai', etape: 0 })).toEqual(milieu);
    expect(etapeTerminee(cat, reprise, { evenement: 'autre', etape: 4 })).toEqual(milieu);
    expect(blocage(cat, reprise, 'kanto.foret-de-jade')).toEqual({ ok: false, raison: 'Un Ronflex dort.' });
    const fin = etapeTerminee(cat, reprise, { evenement: 'essai', etape: 4 });
    expect(fin).toEqual(etapeTerminee(cat, milieu, { evenement: 'essai', etape: 4 }));
    expect(fin.inventaire.pokeball).toBe(7);
    expect(fin.zoneId).toBe('kanto.bourg-palette');
    expect(fin.etape).toBe(1);
    expect(fin.evenementsJoues).toEqual(['essai']);
    expect(fin.evenementEnCours).toBeUndefined();
    expect(commandeCourante(cat, fin)).toBeNull();
    expect(etapeTerminee(cat, fin, { evenement: 'essai', etape: 4 })).toEqual(fin);
    expect(blocage(cat, fin, 'kanto.foret-de-jade')).toEqual({ ok: false, raison: 'Un Ronflex dort.' });
    expect(blocage(cat, { ...fin, drapeaux: [...fin.drapeaux, 'flute'] }, 'kanto.foret-de-jade')).toEqual({ ok: true });
    expect(blocage(cat, fin, 'kanto.route-1')).toEqual({ ok: true });
    expect(declencher(cat, { ...fin, drapeaux: [] }, entree).evenementEnCours).toBeUndefined();
    expect(declencher(cat, { ...initiale, drapeaux: ['essai-fait'] }, entree)).toEqual({ ...initiale, drapeaux: ['essai-fait'] });
  });

  it('rejoue les répétables et donne un objet clé sans doublon', () => {
    const cat = catalogue(evenement('repetition', { repetable: true,
      etapes: [{ type: 'donner', objetCle: 'flute' }, { type: 'donner', objet: 'pokeball', quantite: 5 }] }));
    const une = declencher(cat, region(), entree);
    const deux = declencher(cat, une, entree);
    expect(deux.inventaire.pokeball).toBe(10);
    expect(deux.objetsCles).toEqual(['flute']);
    expect(deux.evenementsJoues).toEqual([]);
  });

  it('ordonne par priorité puis id, sans doublons pendant un événement', () => {
    const cat = catalogue(evenement('z'), evenement('b', { priorite: 1 }), evenement('a', { priorite: 1 }));
    let courante = declencher(cat, region(), entree);
    expect(courante.evenementEnCours).toEqual({ id: 'a', etape: 0, file: ['b', 'z'] });
    courante = declencher(cat, courante, entree);
    expect(courante.evenementEnCours?.file).toEqual(['b', 'z']);
    for (const id of ['a', 'b', 'z']) {
      expect(commandeCourante(cat, courante)?.evenement).toBe(id);
      courante = etapeTerminee(cat, courante, { evenement: id, etape: 0 });
    }
    expect(courante.evenementsJoues).toEqual(['a', 'b', 'z']);
  });

  it('ajoute les nouveaux déclenchements en fin de file et réévalue les conditions', () => {
    const cat = catalogue(evenement('a', { etapes: [dialogue, { type: 'poser-drapeau', id: 'ferme' }] }),
      evenement('b', { si: { non: { type: 'drapeau', id: 'ferme' } } }),
      evenement('c', { declencheur: { type: 'boss-vaincu', zone: entree.zone } }));
    let courante = declencher(cat, region(), entree);
    courante = declencher(cat, courante, { type: 'boss-vaincu', zone: entree.zone });
    expect(courante.evenementEnCours?.file).toEqual(['b', 'c']);
    courante = etapeTerminee(cat, courante, { evenement: 'a', etape: 0 });
    expect(commandeCourante(cat, courante)?.evenement).toBe('c');
    expect(courante.evenementsJoues).toEqual(['a']);
  });

  it('filtre les déclencheurs et ne déclenche pas une entrée via deplacer', () => {
    const cat = catalogue(evenement('depart', { declencheur: { type: 'debut-partie' },
      etapes: [{ type: 'deplacer', zone: entree.zone }] }), evenement('arrivee'),
      evenement('objet', { declencheur: { type: 'objet-utilise', objet: 'flute', zone: entree.zone } }),
      evenement('partout', { declencheur: { type: 'objet-utilise', objet: 'flute' } }));
    expect(declencher(cat, region(), { type: 'entree-zone', zone: 'ailleurs' })).toEqual(region());
    expect(declencher(cat, region(), { type: 'objet-utilise', objet: 'autre' })).toEqual(region());
    expect(declencher(cat, region(), { type: 'objet-utilise', objet: 'flute', zone: 'ailleurs' })
      .evenementEnCours?.id).toBe('partout');
    expect(declencher(cat, region(), { type: 'objet-utilise', objet: 'flute', zone: entree.zone })
      .evenementEnCours?.id).toBe('objet');
    const fin = declencher(cat, region(), { type: 'debut-partie' });
    expect(fin.evenementsJoues).toEqual(['depart']);
    expect(commandeCourante(cat, fin)).toBeNull();
  });

  it('abandonne un événement absent du catalogue et continue la file', () => {
    const cat = catalogue(evenement('suite'));
    const courante = { ...region(), evenementEnCours: { id: 'absent', etape: 0, file: ['disparu', 'suite'] } };
    expect(commandeCourante(cat, courante)).toBeNull();
    expect(declencher(cat, courante, { type: 'debut-partie' }).evenementEnCours)
      .toEqual({ id: 'suite', etape: 0, file: [] });
  });

  it('reste déterministe et ne modifie aucune entrée, même sur les effets', () => {
    const cat = essai();
    const initiale = region();
    const fait = structuredClone(entree);
    const copie = structuredClone({ liste: cat.liste, initiale, fait });
    const debut = declencher(cat, initiale, fait);
    expect(declencher(cat, initiale, fait)).toEqual(debut);
    const avant = structuredClone(debut);
    const ref = { evenement: 'essai', etape: 0 };
    const milieu = etapeTerminee(cat, debut, ref);
    expect(etapeTerminee(cat, debut, ref)).toEqual(milieu);
    const avantMilieu = structuredClone(milieu);
    const commande = commandeCourante(cat, milieu);
    if (commande?.type === 'combat') commande.niveau = 99;
    blocage(cat, milieu, 'kanto.foret-de-jade');
    etapeTerminee(cat, milieu, { evenement: 'essai', etape: 4 });
    expect(milieu).toEqual(avantMilieu);
    expect(debut).toEqual(avant);
    expect(ref).toEqual({ evenement: 'essai', etape: 0 });
    expect({ liste: cat.liste, initiale, fait }).toEqual(copie);
  });
});
