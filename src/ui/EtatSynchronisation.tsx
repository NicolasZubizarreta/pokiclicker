import type { EtatSynchro } from './synchro';
import { synchronisations } from './synchronisations';

export function EtatSynchronisation({ etat }: { etat: EtatSynchro }) {
  const [libelle, couleur] = synchronisations[etat];
  return <span className="inline-flex items-center gap-2 text-sm text-texte-doux"><span aria-hidden="true" className={`h-2 w-2 rounded-full ${couleur}`} />{libelle}</span>;
}
