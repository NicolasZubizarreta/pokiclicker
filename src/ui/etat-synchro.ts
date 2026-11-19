export type EtatSynchro = 'inactif' | 'ok' | 'hors-ligne' | 'refuse' | 'ailleurs' | 'divergence';

export type EvenementSynchro =
  | 'envoi-accepte'
  | 'reseau-coupe'
  | 'serveur-ailleurs'
  | 'conflit'
  | 'client-trop-ancien'
  | 'refus'
  | 'resolu'
  | 'ouverture'
  | 'redemarrage';

export function suivant(etat: EtatSynchro, evenement: EvenementSynchro): EtatSynchro {
  switch (evenement) {
    case 'envoi-accepte': return 'ok';
    case 'reseau-coupe': return etat === 'divergence' ? 'divergence' : 'hors-ligne';
    case 'serveur-ailleurs': return 'ailleurs';
    case 'conflit': return 'divergence';
    case 'client-trop-ancien':
    case 'refus': return 'refuse';
    case 'resolu': return 'inactif';
    case 'ouverture': return etat === 'divergence' ? 'divergence' : 'inactif';
    case 'redemarrage': return etat === 'refuse' ? 'inactif' : etat;
  }
}

export function bloque(etat: EtatSynchro): boolean {
  return etat === 'refuse' || etat === 'ailleurs' || etat === 'divergence';
}

export function envoiEnEchec(etat: EtatSynchro): boolean {
  return etat === 'hors-ligne' || etat === 'refuse' || etat === 'divergence';
}
