import { reglages, type Ton } from '../core/reglages';

export type { Ton } from '../core/reglages';

export function frequenceNote(note: string): number {
  const resultat = /^([A-G])(#|b)?([0-8])$/.exec(note);
  if (!resultat) throw new Error(`Note invalide : ${note}`);
  const demiTons: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const midi = (Number(resultat[3]) + 1) * 12 + demiTons[resultat[1]!]!
    + (resultat[2] === '#' ? 1 : resultat[2] === 'b' ? -1 : 0);
  return 440 * 2 ** ((midi - 69) / 12);
}

export function creerSons({
  creerContexte = () => typeof AudioContext === 'undefined' ? undefined : new AudioContext(),
  estActif,
}: { creerContexte?: () => AudioContext | undefined; estActif: () => boolean }) {
  let contexte: AudioContext | undefined;
  let sortie: GainNode | undefined;
  let ferme = false;

  return {
    async deverrouiller() {
      if (ferme) return;
      try {
        contexte ??= creerContexte();
        if (!contexte) return;
        if (!sortie) {
          sortie = contexte.createGain();
          sortie.gain.setValueAtTime(10 ** (reglages.sons.volumeDb / 20), contexte.currentTime);
          sortie.connect(contexte.destination);
        }
        if (contexte.state === 'suspended') await contexte.resume();
      } catch { /* Audio indisponible ou geste refusé par le navigateur. */ }
    },
    jouer(ton: Ton) {
      if (ferme || !estActif() || contexte?.state !== 'running' || !sortie) return;
      const { enveloppe, tempo, oscillateur, tons } = reglages.sons;
      const maintenant = contexte.currentTime;
      const duree = 60 / tempo * 4 / Number(tons[ton].duree.slice(0, -1));
      const attaque = Math.min(enveloppe.attaque, duree);
      const declin = Math.min(enveloppe.declin, duree - attaque);
      const niveau = enveloppe.maintien ** (declin / enveloppe.declin);
      for (const note of tons[ton].notes) {
        const source = contexte.createOscillator();
        const gain = contexte.createGain();
        source.type = oscillateur;
        source.frequency.setValueAtTime(frequenceNote(note), maintenant);
        gain.gain.setValueAtTime(0, maintenant);
        gain.gain.linearRampToValueAtTime(1, maintenant + attaque);
        gain.gain.exponentialRampToValueAtTime(niveau, maintenant + attaque + declin);
        gain.gain.setValueAtTime(niveau, maintenant + duree);
        // Attaque/déclin V1 ; maintien 0,3 et relâchement 1 s : défauts Tone.Synth 14.8.
        gain.gain.linearRampToValueAtTime(0, maintenant + duree + enveloppe.relachement);
        source.connect(gain);
        gain.connect(sortie);
        source.onended = () => { source.disconnect(); gain.disconnect(); };
        source.start(maintenant);
        source.stop(maintenant + duree + enveloppe.relachement);
      }
    },
    async fermer() {
      if (ferme) return;
      ferme = true;
      try { await contexte?.close(); } catch { /* Le contexte peut déjà être fermé. */ }
    },
  };
}

export function brancherSons(store: {
  getState: () => { sonActive: boolean };
  abonnerSons: (abonne: (ton: Ton) => void) => () => void;
}) {
  const sons = creerSons({ estActif: () => store.getState().sonActive });
  const desabonner = store.abonnerSons(sons.jouer);
  return { ...sons, fermer: async () => { desabonner(); await sons.fermer(); } };
}
