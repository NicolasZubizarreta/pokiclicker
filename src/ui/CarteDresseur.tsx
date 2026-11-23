import { useEffect, useState } from 'react';
import { useStore } from 'zustand';
import { chargerTitres, compteursDe, titresObtenus } from '../core/titres';
import { chargerPokemon } from '../core/pokemon';
import { storeJeu } from './store';
import { bilanJoueur } from './bilan-joueur';
import { genererCarte, type DonneesCarte } from './carte-dresseur';
import { useSkin } from './skins';

const catalogue = chargerPokemon();
const titres = chargerTitres();
export function CarteDresseur({ retour, nomPartie = 'Dresseur' }: { retour(): void; nomPartie?: string }) {
  const suivi = useStore(storeJeu, s => s.suivi);
  const equipe = useStore(storeJeu, s => s.equipe);
  const pokedex = useStore(storeJeu, s => s.pokedex);
  const tempsJeuMs = useStore(storeJeu, s => s.tempsJeuMs);
  const progression = useStore(storeJeu, s => s.progression);
  const cadre = useSkin('cadre-profil');
  const especesShiny = useStore(storeJeu, s => s.especesShiny);
  const obtenus = titresObtenus(compteursDe({ suivi, pokedexTotal: progression.pokedex.nombre, tempsJeuMs }));
  const titre = obtenus.find(t => t.id === suivi.titre) ?? titres[0]!;
  const bilan = bilanJoueur({ suivi, pokedex, tempsJeuMs, especesShiny, badges: { obtenus: progression.obtenus, total: progression.total } });
  const donnees: DonneesCarte = { nom: nomPartie, titre: titre.nom, ...(cadre ? { cadre: cadre.jeton } : {}),
    equipe: equipe.flatMap(c => c && !c.pokemon.oeuf ? [{ ...c.pokemon, nom: catalogue.liste.find(p => p.numero === c.pokemon.numero)?.nom ?? `Pokémon ${c.pokemon.numero}`, shiny: !!c.pokemon.shiny }] : []).slice(0, 6),
    chiffres: [bilan[1]!, bilan[2]!, bilan[0]!, bilan[3]!].map(c => ({ ...c, valeur: c.valeur.replace(' sur ', ' / ') })) };
  const cle = JSON.stringify(donnees);
  const [image, fixerImage] = useState<{ blob: Blob; url: string; cle: string }>();
  const [statut, fixerStatut] = useState('');
  useEffect(() => {
    let actif = true; let url: string | undefined;
    genererCarte(JSON.parse(cle) as DonneesCarte).then(blob => {
      if (!actif) return;
      url = URL.createObjectURL(blob); fixerImage({ blob, url, cle });
    }).catch(() => { if (actif) fixerStatut('Image indisponible sur cet appareil.'); });
    return () => { actif = false; if (url) URL.revokeObjectURL(url); };
  }, [cle]);
  const actuelle = image?.cle === cle ? image : undefined;
  const files = actuelle ? [new File([actuelle.blob], 'carte-dresseur.png', { type: 'image/png' })] : [];
  let partage = false;
  try { partage = !!actuelle && !!navigator.share && !!navigator.canShare?.({ files }); } catch { /* API indisponible. */ }
  const description = [donnees.nom, donnees.titre, ...donnees.equipe.map(p => `${p.nom}, niveau ${p.niveau}${p.shiny ? ', Chromatique' : ''}`), ...donnees.chiffres.map(c => `${c.libelle} : ${c.valeur}`)].join('. ');
  return <section className="mx-auto max-w-screen-xl space-y-4 p-4 text-base tabular-nums">
    <button className="plaque min-h-11 px-4" onClick={retour}>Retour au menu</button>
    <h1 className="font-titre text-2xl" tabIndex={-1}>Carte de dresseur</h1>
    <label className="block">Titre<select className="cadre ml-4 min-h-11 bg-surface p-2" value={titre.id} onChange={e => storeJeu.getState().choisirTitre(e.target.value)}>
      {titres.map(t => <option key={t.id} value={t.id} disabled={!obtenus.some(o => o.id === t.id)}>{t.nom}</option>)}
    </select></label>
    <details><summary className="min-h-11 cursor-pointer">Titres à obtenir</summary><ul>{titres.filter(t => !obtenus.some(o => o.id === t.id)).map(t => <li key={t.id} className="text-texte-doux">{t.nom} — Pour l'obtenir : {t.description}</li>)}</ul></details>
    {actuelle && <img src={actuelle.url} alt={description} width={1200} height={630} className="h-auto w-full" />}
    <p>{description}</p>
    <div className="flex flex-wrap gap-4">
      {partage && <button className="plaque min-h-11 px-4" onClick={() => { void navigator.share({ files, title: 'Carte de dresseur' }).catch(() => fixerStatut('Partage annulé.')); }}>Partager</button>}
      <button className="plaque min-h-11 px-4" disabled={!actuelle} onClick={async () => {
        try {
          if (!actuelle || !navigator.clipboard?.write || typeof ClipboardItem === 'undefined') throw new Error();
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': actuelle.blob })]); fixerStatut('Image copiée.');
        } catch { fixerStatut('Copie impossible sur cet appareil.'); }
      }}>Copier l'image</button>
      {actuelle && <a className="plaque flex min-h-11 items-center px-4" download="carte-dresseur.png" href={actuelle.url}>Télécharger</a>}
    </div><p role="status">{statut}</p>
  </section>;
}
