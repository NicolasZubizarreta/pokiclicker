import { reglages } from '../core/reglages';

export type EtapeVol = {
  image: number;
  phase: 'pose' | 'vol' | 'fermeture' | 'fini';
  changerZone: boolean;
  fini: boolean;
};

/** Calendrier V1, save.js L759-797 ; les indicateurs restent vrais après leur seuil. */
export function etapeVol(ms: number): EtapeVol {
  const vol = reglages.interface.vol;
  const changement = vol.poseMs + vol.volMs;
  const fini = ms >= changement + vol.fermetureMs;
  const changerZone = ms >= changement;
  return {
    image: Math.min(vol.images, Math.max(1, Math.floor(ms / vol.imageMs) + 1)),
    phase: fini ? 'fini' : changerZone ? 'fermeture' : ms >= vol.poseMs + vol.delaiOuvertureMs ? 'vol' : 'pose',
    changerZone,
    fini,
  };
}
