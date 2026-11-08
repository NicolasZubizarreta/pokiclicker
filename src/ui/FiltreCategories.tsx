export function FiltreCategories({ categories, choix, choisir, onglets = false }: {
  onglets?: boolean;
  categories: { cle: string; nom: string }[];
  choix: string;
  choisir(cle: string): void;
}) {
  return <div role={onglets ? 'tablist' : 'group'} aria-label={onglets ? 'Rayons' : 'Catégories'} className="flex min-w-0 gap-2 overflow-x-auto text-base text-texte">
    {categories.map(({ cle, nom }, index) => <button key={cle} type="button" role={onglets ? 'tab' : undefined} aria-selected={onglets ? cle === choix : undefined} aria-pressed={onglets ? undefined : cle === choix}
      tabIndex={onglets ? cle !== choix ? -1 : 0 : undefined}
      onKeyDown={event => {
        if (!onglets) return;
        const prochain = event.key === 'ArrowRight' ? (index + 1) % categories.length
          : event.key === 'ArrowLeft' ? (index + categories.length - 1) % categories.length
          : event.key === 'Home' ? 0 : event.key === 'End' ? categories.length - 1 : null;
        if (prochain === null) return;
        event.preventDefault();
        choisir(categories[prochain]!.cle);
        (event.currentTarget.parentElement?.children[prochain] as HTMLElement)?.focus();
      }}
      className="cadre min-h-11 min-w-11 shrink-0 bg-surface p-3 aria-pressed:bg-selection aria-selected:bg-selection"
      onClick={() => choisir(cle)}>{nom}</button>)}
  </div>;
}
