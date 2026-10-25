export function PastillesEffets({ effets }: {
  effets: { id: string; pastille: string; restantS: number }[];
}) {
  return <ul aria-label="Effets actifs" className="flex flex-wrap gap-2 text-base text-texte">
    {effets.map(effet => <li key={effet.id} className="bg-surface-2 px-2 py-1">
      {effet.pastille} : {effet.restantS} s
    </li>)}
  </ul>;
}
