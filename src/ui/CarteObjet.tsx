import { useState } from 'react';
import { IconeObjet } from './icones';
import { QuantiteAchat } from './QuantiteAchat';
import { formaterNombre } from './nombres';

export function CarteObjet({ id, nom, description, image, prix, prixBase, inflationParBadge, stock, possede, unique, abordable, argent, acheter, compact = false }: {
  compact?: boolean;
  id: string;
  nom: string;
  description: string;
  image: string | null;
  prix: number;
  prixBase?: number;
  inflationParBadge?: number;
  stock: number;
  possede: boolean;
  unique: boolean;
  abordable: boolean;
  argent: number;
  acheter(quantite: number): void;
}) {
  const [quantite, changer] = useState(1);
  const acquis = unique && possede;
  const bouton = 'cadre min-h-11 min-w-11 bg-surface p-3 disabled:text-texte-doux';
  const nombre = unique ? 1 : quantite;
  const total = prix * nombre;
  const libelleAchat = total > argent
    ? `Il te manque ${formaterNombre(total - argent)} ₽`
    : `Acheter ×${nombre} : ${formaterNombre(total)} ₽`;
  const achat = <button type="button" className={`${bouton}${compact && unique ? ' col-span-3' : ''}`} disabled={!abordable || total > argent}
    onClick={() => acheter(nombre)}>{libelleAchat}</button>;
  const explicationPrix = prixBase !== undefined && <p className="produit-prix-base text-sm text-texte-doux">
    Prix de base {formaterNombre(prixBase)} ₽ · {inflationParBadge
      ? `+${formaterNombre(inflationParBadge * 100)} % par badge` : 'sans inflation par badge'}
  </p>;

  const prixTexte = acquis ? 'Possédé' : `${formaterNombre(prix)} ₽`;
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
        {!acquis && explicationPrix}
      </div>
      {achatUnique
        ? achat
        : <strong className={acquis ? 'cadre border-dashed px-3 py-2 text-texte-doux' : ''}>{prixTexte}</strong>}
      {!unique && <div className="col-span-3 min-w-0">
        <QuantiteAchat nom={nom} quantite={quantite} changer={changer} prix={prix} argent={argent} bouton={bouton}
          total={achat} />
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
    <strong>{acquis ? 'Possédé' : `${formaterNombre(prix)}\u00a0₽`}</strong>
    {!acquis && explicationPrix}
    {!acquis && <div className="mt-auto grid gap-3">
      {!unique && <QuantiteAchat nom={nom} quantite={quantite} changer={changer} prix={prix} argent={argent} bouton={bouton} />}
      {achat}
    </div>}
  </article>;
}
