export type Condition =
  | { type: 'badge'; id: string; nom?: string }
  | { type: 'boss'; zone: string }
  | { type: 'objet'; id: string; nom?: string }
  | { type: 'quete'; id: string; nom?: string }
  | { type: 'drapeau'; id: string }
  | { tous: Condition[] }
  | { un_parmi: Condition[] }
  | { non: Condition };

export type EtatMonde = {
  badges: string[];
  bossVaincus: string[];
  objets: string[];
  quetes: string[];
  drapeaux: string[];
};

export type ResultatCondition = { ok: boolean; raison?: string };

export function valider(condition: unknown): asserts condition is Condition {
  if (!condition || typeof condition !== 'object') throw new Error('Condition invalide');
  if ('tous' in condition || 'un_parmi' in condition) {
    const enfants = 'tous' in condition ? condition.tous : (condition as { un_parmi: unknown }).un_parmi;
    if (!Array.isArray(enfants)) throw new Error('Liste de conditions invalide');
    enfants.forEach(valider);
  } else if ('non' in condition) {
    valider(condition.non);
  } else {
    const type = 'type' in condition ? condition.type : undefined;
    if (!['badge', 'boss', 'objet', 'quete', 'drapeau'].includes(String(type))) {
      throw new Error(`Condition inconnue : ${type}`);
    }
    const id = type === 'boss' ? ('zone' in condition ? condition.zone : undefined)
      : ('id' in condition ? condition.id : undefined);
    if (typeof id !== 'string' || !id.trim()) throw new Error('Identifiant de condition invalide');
    if ('nom' in condition && typeof condition.nom !== 'string') throw new Error('Nom de condition invalide');
  }
}

export function evaluer(
  condition: Condition,
  etat: EtatMonde,
  contexte?: { nomZone?: (id: string) => string },
): ResultatCondition {
  if ('tous' in condition) {
    for (const enfant of condition.tous) {
      const resultat = evaluer(enfant, etat, contexte);
      if (!resultat.ok) return resultat;
    }
    return { ok: true };
  }
  if ('un_parmi' in condition) {
    const raisons: string[] = [];
    for (const enfant of condition.un_parmi) {
      const resultat = evaluer(enfant, etat, contexte);
      if (resultat.ok) return { ok: true };
      raisons.push(resultat.raison!);
    }
    return { ok: false, raison: `Il te faut l'une de ces conditions : ${raisons.join(' ou ')}` };
  }
  if ('non' in condition) {
    return evaluer(condition.non, etat, contexte).ok
      ? { ok: false, raison: "Cette voie n'est plus ouverte." } : { ok: true };
  }
  let ok: boolean;
  let raison: string;
  switch (condition.type) {
    case 'badge':
      ok = etat.badges.includes(condition.id);
      raison = `Il te faut le badge ${condition.nom ?? condition.id}.`;
      break;
    case 'boss':
      ok = etat.bossVaincus.includes(condition.zone);
      raison = `Bats le boss de ${contexte?.nomZone?.(condition.zone) ?? condition.zone}.`;
      break;
    case 'objet':
      ok = etat.objets.includes(condition.id);
      raison = `Il te faut l'objet ${condition.nom ?? condition.id}.`;
      break;
    case 'quete':
      ok = etat.quetes.includes(condition.id);
      raison = `Termine la quête ${condition.nom ?? condition.id}.`;
      break;
    case 'drapeau':
      ok = etat.drapeaux.includes(condition.id);
      raison = `Il te faut le drapeau ${condition.id}.`;
      break;
  }
  return ok ? { ok: true } : { ok: false, raison };
}
