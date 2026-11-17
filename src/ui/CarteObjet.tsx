import { useState } from 'react';
import { IconeObjet } from './icones';
import { QuantiteAchat } from './QuantiteAchat';

export function CarteObjet({ id, nom, description, image, prix, stock, possede, unique, abordable, argent, acheter, compact = false }: {
  compact?: boolean;
  id: string;
  nom: string;
  description: string;
  image: string | null;
  prix: number;
  stock: number;
  possede: boolean;
  unique: boolean;
  abordable: boolean;
  argent: number;
  acheter(quantite: number): void;
}) {
  const [quantite, changer] = useState(1);
  const acquis = unique && possede;
  const bouton = 'cadre min-h-11 min-w-11 bg-surface p-3';

  const prixTexte = acquis ? 'Possédé' : `${prix.toLocaleString('fr-FR')} ₽`;
  if (compact) {
    // Téléphone : une ligne icône | nom et effet | prix. Objet unique : le prix est le bouton d'achat.
    const achatUnique = unique && !acquis;
    return <article data-objet={id} className="cadre grid min-w-0 grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-2 bg-surface p-3 text-base text-texte tabular-nums">
      <IconeObjet id={id} image={image} nom={nom} />
      <div className="min-w-0">
        {/* Le stock est à côté du nom : l'acheter ne rajoute pas de ligne à la description, la carte garde sa hauteur. */}
        <div className="flex items-baseline gap-2">
          <h3 className="min-w-0 break-words font-titre text-base">{nom}</h3>
          {stock > 0 && <span className="shrink-0 text-sm text-texte-doux">×{stock}</span>}
        </div>
        <p className="break-words text-sm text-texte-doux">{description}</p>
      </div>
      {achatUnique
        ? <button type="button" aria-label={`Acheter ×1, ${prixTexte}`} className={bouton} disabled={!abordable || prix > argent}
          onClick={() => acheter(1)}>{prixTexte}</button>
        : <strong className={acquis ? 'cadre border-dashed px-3 py-2 text-texte-doux' : ''}>{prixTexte}</strong>}
      {!unique && <div className="col-span-3 min-w-0">
        <QuantiteAchat nom={nom} quantite={quantite} changer={changer} prix={prix} argent={argent} bouton={bouton}
          total={<button type="button" className={bouton} disabled={!abordable || prix * quantite > argent}
            onClick={() => acheter(quantite)}>Acheter ×{quantite}</button>} />
      </div>}
    </article>;
  }

  return <article data-objet={id} className="produit cadre flex min-w-0 flex-col gap-4 bg-surface p-4 text-base text-texte tabular-nums">
    <div className="flex min-w-0 items-center gap-3">
      <IconeObjet id={id} image={image} nom={nom} />
      <h3 className="min-w-0 break-words font-titre text-xl">{nom}</h3>
      {stock > 0 && <span className="ml-auto shrink-0">×{stock}</span>}
    </div>
    <p>{description}</p>
    <strong>{acquis ? 'Possédé' : `${prix.toLocaleString('fr-FR')}\u00a0₽`}</strong>
    {!acquis && <div className="mt-auto grid gap-3">
      {!unique && <QuantiteAchat nom={nom} quantite={quantite} changer={changer} prix={prix} argent={argent} bouton={bouton} />}
      <button type="button" className={bouton} disabled={!abordable || prix * (unique ? 1 : quantite) > argent}
        onClick={() => acheter(unique ? 1 : quantite)}>Acheter ×{unique ? 1 : quantite}</button>
    </div>}
  </article>;
}
