import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import tailles from '../../public/img/tailles.json';
import { reglages } from '../core/reglages';
import type { FormeCarte } from '../core/monde';
import { centreForme } from './carte-geometrie';
import { etapeVol } from './vol';
import { Image } from './Image';

type EtatVol = { actif: boolean; ms: number; cible: string | null; depart: FormeCarte | null };
const inactif: EtatVol = { actif: false, ms: 0, cible: null, depart: null };
const duree = (ms: number) => ({ '--vol-ms': ms }) as CSSProperties;
export const imagesVol = Array.from({ length: reglages.interface.vol.images }, (_, i) => `img/sprites/dresseur/vol-${i + 1}.png`);

export function useVol(allerVers: (zone: string) => void, quandArrive: () => void) {
  const [etat, changer] = useState<EtatVol>(inactif);
  const [reduit] = useState(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
  const actif = useRef(false);
  const minuteurs = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => { minuteurs.current.forEach(clearTimeout); }, []);

  function lancer(cible: string, depart: FormeCarte | null = null) {
    if (actif.current) return;
    actif.current = true;
    changer({ actif: true, ms: 0, cible, depart });
    const vol = reglages.interface.vol;
    const changement = reduit ? vol.changerReduitMs : vol.poseMs + vol.volMs;
    const fin = reduit ? vol.fonduReduitMs : changement + vol.fermetureMs;
    const seuils = reduit ? [changement, fin] : [
      ...Array.from({ length: vol.images - 1 }, (_, i) => (i + 1) * vol.imageMs),
      vol.poseMs, vol.poseMs + vol.delaiOuvertureMs, changement, fin,
    ];
    minuteurs.current = [...new Set(seuils)].map(ms => setTimeout(() => {
      const etape = etapeVol(ms);
      if (ms === changement && (reduit || etape.changerZone)) allerVers(cible);
      if (ms === fin && (reduit || etape.fini)) {
        actif.current = false;
        changer(inactif);
        quandArrive();
      } else changer({ actif: true, ms, cible, depart });
    }, ms));
  }
  return { etat, reduit, lancer };
}

export function DresseurVol({ ms, forme }: { ms: number; forme: FormeCarte }) {
  const centre = centreForme(forme);
  const taille = 9 * reglages.interface.vol.tailleDresseurRatio;
  const src = imagesVol[etapeVol(ms).image - 1]!;
  const dimensions = tailles[src as keyof typeof tailles];
  return <svg x={centre.x - taille / 2} y={centre.y - taille / 2} width={taille} height={taille}
    viewBox={`0 0 ${dimensions.largeur} ${dimensions.hauteur}`} className="pointer-events-none image-rendering-pixelated" aria-hidden="true">
    <image data-dresseur href={src} width={dimensions.largeur} height={dimensions.hauteur} />
  </svg>;
}

export function VolGen1({ ms }: { ms: number }) {
  const vol = reglages.interface.vol;
  if (ms < vol.poseMs) return null;
  const piste = duree(vol.pisteMs);
  const attente = duree(vol.delaiOuvertureMs);
  const trajet = duree(vol.volMs);
  return <div data-vol-overlay data-theme="dark" data-phase={etapeVol(ms).phase} aria-hidden="true" className="vol-overlay">
    <div className="vol-attente" style={attente}>
      <div className="vol-piste" style={piste}>
        <div className="vol-traits" style={duree(vol.traitsMs)}>
          {[0, 1].map(copie => <svg key={copie} viewBox="0 0 400 180" preserveAspectRatio="none">
          <path stroke="currentColor" strokeWidth="2" d="M25 15h8 M150 30h12 M80 100h10 M300 80h8 M350 20h9 M220 90h11 M20 70h7 M250 50h9 M120 5h8 M380 110h10 M50 85h9 M180 60h12 M100 140h10 M320 160h8 M200 130h12" />
          </svg>)}
        </div>
        <div className="vol-trajet" style={trajet}>
          <Image genre="sprite" src="img/animes/roucarnage-vol.gif" alt="" className="vol-oiseau" />
        </div>
      </div>
    </div>
  </div>;
}
