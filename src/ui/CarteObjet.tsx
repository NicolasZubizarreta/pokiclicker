import { useState } from 'react';
import { IconeObjet } from './icones';

export function CarteObjet({ id, nom, description, image, prix, stock, possede, unique, abordable, acheter }: {
  id: string;
  nom: string;
  description: string;
  image: string | null;
  prix: number;
  stock: number;
  possede: boolean;
  unique: boolean;
  abordable: boolean;
  acheter(quantite: number): void;
}) {
  const [quantite, changer] = useState(1);
  const acquis = unique && possede;
  const bouton = 'cadre min-h-11 min-w-11 bg-surface p-3';

  return <article data-objet={id} className="cadre flex min-w-0 flex-col gap-4 bg-surface p-4 text-base text-texte tabular-nums">
    <div className="flex min-w-0 items-center gap-3">
      <IconeObjet image={image} nom={nom} />
      <h3 className="min-w-0 break-words font-titre text-xl">{nom}</h3>
    </div>
    <p>{description}</p>
    <strong>{acquis ? 'Possédé' : `${prix.toLocaleString('fr-FR')} pièces`}</strong>
    {stock > 0 && <p>×{stock}</p>}
    {!acquis && <div className="mt-auto grid gap-3">
      {!unique && <div role="group" aria-label={`Quantité de ${nom}`} className="flex items-center gap-3">
        <button type="button" aria-label="Moins" className={bouton} disabled={quantite <= 1}
          onClick={() => changer(q => Math.max(1, q - 1))}>−</button>
        <output aria-label="Quantité">{quantite}</output>
        <button type="button" aria-label="Plus" className={bouton} disabled={quantite >= 99}
          onClick={() => changer(q => Math.min(99, q + 1))}>+</button>
      </div>}
      <button type="button" className={bouton} disabled={!abordable}
        onClick={() => acheter(unique ? 1 : quantite)}>Acheter ×{unique ? 1 : quantite}</button>
    </div>}
  </article>;
}
