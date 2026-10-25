export function FiltreCategories({ categories, choix, choisir }: {
  categories: { cle: string; nom: string }[];
  choix: string;
  choisir(cle: string): void;
}) {
  return <div role="group" aria-label="Catégories" className="flex min-w-0 gap-2 overflow-x-auto text-base text-texte">
    {categories.map(({ cle, nom }) => <button key={cle} type="button" aria-pressed={cle === choix}
      className="cadre min-h-11 min-w-11 shrink-0 bg-surface p-3 aria-pressed:bg-selection"
      onClick={() => choisir(cle)}>{nom}</button>)}
  </div>;
}
